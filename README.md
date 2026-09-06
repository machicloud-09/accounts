# BFS Lending Ledger

A password-protected loan/interest tracker with an Admin role (add, edit,
delete entries, send WhatsApp reminders, manage passwords) and a View Only
role (read-only, can still send reminders).

## Folder structure

```
lending-ledger/
├── index.html              ← stable app shell, versioned in git
├── assets/
│   ├── css/styles.css       ← all styling
│   └── js/
│       ├── state.js         ← shared variables (loaded first)
│       ├── api.js           ← talks to the PHP backend
│       ├── calc.js          ← interest/date math, formatting
│       ├── gate.js          ← login screen logic
│       ├── render.js        ← table / mobile cards / chart / filter+sort
│       ├── entries.js       ← add / edit / delete / reminders
│       ├── passwords.js     ← in-app password management
│       ├── export.js        ← CSV export, JSON backup/import
│       └── app.js           ← small bootstrap, loaded last
├── api/
│   ├── data.php             ← reads/writes data/entries.json
│   └── passwords.php        ← reads/writes data/passwords.json
├── seed/
│   └── seed-data.json       ← template used only on first run
├── data/                    ← LIVE DATA — gitignored, not versioned
│   └── .gitkeep
├── .gitignore
└── README.md
```

**Why this split matters for `git pull`:** everything under `data/` is
listed in `.gitignore`, so your live entries and passwords are never part
of a commit. Pulling new code will update `index.html`, `assets/`, and
`api/` cleanly — it will never touch `data/entries.json` or
`data/passwords.json`, so there's nothing there to merge-conflict on.

## Requirements

This needs a **PHP-enabled web server** (Apache with mod_php, or PHP-FPM +
nginx — most shared hosting and a stock `/var/www/html` Apache setup
already have this). It will **not** work if you just open `index.html`
directly as a `file://` URL, because the browser can't call `api/data.php`
that way — it needs to go through a real HTTP server.

## Deploying to `/var/www/html`

1. Copy the whole `lending-ledger/` folder contents into `/var/www/html/`
   (or clone your git repo there directly).
2. Make sure the `data/` folder is writable by the web server user:
   ```bash
   sudo chown -R www-data:www-data /var/www/html/data
   sudo chmod 775 /var/www/html/data
   ```
   (Use the actual user your web server runs as — `www-data` on
   Debian/Ubuntu Apache, `apache` or `nginx` on RHEL-based systems.)
3. Confirm PHP is enabled: `php -v` and check your Apache/nginx config
   has PHP handling wired up.
4. Visit the site. On first load, `api/data.php` and `api/passwords.php`
   will auto-create `data/entries.json` (seeded from `seed/seed-data.json`)
   and `data/passwords.json` (with the defaults below) the first time
   they're requested.

## Default passwords (change these immediately)

| Purpose | Default |
|---|---|
| Admin login | `admin123` |
| View Only login | `view123` |
| Delete / Import confirmation | `delete123` |

Change them from inside the app: **Admin → 🔑 Change Password**. This
writes straight to `data/passwords.json` — no code editing, no redeploy.

## Security notes (read before exposing this publicly)

- Passwords are stored in **plain text** JSON on the server. This is fine
  for a small private/internal deployment but is not strong security.
  Ideally keep `data/` outside the public web root, or block direct HTTP
  access to `/data/` and `/seed/` via your server config (e.g. an Apache
  `<Directory>` deny rule or an nginx `location` block), since PHP only
  needs filesystem access to those folders, not HTTP access.
- There's no rate-limiting on login attempts. If you expose this to the
  internet rather than a private network, consider adding basic auth or
  an IP allowlist at the server level as a second layer.
- `data/passwords.json` and `data/entries.json` contain sensitive
  financial data — make sure your server's directory listing is disabled
  (`Options -Indexes` in Apache) so these files can't be browsed directly
  even if someone guesses the path.

## Updating the app via `git pull`

```bash
cd /var/www/html
git pull
```

Because `data/` is gitignored, this only ever updates `index.html`,
`assets/`, `api/`, and `seed/` — your live ledger data and passwords are
completely untouched and can never cause a merge conflict.
