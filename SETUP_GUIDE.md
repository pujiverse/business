# Setup guide

Goal: by the end you have **two values** to paste into the app — a *Project URL* and an *anon key*. They come from a free Supabase project that holds your data.

You only do this **once per device**. After that, the app remembers and you go straight to the dashboard.

---

## Part 1 — Create a Supabase project (5 minutes, free)

1. Go to <https://supabase.com> and click **Start your project**. Sign in with GitHub or email.
2. Click **New project**.
3. Fill in:
   - **Name** — anything, e.g. `bizmanager`
   - **Database password** — pick a strong one and save it somewhere (you won't need it for this app, but Supabase requires it)
   - **Region** — pick the closest to you
   - **Plan** — Free
4. Click **Create new project**. Wait ~1 minute while it provisions.

## Part 2 — Run the database schema

The app needs five tables. The repo ships them in `supabase-schema.sql` — you just paste and run.

1. In your new Supabase project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase-schema.sql` from this folder, copy everything, paste into the SQL editor.
4. Click **Run** (or press <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).

You should see *Success. No rows returned*. If you see a red error, scroll up — it usually says exactly which line is unhappy.

## Part 3 — Find your two credentials

1. Open **Project Settings** (gear icon, bottom-left).
2. Click **Data API**.
3. Copy **Project URL** — it looks like `https://abcdefghijkl.supabase.co`.
4. In the **API keys** section just below, find the row labelled **anon** ▸ **public**. Copy that key — it's a long `eyJ...` string.

> Why is it OK to put this key in the browser? Because the schema we ran turned on Row Level Security with a policy that lets the anon key read and write the five tables. Nothing else is exposed.
> If you ever want stricter rules (e.g. multi-user with login), edit the policies at the bottom of `supabase-schema.sql` to use `auth.uid()`.

## Part 4 — Paste into the app

1. Open the app (open `index.html` locally, or visit the GitHub Pages URL).
2. The wizard greets you with *Connect your database*.
3. Paste the **Project URL** in the first field.
4. Paste the **anon key** in the second field. Tick **Show key** to double-check.
5. Click **Test connection**. You should see a green banner: *"Connected. All five tables are reachable."*
6. Click **Save & continue**.

You'll land on the dashboard with zeros everywhere. Add a customer or an expense to see things light up.

---

## What if I'm setting up a second device (phone, work laptop, …)?

Repeat **Part 4 only**. Same URL + key on every device gives you the same data because the data lives in Supabase, not in the browser.

## What if the test connection fails?

Common causes, in order of likelihood:

| Error message contains | Fix |
| --- | --- |
| `Could not read table "customers"` | You skipped Part 2. Run the schema SQL. |
| `Invalid API key` | You pasted the *service_role* key by mistake. Use the **anon public** one. |
| `fetch failed` / `network` | Typo in the URL — make sure it ends with `.supabase.co` and has no trailing slash. |

## Changing or rotating credentials later

Open the app, go to **Settings**, click **Change connection**. Same wizard, same Test button.

To completely reset on this device, click **Disconnect this device** in Settings (or the bottom of the sidebar). Your Supabase data stays untouched.

---

## App workflow at a glance

```
First open ──► Wizard (Part 4)
              │
              ▼
            Home (dashboard)
              ├──► Customers ──► Add customer ──► Add transaction
              ├──► Expenses  ──► Add income/expense entry
              ├──► Loans     ──► New loan ──► Record payments
              ├──► Reports   ──► Print / Download CSV
              └──► Settings  ──► Bulk CSV import / Backup / Restore / Theme / Disconnect
```

That's the whole app. Six pages, one wizard, one settings screen.
