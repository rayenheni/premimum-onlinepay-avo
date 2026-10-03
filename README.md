# Bilingual law-firm website template

A polished Arabic/French, RTL/LTR website template for **one lawyer or one law firm per deployment**. Each customer receives an independent application, database, administrator account, and payment credentials. It is not a shared multi-tenant SaaS platform.

## Included

- Arabic (`/ar`, RTL) and French (`/fr`, LTR) public website
- Responsive homepage, firm profile, services, journal, gallery, contact, careers, legal, privacy and search pages
- PostgreSQL-backed CMS for public text, SEO, pages, articles, media, contact requests and consultation requests
- One protected administration area at `/admin`
- Consultation workflow with Konnect, bank-transfer and D17 options
- Server-side validation, hashed admin sessions, audit log and secure uploaded-media delivery
- Original template images in `public/images`

## New installation

### 1. Requirements

- Node.js 22 or newer
- PostgreSQL 15 or newer
- A database dedicated to this customer

### 2. Configure the installation

```bash
cp .env.example .env
```

Set at least `DATABASE_URL`, `SITE_URL`, and a long random `ADMIN_SETUP_KEY`. In production, `ADMIN_SETUP_KEY` is mandatory before the first admin account can be created.

### 3. Install and initialise the database

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000/admin`, enter the setup key, and create the administrator account. The setup screen is available only while no administrator exists.

For a development database without migration history, `npx drizzle-kit push` is also available. Use the committed migrations for production installations.

### 4. Configure the firm

Sign in at `/admin` and update, in this order:

1. **Tous les textes** — firm name, lawyer name, practice descriptions, legal wording, consultation fees and bilingual copy.
2. **Logo & apparence** — logo, cover images and optional licensed video.
3. **Paramètres** — contact information, hours, social links, notifications and SEO indexing.
4. **Paiements** — enable only the methods accepted by this firm and enter bank/D17 details where applicable.
5. **Pages & SEO** — control publication, navigation and page metadata.

Default content is intentionally generic. Every customer should review their legal notices, privacy content, service scope and fees before publishing.

## Payments

### Konnect

Set all three server variables below to enable online checkout:

- `KONNECT_API_KEY`
- `KONNECT_WALLET_ID`
- `SITE_URL`

`SITE_URL` must be the firm’s canonical public URL and must use HTTPS in production. The server independently verifies the completed payment, TND currency, order reference, receiving wallet, and reached amount before marking a consultation as paid.

### Bank transfer and D17

These methods are manual by design. The client provides a transaction reference **and uploads a payment receipt** (JPG, PNG, WebP or PDF; 5 MB maximum). The receipt is stored privately, the request is set to `awaiting_verification`, and the firm opens the proof in **Admin → Consultations** before choosing **Accepter la preuve et marquer payé**. Proof files are never exposed through the public media route.

## Media and assets

The bundled office, justice and article visuals are template images. Replace them from **Admin → Médiathèque & galerie** or use a licensed external HTTPS URL. An introductory video is not bundled; adding one is optional and must be properly licensed.

Uploaded JPG, PNG and WebP images are limited to 5 MB and their binary signature is checked server-side before storage.

## Security and operations

- Keep `.env` out of version control.
- Run the site behind HTTPS.
- Configure your reverse proxy/CDN to overwrite `x-real-ip`; use CDN/WAF rate limiting in addition to the in-memory form guard.
- Back up PostgreSQL regularly. The admin interface includes content exports, but database backups remain essential.
- Do not share Konnect, Resend, database, or setup credentials with template buyers outside their own deployment.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The E2E suite needs a running PostgreSQL database defined by `DATABASE_URL` and a started application (`PLAYWRIGHT_BASE_URL`, default `http://127.0.0.1:3000`).

## Selling the template

License the template for one law firm and one deployment per purchase. Hosting, branding, content entry, payment configuration, support and future custom work should be offered as separate services.
