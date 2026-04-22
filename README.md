# Aro Johnson Website

Client-facing marketing site and inquiry flow for a virtual assistant business. The project uses a static front end with a serverless contact endpoint that sends structured inquiry emails through Resend.

## What is included

- Refreshed homepage with stronger light and dark themes
- Two prepared headshot slots:
  one in the hero section and one in the about section
- Rewritten copy that sounds more natural and business-ready
- Reorganized services, case studies, FAQ, and contact flow
- Updated SVG logo, favicon, and icon sprite
- Floating WhatsApp shortcut
- Improved SEO metadata, structured data, robots, sitemap, and manifest
- Hardened contact form endpoint with stricter validation and email formatting

## Project structure

```text
Aro/
|-- api/
|   `-- contact.js
|-- assets/
|   |-- css/
|   |   `-- style.css
|   |-- icons/
|   |   |-- logo-mark.svg
|   |   `-- sprite.svg
|   |-- images/
|   |   |-- case-studies/
|   |   |-- portfolio/
|   |   |   |-- headshot-desk.svg
|   |   |   `-- headshot-main.svg
|   |   |-- site/
|   |   `-- credits.txt
|   `-- js/
|       `-- main.js
|-- .env.example
|-- favicon.svg
|-- index.html
|-- robots.txt
|-- sitemap.xml
`-- site.webmanifest
```

## Local setup

1. Copy `.env.example` into your real environment configuration.
2. Set `CONTACT_ALLOWED_ORIGIN` to the live domain.
3. Set a verified Resend sender in `CONTACT_FROM_EMAIL`.
4. Deploy the static files and the `api/contact.js` serverless function together.

## Environment variables

```env
RESEND_API_KEY=re_xxxxxxxxx
CONTACT_TO_EMAIL=hello@arojohnson.com
CONTACT_FROM_EMAIL=Aro Johnson <onboarding@resend.dev>
CONTACT_ALLOWED_ORIGIN=https://arojohnson.com
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=5
MAX_CONTENT_LENGTH_BYTES=16384
```

## Replacing the personal photos

Two placeholder SVGs are ready to be swapped with the owner's real images:

- `assets/images/portfolio/headshot-main.svg`
- `assets/images/portfolio/headshot-desk.svg`

You can either replace those files directly while keeping the same names, or update the image paths in [index.html](./index.html).

## WhatsApp link

The floating WhatsApp button is currently wired to `#contact` as a safe placeholder because no real WhatsApp number or chat URL was provided in the project files.

Before launch, replace this link in [index.html](./index.html) with the owner's real WhatsApp URL, for example:

```text
https://wa.me/234XXXXXXXXXX?text=Hello%20Aro%2C%20I%20would%20like%20to%20ask%20about%20virtual%20assistant%20support.
```

## Security notes

The contact endpoint now includes:

- `POST`-only handling with `OPTIONS` support
- Origin and referer checks
- JSON-only request handling
- Content length limits
- Honeypot and submission timing checks
- Required consent validation
- Service allow-listing
- Input normalization, length limits, and HTML escaping
- Basic IP and email rate limiting
- Defensive response headers
- Cleaner HTML and text email templates for the owner

## SEO notes

The site includes:

- Canonical URL
- Open Graph and Twitter metadata
- `ProfessionalService`, `Person`, and `FAQPage` structured data
- Semantic headings and section structure
- Sitemap and robots configuration
- Theme-aware metadata and manifest updates

If the final production domain changes, update all hard-coded `https://arojohnson.com` references in:

- `index.html`
- `robots.txt`
- `sitemap.xml`
- `.env.example`

## Image credits

Free stock images are documented in [assets/images/credits.txt](./assets/images/credits.txt).

## Launch checklist

- Replace both placeholder headshots with real photos
- Replace the WhatsApp placeholder link with the owner's real chat URL
- Confirm the live domain is correct everywhere
- Confirm the Resend sender is verified
- Test one successful contact form submission in production
