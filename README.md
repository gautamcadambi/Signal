# Signal

A finite daily feed: sport, tech, science, cars and music. It ends when the day's
news ends.

## Important: this site needs a real deploy, not drag-and-drop

Netlify's drag-and-drop deploys do not run a build, so the `netlify/functions`
folder is ignored and the site has no server side. Without it the app must borrow
a public relay to read feeds, and those are often blocked. Deploy one of the two
ways below instead.

### Option A — GitHub (recommended, updates itself)

1. Create a new repository at github.com/new. Name it `signal`. Keep it private.
2. Upload every file in this folder to it (GitHub's web uploader accepts a drag
   of the whole folder — include `netlify/functions`).
3. In Netlify: Add new site, Import an existing project, pick the repo.
   Build command: leave blank. Publish directory: `.`
4. Deploy. Future updates: replace `index.html` in GitHub and Netlify redeploys
   on its own.

### Option B — Netlify CLI (one command, needs Node on your computer)

```bash
npm install -g netlify-cli
cd signal-site
netlify deploy --prod --dir=. --functions=netlify/functions
```

### Check it worked

Open `https://YOUR-SITE.netlify.app/.netlify/functions/ping`

You should see JSON like `{"ok":true,"node":"v20...","oauth":false}`.
A 404 means functions did not deploy and you are still on a drag-and-drop deploy.

## Optional: connect your YouTube account

This lets the Music tab import the channels you already subscribe to instead of
you pasting them by hand. It is read-only.

1. Go to console.cloud.google.com and create a project.
2. APIs & Services, Library, search "YouTube Data API v3", Enable.
3. APIs & Services, OAuth consent screen:
   - User type: External
   - Fill in app name and your email
   - Scopes: add `.../auth/youtube.readonly`
   - Test users: add your own Google address
4. APIs & Services, Credentials, Create credentials, OAuth client ID:
   - Application type: Web application
   - Authorised redirect URI:
     `https://YOUR-SITE.netlify.app/.netlify/functions/yt-callback`
5. Copy the client ID and client secret.
6. In Netlify: Site configuration, Environment variables, add
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. Redeploy, then open the Music tab and press Connect YouTube.

Note: while the Google project stays in Testing mode the sign-in expires after
seven days. That does not matter much here — you connect once, press "Add all",
and the channels keep working afterwards as plain feeds with no sign-in at all.
Reconnect only when you want to re-sync your subscriptions.

## Files

- `index.html` — the whole app
- `sw.js` — offline cache (app files only; never caches feeds)
- `manifest.json`, `icon-*.png` — home-screen install
- `netlify/functions/feed.js` — server-side feed reader
- `netlify/functions/ping.js` — deployment probe
- `netlify/functions/yt-*.js` — YouTube sign-in (optional)
