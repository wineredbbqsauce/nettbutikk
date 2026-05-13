# USAGE: bcrypt

import sqlite3
import bcrypt
from functools import wraps
from flask import session, jsonify

DB_PATH = "users.db"

def get_user_db():
    """Get conn to users.db"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_user_db():
    """ initialize users table """
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstname TEXT NOT NULL,
                lastname TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.commit()

def hashed_password(password: str) -> str:
    """Hash a password for storing - wouldnt be that good to have it plain.. obvs.. """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_hashed_password(plain: str, hashed: str) -> bool:
    """Verify if it is the same password """
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_user(firstname, lastname, email, password):
    """ Create new user """
    try:
        with get_user_db() as conn:
            conn.execute(
                "INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)",
                (firstname, lastname, email, hashed_password(password))
            )
            conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False # If user or email already exists

def get_user_by_email(email):
    """ Get user by email - as it says in the name """
    conn = get_user_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """ Get user by id - as it says in the name again, idiot """
    conn = get_user_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return user

def authenticate_user(email, password):
    """ Authenticate user - check if email and password match """
    user = get_user_by_email(email)
    if user and verify_hashed_password(password, user["password"]):
        return dict(user)
    return None

def login_required(f):
    """ Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function