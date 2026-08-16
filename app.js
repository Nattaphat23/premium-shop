// ===============================
// PREMIUM SHOP - app.js
// ===============================

const products = [
  {
    id: 1,
    name: "Netflix Premium 4K",
    description: "รับชมความบันเทิงระดับ 4K",
    price: 99,
    duration: "30 วัน"
  },
  {
    id: 2,
    name: "YouTube Premium",
    description: "ดูวิดีโอแบบไม่มีโฆษณา",
    price: 59,
    duration: "30 วัน"
  },
  {
    id: 3,
    name: "Disney+",
    description: "รับชมหนังและซีรีส์",
    price: 69,
    duration: "30 วัน"
  },
  {
    id: 4,
    name: "Viu Premium",
    description: "ซีรีส์และรายการยอดนิยม",
    price: 39,
    duration: "30 วัน"
  },
  {
    id: 5,
    name: "WeTV VIP",
    description: "รับชมคอนเทนต์ VIP",
    price: 49,
    duration: "30 วัน"
  },
  {
    id: 6,
    name: "CapCut Pro",
    description: "เครื่องมือตัดต่อระดับ Pro",
    price: 79,
    duration: "30 วัน"
  }
];

let cart = JSON.parse(localStorage.getItem("premium_cart") || "[]");
let orders = JSON.parse(localStorage.getItem("premium_orders") || "[]");

// ===============================
// แสดงสินค้า
// ===============================

function renderProducts(list = products) {
  const container = document.getElementById("products");

  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty">
        ไม่พบสินค้าที่ค้นหา
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(product => `
    <div class="product-card">
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description)}</p>
        <small>${escapeHTML(product.duration)}</small>
      </div>

      <div class="product-bottom">
        <strong>฿${product.price}</strong>

        <button
          class="primary"
          onclick="addToCart(${product.id})">
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  `).join("");
}

// ===============================
// เพิ่มสินค้าลงตะกร้า
// ===============================

function addToCart(id) {
  const product = products.find(p => p.id === id);

  if (!product) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      ...product,
      qty: 1
    });
  }

  saveCart();
  renderCart();

  alert(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`);
}

// ===============================
// แสดงตะกร้า
// ===============================

function renderCart() {
  const container = document.getElementById("cart");

  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty">
        ยังไม่มีสินค้าในตะกร้า
      </div>
    `;

    updateTotal();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <div>฿${item.price} × ${item.qty}</div>
      </div>

      <div class="cart-actions">
        <button onclick="changeQty(${item.id}, -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${item.id}, 1)">+</button>
        <button onclick="removeFromCart(${item.id})">ลบ</button>
      </div>
    </div>
  `).join("");

  updateTotal();
}

// ===============================
// เปลี่ยนจำนวนสินค้า
// ===============================

function changeQty(id, amount) {
  const item = cart.find(p => p.id === id);

  if (!item) return;

  item.qty += amount;

  if (item.qty <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  saveCart();
  renderCart();
}

// ===============================
// ลบสินค้า
// ===============================

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);

  saveCart();
  renderCart();
}

// ===============================
// คำนวณยอดรวม
// ===============================

function getTotal() {
  return cart.reduce(
    (total, item) => total + (item.price * item.qty),
    0
  );
}

function updateTotal() {
  const total = document.getElementById("total");

  if (total) {
    total.textContent = `รวมทั้งหมด ฿${getTotal()}`;
  }
}

// ===============================
// บันทึกตะกร้า
// ===============================

function saveCart() {
  localStorage.setItem(
    "premium_cart",
    JSON.stringify(cart)
  );
}

// ===============================
// Checkout
// ===============================

function checkout() {
  if (!cart.length) {
    alert("กรุณาเลือกสินค้าก่อนสั่งซื้อ");
    return;
  }

  const total = getTotal();

  const order = {
    id: "ORD-" + Date.now(),
    items: [...cart],
    total: total,
    status: "รอชำระเงิน",
    createdAt: new Date().toLocaleString("th-TH")
  };

  orders.unshift(order);

  localStorage.setItem(
    "premium_orders",
    JSON.stringify(orders)
  );

  cart = [];
  saveCart();
  renderCart();
  renderOrders();

  alert(
    `สร้างออเดอร์เรียบร้อย\nหมายเลขออเดอร์: ${order.id}\nยอดชำระ: ฿${total}`
  );

  go("orders-section");
}

// ===============================
// แสดงออเดอร์
// ===============================

function renderOrders() {
  const container = document.getElementById("orders-list");

  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty">
        ยังไม่มีออเดอร์
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <strong>${order.id}</strong>

      <div>
        ${order.items.map(item =>
          `${escapeHTML(item.name)} × ${item.qty}`
        ).join("<br>")}
      </div>

      <p>ยอดรวม: <strong>฿${order.total}</strong></p>
      <small>${order.createdAt}</small>

      <div class="order-status">
        ${escapeHTML(order.status)}
      </div>
    </div>
  `).join("");
}

// ===============================
// ระบบค้นหาสินค้า
// ===============================

function searchProducts() {
  const input = document.getElementById("search");

  if (!input) return;

  const keyword = input.value.toLowerCase().trim();

  const result = products.filter(product =>
    product.name.toLowerCase().includes(keyword) ||
    product.description.toLowerCase().includes(keyword)
  );

  renderProducts(result);
}

// ===============================
// เลื่อนหน้า
// ===============================

function go(sectionId) {
  const section = document.getElementById(sectionId);

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

// ===============================
// Login / Register
// ===============================

function openRegister() {
  const username = prompt("ตั้งชื่อผู้ใช้:");

  if (!username) return;

  localStorage.setItem(
    "premium_user",
    username
  );

  alert(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${username}`);
  updateLoginButton();
}

function openAdminLogin() {
  const username = prompt("Username:");
  const password = prompt("Password:");

  if (
    username === "admin@local" &&
    password === "1234"
  ) {
    alert("เข้าสู่ระบบ Admin สำเร็จ");
    localStorage.setItem("premium_admin", "true");
  } else {
    alert("Username หรือ Password ไม่ถูกต้อง");
  }
}

function updateLoginButton() {
  const btn = document.getElementById("loginBtn");

  if (!btn) return;

  const user = localStorage.getItem("premium_user");

  if (user) {
    btn.textContent = `👤 ${user}`;
  }
}

// ===============================
// Utility
// ===============================

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===============================
// เริ่มต้นระบบ
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  renderOrders();
  updateLoginButton();

  const search = document.getElementById("search");

  if (search) {
    search.addEventListener(
      "input",
      searchProducts
    );
  }
});
