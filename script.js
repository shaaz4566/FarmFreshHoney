const WHATSAPP_NUMBER = "919400540669";

const products = {
  "honey-500": {
    id: "honey-500",
    name: "Farm Fresh Honey",
    size: "500 g",
    price: 200,
    image: "IMG_1388.JPG"
  },
  "honey-1000": {
    id: "honey-1000",
    name: "Farm Fresh Honey",
    size: "1 kg",
    price: 400,
    image: "IMG_1387.JPG"
  }
};

let cart = JSON.parse(localStorage.getItem("farmFreshCart") || "[]");

const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const emptyCart = document.getElementById("emptyCart");
const cartSummary = document.getElementById("cartSummary");
const orderForm = document.getElementById("orderForm");
const orderPreview = document.getElementById("orderPreview");
const orderPreviewContent = document.getElementById("orderPreviewContent");
const cartCount = document.getElementById("cartCount");
const drawerCount = document.getElementById("drawerCount");
const floatingCount = document.getElementById("floatingCount");
const cartTotal = document.getElementById("cartTotal");
const cartGrandTotal = document.getElementById("cartGrandTotal");

function saveCart() {
  localStorage.setItem("farmFreshCart", JSON.stringify(cart));
}

function itemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function totalPrice() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCounters() {
  const count = itemCount();
  cartCount.textContent = count;
  drawerCount.textContent = count;
  floatingCount.textContent = count;
}


function renderCart() {
  updateCounters();

  // Always show both honey sizes in the main cart.
  // Each size has its own independent quantity.
  const allProducts = Object.values(products);

  cartItems.innerHTML = allProducts.map(product => {
    const item = cart.find(entry => entry.id === product.id);
    const quantity = item ? item.quantity : 0;
    const lineTotal = product.price * quantity;

    return `
      <div class="cart-item ${quantity === 0 ? "cart-item-zero" : ""}">
        <img src="${product.image}" alt="${product.name} ${product.size}">
        <div>
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-size">${product.size} · ₹${product.price}</div>
          <div class="qty">
            <button
              type="button"
              data-action="decrease"
              data-id="${product.id}"
              aria-label="Decrease ${product.size} quantity"
              ${quantity === 0 ? "disabled" : ""}
            >−</button>
            <span>${quantity}</span>
            <button
              type="button"
              data-action="increase"
              data-id="${product.id}"
              aria-label="Increase ${product.size} quantity"
            >+</button>
          </div>
        </div>
        <div class="cart-item-price">₹${lineTotal}</div>
      </div>
    `;
  }).join("");

  // The product rows are always visible. Only the checkout section changes
  // after at least one item has been selected.
  if (!cart.length) {
    emptyCart.hidden = true;
    cartSummary.hidden = true;
    orderForm.hidden = true;
    orderPreview.hidden = true;
    return;
  }

  emptyCart.hidden = true;
  cartSummary.hidden = false;
  orderForm.hidden = false;
  orderPreview.hidden = false;

  const total = totalPrice();
  cartTotal.textContent = `₹${total}`;
  cartGrandTotal.textContent = `₹${total}`;

  renderOrderPreview();
}
function renderOrderPreview() {
  const field = id => document.getElementById(id);
  const name = field("customerName").value.trim();
  const phone = field("customerPhone").value.replace(/\D/g, "");
  const state = field("customerState").value;
  const district = field("customerDistrict").value;
  const city = field("customerCity").value.trim();
  const pin = field("customerPin").value.replace(/\D/g, "");
  const house = field("customerHouse").value.trim();
  const address1 = field("customerAddress1").value.trim();
  const address2 = field("customerAddress2").value.trim();

  const selectedProducts = cart.length
    ? cart.map(item => `
        <div class="preview-line">
          <span>${item.name} · ${item.size} × ${item.quantity}</span>
          <strong>₹${item.price * item.quantity}</strong>
        </div>
      `).join("")
    : `<div class="preview-muted">No products selected.</div>`;

  const customerLines = [
    name ? `<div><span>Name</span><strong>${escapeHtml(name)}</strong></div>` : "",
    phone ? `<div><span>Phone</span><strong>+91 ${escapeHtml(phone)}</strong></div>` : "",
    district ? `<div><span>District</span><strong>${escapeHtml(district)}</strong></div>` : "",
    city ? `<div><span>City / Town</span><strong>${escapeHtml(city)}</strong></div>` : "",
    pin ? `<div><span>PIN Code</span><strong>${escapeHtml(pin)}</strong></div>` : "",
    house ? `<div><span>House</span><strong>${escapeHtml(house)}</strong></div>` : "",
    address1 ? `<div><span>Address</span><strong>${escapeHtml(address1)}</strong></div>` : "",
    address2 ? `<div><span>Additional</span><strong>${escapeHtml(address2)}</strong></div>` : "",
    state ? `<div><span>State</span><strong>${escapeHtml(state)}</strong></div>` : ""
  ].filter(Boolean).join("");

  orderPreviewContent.innerHTML = `
    <div class="preview-products">
      ${selectedProducts}
      <div class="preview-total">
        <span>Order total</span>
        <strong>₹${totalPrice()}</strong>
      </div>
    </div>
    <div class="preview-customer">
      <div class="preview-subheading">Delivery details</div>
      ${customerLines || `<div class="preview-muted">Your delivery details will appear here as you fill them in.</div>`}
    </div>
    <div class="preview-payment">
      <span>Payment</span>
      <strong>UPI</strong>
    </div>
  `;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function addToCart(id) {
  const product = products[id];
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCart();
}

function changeQuantity(id, direction) {
  const product = products[id];
  if (!product) return;

  let item = cart.find(entry => entry.id === id);

  // A product shown at quantity 0 is not stored in the cart yet.
  // Pressing + must create it immediately.
  if (!item && direction > 0) {
    cart.push({ ...product, quantity: 1 });
    saveCart();
    renderCart();
    return;
  }

  // Pressing − on a zero/unselected product does nothing.
  if (!item) return;

  item.quantity += direction;

  if (item.quantity <= 0) {
    cart = cart.filter(entry => entry.id !== id);
  }

  saveCart();
  renderCart();
}

function openCart() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.classList.add("no-scroll");
}

function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.classList.remove("no-scroll");
}

document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => addToCart(button.dataset.add));
});

document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("floatingOrder").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.getElementById("browseProducts").addEventListener("click", () => {
  closeCart();
  document.getElementById("honey").scrollIntoView({ behavior: "smooth" });
});


orderForm.addEventListener("input", renderOrderPreview);
orderForm.addEventListener("change", renderOrderPreview);

document.getElementById("orderFromBanner").addEventListener("click", () => {
  if (!cart.length) {
    addToCart("honey-500");
    return;
  }
  openCart();
});

cartItems.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const direction = button.dataset.action === "increase" ? 1 : -1;
  changeQuantity(button.dataset.id, direction);
});

orderForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.length) return;

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.replace(/\D/g, "");
  const state = document.getElementById("customerState").value;
  const district = document.getElementById("customerDistrict").value;
  const city = document.getElementById("customerCity").value.trim();
  const pin = document.getElementById("customerPin").value.replace(/\D/g, "");
  const house = document.getElementById("customerHouse").value.trim();
  const address1 = document.getElementById("customerAddress1").value.trim();
  const address2 = document.getElementById("customerAddress2").value.trim();

  if (!name || phone.length !== 10 || !state || !district || !city || !address1 || pin.length !== 6) {
    orderForm.reportValidity();
    return;
  }

  const lines = cart.map((item, index) =>
    `${index + 1}. ${item.name} — ${item.size} × ${item.quantity} — ₹${item.price * item.quantity}`
  );

  const total = totalPrice();

  const addressLines = [
    house ? `House Name: ${house}` : "",
    `Address Line 1: ${address1}`,
    address2 ? `Address Line 2: ${address2}` : "",
    `City / Town: ${city}`,
    `District: ${district}`,
    `PIN Code: ${pin}`,
    `State: ${state}`
  ].filter(Boolean);

  const message = [
    "FARM FRESH HONEY — ORDER REQUEST",
    "",
    "Hello Farm Fresh Honey,",
    "",
    "I would like to place the following order:",
    "",
    ...lines,
    "",
    "ORDER SUMMARY",
    `Total Pieces: ${itemCount()}`,
    `Order Total: ₹${total}`,
    "",
    "CUSTOMER DETAILS",
    `Name: ${name}`,
    `Phone: +91 ${phone}`,
    ...addressLines,
    "",
    "Payment Method: UPI",
    "",
    "Please confirm the order and share the payment details.",
    "Thank you."
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Direct navigation is intentional: it is more reliable on iPad/Koder
  // and avoids popup blockers when handing the order to WhatsApp.
  window.location.href = url;
});

document.getElementById("year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll(".reveal").forEach(element => observer.observe(element));

renderCart();
