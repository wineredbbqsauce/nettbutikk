const API = "/api/products";
let allProducts = [];

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  setupEventListeners();
  setupScrollAnimations();
});

function setupEventListeners() {
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
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

// ====== FILTER & SORT ======
function filterAndSort() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const sort = document.getElementById("sort-select").value;

  let filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query),
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
