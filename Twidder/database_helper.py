# -*- coding: utf-8 -*-

import sqlite3
from flask import g

DATABASE = '/home/emma/Documents/TDDD97/Twidder/database.db'


def connect_db():
    sqldb = sqlite3.connect(DATABASE)
    return sqldb


def get_db():
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db


def close_db(error):
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()


def get_user(email, password):
    db = get_db()
    cursor = db.cursor()
    result = cursor.execute("SELECT email, password FROM users WHERE email=? AND password=?", (email, password))
    usr = result.fetchall()
    return usr


def add_user(email, password, firstname, familyname, gender, city, country):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO users VALUES( ?, ?, ?, ?, ?, ?, ?)",
                   (email, password, firstname, familyname, gender, city, country))
    db.commit()


def set_password(email, old_password, new_password):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE email = ? AND password = ?", (new_password, email, old_password))
    db.commit()


def get_userinfo(email):
    db = get_db()
    cursor = db.cursor()
    res = cursor.execute("SELECT email, firstname, familyname, gender, city, country FROM users WHERE email= ?", (email,))
    usrinfo = res.fetchall()
    return usrinfo


def add_message(from_email, to_email, message):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO messages VALUES(?,?,?)", (from_email, to_email, message))
    db.commit()


def get_messages(email):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT message FROM messages WHERE post_to=?", (email,))
    msges = cursor.fetchall()
    return msges


def get_logged_in_user(email):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT email FROM logged_in_users WHERE email=?", (email,))
    user = cursor.fetchall()
    return user


def set_logged_in_user(email, token):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO logged_in_users VALUES (?,?)", (email, token))
    db.commit()


def find_logged_in_user(token):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT token FROM logged_in_users WHERE token=?", (token,))
    logged_in_user = cursor.fetchall()
    return logged_in_user


def log_out_user(token):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM logged_in_users WHERE token=?", (token,))
    db.commit()
