// ---------- Room inventory (fixed, not persisted) ----------
const ROOMS = [
  { id: "std-101", type: "standard", name: "Standard Room 101", capacity: 2, price: 1800, desc: "Cozy and comfortable, perfect for solo travelers or couples." },
  { id: "std-102", type: "standard", name: "Standard Room 102", capacity: 2, price: 1800, desc: "Bright and simple, with a queen bed and city view." },
  { id: "dlx-201", type: "deluxe", name: "Deluxe Garden Room", capacity: 3, price: 2800, desc: "Spacious room overlooking the garden courtyard." },
  { id: "dlx-202", type: "deluxe", name: "Deluxe Balcony Room", capacity: 3, price: 2800, desc: "Private balcony with a king bed and sitting area." },
  { id: "ste-301", type: "suite", name: "Executive Suite", capacity: 4, price: 4600, desc: "Separate living area, ideal for extended stays." },
  { id: "ste-302", type: "suite", name: "Family Suite", capacity: 5, price: 5200, desc: "Two connected rooms, perfect for families." },
];
const TYPE_LABEL = { standard: "Standard", deluxe: "Deluxe", suite: "Suite" };

const BOOKINGS_KEY = "stayloop_bookings";
let currentSearch = null; // {checkIn, checkOut, guests}

// ---------- Date helpers ----------
// Builds YYYY-MM-DD from local date fields (not toISOString, which converts
// to UTC and shifts the date back a day in any timezone ahead of UTC).
function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function todayISO() {
  return isoDate(new Date());
}
function calcNights(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.max(1, Math.round(ms / 86400000));
}
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function formatCurrency(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ---------- localStorage ----------
function loadBookings() {
  return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
}
function saveBookings(list) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}
function seedBookingsIfEmpty() {
  if (localStorage.getItem(BOOKINGS_KEY) !== null) return;
  const T = new Date();
  const seed = [
    { roomId: "std-101", guestName: "Priya Nair", guestEmail: "priya.nair@example.com", guestPhone: "+91 98200 11223", checkIn: isoDate(addDays(T, -1)), checkOut: isoDate(addDays(T, 2)), guests: 2, status: "confirmed" },
    { roomId: "dlx-201", guestName: "Rahul Verma", guestEmail: "rahul.verma@example.com", guestPhone: "+91 90210 44556", checkIn: isoDate(T), checkOut: isoDate(addDays(T, 3)), guests: 2, status: "confirmed" },
    { roomId: "ste-301", guestName: "Amit Shah", guestEmail: "amit.shah@example.com", guestPhone: "+91 99870 33221", checkIn: isoDate(addDays(T, -4)), checkOut: isoDate(addDays(T, -2)), guests: 3, status: "confirmed" },
    { roomId: "std-102", guestName: "Neha Gupta", guestEmail: "neha.gupta@example.com", guestPhone: "+91 88990 77665", checkIn: isoDate(addDays(T, 4)), checkOut: isoDate(addDays(T, 6)), guests: 1, status: "confirmed" },
    { roomId: "dlx-202", guestName: "Karan Mehta", guestEmail: "karan.mehta@example.com", guestPhone: "+91 97654 12309", checkIn: isoDate(addDays(T, 1)), checkOut: isoDate(addDays(T, 2)), guests: 2, status: "cancelled" },
    { roomId: "ste-302", guestName: "Ananya Iyer", guestEmail: "ananya.iyer@example.com", guestPhone: "+91 96543 88990", checkIn: isoDate(addDays(T, 9)), checkOut: isoDate(addDays(T, 12)), guests: 4, status: "confirmed" },
  ].map((b, i) => {
    const room = ROOMS.find((r) => r.id === b.roomId);
    const nights = calcNights(b.checkIn, b.checkOut);
    return { id: "RM-" + (2400 + i * 7), nights, totalPrice: nights * room.price, createdAt: isoDate(addDays(T, -10 + i)), ...b };
  });
  saveBookings(seed);
}

// ---------- Availability logic ----------
function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}
function isRoomAvailable(roomId, checkIn, checkOut) {
  const bookings = loadBookings();
  return !bookings.some(
    (b) => b.roomId === roomId && b.status !== "cancelled" && datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
  );
}
function generateBookingId() {
  const bookings = loadBookings();
  let id;
  do {
    id = "RM-" + (2000 + Math.floor(Math.random() * 8000));
  } while (bookings.some((b) => b.id === id));
  return id;
}

// ---------- Rooms view ----------
function renderRooms() {
  const grid = document.getElementById("roomGrid");
  const hint = document.getElementById("searchHint");
  let rooms = ROOMS;

  if (currentSearch) {
    rooms = ROOMS.filter((r) => r.capacity >= currentSearch.guests);
    hint.textContent = rooms.length
      ? `Showing rooms for ${formatDate(currentSearch.checkIn)} – ${formatDate(currentSearch.checkOut)}, ${currentSearch.guests} guest(s).`
      : "No rooms match that many guests. Try a smaller group.";
  } else {
    hint.textContent = "Search dates to check availability — all rooms are shown below.";
  }

  if (!rooms.length) {
    grid.innerHTML = `<div class="empty-state">No rooms to show.</div>`;
    return;
  }

  grid.innerHTML = rooms
    .map((r) => {
      let statusHtml = "";
      let disabled = "";
      if (currentSearch) {
        const available = isRoomAvailable(r.id, currentSearch.checkIn, currentSearch.checkOut);
        statusHtml = available
          ? `<div class="room-status available"><span class="dot"></span> Available</div>`
          : `<div class="room-status unavailable"><span class="dot"></span> Unavailable</div>`;
        disabled = available ? "" : "disabled";
      }
      return `
      <div class="room-card">
        <div class="room-visual type-${r.type}">
          <span class="room-type-badge">${TYPE_LABEL[r.type]}</span>
          <svg class="icon"><use href="#icon-bed"/></svg>
        </div>
        <div class="room-body">
          <h3>${r.name}</h3>
          <div class="room-meta"><svg class="icon"><use href="#icon-users"/></svg> Up to ${r.capacity} guests</div>
          <p class="room-desc">${r.desc}</p>
          ${statusHtml}
          <div class="room-price">${formatCurrency(r.price)}<small> / night</small></div>
          <button class="btn btn-primary btn-block" data-room="${r.id}" ${disabled}>${disabled ? "Unavailable" : "Book Now"}</button>
        </div>
      </div>`;
    })
    .join("");

  grid.querySelectorAll("button[data-room]:not([disabled])").forEach((btn) =>
    btn.addEventListener("click", () => openBookingModal(btn.dataset.room))
  );
}

function runSearch(checkIn, checkOut, guests) {
  if (checkOut <= checkIn) {
    showToast("Check-out must be after check-in");
    return;
  }
  currentSearch = { checkIn, checkOut, guests };
  renderRooms();
}

// ---------- Booking modal ----------
function openBookingModal(roomId) {
  if (!currentSearch) {
    showToast("Please search dates first");
    return;
  }
  const room = ROOMS.find((r) => r.id === roomId);
  const nights = calcNights(currentSearch.checkIn, currentSearch.checkOut);
  const total = nights * room.price;

  document.getElementById("modalBody").innerHTML = `
    <div class="modal-head">
      <h3>Book ${room.name}</h3>
      <button class="modal-close" id="modalCloseBtn"><svg class="icon"><use href="#icon-close"/></svg></button>
    </div>
    <div class="modal-summary">
      <div class="row"><span>Check-in</span><span>${formatDate(currentSearch.checkIn)}</span></div>
      <div class="row"><span>Check-out</span><span>${formatDate(currentSearch.checkOut)}</span></div>
      <div class="row"><span>Nights</span><span>${nights}</span></div>
      <div class="row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
    </div>
    <form id="guestForm">
      <div class="form-stack">
        <div class="field"><label for="guestName">Full name</label><input type="text" id="guestName" required></div>
        <div class="field"><label for="guestEmail">Email</label><input type="email" id="guestEmail" required></div>
        <div class="field"><label for="guestPhone">Phone</label><input type="tel" id="guestPhone" required></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline btn-block" id="modalCancelBtn">Cancel</button>
        <button type="submit" class="btn btn-primary btn-block">Confirm Booking</button>
      </div>
    </form>`;

  document.getElementById("modalCloseBtn").addEventListener("click", closeBookingModal);
  document.getElementById("modalCancelBtn").addEventListener("click", closeBookingModal);
  document.getElementById("guestForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("guestName").value.trim();
    const email = document.getElementById("guestEmail").value.trim();
    const phone = document.getElementById("guestPhone").value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone) {
      showToast("Please fill in all fields with a valid email");
      return;
    }
    openPaymentStep(room, name, email, phone, nights, total);
  });

  document.getElementById("modalOverlay").classList.add("open");
}

function closeBookingModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

// ---------- Payment step ----------
function openPaymentStep(room, name, email, phone, nights, total) {
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-head">
      <h3>Secure Payment</h3>
      <button class="modal-close" id="modalCloseBtn"><svg class="icon"><use href="#icon-close"/></svg></button>
    </div>
    <div class="modal-summary">
      <div class="row"><span>${room.name}</span><span>${nights} night${nights > 1 ? "s" : ""}</span></div>
      <div class="row total"><span>Amount payable</span><span>${formatCurrency(total)}</span></div>
    </div>
    <div class="pay-methods" id="payMethods">
      <button type="button" class="pay-method-tab active" data-method="card"><svg class="icon"><use href="#icon-cash"/></svg> Card</button>
      <button type="button" class="pay-method-tab" data-method="upi"><svg class="icon"><use href="#icon-cash"/></svg> UPI</button>
      <button type="button" class="pay-method-tab" data-method="netbanking"><svg class="icon"><use href="#icon-bank"/></svg> Net Banking</button>
    </div>
    <form id="paymentForm">
      <div class="pay-panel active" data-panel="card">
        <div class="form-stack">
          <div class="field pay-input-wrap">
            <label for="cardNumber">Card number</label>
            <input type="text" id="cardNumber" inputmode="numeric" placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number">
            <span class="card-brand-badge" id="cardBrandBadge"></span>
          </div>
          <div class="field"><label for="cardName">Name on card</label><input type="text" id="cardName" placeholder="As printed on card" autocomplete="cc-name"></div>
          <div class="pay-row-2">
            <div class="field"><label for="cardExpiry">Expiry</label><input type="text" id="cardExpiry" inputmode="numeric" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp"></div>
            <div class="field"><label for="cardCvv">CVV</label><input type="password" id="cardCvv" inputmode="numeric" placeholder="•••" maxlength="3" autocomplete="cc-csc"></div>
          </div>
        </div>
      </div>
      <div class="pay-panel" data-panel="upi">
        <div class="form-stack">
          <div class="field"><label for="upiId">UPI ID</label><input type="text" id="upiId" placeholder="yourname@okhdfcbank"></div>
          <p class="pay-hint">You'll get a payment request on your UPI app to approve.</p>
        </div>
      </div>
      <div class="pay-panel" data-panel="netbanking">
        <div class="form-stack">
          <div class="field">
            <label for="bankSelect">Select your bank</label>
            <select id="bankSelect">
              <option value="">Choose a bank</option>
              <option>State Bank of India</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline btn-block" id="paymentBackBtn">Back</button>
        <button type="submit" class="btn btn-primary btn-block pay-btn-pay" id="payBtn">
          <span class="pay-btn-label">Pay ${formatCurrency(total)}</span>
          <span class="spinner"><span class="spinner-ring"></span></span>
        </button>
      </div>
      <div class="pay-trust"><svg class="icon"><use href="#icon-lock"/></svg> 256-bit encrypted · Secured by StayloopPay Gateway</div>
    </form>`;

  document.getElementById("modalCloseBtn").addEventListener("click", closeBookingModal);
  document.getElementById("paymentBackBtn").addEventListener("click", () => openBookingModal(room.id));

  let activeMethod = "card";
  document.querySelectorAll(".pay-method-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeMethod = tab.dataset.method;
      document.querySelectorAll(".pay-method-tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".pay-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === activeMethod));
    });
  });

  const cardNumberInput = document.getElementById("cardNumber");
  const cardBrandBadge = document.getElementById("cardBrandBadge");
  cardNumberInput.addEventListener("input", () => {
    const digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    cardNumberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
    const brand = digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : digits.startsWith("6") ? "RuPay" : digits.startsWith("3") ? "Amex" : "";
    cardBrandBadge.textContent = brand;
    cardBrandBadge.classList.toggle("show", !!brand);
  });
  const cardExpiryInput = document.getElementById("cardExpiry");
  cardExpiryInput.addEventListener("input", () => {
    const digits = cardExpiryInput.value.replace(/\D/g, "").slice(0, 4);
    cardExpiryInput.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
  });
  document.getElementById("cardCvv").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
  });

  document.getElementById("paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let paymentDetail;
    if (activeMethod === "card") {
      const num = cardNumberInput.value.replace(/\s/g, "");
      const expiry = cardExpiryInput.value;
      const cvv = document.getElementById("cardCvv").value;
      const cardName = document.getElementById("cardName").value.trim();
      if (num.length !== 16 || !/^\d{2}\/\d{2}$/.test(expiry) || cvv.length !== 3 || !cardName) {
        showToast("Please enter valid card details");
        return;
      }
      paymentDetail = { method: "Card", display: `Card ending ${num.slice(-4)}` };
    } else if (activeMethod === "upi") {
      const upi = document.getElementById("upiId").value.trim();
      if (!/^[\w.\-]+@[\w.\-]+$/.test(upi)) {
        showToast("Please enter a valid UPI ID");
        return;
      }
      paymentDetail = { method: "UPI", display: upi };
    } else {
      const bank = document.getElementById("bankSelect").value;
      if (!bank) {
        showToast("Please select your bank");
        return;
      }
      paymentDetail = { method: "Net Banking", display: bank };
    }

    const payBtn = document.getElementById("payBtn");
    payBtn.classList.add("loading");
    payBtn.disabled = true;
    setTimeout(() => {
      confirmBooking(room, name, email, phone, nights, total, paymentDetail);
    }, 1400);
  });
}

function generateTransactionId() {
  return "TXN" + Date.now().toString().slice(-8) + Math.floor(10 + Math.random() * 90);
}

function confirmBooking(room, name, email, phone, nights, total, paymentDetail) {
  const bookings = loadBookings();
  const txnId = generateTransactionId();
  const booking = {
    id: generateBookingId(),
    roomId: room.id,
    guestName: name,
    guestEmail: email,
    guestPhone: phone,
    checkIn: currentSearch.checkIn,
    checkOut: currentSearch.checkOut,
    guests: currentSearch.guests,
    nights,
    totalPrice: total,
    status: "confirmed",
    createdAt: todayISO(),
    paymentMethod: paymentDetail.method,
    paymentDisplay: paymentDetail.display,
    transactionId: txnId,
  };
  bookings.push(booking);
  saveBookings(bookings);

  document.getElementById("modalBody").innerHTML = `
    <div class="confirm-view">
      <div class="confirm-icon"><svg class="icon"><use href="#icon-check"/></svg></div>
      <h3>Booking confirmed!</h3>
      <p>${room.name} is booked for ${name}, ${formatDate(booking.checkIn)} – ${formatDate(booking.checkOut)}. Booking ID ${booking.id}.</p>
      <div class="pay-receipt">
        <div class="row"><span>Paid via</span><span>${booking.paymentMethod} (${booking.paymentDisplay})</span></div>
        <div class="row"><span>Transaction ID</span><span>${txnId}</span></div>
        <div class="row"><span>Amount</span><span>${formatCurrency(total)}</span></div>
        <div class="row muted"><span>Status</span><span style="color:var(--green); font-weight:700;">Paid</span></div>
      </div>
      <button class="btn btn-primary btn-block" id="modalDoneBtn">Make Another Booking</button>
    </div>`;
  document.getElementById("modalDoneBtn").addEventListener("click", closeBookingModal);

  showToast(`Payment successful — booking confirmed for ${room.name}`);
  renderRooms();
  renderBookingsView();
  renderDashboard();
}

function cancelBooking(id) {
  const bookings = loadBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking || booking.status === "cancelled") return;
  booking.status = "cancelled";
  saveBookings(bookings);
  showToast("Booking cancelled");
  renderRooms();
  renderBookingsView();
  renderDashboard();
}

// ---------- Tables ----------
function bookingRowHtml(b, readonly) {
  const room = ROOMS.find((r) => r.id === b.roomId);
  return `<tr class="${b.status === "cancelled" ? "cancelled" : ""}">
    <td>${b.id}</td>
    <td>${b.guestName}</td>
    <td>${room ? room.name : b.roomId}</td>
    <td>${formatDate(b.checkIn)}</td>
    <td>${formatDate(b.checkOut)}</td>
    <td>${formatCurrency(b.totalPrice)}</td>
    <td><span class="status-pill ${b.status}">${b.status}</span></td>
    ${readonly ? "" : `<td>${b.status === "confirmed" ? `<button class="btn btn-outline btn-sm" data-cancel="${b.id}">Cancel</button>` : "—"}</td>`}
  </tr>`;
}

function renderBookingsView() {
  const table = document.getElementById("bookingsTable");
  const bookings = [...loadBookings()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (!bookings.length) {
    table.innerHTML = `<tbody><tr><td class="empty-state">No bookings yet.</td></tr></tbody>`;
    return;
  }
  table.innerHTML = `
    <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th><th></th></tr></thead>
    <tbody>${bookings.map((b) => bookingRowHtml(b, false)).join("")}</tbody>`;
  table.querySelectorAll("button[data-cancel]").forEach((btn) =>
    btn.addEventListener("click", () => cancelBooking(btn.dataset.cancel))
  );
}

// ---------- Dashboard ----------
function computeDashboardStats(bookings) {
  const today = todayISO();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const occupiedToday = new Set(
    active.filter((b) => b.checkIn <= today && today < b.checkOut).map((b) => b.roomId)
  ).size;
  const occupancy = Math.round((occupiedToday / ROOMS.length) * 100);
  const weekEnd = isoDate(addDays(new Date(), 7));
  const bookingsThisWeek = active.filter((b) => b.checkIn >= today && b.checkIn < weekEnd).length;
  const roomsAvailableToday = ROOMS.length - occupiedToday;
  const revenue = active.reduce((sum, b) => sum + b.totalPrice, 0);
  return { occupancy, bookingsThisWeek, roomsAvailableToday, revenue };
}

function renderDashboard() {
  const bookings = loadBookings();
  const stats = computeDashboardStats(bookings);
  document.getElementById("dashStats").innerHTML = `
    <div class="stat-card"><div class="stat-label"><svg class="icon"><use href="#icon-chart"/></svg> Occupancy</div><div class="stat-value">${stats.occupancy}%</div></div>
    <div class="stat-card"><div class="stat-label"><svg class="icon"><use href="#icon-calendar"/></svg> Bookings This Week</div><div class="stat-value">${stats.bookingsThisWeek}</div></div>
    <div class="stat-card"><div class="stat-label"><svg class="icon"><use href="#icon-bed"/></svg> Rooms Available Today</div><div class="stat-value">${stats.roomsAvailableToday}</div></div>
    <div class="stat-card"><div class="stat-label"><svg class="icon"><use href="#icon-cash"/></svg> Revenue (mock)</div><div class="stat-value">${formatCurrency(stats.revenue)}</div></div>`;

  const recent = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);
  const recentTable = document.getElementById("dashRecentTable");
  if (!recent.length) {
    recentTable.innerHTML = `<tbody><tr><td class="empty-state">No bookings yet.</td></tr></tbody>`;
  } else {
    recentTable.innerHTML = `
      <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${recent.map((b) => bookingRowHtml(b, true)).join("")}</tbody>`;
  }
}

// ---------- View switching ----------
function switchView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  document.querySelectorAll(".app-tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  seedBookingsIfEmpty();

  document.getElementById("appTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".app-tab");
    if (btn) switchView(btn.dataset.view);
  });
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeBookingModal();
  });

  const checkInInput = document.getElementById("searchCheckIn");
  const checkOutInput = document.getElementById("searchCheckOut");
  const guestsInput = document.getElementById("searchGuests");
  const today = todayISO();
  checkInInput.min = today;
  checkOutInput.min = today;
  checkInInput.value = today;
  checkOutInput.value = isoDate(addDays(new Date(), 2));

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch(checkInInput.value, checkOutInput.value, parseInt(guestsInput.value, 10) || 1);
  });
  document.getElementById("clearSearchBtn").addEventListener("click", () => {
    currentSearch = null;
    renderRooms();
  });

  runSearch(checkInInput.value, checkOutInput.value, parseInt(guestsInput.value, 10));
  renderBookingsView();
  renderDashboard();
});
