#!/usr/bin/python
# -*- coding: utf-8 -*-


import json

from flask import Flask, request

import database_helper
import uuid

app = Flask(__name__)
app.debug = True

logged_in_users = {}


# connect to database
@app.before_request
def before_request():
    database_helper.connect_db()


# disconnect database
@app.teardown_request
def disconnect(error):
    database_helper.close_db(error)


@app.route("/", methods=['GET'])
def home():
        return "this is the homepage..."


# sign in user
@app.route("/sign_in", methods=['POST'])
def sign_in():
    # get email and password from form
    email = request.form['login_email']
    password = request.form['login_password']
    # check if user is logged in
    user_status = database_helper.get_logged_in_user(email)
    if len(user_status) != 0:
        returnmsg = {
            'sucess': False,
            'message': " User is already logged in ",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    else:
        # find user, thus checking if email/password exists
        usr = database_helper.get_user(email, password)
        # generate token
        token = str(uuid.uuid4().get_hex())
        if len(usr) == 0:
            returnmsg = {
                'sucess': False,
                'message': "Wrong username or password.",
                'data': '-'}
            return json.dumps(returnmsg, indent=4)
        else:
            # add user to logged in users
            database_helper.set_logged_in_user(email, token)
            returnmsg = {
                'sucess': True,
                'message': "Successfully signed in.",
                'data': token}
            return json.dumps(returnmsg, indent=4, ensure_ascii=False).encode('utf8')


# sign up
@app.route("/sign_up", methods=['POST'])
def sign_up():
    # retrieve all info from form
    email = request.form['Email']
    password = request.form['Password1']
    firstname = request.form['Name']
    familyname = request.form['Last-name']
    gender = request.form['Gender']
    city = request.form['City']
    country = request.form['Country']
    # make sure that the user does not exist
    check = database_helper.get_user(email, password)
    if len(check) == 0:
        # if no such user, add to database!
        database_helper.add_user(email, password, firstname, familyname, gender, city, country)
        usr = database_helper.get_user(email, password)
        if len(usr) == 0:
            # make sure that the user was added correctly
            returnmsg = {
                'sucess': False,
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
            'sucess': False,
            'message': "User already exists.",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)


# sign out
@app.route("/sign_out", methods=['POST'])
def sign_out():
    # get token and check if logged in
    token = request.form['token']
    logged_in = database_helper.find_logged_in_user(token)
    if len(logged_in) != 0:
        # delete token from logged in users
        database_helper.log_out_user(token)
        check = database_helper.find_logged_in_user(token)
        if len(check) == 0:
            returnmsg = {
                'sucess': True,
                'message': "Successfully signed out.",
                'data': '-'}
            return json.dumps(returnmsg, indent=4)
    else:
        returnmsg = {
            'sucess': False,
            'message': "You are not signed in.",
            'data': '-'}
        return json.dumps(returnmsg)


# change password
@app.route("/change_password", methods=['POST'])
def change_password():
    # retrieve all the variables
    token = request.form['token']
    old_password = request.form['old_password']
    new_password = request.form['new_password']

    # check if user is logged in
    if token not in logged_in_users:
        returnmsg = {
            'sucess': False,
            'message': "User not logged in",
            'data': '-'}
        return json.dumps(returnmsg)

    email = logged_in_users[token]
    # check if user in database (correct password)
    usr = database_helper.get_user(email, old_password)
    if len(usr) < 1:
        returnmsg = {
            'sucess': False,
            'message': "Wrong password",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    else:
        # user logged in and entered the correct password!
        database_helper.set_password(email, old_password, new_password)
        if len(database_helper.get_user(email, new_password)) is not 0:
            returnmsg = {
                'sucess': True,
                'message': "Password changed.",
                'data': '-'}
            return json.dumps(returnmsg)
        else:
            returnmsg = {
                'sucess': False,
                'message': "Something went wrong...",
                'data': '-'}
            return json.dumps(returnmsg)


@app.route("/get_user_data_by_token/<token>", methods=['GET'])
def get_user_data_by_token(token):
    # make sure that user is logged in
    if token in logged_in_users:
        email = logged_in_users[token]
        user = database_helper.get_userinfo(email)
        if user is None:
            returnmsg = {
                'success': False,
                'message': "User does not exist",
                'data': '-'}
            return returnmsg
        else:
            return json.dumps(user, indent=4, ensure_ascii=False).encode('utf8')
    else:
        # if user not logged in
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return returnmsg


@app.route("/get_user_data_by_email/<token>/<email>", methods=['GET'])
def get_user_data_by_email(token, email):
    if token not in logged_in_users:
        returnmsg = {
            'success': False,
            'message': "You are not signed in.",
            'data': '-'}
        return returnmsg

    info = database_helper.get_userinfo(email)
    if info is None:
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return returnmsg
    else:
        return json.dumps(info, indent=4, ensure_ascii=False).encode('utf8')


@app.route("/get_user_messages_by_token/<token>", methods=['GET'])
def get_user_messages_by_token(token):
    # check if user is logged in
    if token not in logged_in_users:
        returnmsg = {
            'success': False,
            'message': "You are not signed in",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    email = logged_in_users[token]
    messages = database_helper.get_messages(email)
    return json.dumps(messages, indent=4)


@app.route("/get_user_messages_by_email/<token>/<email>", methods=['GET'])
def get_user_messages_by_email(token, email):
    # current user is logged in
    if token not in logged_in_users:
        returnmsg = {
            'success': False,
            'message': "You are not signed in",
            'data': '-'}
        return returnmsg
    # check if user exists
    user = database_helper.get_userinfo(email)
    if user is None:
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return returnmsg
    messages = database_helper.get_messages(email)
    return json.dumps(messages, indent=4)


@app.route("/post_message", methods=['POST'])
def post_message():
    token = request.form['token']
    # check if current user is logged in
    if token not in logged_in_users:
        returnmsg = {
            'success': False,
            'message': "You are not signed in",
            'data': '-'}
        return json.dumps(returnmsg, indent=4)
    # retrieve the rest of the information
    message = request.form['message']
    to_email = request.form['to_email']
    to_usr = database_helper.get_userinfo(to_email)
    # does the "post to" user exist?
    if len(to_usr) is None:
        returnmsg = {
            'success': False,
            'message': "User does not exist",
            'data': '-'}
        return json.dumps(returnmsg)
    # get current users email and post the message
    from_email = logged_in_users[token]
    database_helper.add_message(from_email, to_email, message)
    returnmsg = {
        'success': True,
        'message': "Message posted",
        'data': '-'}
    return json.dumps(returnmsg)


if __name__ == "__main__":
    app.run()
