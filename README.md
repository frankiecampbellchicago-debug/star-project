# Star Project

Online store for the Star Project clothing label. Static site on GitHub Pages.

- `index.html`: the starfield + comet intro, the flip-through catalogue (one spread per drop), story, sign-up
- `checkout.html`: order summary, shipping details, payment hand-off
- `products.js`: **edit this to change drops, products, prices and sizes**
- `images/`: product photos (`<name>-800.webp` and `<name>-400.webp`). Current photos are placeholders.

## Going live with payments
Set `PAYMENT_URL` in `checkout.js` to your payment provider's checkout link (e.g. Stripe).
Until then the Pay button runs in preview mode and charges nothing.
The "Join the list" form is also preview only until an email service is connected.
