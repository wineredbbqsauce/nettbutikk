const API = "/api/products";
let cart = [];
let allProducts = [];

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  setupEventListeners();
  setupScrollAnimations();
});

function setupEventListeners() {
  document.getElementById("cart-toggle").addEventListener("click", toggleCart);
  document
    .getElementById("search-input")
    .addEventListener("input", filterAndSort);
  document
    .getElementById("sort-select")
    .addEventListener("change", filterAndSort);
  document
    .getElementById("contact-form")
    .addEventListener("submit", handleContactForm);
}

// ====== LOAD PRODUCTS ======
async function loadProducts() {
  try {
    const res = await fetch(API);
    const products = await res.json();
    allProducts = products;

    renderFeatured(products.slice(0, 3));
    renderAllProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function renderFeatured(products) {
  const grid = document.getElementById("featured-grid");
  grid.innerHTML = products.map((p) => createProductCard(p)).join("");
}

function renderAllProducts(products) {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = products.map((p) => createProductCard(p)).join("");
}

function createProductCard(product) {
  return `
        <div class="product-card">
            <div class="product-image">
                ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : "📦"}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-desc">${product.description || "Premium quality item"}</div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

// ====== CART MANAGEMENT ======
function addToCart(id, name, price) {
  const item = cart.find((i) => i.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }

  updateCartUI();
  showNotification(`${name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  document.querySelector(".cart-count").textContent = count;
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cart-items");

  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-message">Your cart is empty</p>';
    document.getElementById("cart-total").textContent = "$0.00";
    return;
  }

  container.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-qty">x${item.qty}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
            </div>
        </div>
    `,
    )
    .join("");

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
}

function toggleCart() {
  document.getElementById("cart-modal").classList.toggle("hidden");
}

// ====== FILTER & SORT ======
function filterAndSort() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const sort = document.getElementById("sort-select").value;

  let filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query),
  );

  if (sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderAllProducts(filtered);
}

// ====== CONTACT FORM ======
function handleContactForm(e) {
  e.preventDefault();
  showNotification("Message sent! We'll get back to you soon.");
  e.target.reset();
}

// ====== NOTIFICATIONS ======
function showNotification(message) {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.classList.remove("hidden");

  setTimeout(() => {
    notif.classList.add("hidden");
  }, 3000);
}

// ====== SCROLL ANIMATIONS ======
function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 },
  );

  document
    .querySelectorAll(".product-card, .about-text, .contact-wrapper")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "all 0.6s ease";
      observer.observe(el);
    });
}
