from flask import Flask, jsonify, render_template, g, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)
DB_PATH = 'products.db'

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
                     "https://example.com/shoe.jpg",
                     "Comfortable everyday shoes!"),
                     (None,"Leather Bag",89.99,
                     "https://example.com/bag.jpg",
                     "Genuine leather tote bag"),
                ]
            )
        conn.commit()

@app.route("/")
def index():
    return render_template("index.html")

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

@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.get_json()
    name = data.get("name", "").strip()
    price = data.get("price")
    image_url = data.get("image_url", "").strip()

    if not name or price is None:
        return jsonify({ "error": "Name and price are requird"}), 400
    
    db = get_db()
    db.execute(
        "INSERT INTO products (name, price, image_url, description) VALUES (?,?,?,?)",
        (name, float(price), image_url, "")
    )
    db.commit()
    return jsonify({"sucess": True }), 201

if __name__ == "__main__":
    init_db()
    app.run(debug=True)