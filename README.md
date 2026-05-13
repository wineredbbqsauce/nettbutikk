<p align="center">
  <img src="https://imgur.com/7oOLWZg.png" width="65%" style="border-radius: 6px" alt="Nettbutikk Banner">
</p>

<h1 align="center">🛒 Nettbutikk Mock / Template</h1>

<p align="center">
  A customizable Flask webshop template with authentication, carts, products and SQLite support.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flask-Webstore-black?style=for-the-badge&logo=flask">
  <img src="https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python">
  <img src="https://img.shields.io/badge/Database-SQLite-green?style=for-the-badge">
  <img src="https://img.shields.io/badge/Status-WIP-orange?style=for-the-badge">
</p>

<p align="center">
<img src="https://img.shields.io/github/repo-size/wineredbbqsauce/nettbutikk" />
<img src="https://img.shields.io/github/stars/wineredbbqsauce/nettbutikk" />
<img src="https://img.shields.io/github/last-commit/wineredbbqsauce/nettbutikk" />
</p>

<p align="center">This project is meant to be used as a starting point for your own webshop, experiments, learning projects, or custom storefronts.</p>

<br>
<br>
<h2 align="center">⚠️ Disclaimer</h2>

<p align="center">
This project is open-source and free to use with attribution optional.
</p>

<p align="center">
You are free to use, modify, and distribute this project however you'd like.
</p>

<p align="center"><strong>Just don't use it for:</strong></p>

<p align="center">
malware • phishing • hacking • illegal activity • other shady stuff
</p>

<p align="center">
Be normal.
</p>

---

<br>
<br>
<br>

# <p align="center"> <strong>✨ Features </strong></p>

| Feature                | Status |
| ---------------------- | ------ |
| User Authentication    | ✅     |
| Shopping Cart          | ✅     |
| Product System         | ✅     |
| SQLite Support         | ✅     |
| Auto Database Creation | ✅     |
| Admin Panel            | 🚧     |
| Checkout System        | 🚧     |
| OAuth Login            | 🚧     |
| Settings tab           | 🚧     |

The placeholder/demo products are only there so the store has content out of the box.

If you don't want them:

- remove them manually
- or replace them with your own products

---

<br>
<br>
<br>

# <p align="center"><strong>📋 Requirements </strong></p>

| Requirement        | Version | Notes    |
| ------------------ | ------- | -------- |
| Python             | 3.12    | Required |
| Web browser        | Latest  | Required |
| Internet and Power | Latest  | Required |

<!-- > **Note:** Spigot may work but is untested. Paper is recommended. -->

---

<br>
<br>
<br>

# <p align="center"><strong>🗄️ Database </strong></p>

This project currently uses SQLite (`.db` files) for simplicity and portability.

The database files are automatically created the first time the server starts, so you normally don't need to manually create anything yourself.

You can absolutely switch to another database if you'd like, for example:

- PostgreSQL
- MySQL
- MariaDB
- MongoDB
- anything else

The project structure is intentionally simple so modifying the database layer should be straightforward.

---

<br>
<br>
<br>

# <p align="center"><strong>🚀 Quick Setup </strong></p>

## Using the setup script (recommended)

```bash
git clone https://github.com/wineredbbqsauce/nettbutikk.git
cd nettbutikk
chmod +x setup.sh
./setup.sh
```

---

<br>
<br>
<br>

# <p align="center"><strong>🛠️ Manual Setup </strong></p>

## 1. Clone the repository

Clone the repository to desired location and change directory

```bash
git clone https://github.com/wineredbbqsauce/nettbutikk.git

cd nettbutikk
```

## 2. Create virtual enviroment

This webstore uses Flask which needs it own virtual enviroment (venv) to work

```bash
python3 -m venv .venv
```

#### Linux / MacOS

```bash
python3 -m venv .venv

source .venv/bin/activate
```

Windows

```powershell
.venv\Scripts\activate

OR

.venv\Scripts\activate.bat
```

If you are on any other OS, figure it out. Google is free.

## 3. Install Dependencies

All the required dependencies are inside the [requirements.txt](requirements.txt)

```bash
pip install -r requirements.txt
```

If pip does not work, or you do not have pip installed (which you should concidering this used python), install pip or figure out the problem. It's really not that hard

## 4. Start the server

```bash
python app.py
```

As said before "_The database (`.db`) files are automatically created the first time the server starts, so you normally don't need to manually create anything yourself._"

If they are not created, and you have to create them yourself

Create **2** .db files:

- users.db
- products.db

---

<br>
<br>
<br>
<h1 align="center"><strong>❓ Things to add later?</strong></h1>

<p align="center">
This project is still evolving. Here are some planned improvements and features:
</p>

<p align="center">
<strong>🧠 Planned features</strong>
</p>

<p align="center">
- Dedicated admin dashboard (manage products, users, orders)<br>
- Full checkout system (payments + order handling (<strong>mock</strong>))<br>
- Google / Apple OAuth login<br>
- Better authentication system (roles, permissions)<br>
- Product image upload system<br>
- Email notifications (orders, receipts, etc.)<br>
- Improved UI / UX redesign<br>
- Better cart persistence (session + database sync)
</p>

<p align="center">
<strong>🧪 Experimental ideas</strong>
</p>

<p align="center">
- Docker support for easy deployment<br>
- REST API version of the webshop<br>
- Multi-store support (one backend, multiple shops)<br>
- Dark mode / theme system<br>
- Analytics dashboard (sales, users, traffic)
</p>

<p align="center">
<i>Nothing is guaranteed to be added in any specific order — this is just a roadmap of ideas.</i>
</p>
<br>
<br>
<br>

# <p align="center">🛠️🚧 Under Construction </p>

Keep in mind that this project is under construction and it is not fully done

If things break or doens't work as they should, womp womp - ask [Google](https://google.com), not me.

I will try to update the project as much as i can, but i do also have a life, so i cannot (and will not) update this as it's suits you.

> _PS: There are some commens in the file in norwegian and some in english, i just dont have energy to do anything about it. Just use google translate._

<br>
<br>

## 📄 License

This project is licensed under the [MIT License](LICENSE).

</p>
