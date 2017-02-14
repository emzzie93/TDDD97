# -*- coding: utf-8 -*-

import sqlite3
from flask import g

DATABASE = '/home/emma/Documents/TDDD97/lab2/venv/database.db'


def connect_db():
    sqldb = sqlite3.connect('/home/emma/Documents/TDDD97/lab2/venv/database.db')
    return sqldb


def get_db():
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db


def close_db(error):
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()


def find_user(email, password):
    db = get_db()
    cursor = db.cursor()
    result = cursor.execute("SELECT email, password FROM users WHERE email=? AND password=?", (email, password))
    usr = result.fetchone()
    return usr


def add_user(email, password, firstname, familyname, gender, city, country):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO users VALUES( ?, ?, ?, ?, ?, ?, ?)",
                   (email, password, firstname, familyname, gender, city, country))
    db.commit()


def change_password(email, old_password, new_password):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE email = ? AND password = ?", (new_password, email, old_password))
    db.commit()


def get_userinfo(email):
    db = get_db()
    cursor = db.cursor()
    res = cursor.execute("SELECT email, firstname, familyname, gender, city, country FROM users WHERE email= ?", (email,))
    usrinfo = res.fetchone()
    return usrinfo


def postmsg(from_email, to_email, message):
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
