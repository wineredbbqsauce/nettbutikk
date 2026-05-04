/* const products = [
  {
    id: 1,
    name: "Weed",
    price: 10,
    image: "weed.png",
    brand: "Cow",
    description: "The best smoke you will ever have",
  },
];

let cart = [];

function renderProducts(productsToRender) {
    productGrid.innerHTML = "";
    if (productsToRender.lenght === 0) {
            productGrid.innerHTML = `<p class="no-products-found">No products match your criteria.</p>`;
            return;
    }
    productsToRender.forEach((product, index) => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";
        productCard.style.animationDelay = `${index * 0.5}s`;
        productCard.dataset.productId = productIdM
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image>
            <h3>${product.name}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
        `;
        productGrid.appendChild(productCard)
    })
}

*/
const API = "/api/products";

let removeMode = false;

async function loadProducts() {
  const res = await fetch(API);
  const products = await res.json();

  const grid = document.getElementById("product-grid");

  if (products.length === 0) {
    grid.innerHTML = "<p style='padding:24px;'>No Products yet, moron.</p>";
    return;
  }

  grid.innerHTML = products
    .map(
      (p) => `
      <div class="card" id="card-${p.id}">
        <div class="image">
          <img src="${p.image_url || ""}" alt="${p.name}" onerror="this.style.display='none'">
          <div class="overlay">
            <button class="overlay-btn" onclick="addToCart(event, this, ${p.id})">Add to Cart</button>
          </div>
          <button class="delete-btn" onclick="deleteProduct(event, ${p.id})">🗑</button>
        </div>
        <div class="info">
          <span class="title">${p.name}</span>
          <span class="price">$${parseFloat(p.price).toFixed(2)}</span>
        </div>
      </div>
    `,
    )
    .join("");
}

function toggleRemoveMode() {
  removeMode = !removeMode;
  const btn = document.getElementById("remove-toggle");

  if (removeMode) {
    btn.textContent = "✕";
    btn.classList.add("active");
  } else {
    btn.textContent = "🗑 Remove";
    btn.classList.remove("active");
  }

  // toggle remove modes class on all cards without re-fetching
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("remove-mode", removeMode);
    const overlay = card.querySelector(".overlay");
    if (overlay) overlay.style.display = removeMode ? "none" : "";
  });
}

async function deleteProduct(event, id) {
  event.stopPropagation();

  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (res.ok) {
    // remove card from DOM instantly without full reload
    const card = document.getElementById(`card-${id}`);
    if (card) card.remove();
  } else {
    alert("Failed t odelete product.");
  }
}

function addToCart(event, btn, id) {
  event.stopPropagation(); // dont trigger card click
  btn.textContent = "Added!";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = "Add To Cart";
    btn.classList.remove("added");
  }, 1400);
}

// Show preview when file is selected
document.getElementById("new-image").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  const preview = document.getElementById("image-preview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
});

// Add moron- no. i mean modal

function openAddModal() {
  document.getElementById("add-modal").classList.remove("hidden");
}

function closeAddModal() {
  document.getElementById("add-modal").classList.add("hidden");
  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-image").value = "";
  document.getElementById("add-error").style.display = "none";
}

async function submitProduct() {
  const name = document.getElementById("new-name").value.trim();
  const price = document.getElementById("new-price").value.trim();
  const image = document.getElementById("new-image").files[0];
  const errEl = document.getElementById("add-error");

  if (!name || !price) {
    errEl.textContent = "Name and Price are required!";
    errEl.style.display = "block";
    return;
  }

  if (isNaN(price) || parseFloat(price) <= 0) {
    errEl.textContent = "Price must be a valid positive number!";
    errEl.style.display = "block";
    return;
  }

  // Bruker FormData og ikke JSON - trengs for file opplastinger
  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", price);
  if (image) formData.append("image", image);

  const res = await fetch(API, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (res.ok) {
    closeAddModal();
    loadProducts(); // refresh u moron bastartd
  } else {
    errEl.textContent = data.error || "Something went wrong dipshit";
    errEl.style.display = "block";
  }
}

loadProducts();
