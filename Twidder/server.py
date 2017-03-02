#!/usr/bin/python
# -*- coding: utf-8 -*-


import json
from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from flask import Flask, request
from flask_bcrypt import generate_password_hash, check_password_hash, Bcrypt

import database_helper
import uuid

app = Flask(__name__)
app.debug = True
bcrypt = Bcrypt(app)

active_sockets = {}


# connect to database
@app.before_request
def before_request():
    database_helper.connect_db()


# disconnect database
@app.teardown_request
def disconnect(error):
    database_helper.close_db(error)


@app.route("/")
def home():
        return app.send_static_file('client.html')


# sign in user
@app.route("/sign_in", methods=['POST'])
def sign_in():

    # get email and password from form
    email = request.json['login_email']
    password = request.json['login_password']

    # find user, thus checking if email/password exists
    hashed_pw = database_helper.get_password(email)[0][0]
    # checking if user in database and if the correct password is given
    if not hashed_pw or not check_password_hash(hashed_pw, password):
        returnmsg = {
            'success': False,
            'message': "Wrong username or password.",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)

    # check if user is logged in
    user_status = database_helper.get_logged_in_user(email)

    # if user is logged in somewhere else and socket is active
    if len(user_status) != 0 and user_status[0] in active_sockets:
        message = "[sign_in] log_out"
        old_token = user_status[0]
        active_sockets[old_token].send(message)
        database_helper.remove_logged_in_user(old_token)
        del active_sockets[old_token]

    # generate token
    token = str(uuid.uuid4().get_hex())

    # add user to logged in users
    database_helper.add_logged_in_user(email, token)
    returnmsg = {
        'success': True,
        'message': "Successfully signed in.",
        'data': token}
    return json.dumps(returnmsg, indent=4, ensure_ascii=False).encode('utf8')


# sign up
@app.route("/sign_up", methods=['POST'])
def sign_up():

    # retrieve all info from form
    email = request.json['email']
    password = request.json['password']
    firstname = request.json['firstname']
    familyname = request.json['familyname']
    gender = request.json['gender']
    city = request.json['city']
    country = request.json['country']

    # make sure that the user does not exist
    check = database_helper.get_user(email, password)
    if len(check) == 0:

        # if no such user, hash the password
        hash_pw = generate_password_hash(password, 5)

        #  add new user to database!
        database_helper.add_user(email, hash_pw, firstname, familyname, gender, city, country)
        usr = database_helper.get_user(email, hash_pw)
        if len(usr) == 0:
            # make sure that the user was added correctly
            returnmsg = {
                'success': False,
                'message': "Form data missing or incorrect type.",
                'data': '-'}
            return json.dumps(returnmsg, indent=4)
        else:
            returnmsg = {
                'success': True,
                'message': "Successfully created a new user.",
                'data': '-'}
            return json.dumps(returnmsg, indent=4)
    else:
        returnmsg = {
            'success': False,
            'message': "User already exists.",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)


# sign out
@app.route("/sign_out", methods=['POST'])
def sign_out():
    # get token and check if logged in
    token = request.json['token']
    logged_in = database_helper.find_logged_in_user(token)
    if len(logged_in) != 0:
        # delete token from logged in users
        database_helper.remove_logged_in_user(token)
        check = database_helper.find_logged_in_user(token)
        # if no longer logged in but still active socket
        if not check and token in active_sockets:
            message = "[log_out] close"
            active_sockets[token].send(message)
            del active_sockets[token]
        returnmsg = {
            'success': True,
            'message': "Successfully signed out.",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    else:
        returnmsg = {
            'success': False,
            'message': "You are not signed in.",
            'data': '-'}
        return json.dumps(returnmsg)


# change password
@app.route("/change_password", methods=['POST'])
def change_password():
    # retrieve all the variables
    token = request.json['token']
    old_password = request.json['old_password']
    new_password = request.json['new_password']

    user_email = database_helper.find_logged_in_user(token)
    # check if user is logged in
    if not user_email:
        returnmsg = {
            'success': False,
            'message': "User not logged in",
            'data': '-'}
        return json.dumps(returnmsg)

    # check if correct password by getting the old hashed password
    # and cheking against the given password.
    old_hash = database_helper.get_password(user_email)[0][0]
    correct_pw = check_password_hash(old_hash, old_password)

    if not correct_pw:
        returnmsg = {
            'success': False,
            'message': "Wrong password",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)

    # user logged in and entered the correct password!
    new_password = generate_password_hash(new_password)

    database_helper.set_password(user_email, old_password, new_password)
    if not database_helper.get_user(user_email, new_password):
        returnmsg = {
            'success': True,
            'message': "Password changed.",
            'data': '-'}
        return json.dumps(returnmsg)
    else:
        returnmsg = {
            'success': False,
            'message': "Something went wrong...",
            'data': '-'}
        return json.dumps(returnmsg)


@app.route("/get_user_data_by_token/<token>", methods=['GET'])
def get_user_data_by_token(token):

    email = database_helper.find_logged_in_user(token)
    # check if user logged in
    if not email:
        # if user not logged in
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return json.dumps(returnmsg)
    # user logged in, retrieve userinfo
    user_data = database_helper.get_userinfo(email)
    if not user_data:
        # user does not exist, should not get into here...
        returnmsg = {
            'success': False,
            'message': "User does not exist, server problem!",
            'data': '-'}
        return json.dumps(returnmsg)
    else:
        returnmsg = {
            'success': True,
            'message': "User data retrieved",
            'data': user_data}
    return json.dumps(returnmsg)


@app.route("/get_user_data_by_email/<token>/<email>", methods=['GET'])
def get_user_data_by_email(token, email):
    # make sure current user is logged in...
    requester = database_helper.find_logged_in_user(token)

    if not requester:
        returnmsg = {
            'success': False,
            'message': "You are not signed in.",
            'data': '-'}
        return json.dumps(returnmsg)
    # user is logged in, retrieve requested info
    info = database_helper.get_userinfo(email)
    if info is None:
        # requested user does not exist...
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return json.dumps(returnmsg)
    else:
        # return requested user information
        returnmsg = {
            'success': True,
            'message': "User data retrieved",
            'data': info}
        return json.dumps(returnmsg)


@app.route("/get_user_messages_by_token/<token>", methods=['GET'])
def get_user_messages_by_token(token):
    # check if user is logged in
    email = database_helper.find_logged_in_user(token)
    if not email:
        returnmsg = {
            'success': False,
            'message': "You are not signed in",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    messages = database_helper.get_messages(email)
    returnmsg = {
        'success': True,
        'message': "User messages retrieved.",
        'data': messages}

    return json.dumps(returnmsg)


@app.route("/get_user_messages_by_email/<token>/<email>", methods=['GET'])
def get_user_messages_by_email(token, email):
    # current user is logged in
    My_email = database_helper.find_logged_in_user(token)
    if not My_email:
        returnmsg = {
            'success': False,
            'message': "You are not signed in",
            'data': '-'}
        return json.dumps(returnmsg)
    # check if user exists
    user = database_helper.get_userinfo(email)
    if not user:
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return json.dumps(returnmsg)
    messages = database_helper.get_messages(email)
    returnmsg = {
        'success': True,
        'message': "User messages retrieved.",
        'data': messages}
    return json.dumps(returnmsg)


@app.route("/post_message", methods=['POST'])
def post_message():
    token = request.json['token']
    # check if current user is logged in
    from_email = database_helper.find_logged_in_user(token)
    if not from_email:
        returnmsg = {
            'success': False,
            'message': "You are not signed in",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    # retrieve the rest of the information
    message = request.json['message']
    to_email = request.json['to_email']
    to_usr = database_helper.get_userinfo(to_email)
    # does the "post to" user exist?
    if len(to_usr) is None:
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return json.dumps(returnmsg)
    # get current users email and post the message
    database_helper.add_message(from_email, to_email, message)
    returnmsg = {
        'success': True,
        'message': "Message posted",
        'data': '-'}
    return json.dumps(returnmsg)


@app.route("/init_socket")
def init_socket():

    if request.environ.get('wsgi.websocket'):
        wsoc = request.environ.get('wsgi.websocket')
        token = ""
        while True:

            from_client = json.loads(wsoc.receive())
            token = from_client["token"]
            email = from_client["email"]
            active_sockets[token] = wsoc
            # if wsoc.receive() is not None:
            message = wsoc.receive()
            if message is None:
                if token in active_sockets:
                    del active_sockets[token]
                print("!!---------closed socket: " + email +" -----------!!")
                break
            wsoc.send(message)
        return ''


if __name__ == "__main__":
    # app.run()
    twidder_server = WSGIServer(('127.0.0.1', 5000), app, handler_class=WebSocketHandler)
    twidder_server.serve_forever()

