const products = [
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

// function renderProducts(productsToRender) {
//     productGrid.innerHTML = "";
//     if (productsToRender.lenght === 0) {
//             productGrid.innerHTML = `<p class="no-products-found">No products match your criteria.</p>`;
//             return;
//     }
//     productsToRender.forEach((product, index) => {
//         const productCard = document.createElement("div");
//         productCard.className = "product-card";
//         productCard.style.animationDelay = `${index * 0.5}s`;
//         productCard.dataset.productId = productIdM
//         productCard.innerHTML = `
//             <img src="${product.image}" alt="${product.name}" class="product-image>
//             <h3>${product.name}</h3>
//             <p class="product-price">$${product.price.toFixed(2)}</p>
//             <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
//         `;
//         productGrid.appendChild(productCard)
//     })
// }
