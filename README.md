# Aro Johnson | Virtual Assistant Services

Professional portfolio website for virtual assistant services. Built with clean design, accessibility, and performance in mind.

##  Features

- Responsive design optimized for all devices
- Light/Dark theme support with automatic system detection
- Accessible navigation and keyboard support
- Smooth scroll animations and transitions
- Performance optimized with lazy loading
- SEO optimized with structured data
- Contact form with spam protection
- Security headers and best practices

##  Technologies

- HTML5 semantic markup
- Modern CSS3 with custom properties
- Vanilla JavaScript (no frameworks)
- Font Awesome icons
- Google Fonts (Fraunces & Manrope)

##  Project Structure

```
Aro/
├── index.html              # Main landing page
├── robots.txt              # Search engine directives
├── README.md               # This file
├── api/
│   └── contact.js          # Contact form handler
└── assets/
    ├── css/
    │   └── style.css       # Main stylesheet
    ├── js/
    │   └── main.js         # Application logic
    └── images/
        ├── case-studies/   # Work examples
        ├── portfolio/      # Profile photos
        └── site/           # General site images
```

##  Design System

| Variable | Light Mode | Dark Mode | Purpose |
|---|---|---|---|
| `--primary` | `#b86a34` | `#d89658` | Brand primary color |
| `--bg` | `#f7f5ef` | `#111519` | Page background |
| `--text` | `#1d2430` | `#f0ebe0` | Primary text |
| `--text-soft` | `#5f6777` | `#a1aab5` | Secondary text |

All colors use single solid values without mixed gradients on surfaces.

## Security

- Honeypot field for spam protection
- Form validation on client and server
- CORS configuration
- XSS protection headers
- No external dependencies beyond trusted CDNs

## Breakpoints

- `1100px` – Tablet layout
- `860px` – Mobile navigation
- `640px` – Small mobile layout

## Deployment

This is a static site that can be deployed to any hosting provider. No build step required.

## License

All rights reserved. Copyright © 2026 Oluwayemi Oyinlola.