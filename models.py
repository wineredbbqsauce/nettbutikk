# ─── SQLite ──────────────────────
import sqlite3

# ─── MariaDB ─────────────────────
# import pymysql
# import pymysql.cursors

import bcrypt
from datetime import datetime

# ─── SQLite ──────────────────────
DB_PATH = "users.db"

# ─── MariaDB ─────────────────────
# DB_CONFIG = {
#     "host": "localhost",
#     "user": "nettbutikk",
#     "password": "password",
#     "database": "nettbutikk",
#     "charset": "utf8mb4",
#     "cursorclass": pymysql.cursors.DictCursor
# }git commit -m "Added commented out mariaDB versions - UNCOMMENT TO SWITCH TO MariaDB"


def get_user_db():
    """Get conn to users.db"""
    # ─── SQLite ──────────────────────
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

    # ─── MariaDB ─────────────────────
    # return pymysql.connect(**DB_CONFIG)

def init_user_db():
    """ Initialize users table """
    # ─── SQLite ──────────────────────
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.commit()
    
    # ─── MariaDB ─────────────────────
    # conn = pymysql.connect(**DB_CONFIG)
    # with conn.cursor() as cursor:
    #     cursor.execute("""
    #         CREATE TABLE IF NOT EXISTS users (
    #             id INT AUTO_INCREMENT PRIMARY KEY,
    #             username VARCHAR(100) UNIQUE NOT NULL,
    #             password VARCHAR(60) NOT NULL
    #         )
    #     """)
    # conn.commit()
    # conn.close()

def hashed_password(password):
    """Hash a password for storing - wouldnt be that good to have it plain.. obvs.. """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

def verify_hashed_password(password, hashed_password):
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password)

def create_user(username, email, password):
    # ─── SQLite ──────────────────────
    try:
        conn = get_user_db()
        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_password(password))
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False # If username or email already exists

    # ─── MariaDB ─────────────────────
    # try:
    #     conn = get_user_db()
    #     with conn.cursor() as cursor:
    #         cursor.execute(
    #             "INSERT INTO users (username, password) VALUES (%s, %s)",
    #             (username, hashed_password(password))
    #         )
    #     conn.commit()
    #     conn.close()
    # except pymysql.err.IntegrityError:
    #     return False # If username or email already exists

def get_user_by_username(username):
    # ─── SQLite ──────────────────────
    conn = get_user_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()

    # ─── MariaDB ─────────────────────
    # conn = get_user_db()
    # with conn.cursor() as cursor:
    #     cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    #     user = cursor.fetchone()
    conn.close()
    return user

def authenticate_user(username, password):
    user = get_user_by_username(username)
    if user and verify_hashed_password(password, user["password"]):
        return user
    return None
