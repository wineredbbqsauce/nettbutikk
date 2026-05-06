from flask import Flask, jsonify, render_template, g, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)
DB_PATH = 'products.db'
UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Create the folder if not exists, obv u moron

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
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
        if conn.execute(
            "SELECT COUNT(*) FROM products"
        ).fetchone()[0] == 0:
            conn.executemany(
                "INSERT INTO products VALUES (?,?,?,?,?)",
                [
                    (None, "Blue Sneakers", 49.99,
                     "https://luksusbaby.no/cdn/shop/products/gsb480wh_2.jpg?v=1710449321&width=1214",
                     "Comfortable everyday shoes!"),
                    (None,"Leather Bag",89.99,
                      "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/F02718s.jpg?im=Resize,width=750",
                    "Genuine leather tote bag"),
                    (None, "Placeholder", -10,
                     "/static/assets/placeholder.png",
                     "Let me - bitch"
                    ),
                ]
            )
        conn.commit()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/products")
def products():
    return render_template("products.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/api/products")
def get_products():
    db = get_db()
    rows = db.execute("SELECT * FROM products").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/products/<int:product_id>")
def get_product(product_id):
    db = get_db()
    row = db.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)
    ).fetchone()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "Not found"}), 404

@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    db = get_db()
    db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
    return jsonify({"success": True}), 200

@app.route("/api/products", methods=["POST"])
def add_product():
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
        db.execute(
            "INSERT INTO products (name, price, image_url, description) VALUES (?,?,?,?)",
            (name, float(price), image_url, description)
        )
        db.commit()
        return jsonify({"success": True }), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

if __name__ == "__main__":
    init_db()
    app.run(debug=True)