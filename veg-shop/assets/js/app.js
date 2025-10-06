// Product data
const products = [
  { id: 'spinach', name: 'Spinach', category: 'Leafy', price: 2.5, unit: 'bunch', thumb: '🥬', stock: 24 },
  { id: 'kale', name: 'Kale', category: 'Leafy', price: 2.9, unit: 'bunch', thumb: '🥬', stock: 18 },
  { id: 'lettuce', name: 'Lettuce', category: 'Leafy', price: 1.8, unit: 'head', thumb: '🥬', stock: 30 },
  { id: 'carrot', name: 'Carrot', category: 'Root', price: 1.6, unit: 'lb', thumb: '🥕', stock: 40 },
  { id: 'beetroot', name: 'Beetroot', category: 'Root', price: 2.2, unit: 'lb', thumb: '🫚', stock: 20 },
  { id: 'potato', name: 'Potato', category: 'Root', price: 1.2, unit: 'lb', thumb: '🥔', stock: 60 },
  { id: 'tomato', name: 'Tomato', category: 'Fruit', price: 2.1, unit: 'lb', thumb: '🍅', stock: 35 },
  { id: 'cucumber', name: 'Cucumber', category: 'Fruit', price: 1.5, unit: 'ea', thumb: '🥒', stock: 50 },
  { id: 'pepper', name: 'Bell Pepper', category: 'Fruit', price: 2.4, unit: 'ea', thumb: '🫑', stock: 28 },
  { id: 'cilantro', name: 'Cilantro', category: 'Herb', price: 1.2, unit: 'bunch', thumb: '🌿', stock: 25 },
  { id: 'basil', name: 'Basil', category: 'Herb', price: 1.8, unit: 'bunch', thumb: '🌿', stock: 22 },
  { id: 'onion', name: 'Onion', category: 'Other', price: 1.1, unit: 'lb', thumb: '🧅', stock: 55 }
];

// State
const state = {
  filter: 'All',
  query: '',
  cart: /** @type {Record<string, number>} */({})
};

// Utils
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const formatPrice = n => `$${n.toFixed(2)}`;

function getFilteredProducts() {
  const query = state.query.trim().toLowerCase();
  return products.filter(p => {
    const matchesCategory = state.filter === 'All' || p.category === state.filter;
    const matchesQuery = query.length === 0 || p.name.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

// Render products
function renderProducts() {
  const grid = $('#productsGrid');
  const list = getFilteredProducts();
  grid.innerHTML = list.map(p => `
    <article class="product" data-id="${p.id}">
      <div class="product-thumb" aria-hidden="true">${p.thumb}</div>
      <div class="product-body">
        <div class="product-title">${p.name}</div>
        <div class="product-meta">${p.category} • ${p.unit} • In stock: ${p.stock}</div>
        <div class="product-actions">
          <span class="price">${formatPrice(p.price)}</span>
          <button class="button add" data-id="${p.id}">Add</button>
        </div>
      </div>
    </article>
  `).join('');
}

// Cart logic
function addToCart(id, qty = 1) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const current = state.cart[id] || 0;
  const next = Math.min(product.stock, current + qty);
  state.cart[id] = next;
  updateCartUI();
}
function removeFromCart(id, qty = 1) {
  const current = state.cart[id] || 0;
  const next = Math.max(0, current - qty);
  if (next === 0) delete state.cart[id]; else state.cart[id] = next;
  updateCartUI();
}
function clearCart() {
  state.cart = {};
  updateCartUI();
}
function getCartItems() {
  return Object.entries(state.cart).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    return { product, qty, lineTotal: (product?.price || 0) * qty };
  });
}
function getCartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.lineTotal, 0);
}
function updateCartUI() {
  const items = getCartItems();
  const itemsList = $('#cartItems');
  const subtotalEl = $('#cartSubtotal');
  const countEl = $('#cartCount');

  itemsList.innerHTML = items.map(({ product, qty, lineTotal }) => `
    <li class="cart-item">
      <div>
        <div><strong>${product.name}</strong></div>
        <div class="product-meta">${product.unit} • ${formatPrice(product.price)} • ${product.category}</div>
      </div>
      <div class="cart-qty">
        <button class="dec" data-id="${product.id}" aria-label="Decrease quantity">−</button>
        <span aria-live="polite">${qty}</span>
        <button class="inc" data-id="${product.id}" aria-label="Increase quantity">+</button>
        <span style="margin-left:.5rem; font-weight:800;">${formatPrice(lineTotal)}</span>
      </div>
    </li>
  `).join('');

  subtotalEl.textContent = formatPrice(getCartSubtotal());
  const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
  countEl.textContent = totalQty.toString();
}

// Drawer
function openCart() {
  const drawer = $('#cartDrawer');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}
function closeCart() {
  const drawer = $('#cartDrawer');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

function setupEventListeners() {
  // Nav toggle
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  navToggle?.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // Filters
  $$('#categoryFilters .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#categoryFilters .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.category || 'All';
      renderProducts();
    });
  });

  // Search
  $('#searchInput')?.addEventListener('input', (e) => {
    state.query = e.target.value;
    renderProducts();
  });

  // Delegate add to cart on grid
  $('#productsGrid')?.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('button.add')) {
      addToCart(target.dataset.id);
      openCart();
    }
  });

  // Cart qty buttons
  $('#cartItems')?.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('button.inc')) addToCart(target.dataset.id, 1);
    if (target.matches('button.dec')) removeFromCart(target.dataset.id, 1);
  });

  // Cart open/close
  $('#cartButton')?.addEventListener('click', openCart);
  $('#closeCart')?.addEventListener('click', closeCart);
  $('#cartBackdrop')?.addEventListener('click', closeCart);

  // Clear cart / checkout
  $('#clearCart')?.addEventListener('click', clearCart);
  $('#checkoutButton')?.addEventListener('click', () => {
    if (Object.keys(state.cart).length === 0) {
      alert('Your cart is empty.');
      return;
    }
    alert('Thanks for your order! (demo)');
    clearCart();
    closeCart();
  });

  // Contact form (demo validation)
  $('#contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const status = $('#contactStatus');

    if (!name || !email || !message) {
      status.textContent = 'Please fill out all fields.';
      status.style.color = 'var(--error)';
      return;
    }
    status.textContent = 'Thanks! Your message has been sent (demo).';
    status.style.color = 'var(--muted)';
    e.target.reset();
  });

  // Year in footer
  $('#year').textContent = new Date().getFullYear().toString();
}

// Init
function init() {
  renderProducts();
  updateCartUI();
  setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
