/* Step 3: read the channels you subscribe to, so they can become feeds.
   Nothing is stored server-side — the channel list goes to the browser and
   lives there as plain RSS addresses that keep working without any token. */
const { cookies } = require("./_shared");
const J = (code, obj) => ({
  statusCode: code,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(obj)
});

exports.handler = async (event) => {
  if ((event.queryStringParameters || {}).logout === "1")
    return { statusCode: 200,
             headers: { "content-type": "application/json", "Set-Cookie": "ytrt=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" },
             body: JSON.stringify({ ok: true, connected: false }) };

  const rt = cookies(event).ytrt;
  if (!rt) return J(200, { connected: false });
  if (!process.env.GOOGLE_CLIENT_ID) return J(500, { error: "GOOGLE_CLIENT_ID is not set" });

  try {
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: rt,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token"
      })
    });
    const tj = await tr.json();
    if (!tj.access_token) return J(200, { connected: false, expired: true, detail: tj.error || "token refused" });

    const items = [];
    let page = "";
    for (let i = 0; i < 5; i++) {
      const u = "https://www.googleapis.com/youtube/v3/subscriptions?" + new URLSearchParams({
        part: "snippet", mine: "true", maxResults: "50", order: "alphabetical", ...(page ? { pageToken: page } : {})
      });
      const r = await fetch(u, { headers: { authorization: "Bearer " + tj.access_token } });
      const j = await r.json();
      if (j.error) return J(200, { connected: true, error: j.error.message });
      (j.items || []).forEach(it => {
        const s = it.snippet || {};
        const cid = s.resourceId && s.resourceId.channelId;
        if (cid) items.push({
          channelId: cid,
          title: s.title || cid,
          thumb: (((s.thumbnails || {}).default) || {}).url || ""
        });
      });
      page = j.nextPageToken || "";
      if (!page) break;
    }
    return J(200, { connected: true, count: items.length, items });
  } catch (e) {
    return J(500, { error: String(e) });
  }
};
