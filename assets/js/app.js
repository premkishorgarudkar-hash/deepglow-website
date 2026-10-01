/* ==========================================================================
   DeepGlow – cart, booking form and WhatsApp handoff
   --------------------------------------------------------------------------
   OWNER NOTE: to change a package name, price or included services, edit the
   PACKAGES list below. Cards, cart totals and the WhatsApp message are all
   generated from this one list, so they can never disagree.
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- Configuration ---------- */
  var WHATSAPP_NUMBER = "917709753948";
  var WHATSAPP_BASE = "https://wa.me/" + WHATSAPP_NUMBER;
  /* Pre-filled booking messages use api.whatsapp.com/send directly: the wa.me
     redirect replaces emoji (🌿 👤 📞 …) with "�" before handing off to
     WhatsApp. This endpoint is the one wa.me forwards to, so the recipient
     number and behaviour are identical – only the emoji survive intact. */
  var WHATSAPP_SEND = "https://api.whatsapp.com/send?phone=" + WHATSAPP_NUMBER + "&text=";
  var CART_KEY = "deepglow-cart-v1";
  var FORM_KEY = "deepglow-booking-draft-v1";
  var MAX_QTY = 10;

  var PACKAGES = [
    {
      id: "glow-facial-wax",
      image: "assets/img/packages/glow-facial-wax.jpg",
      imageAlt: "Beautician giving a relaxing facial to a client at home, with waxing essentials arranged nearby",
      name: "Glow Facial & Wax Package",
      label: "Facial · Wax",
      price: 1999,
      art: "art-facial",
      services: ["O3 Facial", "Hand Wax", "Leg Wax", "Eyebrow"]
    },
    {
      id: "complete-wax",
      image: "assets/img/packages/complete-wax.jpg",
      imageAlt: "Professional waxing kit with warm wax, spatulas and clean towels set up for an at-home waxing session",
      name: "Complete Wax Package (All-in-One)",
      label: "Waxing",
      price: 1100,
      art: "art-wax",
      services: ["Hand Wax with Underarm", "Full Leg Wax", "Face Wax", "Eyebrow", "Upper Lip"]
    },
    {
      id: "dtan-wax-relax",
      image: "assets/img/packages/dtan-wax-relax.jpg",
      imageAlt: "Client relaxing with a D-Tan face pack while a beautician gives a gentle head massage at home",
      name: "D-Tan Wax & Relax Package",
      label: "D-Tan · Wax · Massage",
      price: 1200,
      art: "art-facial",
      services: ["D-Tan Facial", "Hand & Underarm Wax", "Leg Wax", "Head Massage", "Eyebrow"]
    },
    {
      id: "dtan-relaxation",
      image: "assets/img/packages/dtan-relaxation.jpg",
      imageAlt: "Calm at-home spa setting with a D-Tan facial and a soothing back massage",
      name: "D-Tan Relaxation Package",
      label: "D-Tan · Relaxation",
      price: 1100,
      art: "art-lotus",
      services: ["Head Massage", "D-Tan Facial", "Back Massage", "Eyebrow"]
    },
    {
      id: "dtan-massage-wax",
      image: "assets/img/packages/dtan-massage-wax.jpg",
      imageAlt: "At-home beauty session combining a D-Tan facial, massage oils and a waxing kit",
      name: "D-Tan Massage & Wax Package",
      label: "D-Tan · Massage · Wax",
      price: 1100,
      art: "art-lotus",
      services: ["Head Massage", "D-Tan Facial", "Back Massage", "Hand & Leg Wax", "Eyebrow"]
    },
    {
      id: "vitamin-c-glow",
      image: "assets/img/packages/vitamin-c-glow.jpg",
      imageAlt: "Vitamin C clean-up with fresh orange slices and skincare beside a relaxed client at home",
      name: "Vitamin C Glow Package (All-in-One)",
      label: "Clean-Up · Wax · Massage",
      price: 1500,
      art: "art-citrus",
      services: ["Vitamin C Clean-Up", "Full Leg & Hand Wax with Underarm", "Head Massage", "Eyebrow", "Upper Lip"]
    }
  ];

  var PKG_BY_ID = {};
  PACKAGES.forEach(function (p) { PKG_BY_ID[p.id] = p; });

  /* ---------- Helpers ---------- */
  var inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  function money(n) { return "₹" + inr.format(n); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clampQty(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1) return 1;
    return Math.min(n, MAX_QTY);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icon(id, cls) {
    return '<svg class="' + (cls || "ico") + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }
  function storageGet(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function storageSet(store, key, val) {
    try { window[store].setItem(key, val); } catch (e) { /* storage unavailable – ignore */ }
  }
  function storageRemove(store, key) {
    try { window[store].removeItem(key); } catch (e) { /* ignore */ }
  }
  /* Local (not UTC) date as YYYY-MM-DD, so "today" is correct in India. */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  var liveEl = $("#live");
  function announce(msg) {
    if (!liveEl) return;
    liveEl.textContent = "";
    window.setTimeout(function () { liveEl.textContent = msg; }, 40);
  }

  /* ==========================================================================
     CART – single source of truth: an ordered list of { id, qty }
     ========================================================================== */
  var cart = loadCart();

  function loadCart() {
    var raw = storageGet("localStorage", CART_KEY);
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      var seen = {};
      return data.filter(function (item) {
        var ok = item && typeof item.id === "string" && PKG_BY_ID[item.id] && !seen[item.id];
        if (ok) seen[item.id] = true;
        return ok;
      }).map(function (item) { return { id: item.id, qty: clampQty(item.qty) }; });
    } catch (e) {
      storageRemove("localStorage", CART_KEY);
      return [];
    }
  }
  function saveCart() { storageSet("localStorage", CART_KEY, JSON.stringify(cart)); }
  function findLine(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }
  /* Always recomputed from PACKAGES prices + cart quantities. */
  function cartLines() {
    return cart.map(function (line) {
      var p = PKG_BY_ID[line.id];
      return { id: p.id, name: p.name, price: p.price, qty: line.qty, subtotal: p.price * line.qty };
    });
  }
  function cartTotal(lines) { return lines.reduce(function (s, l) { return s + l.subtotal; }, 0); }
  function cartCount() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }

  function addToCart(id, qty) {
    var line = findLine(id);
    var added = clampQty(qty);
    if (line) line.qty = clampQty(line.qty + added);
    else cart.push({ id: id, qty: added });
    commit();
  }
  function setQty(id, qty) {
    var line = findLine(id);
    if (!line) return;
    line.qty = clampQty(qty);
    commit();
  }
  function removeFromCart(id) {
    cart = cart.filter(function (l) { return l.id !== id; });
    commit();
  }
  function clearCart() { cart = []; commit(); }
  function commit() { saveCart(); renderAll(); }

  /* ==========================================================================
     RENDER – package cards
     ========================================================================== */
  var grid = $("#package-grid");

  function renderPackages() {
    grid.innerHTML = PACKAGES.map(function (p, i) {
      var no = String(i + 1).padStart(2, "0");
      var titleId = "pkg-title-" + p.id;
      return (
        '<article class="card reveal" data-id="' + p.id + '" aria-labelledby="' + titleId + '">' +
          '<div class="card__art">' +
            '<span class="card__label" aria-hidden="true">' + escapeHtml(p.label) + "</span>" +
            icon("sprig", "card__sprig") + icon(p.art, "card__illo") +
            (p.image ? '<img class="card__photo" src="' + p.image + '" alt="' + escapeHtml(p.imageAlt || p.name) +
              '" width="1200" height="800" loading="lazy" decoding="async">' : "") +
          "</div>" +
          '<div class="card__badge"><small>Package</small><strong>' + money(p.price) + "</strong></div>" +
          '<div class="card__body">' +
            '<p class="card__no">Package ' + no + "</p>" +
            '<h3 class="card__title" id="' + titleId + '">' + escapeHtml(p.name) + "</h3>" +
            '<p class="sr-only">Price ' + money(p.price) + ". Includes:</p>" +
            '<ul class="card__list">' +
              p.services.map(function (s) { return "<li>" + icon("i-check") + "<span>" + escapeHtml(s) + "</span></li>"; }).join("") +
            "</ul>" +
            '<div class="card__foot">' +
              '<div class="qty" role="group" aria-label="Quantity for ' + escapeHtml(p.name) + '">' +
                '<button type="button" class="qty__btn" data-action="card-dec" aria-label="Decrease quantity">' + icon("i-minus") + "</button>" +
                '<input class="qty__input" type="number" inputmode="numeric" min="1" max="' + MAX_QTY + '" value="1" aria-label="Quantity" data-role="card-qty">' +
                '<button type="button" class="qty__btn" data-action="card-inc" aria-label="Increase quantity">' + icon("i-plus") + "</button>" +
              "</div>" +
              '<button type="button" class="btn btn--primary card__add" data-action="add">' + icon("i-bag") + "<span>Add to Cart</span></button>" +
              '<p class="card__status" data-role="status"></p>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");

    // Package photos are optional: if a file is missing, remove it so the
    // matching line illustration underneath shows instead.
    $all(".card__photo", grid).forEach(function (img) {
      function fail() { img.remove(); }
      img.addEventListener("error", fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  function syncCardState() {
    $all(".card", grid).forEach(function (card) {
      var line = findLine(card.getAttribute("data-id"));
      var status = $('[data-role="status"]', card);
      card.classList.toggle("in-cart", !!line);
      if (!card.dataset.flash) {
        status.innerHTML = line ? icon("i-check") + "<span>In your cart: " + line.qty + "</span>" : "";
      }
      var input = $('[data-role="card-qty"]', card);
      $('[data-action="card-dec"]', card).disabled = clampQty(input.value) <= 1;
      $('[data-action="card-inc"]', card).disabled = clampQty(input.value) >= MAX_QTY;
    });
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var card = btn.closest(".card");
    var id = card.getAttribute("data-id");
    var input = $('[data-role="card-qty"]', card);
    var action = btn.getAttribute("data-action");

    if (action === "card-inc" || action === "card-dec") {
      input.value = clampQty(+input.value + (action === "card-inc" ? 1 : -1));
      syncCardState();
      return;
    }
    if (action === "add") {
      var qty = clampQty(input.value);
      var existing = findLine(id);
      var prevQty = existing ? existing.qty : 0;
      addToCart(id, qty);
      var line = findLine(id);
      var capped = prevQty > 0 && prevQty === line.qty;
      var p = PKG_BY_ID[id];

      var status = $('[data-role="status"]', card);
      card.dataset.flash = "1";
      status.innerHTML = icon("i-check") + "<span>" + (capped ? "Maximum quantity reached." : "Added to your booking!") + "</span>";
      window.clearTimeout(card._flashTimer);
      card._flashTimer = window.setTimeout(function () { delete card.dataset.flash; syncCardState(); }, 2600);

      input.value = 1;
      syncCardState();
      showToast(capped ? "Maximum quantity reached" : "Added to your booking!");
      announce(p.name + (capped ? " is already at the maximum quantity." : " added to your booking. Quantity in cart: " + line.qty + ". Total " + money(cartTotal(cartLines())) + "."));
    }
  });
  grid.addEventListener("change", function (e) {
    if (e.target.matches('[data-role="card-qty"]')) { e.target.value = clampQty(e.target.value); syncCardState(); }
  });

  /* ---------- Toast ---------- */
  var toast = $("#toast");
  var toastTimer;
  function showToast(text) {
    $("#toast-text").textContent = text;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2800);
  }

  /* ==========================================================================
     RENDER – cart, header badge, booking summary
     ========================================================================== */
  var cartList = $("#cart-list");

  function renderCart(lines) {
    var empty = lines.length === 0;
    $("#cart-empty").hidden = !empty;
    $("#cart-filled").hidden = empty;

    cartList.innerHTML = lines.map(function (l) {
      var safe = escapeHtml(l.name);
      return (
        '<li class="cart__item" data-id="' + l.id + '">' +
          '<div class="cart__info"><div class="cart__name">' + safe + '</div><div class="cart__unit">' + money(l.price) + " each</div></div>" +
          '<div class="qty" role="group" aria-label="Quantity for ' + safe + '">' +
            '<button type="button" class="qty__btn" data-action="dec" aria-label="Decrease quantity of ' + safe + '"' + (l.qty <= 1 ? " disabled" : "") + ">" + icon("i-minus") + "</button>" +
            '<span class="qty__value" aria-label="Quantity ' + l.qty + '">' + l.qty + "</span>" +
            '<button type="button" class="qty__btn" data-action="inc" aria-label="Increase quantity of ' + safe + '"' + (l.qty >= MAX_QTY ? " disabled" : "") + ">" + icon("i-plus") + "</button>" +
          "</div>" +
          '<div class="cart__sub"><span class="sr-only">Subtotal </span>' + money(l.subtotal) + "</div>" +
          '<button type="button" class="cart__remove" data-action="remove" aria-label="Remove ' + safe + ' from cart">' + icon("i-trash") + "</button>" +
        "</li>"
      );
    }).join("");
    $("#cart-total").textContent = money(cartTotal(lines));
  }

  cartList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    var item = btn.closest(".cart__item");
    var id = item.getAttribute("data-id");
    var line = findLine(id);
    var name = PKG_BY_ID[id].name;
    var action = btn.getAttribute("data-action");

    if (action === "remove") {
      removeFromCart(id);
      announce(name + " removed. " + (cart.length ? "Grand total " + money(cartTotal(cartLines())) + "." : "Your cart is now empty."));
      var next = $(".cart__item .cart__remove", cartList) || $("#cart-empty .btn");
      if (next) next.focus();
      return;
    }
    setQty(id, line.qty + (action === "inc" ? 1 : -1));
    announce(name + " quantity " + findLine(id).qty + ". Grand total " + money(cartTotal(cartLines())) + ".");
    // Keep keyboard focus on the same control after re-render.
    var again = $('.cart__item[data-id="' + id + '"] [data-action="' + action + '"]', cartList);
    if (again && !again.disabled) again.focus();
    else if (again) $('.cart__item[data-id="' + id + '"] [data-action="' + (action === "inc" ? "dec" : "inc") + '"]', cartList).focus();
  });

  function renderBadge() {
    var n = cartCount();
    var badge = $("#cart-count");
    var prev = badge.textContent;
    badge.textContent = n;
    badge.classList.toggle("is-empty", n === 0);
    $("#cart-btn").setAttribute("aria-label", "View your booking cart, " + n + (n === 1 ? " item" : " items"));
    if (prev !== String(n)) {
      badge.classList.remove("bump");
      void badge.offsetWidth; // restart animation
      badge.classList.add("bump");
    }
  }

  function renderSummary(lines) {
    var box = $("#summary-items");
    if (!lines.length) {
      box.innerHTML = '<p class="summary__empty">No packages selected yet. <a href="#packages">Choose a package</a> to continue.</p>';
    } else {
      box.innerHTML = '<ul class="summary__items">' + lines.map(function (l) {
        return '<li class="summary__item"><span class="summary__item-name">' + escapeHtml(l.name) + "</span>" +
          '<span class="summary__item-calc">' + l.qty + " × " + money(l.price) + "</span>" +
          '<span class="summary__item-sub">' + money(l.subtotal) + "</span></li>";
      }).join("") + "</ul>";
    }
    $("#summary-total").textContent = money(cartTotal(lines));
    var err = $("#err-cart");
    if (lines.length && err.textContent) err.textContent = "";
  }

  function renderMeta() {
    var d = form.elements.date.value;
    var slot = getSlot();
    $("#summary-date").textContent = d ? formatDate(d) || "Not selected" : "Not selected";
    $("#summary-slot").textContent = slot || "Not selected";
  }

  function renderAll() {
    var lines = cartLines();
    renderCart(lines);
    renderBadge();
    renderSummary(lines);
    syncCardState();
  }

  /* ==========================================================================
     BOOKING FORM – validation
     ========================================================================== */
  var form = $("#booking-form");
  var dateInput = $("#f-date");
  dateInput.min = todayISO();

  function getSlot() {
    var r = form.querySelector('input[name="slot"]:checked');
    return r ? r.value : "";
  }
  function normalisePhone(v) { return String(v || "").replace(/[\s-]/g, ""); }
  /* Keep just the 10-digit mobile number (drops a pasted +91 / 91 / 0 prefix)
     and space it as "98765 43210" for easy reading. */
  function formatPhone(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (d.length > 10 && d.indexOf("91") === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    d = d.slice(0, 10);
    return d.length > 5 ? d.slice(0, 5) + " " + d.slice(5) : d;
  }
  function isValidIndianMobile(v) {
    return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(normalisePhone(v));
  }

  var validators = {
    name: function (v) {
      v = v.trim();
      if (!v) return "Please enter your full name.";
      if (v.length < 2) return "Please enter your full name.";
      return "";
    },
    phone: function (v) {
      if (!v.trim()) return "Please enter your mobile number.";
      if (!isValidIndianMobile(v)) return "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9 (e.g. 98765 43210).";
      return "";
    },
    address: function (v) { return v.trim() ? "" : "Please enter your full address."; },
    area: function (v) { return v.trim() ? "" : "Please enter your area or a nearby landmark."; },
    pincode: function (v) {
      v = v.trim();
      if (!v) return "Please enter your 6-digit PIN code.";
      if (!/^\d{6}$/.test(v)) return "PIN code must be exactly 6 digits.";
      return "";
    },
    date: function (v) {
      if (!v) return "Please choose your preferred date.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Please choose a valid date.";
      if (v < todayISO()) return "This date has passed. Please choose today or a future date.";
      return "";
    },
    slot: function () { return getSlot() ? "" : "Please choose a preferred time slot."; }
  };

  function setError(name, msg) {
    var err = $("#err-" + name);
    if (err) err.textContent = msg;
    if (name === "slot") {
      $(".slots", form).classList.toggle("is-invalid", !!msg);
    } else {
      var el = form.elements[name];
      if (el) {
        if (msg) el.setAttribute("aria-invalid", "true");
        else el.removeAttribute("aria-invalid");
        // Green tick once a field is filled in correctly
        if (!msg && el.value.trim()) el.dataset.valid = "1";
        else delete el.dataset.valid;
      }
      if (name === "date") $("#date-chips").classList.toggle("is-invalid", !!msg);
    }
    if (!errorSummary.hidden) updateErrorSummary();
  }
  function validateField(name) {
    var el = form.elements[name];
    var msg = validators[name](name === "slot" ? "" : el.value);
    setError(name, msg);
    return !msg;
  }

  // Validate on blur once touched; re-validate live after a field has shown an error.
  Object.keys(validators).forEach(function (name) {
    if (name === "slot") return;
    var el = form.elements[name];
    el.addEventListener("blur", function () { if (el.value.trim() || el.dataset.touched) { el.dataset.touched = "1"; validateField(name); } });
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validateField(name); });
  });
  // Pincode: digits only.
  form.elements.pincode.addEventListener("input", function (e) {
    var cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
    if (cleaned !== e.target.value) e.target.value = cleaned;
  });
  /* ---------- Error summary (shown after a failed submit) ---------- */
  var errorSummary = $("#error-summary");
  var SUMMARY_ORDER = ["name", "phone", "address", "area", "pincode", "date", "slot"];
  function focusField(name) {
    var target = name === "slot" ? $('input[name="slot"]', form)
      : name === "date" ? ($('input[name="date-chip"]:checked', form) || $('input[name="date-chip"]', form) || dateInput)
      : form.elements[name];
    if (target) { target.focus({ preventScroll: true }); target.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }
  function updateErrorSummary(show) {
    var items = [];
    SUMMARY_ORDER.forEach(function (n) {
      var msg = $("#err-" + n).textContent;
      if (msg) items.push('<li><a href="#" data-focus="' + n + '">' + escapeHtml(msg) + "</a></li>");
    });
    if (!cart.length && $("#err-cart").textContent) {
      items.push('<li><a href="#packages">Your cart is empty – add at least one package.</a></li>');
    }
    $("#error-summary-list").innerHTML = items.join("");
    if (show || !errorSummary.hidden) errorSummary.hidden = items.length === 0;
  }
  errorSummary.addEventListener("click", function (e) {
    var a = e.target.closest("[data-focus]");
    if (!a) return;
    e.preventDefault();
    focusField(a.getAttribute("data-focus"));
  });

  /* ---------- Phone: fixed +91 prefix, auto-spacing, clean pastes ---------- */
  var phoneInput = form.elements.phone;
  phoneInput.addEventListener("input", function () {
    var v = phoneInput.value;
    var caret = phoneInput.selectionStart || v.length;
    var digitsBeforeCaret = v.slice(0, caret).replace(/\D/g, "").length;
    var formatted = formatPhone(v);
    // A pasted +91/91/0 prefix is dropped, so count those digits out of the caret position too.
    var dropped = v.replace(/\D/g, "").length - formatted.replace(/\D/g, "").length;
    if (formatted === v) return;
    phoneInput.value = formatted;
    var target = Math.max(0, digitsBeforeCaret - Math.max(0, dropped));
    var pos = 0, seen = 0;
    while (pos < formatted.length && seen < target) { if (/\d/.test(formatted.charAt(pos))) seen++; pos++; }
    try { phoneInput.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
  });

  /* ---------- Pincode quick-fill ---------- */
  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fill-pincode]");
    if (!b) return;
    form.elements.pincode.value = b.getAttribute("data-fill-pincode");
    form.elements.pincode.dataset.touched = "1";
    validateField("pincode");
    saveDraft();
  });

  /* ---------- Date: one-tap chips for the next 10 days ---------- */
  var DATE_CHIP_DAYS = 10;
  var dateChips = $("#date-chips");
  function renderDateChips() {
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var base = new Date();
    var html = "";
    for (var i = 0; i < DATE_CHIP_DAYS; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      var top = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()];
      html += '<label class="date-chip"><input type="radio" name="date-chip" value="' + iso + '">' +
        '<span class="date-chip__box"><span class="date-chip__top">' + top + "</span>" +
        '<span class="date-chip__day">' + d.getDate() + "</span>" +
        '<span class="date-chip__mon">' + months[d.getMonth()] + "</span></span></label>";
    }
    dateChips.innerHTML = html;
  }
  function syncDateChips() {
    $all('input[name="date-chip"]', dateChips).forEach(function (r) { r.checked = r.value === dateInput.value; });
  }
  dateChips.addEventListener("change", function (e) {
    if (!e.target.matches('input[name="date-chip"]')) return;
    dateInput.value = e.target.value;
    dateInput.dataset.touched = "1";
    validateField("date");
    renderMeta();
    saveDraft();
  });

  /* ---------- Notes: one-tap phrases ---------- */
  var notesInput = form.elements.notes;
  function noteParts() { return notesInput.value.split(/\s*;\s*/).filter(function (x) { return x.trim(); }); }
  function syncNoteChips() {
    var parts = noteParts();
    $all("[data-note]", form).forEach(function (b) {
      b.setAttribute("aria-pressed", String(parts.indexOf(b.getAttribute("data-note")) !== -1));
    });
  }
  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-note]");
    if (!b) return;
    var note = b.getAttribute("data-note");
    var parts = noteParts();
    var at = parts.indexOf(note);
    if (at === -1) parts.push(note); else parts.splice(at, 1);
    notesInput.value = parts.join("; ").slice(0, 500);
    syncNoteChips();
    saveDraft();
  });
  notesInput.addEventListener("input", syncNoteChips);

  dateInput.addEventListener("change", function () { syncDateChips(); validateField("date"); renderMeta(); });
  $all('input[name="slot"]', form).forEach(function (r) {
    r.addEventListener("change", function () { validateField("slot"); renderMeta(); });
  });

  /* ---------- Draft persistence (sessionStorage – cleared when the tab closes) ---------- */
  var DRAFT_FIELDS = ["name", "phone", "address", "area", "pincode", "date", "notes"];
  function saveDraft() {
    var d = {};
    DRAFT_FIELDS.forEach(function (f) { d[f] = form.elements[f].value; });
    d.slot = getSlot();
    storageSet("sessionStorage", FORM_KEY, JSON.stringify(d));
  }
  function loadDraft() {
    var raw = storageGet("sessionStorage", FORM_KEY);
    if (!raw) return;
    try {
      var d = JSON.parse(raw);
      DRAFT_FIELDS.forEach(function (f) { if (typeof d[f] === "string") form.elements[f].value = d[f]; });
      if (d.date && d.date < todayISO()) form.elements.date.value = "";
      form.elements.phone.value = formatPhone(form.elements.phone.value);
      if (d.slot) {
        var r = form.querySelector('input[name="slot"][value="' + String(d.slot).replace(/"/g, "") + '"]');
        if (r) r.checked = true;
      }
    } catch (e) { storageRemove("sessionStorage", FORM_KEY); }
  }
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);

  /* ==========================================================================
     WHATSAPP MESSAGE + HANDOFF
     ========================================================================== */
  function buildMessage(data, lines) {
    var total = cartTotal(lines);
    var out = [
      "🌿 New Booking – DeepGlow",
      "👤 Name: " + data.name,
      "📞 Phone: " + data.phone,
      "🏠 Address: " + data.address,
      "📍 Area/Landmark: " + data.area,
      "📮 Pincode: " + data.pincode,
      "📅 Date: " + data.date + " ⏰ Time: " + data.slot,
      "💆 Packages:"
    ];
    lines.forEach(function (l, i) {
      out.push((i + 1) + ". " + l.name + " – " + l.qty + " x " + money(l.price) + " = " + money(l.subtotal));
    });
    out.push("💰 Grand Total: " + money(total));
    out.push("📝 Notes: " + (data.notes || "None"));
    return out.join("\n");
  }
  function buildWhatsAppUrl(message) {
    return WHATSAPP_SEND + encodeURIComponent(message);
  }
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024);
  }

  var confirmBtn = $("#confirm-btn");
  var handoff = $("#handoff");
  var submitting = false;

  function setSubmitting(on) {
    submitting = on;
    confirmBtn.disabled = on;
    confirmBtn.setAttribute("aria-busy", on ? "true" : "false");
    $(".btn__label", confirmBtn).textContent = on ? "Opening WhatsApp…" : "Confirm Booking on WhatsApp";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitting) return;

    // 1. Validate every required field.
    var fields = ["name", "phone", "address", "area", "pincode", "date", "slot"];
    var firstInvalid = null;
    fields.forEach(function (f) {
      if (!validateField(f) && !firstInvalid) firstInvalid = f;
    });

    // 2. Cart must contain at least one package. Recalculate from real cart data.
    var lines = cartLines();
    var cartErr = $("#err-cart");
    if (!lines.length) {
      cartErr.innerHTML = 'Your cart is empty. Please <a href="#packages">add at least one package</a> before booking.';
    } else {
      cartErr.textContent = "";
    }

    if (firstInvalid) {
      updateErrorSummary(true);
      errorSummary.focus({ preventScroll: true });
      errorSummary.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errorSummary.hidden = true;
    if (!lines.length) {
      cartErr.scrollIntoView({ behavior: "smooth", block: "center" });
      announce("Your cart is empty. Add at least one package before booking.");
      return;
    }

    setSubmitting(true);

    var data = {
      name: form.elements.name.value.trim(),
      phone: "+91 " + formatPhone(form.elements.phone.value),
      address: form.elements.address.value.trim().replace(/\s*\n\s*/g, ", "),
      area: form.elements.area.value.trim(),
      pincode: form.elements.pincode.value.trim(),
      date: formatDate(form.elements.date.value),
      slot: getSlot(),
      notes: form.elements.notes.value.trim()
    };
    var url = buildWhatsAppUrl(buildMessage(data, lines));

    // Keep cart + form intact; show guidance and a fallback link.
    $("#handoff-link").href = url;
    handoff.hidden = false;
    announce("Thank you! Your booking request is ready in WhatsApp. Please send the pre-filled message to DeepGlow.");

    var opened = false;
    if (!isMobile()) {
      // Desktop: new tab keeps the site open. Must run synchronously in the click handler.
      try {
        var win = window.open(url, "_blank");
        if (win) { try { win.opener = null; } catch (err) { /* ignore */ } opened = true; }
      } catch (err) { opened = false; }
    }
    if (!opened) {
      // Mobile (or popup blocked): same-tab navigation gives the most reliable app handoff.
      try { window.location.href = url; } catch (err) { /* fallback link remains visible */ }
    }

    handoff.focus({ preventScroll: true });
    handoff.scrollIntoView({ behavior: "smooth", block: "nearest" });
    window.setTimeout(function () { setSubmitting(false); }, 3000);
  });

  // If the customer returns via the Back button (bfcache), re-enable the button.
  window.addEventListener("pageshow", function () { if (submitting) setSubmitting(false); });

  $("#reset-btn").addEventListener("click", function () {
    clearCart();
    form.reset();
    storageRemove("sessionStorage", FORM_KEY);
    Object.keys(validators).forEach(function (n) { setError(n, ""); });
    $all("[data-touched]", form).forEach(function (el) { delete el.dataset.touched; });
    $all("[data-valid]", form).forEach(function (el) { delete el.dataset.valid; });
    errorSummary.hidden = true;
    syncDateChips();
    syncNoteChips();
    handoff.hidden = true;
    renderMeta();
    announce("Booking cleared. You can start a new booking.");
    document.getElementById("packages").scrollIntoView({ behavior: "smooth" });
  });

  /* Proceed to booking – focus first field */
  $("#proceed-btn").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, 450);
  });

  /* ==========================================================================
     NAVIGATION, HEADER, REVEAL, FLOATING BUTTON
     ========================================================================== */
  var header = $("#header");
  var nav = $("#site-nav");
  var menuBtn = $("#menu-btn");

  function setNavTop() {
    var rect = header.getBoundingClientRect();
    document.documentElement.style.setProperty("--nav-top", Math.max(0, rect.bottom) + "px");
  }
  function closeMenu() {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    setNavTop();
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    if (open) { var first = $(".nav__link", nav); if (first) first.focus(); }
  });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); menuBtn.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (nav.classList.contains("is-open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
  });
  window.addEventListener("resize", function () { if (window.innerWidth > 900) closeMenu(); setNavTop(); });

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
      if (nav.classList.contains("is-open")) setNavTop();
      ticking = false;
    });
  }, { passive: true });

  var revealObs = null;
  function observeReveals(root) {
    $all(".reveal", root).forEach(function (el) {
      if (revealObs) revealObs.observe(el); else el.classList.add("is-visible");
    });
  }
  if ("IntersectionObserver" in window) {
    // Entrance animations
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    observeReveals(document);

    // Active nav link
    var links = {};
    $all(".nav__link").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $all(".nav__link").forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
          links[en.target.id].classList.add("is-active");
          links[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["home", "packages", "about", "reviews", "contact"].forEach(function (id) {
      var s = document.getElementById(id); if (s) navObs.observe(s);
    });

    // Hide the floating WhatsApp button while the confirm button is on screen,
    // so it never covers the checkout action on small phones.
    var wa = $("#wa-float");
    var waObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { wa.classList.toggle("is-hidden", en.isIntersecting && window.innerWidth < 900); });
    });
    waObs.observe(confirmBtn);
  } else {
    observeReveals(document);
  }

  /* ==========================================================================
     INIT
     ========================================================================== */
  try {
    renderPackages();
    observeReveals(grid);
    renderDateChips();
    loadDraft();
    // Show green ticks for valid details restored from a saved draft.
    ["name", "phone", "address", "area", "pincode", "date"].forEach(function (n) {
      var el = form.elements[n];
      if (el.value.trim() && !validators[n](el.value)) el.dataset.valid = "1";
    });
    syncDateChips();
    syncNoteChips();
    renderAll();
    renderMeta();
    setNavTop();
  } catch (err) {
    if (window.console) console.error("DeepGlow init error:", err);
    grid.innerHTML = '<p class="notice">Sorry, the packages could not be loaded. Please <a href="' + WHATSAPP_BASE +
      '">book directly on WhatsApp at +91 7709753948</a>.</p>';
  }

  // Expose pure helpers for testing in the browser console.
  window.DeepGlow = { buildMessage: buildMessage, buildWhatsAppUrl: buildWhatsAppUrl, cartLines: cartLines, isValidIndianMobile: isValidIndianMobile };
})();
