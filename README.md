# Academic Proofread Studio

A GitHub Pages-ready static web app for academic proofreading, manuscript-readiness checking, project tracking, manual payment confirmation, invoice/receipt generation, and proofread passport reporting.

## Owner

**Dr. Joko Slamet**  
Email: jokoslamet@cwcu.ac.id  
WhatsApp: +6282338202233

## Admin Access

Admin PIN: `JS2026`

## Payment Account

- BCA: `0183188531` a.n. Joko Slamet
- Mandiri: `1410025957408` a.n. Joko Slamet
- WhatsApp confirmation: `+6282338202233`
- Email confirmation: `jokoslamet@cwcu.ac.id`

## Included Features

- Executive landing page and service overview
- Client/project dashboard
- Create project with complete metadata
- Package selection and price calculation
- Proofreading workspace with scoring and academic suggestions
- Tracking results and revision history
- Payment confirmation flow
- Invoice and receipt generator
- Signature with official overlapping stamp on invoice, receipt, and report
- Proofread Passport final report
- Admin panel for payment verification, completion, and package settings
- Export/import backup JSON
- Browser print/save PDF support

## Recommended Default Pricing

- Basic Proofread: Rp 500.000, up to 1,000 words
- Academic Proofread: Rp 1.000.000, up to 2,500 words
- Manuscript Readiness: Rp 1.750.000, article draft 4,000–6,000 words
- Premium Academic Review: Rp 2.500.000, full manuscript + expert note

## GitHub Pages Deployment

1. Unzip this package.
2. Create a new GitHub repository, for example `Academic-Proofread-Studio`.
3. Upload the full contents of the unzipped folder to the repository root. The root must contain `index.html`, `styles.css`, `app.js`, `manifest.json`, and the `assets` folder.
4. Commit the files to the `main` branch.
5. Open repository **Settings**.
6. Go to **Pages**.
7. Under **Build and deployment**, choose **Deploy from a branch**.
8. Select branch **main** and folder **/ root**.
9. Click **Save**.
10. Wait until GitHub finishes deployment. The public link will appear in the Pages section.

## Important Payment Note

This version uses manual transfer and manual admin verification. Automated QRIS, Midtrans, Xendit, or PayPal confirmation requires a secure backend/server because payment gateway secret keys must not be stored in public GitHub Pages files.

## Data Storage Note

The static version stores project data in the browser's local storage. For production with real users, migrate data to a secure backend database with authentication, access control, and regular backups.

## Copyright

Copyright © Dr. Joko Slamet. Academic Proofread Studio.
