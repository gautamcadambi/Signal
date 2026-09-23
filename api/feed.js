/* Server-side feed reader, hosted on Vercel. Called cross-origin from the
   GitHub Pages site, so it must set CORS headers itself — unlike the old
   Netlify version, which was same-origin. */
const ALLOWED = /^https?:\/\//i;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const target = req.query.url;
  if (!target || !ALLOWED.test(target)) { res.status(400).send("bad url"); return; }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(target, {
      signal: ctl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SignalReader/1.0; +https://vercel.com)",
        "accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "accept-language": "en"
      }
    });
    clearTimeout(timer);
    const body = await r.text();
    if (!r.ok) { res.status(502).send("upstream " + r.status); return; }
    res.setHeader("content-type", "text/xml; charset=utf-8");
    res.setHeader("cache-control", "public, max-age=300");
    res.status(200).send(body);
  } catch (e) {
    clearTimeout(timer);
    res.status(504).send(String(e && e.name === "AbortError" ? "timeout" : e));
  }
};
