// inkluder alle sider med <script src="/static/js/cart.js" />

const Cart = {
  async getItems() {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async add(productId, quantity = 1) {
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      Cart.refreshUI();
      return data;
    } catch (err) {
      console.error("Cart.add:", err);
    }
  },
  async remove(productId) {
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      Cart.refreshUI();
      return data;
    } catch (err) {
      console.error("Cart.remove:", err);
    }
  },

  async update(productId, quantity) {
    try {
      const res = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      Cart.refreshUI();
      return data;
    } catch (err) {
      console.error("Cart.update:", err);
    }
  },

  async clear() {
    try {
      await fetch("/api/cart/clear", { method: "POST" });
      await Cart.refreshUI();
    } catch (err) {
      console.error("Cart.clear:", err);
    }
  },

  changeQty(productId, newQty) {
    if (newQty <= 0) Cart.remove(productId);
    else Cart.update(productId, newQty);
  },

  // -------------- UI --------------

  async refreshUI() {
    const items = await Cart.getItems();
    Cart.updateBadge(items);
    Cart.renderDrawer(items);
  },

  // Oppdater antall-badge i handlekurv ikonet
  updateBadge(items) {
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll(".cart-count").forEach((badge) => {
      badge.textContent = total;
    });
  },

  renderDrawer(items) {
    const body = document.getElementById("cart-drawer-body");
    const totalEl = document.getElementById("cart-drawer-total");
    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
      if (totalEl) totalEl.textContent = "$0.00";
      return;
    }

    body.innerHTML = items
      .map(
        (item) => `
      <div class="cart-item" id="cart-item-${item.product_id}">
        <img src="${item.image_url || ""}" alt="${item.name}"
             onerror="this.style.display='none'" />
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</span>
          <div class="cart-item-qty">
            <button onclick="Cart.changeQty(${item.product_id}, ${item.quantity - 1})">−</button>
            <span>${item.quantity}</span>
            <button onclick="Cart.changeQty(${item.product_id}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.remove(${item.product_id})">✕</button>
      </div>
    `,
      )
      .join("");

    if (totalEl) {
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      totalEl.textContent = `$${total.toFixed(2)}`;
    }
  },

  openDrawer() {
    document.getElementById("cart-drawer")?.classList.add("open");
    const overlay = document.getElementById("cart-drawer-overlay");
    if (overlay) overlay.style.display = "block";
  },

  closeDrawer() {
    document.getElementById("cart-drawer")?.classList.remove("open");
    const overlay = document.getElementById("cart-drawer-overlay");
    if (overlay) overlay.style.display = "none";
  },

  async requireLogin() {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      window.location.href = "/login";
      return false;
    }
    return true;
  },
};

// Global func
async function addToCart(productId) {
  event.stopPropagation();
  const ok = await Cart.requireLogin();
  if (!ok) return;

  const btn = event.target;
  btn.textContent = "Added!";
  btn.classList.add("added");
  await Cart.add(productId);
  setTimeout(() => {
    btn.textContent = "Add to Cart!";
    btn.classList.remove("added");
  }, 1400);
}

async function addToCartFromModal() {
  if (!currentProduct) return;
  const ok = await Cart.requireLogin();
  if (!ok) return;

  const btn = event.target;
  await Cart.add(currentProduct);
  btn.textContent = "Added!";
  btn.style.background = "#28a745";
  setTimeout(() => {
    btn.textContent = "Add to Cart";
    btn.style.background = "#222";
    closeProductModal();
  }, 1400);
}

// ---- DRAWER HTML --- desverre

function injectCartDrawer() {
  if (document.getElementById("cart-drawer")) return;

  //overlay - med createElement
  const overlay = document.createElement("div");
  overlay.id = "cart-drawer-overlay";
  overlay.style.cssText =
    "display: none; position: fixed; inset: 0; background:rgba(0,0,0,0.4); z-index:999;";
  overlay.addEventListener("click", () => Cart.closeDrawer());
  document.body.appendChild(overlay);

  // drawer - obvs
  const drawer = document.createElement("div");
  drawer.id = "cart-drawer";
  drawer.innerHTML =
    '<div class="cart-drawer-header">' +
    "<h2>Your Cart</h2>" +
    '<button onclick="Cart.closeDrawer()">X</button>' +
    "</div>" +
    '<div id="cart-drawer-body">' +
    '<p class="cart-empty">Your cart is empty.</p>' +
    "</div>" +
    '<div class="cart-drawer-footer">' +
    '<div class="cart-total">Total: <strong id="cart-drawer-total">$0.00</strong></div>' +
    '<button class="cart-checkout-btn" onclick="alert(\'Checkout coming soon!\')">Checkout</button>' +
    '<button class="cart-clear-btn" onclick="Cart.clear()">Clear Cart</button>' +
    "</div>";
  document.body.appendChild(drawer);

  // css - the rope is calling
  const style = document.createElement("style");
  style.textContent = [
    "#cart-drawer { position:fixed; top:0; right:0; width:380px; max-width:100vw; height:100vh; background:#fff; z-index:1000; transform:translateX(100%); transition:transform 0.3s ease; display:flex; flex-direction:column; box-shadow:-4px 0 24px rgba(0,0,0,0.15); font-family:'Poppins',sans-serif; }",
    "#cart-drawer.open { transform:translateX(0); }",
    ".cart-drawer-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid #eee; }",
    ".cart-drawer-header h2 { font-size:18px; font-weight:600; margin:0; }",
    ".cart-drawer-header button { background:none; border:none; font-size:18px; cursor:pointer; color:#555; }",
    "#cart-drawer-body { flex:1; overflow-y:auto; padding:16px 24px; display:flex; flex-direction:column; gap:16px; }",
    ".cart-empty { color:#888; font-size:14px; text-align:center; margin-top:40px; }",
    ".cart-item { display:flex; gap:12px; align-items:flex-start; }",
    ".cart-item img { width:64px; height:64px; object-fit:cover; border-radius:8px; background:#f5f5f5; flex-shrink:0; }",
    ".cart-item-info { flex:1; display:flex; flex-direction:column; gap:4px; }",
    ".cart-item-name { font-size:14px; font-weight:500; color:#222; }",
    ".cart-item-price { font-size:13px; color:#555; }",
    ".cart-item-qty { display:flex; align-items:center; gap:8px; margin-top:4px; }",
    ".cart-item-qty button { width:26px; height:26px; border:1px solid #ddd; border-radius:6px; background:#f9f9f9; cursor:pointer; font-size:15px; }",
    ".cart-item-qty button:hover { background:#eee; }",
    ".cart-item-qty span { font-size:14px; min-width:20px; text-align:center; }",
    ".cart-item-remove { background:none; border:none; color:#aaa; cursor:pointer; font-size:14px; padding:0; flex-shrink:0; }",
    ".cart-item-remove:hover { color:#e53935; }",
    ".cart-drawer-footer { padding:16px 24px; border-top:1px solid #eee; display:flex; flex-direction:column; gap:10px; }",
    ".cart-total { font-size:16px; display:flex; justify-content:space-between; }",
    ".cart-checkout-btn { background:#222; color:#fff; border:none; border-radius:8px; padding:12px; font-size:15px; font-weight:500; cursor:pointer; font-family:'Poppins',sans-serif; transition:background 0.2s; }",
    ".cart-checkout-btn:hover { background:#444; }",
    ".cart-clear-btn { background:none; border:1px solid #ddd; border-radius:8px; padding:10px; font-size:13px; color:#888; cursor:pointer; font-family:'Poppins',sans-serif; }",
    ".cart-clear-btn:hover { border-color:#e53935; color:#e53935; }",
  ].join("\n");
  document.head.appendChild(style);
}

// -- INIT (bri'ish accent) --
document.addEventListener("DOMContentLoaded", async () => {
  injectCartDrawer();

  document.getElementById("cart-toggle").addEventListener("click", () => {
    const drawer = document.getElementById("cart-drawer");
    drawer.classList.contains("open") ? Cart.closeDrawer() : Cart.openDrawer();
  });

  await Cart.refreshUI();
});
