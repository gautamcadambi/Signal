# Signal

A finite daily feed: sport, tech, science, cars and music. It ends when the day's
news ends.

## Deploying on GitHub Pages

1. Create a repository and push everything in this folder to it (or upload via
   GitHub's web uploader — drag the whole folder in one go, not files picked
   from inside it, or the folder structure gets flattened).
2. In the repo: **Settings → Pages → Source → Deploy from a branch**.
   Branch: `main`, folder: `/ (root)`. Save.
3. GitHub gives you a URL like `https://yourname.github.io/reponame/` within
   a minute or two.
4. Open that URL on your phone, then Add to Home Screen the same way as before.

## What changed from the Netlify version

This build has no server-side component at all — GitHub Pages only serves
static files, so anything that needed a real backend (Spotify sign-in, a
private RSS relay) has been removed.

**What still works:**
- The curated (hand-written) edition, unchanged.
- Live news, pulled through public CORS-relay services directly from the
  browser. These are free third-party services and can be slower or flakier
  than a real backend — if a source shows "failed" in the gear icon's
  Sources panel, that's usually why. The custom relay field there lets you
  paste an alternative proxy if you find one that works better on your
  connection.
- YouTube artist channels in the Music tab — these never needed a server;
  YouTube publishes every channel's uploads as an open feed.

**What's gone:**
- Spotify sign-in and the "artists you follow / top artists" sections.
- The reliable own-server RSS relay that Netlify was running — live feeds
  now depend entirely on the public relays.

If reliability becomes a real problem, the fix is moving the small backend
pieces to a host that supports serverless functions on its free tier —
Vercel or Cloudflare Pages both work well and keep the GitHub-connected,
auto-deploy workflow. That's a future option, not something this build does.

## Files

- `index.html` — the whole app
- `sw.js` — offline cache (app files only; never caches feeds)
- `manifest.json`, `icon-*.png` — home-screen install
