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
    <div class="card">
      <div class="image">
        <img src="${p.image_url || ""}"
          alt="${p.name}"
          onerror="this.style.display='none'">
      </div>
      <span class="title">${p.name}</span>
      <span class="price">$${parseFloat(p.price).toFixed(2)}</span>
      </div>
    `,
    )
    .join("");
}

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
  const price = document.getElementById("new-price").value;
  const image_url = document.getElementById("new-image").value.trim();
  const errEl = document.getElementById("add-error");

  if (!name || !price) {
    errEl.textContent = "Name and Price are required!";
    errEl.style.display = "block";
    return;
  }

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price: parseFloat(price), image_url }),
  });

  if (res.ok) {
    closeAddModal();
    loadProducts(); // refresh u moron bastartd
  } else {
    const data = await res.json();
    errEl.textContent = data.error || "Something went wrong dipshit";
    errEl.style.display = "block";
  }
}

loadProducts();
