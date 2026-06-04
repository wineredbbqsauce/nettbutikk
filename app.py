# IF YOU WANT TO SWITCH TO MARIA DB, UNCOMMENT THE MARIA DB SECTIONS AND COMMENT OUT THE SQLITE SECTIONS IN THIS FILE, 
# MODELS.PY AND AUTH.PY. 
# 
# ALSO REMEMBER TO INSTALL PYMYSQL (pip install PyMySQL) AND SET UP A MARIA DB DATABASE WITH THE SAME CREDENTIALS AS IN DB_CONFIG. 
# 
# IF YOU FORGET TO COMMENT OUT THE SQLITE SECTIONS, 
# IT WILL STILL WORK WITH SQLITE, BUT IT'LL BE A MESS AND PROBABLY SLOWER, SO DON'T DO IT.


from flask import Flask, jsonify, redirect, render_template, g, request, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
# ─── SQLite ────────────────────────
import sqlite3
# ─── MariaDB ───────────────────────
# import pymysql
# import pymysql.cursors

import os
import uuid
from datetime import datetime, timedelta
from auth import init_user_db, create_user, authenticate_user, get_user_by_email, get_user_by_id, login_required, verify_hashed_password, hashed_password, get_user_db
from seed_products import SEED_PRODUCTS

app = Flask(__name__)
CORS(app)
# ─── SQLite ────────────────────────
DB_PATH = 'products.db'
# ─── MariaDB ───────────────────────
# DB_CONFIG = {
#     "host":       "localhost",
#     "user":       "nettbutikk",
#     "password":   "your_password_here",
#     "database":   "nettbutikk",
#     "charset":    "utf8mb4",
#     "cursorclass": pymysql.cursors.DictCursor,
# }

UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
app.secret_key = "supersecretkey" # For session management, would be better to have it in env variable or something, but this is just a simple project so whatever


app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Create the folder if not exists, obv u moron
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7) # Session expires after 1 week of inactivity, just to be safe
app.config["SESSION_COOKIE_HTTPONLY"] = True # Prevents JavaScript from accessing the session cookie, helps against XSS
app.config["SESSION_COOKIE_SECURE"] = False # Set to True if using HTTPS, but for local development we can leave it as False

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    # ─── SQLite ──────────────────────
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db
# ─── MariaDB ─────────────────────────
# def get_db():
#     if "db" not in g:
#         g.db = pymysql.connect(**DB_CONFIG)
#     return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    # ─── SQLite ─────────────────────
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                price       REAL NOT NULL,
                image_url   TEXT,
                description TEXT
                )
           """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                    email TEXT PRIMARY KEY
                )
            """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS cart (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                product_id  INTEGER NOT NULL,
                quantity    INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE(user_id, product_id)    
                )                         
            """)
        
        conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL,
            order_id     TEXT UNIQUE NOT NULL,
            status       TEXT NOT NULL DEFAULT 'pending',
            total_amount REAL NOT NULL,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id          INTEGER NOT NULL,
            product_id        INTEGER NOT NULL,
            quantity          INTEGER NOT NULL,
            price_at_purchase REAL NOT NULL,
            FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            """)

        if conn.execute(
            "SELECT COUNT(*) FROM products"
        ).fetchone()[0] == 0:
            conn.executemany(
                "INSERT INTO products (name, price, image_url, description) VALUES (?, ?, ?, ?)",
                SEED_PRODUCTS
            )

        if conn.execute("SELECT COUNT (*) FROM admins").fetchone()[0] == 0:
            conn.execute("" \
            "INSERT INTO admins (email) VALUES (?)", ("admin@section.com",))
        conn.commit()
    # ─── MariaDB ─────────────────────
    # conn = pymysql.connect(**DB_CONFIG)
    # with conn.cursor() as cursor:
    #     cursor.execute("""
    #         CREATE TABLE IF NOT EXISTS products (
    #             id          INT AUTO_INCREMENT PRIMARY KEY,
    #             name        VARCHAR(255) NOT NULL,
    #             price       DECIMAL(10,2) NOT NULL,
    #             image_url   TEXT,
    #             description TEXT
    #         )
    #     """)
    #
    #     cursor.execute("""
    #         CREATE TABLE IF NOT EXISTS admins (
    #             email VARCHAR(255) PRIMARY KEY
    #         )
    #     """)
    #
    #     cursor.execute("""
    #         CREATE TABLE IF NOT EXISTS cart (
    #             id          INT AUTO_INCREMENT PRIMARY KEY,
    #             user_id     INT NOT NULL,
    #             product_id  INT NOT NULL,
    #             quantity    INT NOT NULL DEFAULT 1,
    #             FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    #             UNIQUE(user_id, product_id)
    #         )
    #     """)
    #     cursor.execute("SELECT COUNT(*) as count FROM products")
    #     if cursor.fetchone()["count"] == 0:
    #         cursor.executemany(
    #             "INSERT INTO products (name, price, image_url, description) VALUES (%(name)s, %(price)s, %(image_url)s, %(description)s)",
    #             SEED_PRODUCTS
    #         )
    #      if conn.execute("SELECT COUNT (*) FROM admins").fetchone()[0] == 0:
    #        conn.execute(
    #       "INSERT INTO admins (email) VALUES (?)", ("admin@section.com",))
    #     conn.commit()
    #     conn.close()



# ============
#    AUTH
# ============

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    firstname = data.get("firstName", "").strip()
    lastname = data.get("lastName", "").strip()
    password = data.get("password", "").strip()
    email = data.get("email", "").strip()

    if not firstname or not lastname or not email or not password:
        return jsonify({"error": "Firstname, Lastname, Email and Password are required"}), 400
    
    if create_user(firstname, lastname, email, password):
        # Immediately log the user in by setting the session
        user = get_user_by_email(email)
        session["user_id"] = user["id"]
        session["email"] = user["email"]
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": user["id"],
                "firstname": user["firstname"],
                "lastname": user["lastname"],
                "email": user["email"]
            }
        }), 201
    else:
        return jsonify({"error": "Email already exists"}), 400

@app.route("/api/auth/login", methods=["POST"])
def login():
    """ Do u really think u can register a new user every single time u wanna log in? No, this is for logging in, like u know, authenticating.. """
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    user = authenticate_user(email, password)
    if user:
        session["user_id"] = user["id"]
        session["email"] = user["email"]
        return jsonify({
            "success": True, 
            "message": 
            "Logged in successfully", 
            "user": {
                "id": user["id"],
                "firstname": user["firstname"],
                "lastname": user["lastname"],
                "email": user["email"]
            }
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """ U know what this is for, right? Logging out, ending the session, whatever u wanna call it.. """
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

@app.route("/api/auth/me")
def get_current_user():
    """ You know.. sometimes i just want to be ego and look at myself, see if im still there, if the session is still valid and all that.. """
    if "user_id" in session:
        user = get_user_by_id(session["user_id"])
        if user:
            return jsonify({"user": {"id": user["id"], "firstname": user["firstname"], "lastname": user["lastname"], "email": user["email"]}}), 200
        return jsonify({"error": "User not found"}), 404
    return jsonify({"error": "Not authenticated"}), 401

@app.route("/api/auth/delete", methods=["POST"])
def delete_account():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_id = session["user_id"]

    # slett cart først (forgein key)
    db = get_db()
    # ─── SQLite ──────────────────────
    db.execute("DELETE FROM cart WHERE user_id = ?", (user_id,))
    db.commit()

    import sqlite3 as _sqlite3
    with _sqlite3.connect("users.db") as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #   cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
    # db.commit()
    # from auth import get_user_db as _get_user_db
    # user_conn as _get_user_db()
    # with user_conn.cuirsor() as cursor:
    #   cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    # user_conn.commit()
    # user_conn.close()
    
    session.clear()
    return jsonify({"success": True, "message": "Account deleted successfully"}), 200

@app.route("/api/checkout", methods=["POST"])
@login_required
def checkout():
    user_id = session["user_id"]
    db = get_db()

    cart_items = db.execute("""
        SELECT cart.product_id, cart.quantity, products.price
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    """, (user_id,)).fetchall()

    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    total = sum(item["quantity"] * item["price"] for item in cart_items)

    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    db.execute("""
        INSERT INTO orders (user_id, order_id, total_amount, status)
        VALUES (?, ?, ?, 'completed')
    """, (user_id, order_number, total))

    order_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    for item in cart_items:
        db.execute("""
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES (?, ?, ?, ?)
        """, (order_id, item["product_id"], item["quantity"], item["price"]))

    db.execute("DELETE FROM cart WHERE user_id = ?", (user_id,))
    db.commit()

    return jsonify({
        "success": True,
        "order_id": order_id,
        "order_number": order_number,
        "total_amount": total
    }), 200

@app.route("/api/user/transaction")
@login_required
def get_user_transaction():
    user_id = session["user_id"]
    db = get_db()

    transactions = db.execute("""
        SELECT order_id, total_amount, created_at, status
        FROM orders WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,)).fetchall()

    total_spent = db.execute("""
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ?
    """, (user_id,)).fetchone()["total"]

    return jsonify({
        "transactions": [dict(row) for row in transactions],
        "total_spent": total_spent
    })

@app.route("/api/user/orders")
@login_required
def get_user_orders():
    user_id = session["user_id"]
    db = get_db()

    orders = db.execute("""
        SELECT o.order_id, o.total_amount, o.created_at, o.status,
               GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    """, (user_id,)).fetchall()

    return jsonify([dict(row) for row in orders])


# ============
#    CART
# ============

@app.route("/api/cart", methods=["GET"])
def get_cart():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    db = get_db()
    # ─── SQLite ─────────────────────
    rows = db.execute("""
        SELECT cart.id, cart.quantity, products.id as product_id, products.name, products.price, products.image_url
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    """, (session["user_id"],)).fetchall()

    return jsonify([dict(r) for r in rows])

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     cursor.execute("""
    #     SELECT cart.id, cart.quantity, products.id as product_id, products.name, products.price, products.image_url
    #     FROM cart
    #     JOIN products ON cart.product_id = products.id
    #     WHERE cart.user_id = %s
    # """, (session["user_id"],))
    #     rows = cursor.fetchall()
    # return jsonify(rows)

@app.route("/api/cart/add", methods=["POST"])
def cart_add():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    db = get_db()

    # ─── SQLite ──────────────────────
    # Hvis produktet allerede er i kurven, øk antallet - obvs
    db.execute("""
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, product_id)
        DO UPDATE SET quantity = quantity + excluded.quantity
""", (session["user_id"], product_id, quantity))
    db.commit()

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     cursor.execute("""
    #       INSERT INTO cart (user_id, product_id, quantity)
    #       VALUES (%s, %s, %s)
    #       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    #     """, (session["user_id"], product_id, quantity))
    # db.commit()

    return jsonify({"success": True}), 200

@app.route("/api/cart/update", methods=["POST"])
def cart_update():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    product_id = data.get("product_id")
    quantity = data.get("quantity")

    if not product_id or quantity is None:
        return jsonify({"error": "Product_id and quantity are required"}), 400
    
    db = get_db()
    # ─── SQLite ──────────────────────
    if quantity <= 0:
        db.execute("DELETE FROM cart WHERE user_id = ? AND product_id = ?", (session["user_id"], product_id))
    
    else:
        db.execute("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?", (quantity, session["user_id"], product_id))
    
    db.commit()

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     if quantity <= 0:
    #         cursor.execute("DELETE FROM cart WHERE user_id = %s AND product_id = %s", (session["user_id"], product_id))
    #     else:
    #         cursor.execute("UPDATE cart SET quantity = %s WHERE user_id = %s AND product_id = %s", (quantity, session["user_id"], product_id))
    # db.commit()

    return jsonify({"success": True}), 200

@app.route("/api/cart/remove", methods=["POST"])
def cart_remove():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    db = get_db()
    # ─── SQLite ──────────────────────
    db.execute("DELETE FROM cart WHERE user_id = ? AND product_id = ?", (session["user_id"], product_id))
    db.commit()

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     cursor.execute("DELETE FROM cart WHERE user_id = %s AND product_id = %s", (session["user_id"], product_id))
    # db.commit()

    return jsonify({"success": True}), 200


@app.route("/api/cart/clear", methods=["POST"])
def cart_clear():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    db = get_db()
    # ─── SQLite ──────────────────────
    db.execute("DELETE FROM cart WHERE user_id = ?", (session["user_id"],))
    db.commit()

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     cursor.execute("DELETE FROM cart WHERE user_id = %s", (session["user_id"],))
    # db.commit()

    return jsonify({"success": True}), 200

@app.route("/api/auth/update-profile", methods=["PUT"])
def update_profile():
    if "user_id" not in session:
        return jsonify({ "error": "Authentication required"}), 401
    
    data = request.get_json()
    firstname = data.get("firstName", "").strip()
    lastname = data.get("lastName", "").strip()
    email = data.get("email", "").strip()

    if not firstname or not lastname or not email:
        return jsonify({"error": "All fields are required"}), 400
    
    user_id = session["user_id"]

    # Sjekk at epost ikke er i bruk av en annen bruker

    conn = get_user_db()
    # ─── SQLite ──────────────────────
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?", (email, user_id)
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email already taken"}), 400
    
    conn.execute(
        "UPDATE users SET firstname=?, lastname=?, email=? WHERE id=?",
        (firstname, lastname, email, user_id)
    )
    conn.commit()
    conn.close()

    # ─── MariaDB ─────────────────────
    # with conn.cursor() as cursor:
    #     cursor.execute(
    #         "SELECT id FROM users WHERE email = %s AND id != %s", (email, user_id)
    #     )
    #     existing = cursor.fetchone()
    #     if existing:
    #         return jsonify({"error": "Email already taken"}), 400
    #     cursor.execute(
    #         "UPDATE users SET firstname=%s, lastname=%s, email=%s WHERE id=%s",
    #         (firstname, lastname, email, user_id)
    #     )
    # conn.commit()
    # conn.close()

    return jsonify({
        "success": True,
        "firstname": firstname,
        "lastname": lastname,
        "email": email
    }), 200


@app.route("/api/auth/change-password", methods=["PUT"])
def change_password():
    if "user_id" not in session:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json()
    current_password = data.get("currentPassword", "").strip()
    new_password = data.get("newPassword", "").strip()

    if not current_password or not new_password:
        return jsonify({"error": "Current and new password required"}), 400
    # if len(new_password) < 6:
    #     return jsonify({"error": "New password must be at least 6 characters"}), 400

    # verify current password
    user = get_user_by_id(session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not verify_hashed_password(current_password, user["password"]):
        return jsonify({"error": "Current password is incorrect"}), 400

    # hash new password and update
    new_hash = hashed_password(new_password)
    conn = get_user_db()
    # ─── SQLite ──────────────────────
    conn.execute("UPDATE users SET password = ? WHERE id = ?", (new_hash, user["id"]))
    conn.commit()
    conn.close()

    # ─── MariaDB ─────────────────────
    # with conn.cursor() as cursor:
    #     cursor.execute("UPDATE users SET password = %s WHERE id = %s", (new_hash, user["id"]))
    # conn.commit()
    # conn.close()

    return jsonify({"success": True, "message": "Password updated"}), 200

# ============ 
# 
#    ROUTES
# 
# ============

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/products")
def products():
    # ─── SQLite ──────────────────────
    is_admin = False
    if "user_id" in session:
        db = get_db()
        row = db.execute("SELECT email FROM admins WHERE email = ?", (session["email"],)).fetchone()
        if row:
            is_admin = True
    
    # ─── MariaDB ─────────────────────
    # is_admin = False
    # if "user_id" in session:
    #     db = get_db()
    #     with db.cursor() as cursor:
    #         cursor.execute("SELECT email FROM admins WHERE email = %s", (session["email"],))
    #         row = cursor.fetchone()
    #         if row:
    #             is_admin = True
    return render_template("products.html", is_admin=is_admin)

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

@app.route("/about-us")
def about_us():
    return render_template("about-us.html")

@app.route("/contact")
def contact_page():
    return render_template("contact.html")

@app.route("/settings")
def settings_page():
    if "user_id" not in session:
        return redirect("/login")
    return render_template("settings.html")

@app.route("/checkout")
def checkout_page():
    if "user_id" not in session:
        return redirect("/login")
    return render_template("checkout.html")
    
@app.route("/api/products")
def get_products():
    db = get_db()
    # ─── SQLite ──────────────────────
    rows = db.execute("SELECT * FROM products").fetchall()
    return jsonify([dict(r) for r in rows])
    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     cursor.execute("SELECT * FROM products")
    #     rows = cursor.fetchall()
    # return jsonify(rows)

@app.route("/api/products/<int:product_id>")
def get_product(product_id):
    db = get_db()

    # ─── SQLite ──────────────────────
    row = db.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)
    ).fetchone()
    if row:
        return jsonify(dict(row))
    
    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #     cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    #     row = cursor.fetchone()
    # if row:
    #     return jsonify(row)
    return jsonify({"error": "Not found"}), 404

@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    db = get_db()
    # ─── SQLite ──────────────────────
    row = db.execute("SELECT email FROM admins WHERE email = ?", (session["email"],)).fetchone()
    if not row:
        return jsonify({"error": "Admin access required"}), 403
    
    db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()

    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #   cursor.execute("SELECT email FROM admins WHERE email = %s", (session["email"],))
    #   admin = cursor.fetchone()
    #   if not admin:
    #     return jsonify({"error": "Admin access required"}), 403
    #   cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
    # db.commit()
    
    return jsonify({"success": True}), 200

@app.route("/api/products", methods=["POST"])
def add_product():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    db = get_db()
    row = db.execute("SELECT email FROM admins WHERE email = ?", (session["email"],)).fetchone()
    if not row:
        return jsonify({"error": "Admin access required"}), 403
    
    # ─── MariaDB ─────────────────────
    # with db.cursor() as cursor:
    #   cursor.execute("SELECT email FROM admins WHERE email = %s", (session["email"],))
    #   admin = cursor.fetchone()
    #   if not admin:
    #     return jsonify({"error": "Admin access required"}), 403
    
    name = request.form.get("name", "").strip()
    price = request.form.get("price")
    description = request.form.get("description", "").strip()
    image = request.files.get("image")

    # if not name or price is None:
    #     return jsonify({ "error": "Name and price are required"}), 400
    
    if not name:
        return jsonify({"error": "Name is required"}), 400

    if not price:
        return jsonify({"error": "Price is required"}), 400

    try:
        price_float = float(price)
        if price_float <= 0:
            return jsonify({"error": "Price must be greater than 0"}), 400
    except ValueError:
        return jsonify({"error": "Price must be a valid number"}), 400

    image_url = None
    # handler bilder og opplasting

    if image and image.filename:
        if not allowed_file(image.filename):
            return jsonify({"error": "File type not allowed. Use png, jpg, jpeg or webp"}), 400
        
        try:
            # Create unique filename to prevent collissions.. duh.. would be a big no no
            ext = image.filename.rsplit(".", 1)[1].lower()
            unique_filename = f"{uuid.uuid4()}_{int(datetime.now().timestamp())}.{ext}"
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
            image.save(filepath)
            image_url = f"/static/uploads/{unique_filename}"
        except Exception as e:
            return jsonify({"error": f"Image upload failed: {str(e)}"}), 500

    try:
        db = get_db()
        # ─── SQLite ──────────────────────
        db.execute(
            "INSERT INTO products (name, price, image_url, description) VALUES (?,?,?,?)",
            (name, float(price), image_url, description)
        )
        db.commit()

        # ─── MariaDB ─────────────────────
        # with db.cursor() as cursor:
        #     cursor.execute(
        #         "INSERT INTO products (name, price, image_url, description) VALUES (%s, %s, %s, %s)",
        #         (name, float(price), image_url, description)
        #     )
        # db.commit()

        return jsonify({"success": True }), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

if __name__ == "__main__":
    init_db()
    init_user_db()
    app.run(debug=True)
    # Marker ut denne (med # foran) eller fjern den for kunne kjøre profft 

    # app.run(host="0.0.0.0", port=5000)
    # Kjør denne for å hoste den lokalt på nettet og ikke bare på datamaskinen