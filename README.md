# DeepGlow – Beauty at Your Doorstep

Single-page booking website for DeepGlow by Deepa Indurkar (Lohegaon, Pune).
Plain HTML, CSS and vanilla JavaScript. No backend, database, login or payment gateway.

```
deepglow/
├── index.html            Page markup, SEO meta, structured data
├── assets/css/styles.css All styling (brand colours are CSS variables at the top)
├── assets/js/app.js      Packages, cart, form validation, WhatsApp booking
├── assets/img/           Hero photo, favicon, touch icon, social preview image
├── robots.txt
└── sitemap.xml
```

## Run locally

Any static file server works. From the `deepglow` folder:

```bash
python -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly also works, but a server is closer to production.)

## Common owner edits

| To change… | Edit |
|---|---|
| Package names, prices, included services | `PACKAGES` list at the top of `assets/js/app.js`. Cards, cart, totals and the WhatsApp message all use this list. |
| WhatsApp number | `WHATSAPP_NUMBER` in `app.js`, and the `wa.me/917709753948` / `tel:` links in `index.html` |
| Colours | `:root` variables at the top of `styles.css` |
| Testimonials | The `#reviews` section in `index.html`. **The four reviews are sample placeholders. Replace them with genuine, permission-approved client reviews before launch**, and remove the "Sample testimonials" line when you do. |
| Package photos | Save `assets/img/packages/<package-id>.jpg` (3:2 landscape). File names and AI prompts are in `IMAGE-PROMPTS.md`. Cards without a photo show a line illustration. |
| Any CSS or JS file | After editing, change the `?v=…` number on its `<link>`/`<script>` tag in `index.html` (e.g. `?v=20261001c` → `?v=20261015`) so visitors' browsers load the new version instead of an old cached copy. |
| Hero photo | Replace `assets/img/hero-facial.webp` and `.jpg` (portrait, about 500×770) |

## Photo credits

The package card photos are free photos from [Unsplash](https://unsplash.com/), used under the [Unsplash License](https://unsplash.com/license).
That licence allows free commercial use, and attribution isn't required, but it is appreciated.
They are illustrative: they don't show DeepGlow staff or clients.

| File | Photo | Photographer |
|---|---|---|
| `glow-facial-wax.jpg` | [Facial mask treatment](https://unsplash.com/photos/Pe9IXUuC6QU) | Rosa Rafael |
| `complete-wax.jpg` | [Sugar wax](https://unsplash.com/photos/dFAdCxeJmwo) (cropped to the wax drip) | Maryam Shittu |
| `dtan-wax-relax.jpg` | [Facial massage](https://unsplash.com/photos/16mHHrY3PUk) | Ionela Mat |
| `dtan-relaxation.jpg` | [Back massage](https://unsplash.com/photos/Y1JKxNFwZx4) | yury kirillov |
| `dtan-massage-wax.jpg` | [Wax heater](https://unsplash.com/photos/lrW3m3p4mYQ) | Grove Brands |
| `vitamin-c-glow.jpg` | [Face pack with lemon slices](https://unsplash.com/photos/3r5n5i8mzcw) | Alireza Mirzabegi |

To use your own photos instead, replace these files and keep the same names (see `IMAGE-PROMPTS.md`).

## How booking works

1. The customer adds packages to the cart. The cart is saved in `localStorage`, so a page refresh keeps it.
2. They fill in the booking form. Every field is validated inline, and past dates are rejected.
3. **Confirm Booking on WhatsApp** rebuilds the totals from the cart and opens WhatsApp with the full booking message pre-filled, addressed to +91 7709753948.
4. The customer must press **Send** in WhatsApp. The site says this clearly and keeps the cart and form until the customer clicks "I've sent it – start a new booking".

Note: the pre-filled message link uses `https://api.whatsapp.com/send?phone=917709753948&text=…` rather than `wa.me/…?text=…`.
In testing, the `wa.me` redirect replaced every emoji in the message (🌿 👤 📞 …) with "�".
`api.whatsapp.com/send` is the address `wa.me` redirects to, so it reaches the same number and keeps the emoji.
Plain "Chat on WhatsApp" buttons still use `wa.me`.

## Publish on www.deepglow.in

The site is static, so any static host works. Two free options:

**Netlify**: drag the `deepglow` folder onto https://app.netlify.com/drop, then go to *Domain management* and add `www.deepglow.in`.

**GitHub Pages**: push the folder's contents to a repository, enable Pages (branch `main`, root), and set the custom domain to `www.deepglow.in`.

Then, at your domain registrar:

- Add a `CNAME` record for `www` pointing to the host's address (e.g. `your-site.netlify.app` or `username.github.io`).
- Redirect the bare `deepglow.in` to `www.deepglow.in`. Use the host's apex instructions (A/ALIAS records) or the registrar's forwarding.
- Turn on HTTPS in the host dashboard (both hosts provide free certificates).

After it goes live:

- Check that `https://www.deepglow.in/` loads. The canonical URL, Open Graph image and sitemap all assume that address.
- Submit `https://www.deepglow.in/sitemap.xml` in Google Search Console.
- Test a booking from a real phone and confirm the message arrives in WhatsApp.

## Before launch checklist

- [ ] Replace the sample testimonials with real, approved reviews
- [ ] If available, add the original high-resolution logo file (SVG or PNG). The header and footer currently use a text-and-SVG recreation.
- [ ] Confirm `www.deepglow.in` is the final domain (update `canonical`, `og:url` and `sitemap.xml` if not)
