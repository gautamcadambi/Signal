/* Step 2: swap the code for a refresh token, stored HttpOnly on your own domain. */
const { cookies, origin } = require("./_shared");

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const home = origin(event) + "/";
  if (q.error) return { statusCode: 302, headers: { Location: home + "?sp=denied" }, body: "" };
  if (!q.code)  return { statusCode: 302, headers: { Location: home + "?sp=nocode" }, body: "" };
  if (!q.state || q.state !== cookies(event).spst)
    return { statusCode: 302, headers: { Location: home + "?sp=badstate" }, body: "" };

  try {
    const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basic}` },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: q.code,
        redirect_uri: origin(event) + "/.netlify/functions/sp-callback"
      })
    });
    const j = await res.json();
    if (!j.refresh_token) return { statusCode: 302, headers: { Location: home + "?sp=norefresh" }, body: "" };
    return {
      statusCode: 302,
      headers: {
        Location: home + "?sp=ok#music",
        "Set-Cookie": `sprt=${encodeURIComponent(j.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=15552000`
      },
      body: ""
    };
  } catch (e) {
    return { statusCode: 302, headers: { Location: home + "?sp=error" }, body: "" };
  }
};
