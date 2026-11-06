import { GRC_CONFIG, PRODUCTS, RETREAT_EXPERIENCES } from "./goshala-data.js";

const STORAGE_KEY = "grc_seva_cart_v1";
let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let activeCategory = "all";

const productGrid = document.getElementById("productGrid");
const retreatGrid = document.getElementById("retreatGrid");
const cartCount = document.getElementById("cartCount");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const upiPayLink = document.getElementById("upiPayLink");
const modal = document.getElementById("productModal");
const modalBody = document.getElementById("modalBody");

document.getElementById("year").textContent = new Date().getFullYear();

function renderProducts() {
  const list = activeCategory === "all"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  productGrid.innerHTML = list.map((p) => `
    <article class="product-card" data-id="${p.id}">
      <div class="card-media">
        <span class="card-badge">${p.badge}</span>
        <img
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
          decoding="async"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="card-placeholder" style="display:none;">
          <span class="card-placeholder-icon">${p.icon}</span>
          <span class="card-placeholder-label">${p.name}</span>
        </div>
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="card-tagline">${p.tagline}</p>
        <select class="variant-select" aria-label="Select pack size for ${p.name}">
          ${p.variants.map((v, idx) => `<option value="${idx}">${v.label} — ₹${v.price}</option>`).join("")}
        </select>
        <div class="card-footer">
          <span class="price-tag">₹${p.variants[0].price}</span>
          <div class="card-btns">
            <button class="btn btn-outline btn-sm quick-view-btn" type="button">Details</button>
            <button class="btn btn-primary btn-sm add-cart-btn" type="button">+ Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function renderRetreat() {
  retreatGrid.innerHTML = RETREAT_EXPERIENCES.map((item) => `
    <div class="retreat-card">
      <span class="retreat-tag">${item.tag}</span>
      <h3>${item.title}</h3>
      <p>${item.detail}</p>
    </div>
  `).join("");
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, variantIdx) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  const variant = product.variants[variantIdx];
  const key = `${product.id}__${variant.label}`;
  const existing = cart.find((item) => item.key === key);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key,
      name: product.name,
      variant: variant.label,
      price: variant.price,
      qty: 1
    });
  }
  saveCart();
  openCart();
}

function changeQty(key, delta) {
  const item = cart.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.key !== key);
  }
  saveCart();
}

function updateCartUI() {
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  cartCount.textContent = totalQty;
  cartSubtotalEl.textContent = `₹${subtotal}`;

  const upiParams = new URLSearchParams({
    pa: GRC_CONFIG.upiId,
    pn: GRC_CONFIG.name,
    am: subtotal > 0 ? String(subtotal) : "",
    cu: "INR",
    tn: "GRC Goshala Seva Order"
  });
  upiPayLink.href = `upi://pay?${upiParams.toString()}`;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p style="color:var(--muted);text-align:center;padding:2rem 0;">Your Goseva basket is empty. Add cold-pressed oils, honey, or wellness offerings to begin.</p>`;
    return;
  }

  cartItemsEl.innerHTML = cart.map((item) => `
    <div class="cart-row">
      <div>
        <strong>${item.name}</strong>
        <div style="font-size:0.8rem;color:var(--muted);">${item.variant} × ₹${item.price}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-key="${item.key}" data-delta="-1" type="button">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" data-key="${item.key}" data-delta="1" type="button">+</button>
      </div>
    </div>
  `).join("");
}

function openCart() {
  cartBackdrop.hidden = false;
  cartDrawer.classList.add("open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.hidden = true;
}

productGrid.addEventListener("change", (e) => {
  if (e.target.classList.contains("variant-select")) {
    const card = e.target.closest(".product-card");
    const product = PRODUCTS.find((p) => p.id === card.dataset.id);
    const variant = product.variants[Number(e.target.value)];
    card.querySelector(".price-tag").textContent = `₹${variant.price}`;
  }
});

productGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;
  const productId = card.dataset.id;
  const variantIdx = Number(card.querySelector(".variant-select").value);

  if (e.target.classList.contains("add-cart-btn")) {
    addToCart(productId, variantIdx);
  } else if (e.target.classList.contains("quick-view-btn")) {
    const p = PRODUCTS.find((item) => item.id === productId);
    modalBody.innerHTML = `
      <p class="eyebrow">${p.badge}</p>
      <h2 id="modalTitle" style="margin-bottom:0.5rem;">${p.name}</h2>
      <p style="margin-bottom:1rem;">${p.description}</p>
      <p style="font-size:0.9rem;background:var(--cream);padding:0.85rem;border-radius:10px;">
        <strong>Traditional Usage:</strong> ${p.usage}
      </p>
    `;
    modal.hidden = false;
  }
});

document.querySelectorAll(".filter-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderProducts();
  });
});

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".qty-btn");
  if (!btn) return;
  changeQty(btn.dataset.key, Number(btn.dataset.delta));
});

document.getElementById("openCartBtn").addEventListener("click", openCart);
document.getElementById("closeCartBtn").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.getElementById("closeModalBtn").addEventListener("click", () => { modal.hidden = true; });
modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });

document.getElementById("checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (cart.length === 0) return;

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const mode = document.getElementById("deliveryMode").value;
  const address = document.getElementById("custAddress").value.trim();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const lines = cart.map((i, idx) => `${idx + 1}. ${i.name} (${i.variant}) x ${i.qty} = ₹${i.price * i.qty}`);
  const message = [
    "Hare Krishna! New Goshala Product Order — Giriraj Retreat Centre",
    "",
    ...lines,
    "",
    `Estimated Total: ₹${subtotal}`,
    `Customer: ${name} (${phone})`,
    `Fulfilment: ${mode}`,
    address ? `Address: ${address}` : "",
    "",
    "Please confirm stock availability and final courier charges for UPI payment."
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${GRC_CONFIG.orderWhatsApp}?text=${encodeURIComponent(message)}`, "_blank");
});

renderProducts();
renderRetreat();
updateCartUI();