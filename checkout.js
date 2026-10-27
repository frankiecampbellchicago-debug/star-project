SKY.shine = 0.7;
SKY.redraw?.();

// Paste the payment provider's checkout link here when the store goes live
// (for example a Stripe Payment Link). Empty = preview mode, nothing is charged.
const PAYMENT_URL = "";

(() => {
  const form = document.getElementById("checkout-form");
  const lines = document.getElementById("sum-lines");
  const payBtn = document.getElementById("pay-btn");
  const note = document.getElementById("pay-note");

  const shipping = () => {
    const sub = Cart.subtotal();
    if (form.ship.value === "express") return 18;
    return sub >= FREE_SHIP ? 0 : SHIP_STANDARD;
  };

  function render() {
    const items = Cart.items;
    const sub = Cart.subtotal();
    document.querySelector("[data-std]").textContent = sub >= FREE_SHIP ? "Free" : money(SHIP_STANDARD);
    if (!items.length) {
      lines.innerHTML = `<div class="empty"><p>Your bag is empty.</p><a class="btn ghost" href="index.html#catalogue">Open the catalogue</a></div>`;
      payBtn.disabled = true;
    } else {
      lines.innerHTML = items.map(lineHTML).join("");
      payBtn.disabled = false;
    }
    const ship = items.length ? shipping() : 0;
    document.getElementById("sum-sub").textContent = money(sub);
    document.getElementById("sum-ship").textContent = !items.length ? "—" : ship ? money(ship) : "Free";
    document.getElementById("sum-total").textContent = money(sub + ship);
    payBtn.textContent = items.length ? `Pay ${money(sub + ship)}` : "Pay";
  }

  bindLineButtons(lines);
  Cart.onChange(render);
  form.addEventListener("change", (e) => { if (e.target.name === "ship") render(); });

  // validate as people leave each field, and again on submit
  const check = (input) => {
    const err = form.querySelector(`[data-err="${input.name}"]`);
    if (!err) return true;
    let msg = "";
    if (input.validity.valueMissing) msg = "This field is required.";
    else if (input.validity.typeMismatch) msg = "Please enter a valid email address.";
    err.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  };
  form.querySelectorAll("input[required]").forEach((i) => i.addEventListener("blur", () => check(i)));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = [...form.querySelectorAll("input[required]")].filter((i) => !check(i));
    if (bad.length) { bad[0].focus(); note.textContent = "Please fill in the highlighted fields."; return; }
    if (!Cart.items.length) return;
    payBtn.disabled = true;
    payBtn.textContent = "Opening secure payment…";
    setTimeout(() => {
      if (PAYMENT_URL) { location.href = PAYMENT_URL; return; }
      payBtn.disabled = false;
      render();
      note.textContent = "Preview mode: payments aren't switched on yet, so nothing was charged. Your bag is saved.";
    }, 700);
  });

  render();
})();
