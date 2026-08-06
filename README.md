# Resend Blast

Next.js app to configure Resend in the UI, upload contacts, map CSV headers, write an HTML pitch, blast a campaign, and download stats as CSV.

## Setup

1. Copy env file and fill in values:

```bash
cp .env.example .env.local
```

Required env vars:

- `MONGODB_URI` — your MongoDB connection string
- `APP_PASSWORD` — password prompted when opening the app
- `SESSION_SECRET` — long random string for login cookies

2. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Log in with `APP_PASSWORD`
2. **Settings** — paste Resend API key + from email
3. **New blast** — campaign name, subject, CSV upload, map columns (`firstname`, `lastname`, `company`, `email`), HTML body, send
4. **History** — campaign stats; open a campaign to download CSV

## Merge tags

Use in subject or HTML:

- `{{firstname}}`
- `{{lastname}}`
- `{{company}}`
- `{{email}}`
