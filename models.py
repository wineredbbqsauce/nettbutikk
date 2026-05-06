import sqlite3
import bcrypt
from datetime import datetime

DB_PATH = "users.db"

def get_user_db():
    """Get conn to users.db"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_user_db():
    """ Initialize users table """
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.commit()

def hashed_password(password):
    """Hash a password for storing - wouldnt be that good to have it plain.. obvs.. """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

def verify_hashed_password(password, hashed_password):
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password)

def create_user(username, email, password):
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

def get_user_by_username(username):
    conn = get_user_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    conn.close()
    return user

def authenticate_user(username, password):
    user = get_user_by_username(username)
    if user and verify_hashed_password(password, user["password"]):
        return user
    return None
