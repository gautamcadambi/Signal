/* Step 3: read followed + top artists, then each artist's newest releases.
   Nothing is stored server-side — the result goes straight to the browser. */
const { cookies } = require("./_shared");
const J = (code, obj) => ({
  statusCode: code,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(obj)
});

async function refreshToken(rt) {
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basic}` },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: rt })
  });
  return r.json();
}
async function spGet(url, token) {
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return r.json();
}
async function fetchAllFollowed(token) {
  const out = [];
  let after = "";
  for (let i = 0; i < 3; i++) {
    const u = "https://api.spotify.com/v1/me/following?type=artist&limit=50" + (after ? `&after=${after}` : "");
    const j = await spGet(u, token);
    if (!j || !j.artists) break;
    (j.artists.items || []).forEach(a => out.push({ id: a.id, name: a.name, image: (a.images && a.images[0] && a.images[0].url) || "" }));
    after = j.artists.cursors && j.artists.cursors.after;
    if (!after) break;
  }
  return out;
}
async function fetchTop(token) {
  const j = await spGet("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50", token);
  if (!j || !j.items) return [];
  return j.items.map(a => ({ id: a.id, name: a.name, image: (a.images && a.images[0] && a.images[0].url) || "" }));
}
function isoDate(d) {
  if (!d) return new Date(0).toISOString();
  if (d.length === 4) return new Date(d + "-01-01").toISOString();
  if (d.length === 7) return new Date(d + "-01").toISOString();
  return new Date(d).toISOString();
}
async function releasesFor(artist, token, source) {
  const j = await spGet(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&market=US&limit=3`, token);
  if (!j || !j.items) return [];
  return j.items.map(al => ({
    id: "sp:" + al.id,
    artist: artist.name,
    title: al.name,
    type: al.album_type === "single" ? "Single" : "Album",
    date: isoDate(al.release_date),
    url: (al.external_urls && al.external_urls.spotify) || "#",
    img: (al.images && al.images[0] && al.images[0].url) || artist.image || "",
    source
  }));
}
function recent(items, days) {
  const cut = Date.now() - days * 86400000;
  return items.filter(r => new Date(r.date).getTime() >= cut);
}
async function batched(list, fn, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(...(await Promise.all(list.slice(i, i + size).map(fn))).flat());
  }
  return out;
}

exports.handler = async (event) => {
  if ((event.queryStringParameters || {}).logout === "1")
    return { statusCode: 200,
             headers: { "content-type": "application/json", "Set-Cookie": "sprt=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" },
             body: JSON.stringify({ ok: true, connected: false }) };

  const rt = cookies(event).sprt;
  if (!rt) return J(200, { connected: false });
  if (!process.env.SPOTIFY_CLIENT_ID) return J(500, { error: "SPOTIFY_CLIENT_ID is not set" });

  try {
    const tok = await refreshToken(rt);
    if (!tok.access_token) return J(200, { connected: false, expired: true, detail: tok.error || "token refused" });

    const [followed, top] = await Promise.all([ fetchAllFollowed(tok.access_token), fetchTop(tok.access_token) ]);
    const followedCap = followed.slice(0, 15);
    const topCap = top.slice(0, 15);

    const [followedReleasesRaw, topReleasesRaw] = await Promise.all([
      batched(followedCap, a => releasesFor(a, tok.access_token, "followed"), 6),
      batched(topCap, a => releasesFor(a, tok.access_token, "top"), 6)
    ]);

    const followedReleases = recent(followedReleasesRaw, 45).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 25);
    const topReleases = recent(topReleasesRaw, 45).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 25);

    return J(200, {
      connected: true,
      followed: followed.map(a => ({ id: a.id, name: a.name, image: a.image })),
      top: top.map(a => ({ id: a.id, name: a.name, image: a.image })),
      releases: [...followedReleases, ...topReleases]
    });
  } catch (e) {
    return J(500, { error: String(e) });
  }
};
