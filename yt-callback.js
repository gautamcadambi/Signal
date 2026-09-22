/* Step 2: swap the code for a refresh token. The token never reaches the browser
   as readable script data — it goes into an HttpOnly cookie on your own domain. */
const { cookies, origin } = require("./_shared");

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const home = origin(event) + "/";
  if (q.error) return { statusCode: 302, headers: { Location: home + "?yt=denied" }, body: "" };
  if (!q.code)  return { statusCode: 302, headers: { Location: home + "?yt=nocode" }, body: "" };
  if (!q.state || q.state !== cookies(event).ytstate)
    return { statusCode: 302, headers: { Location: home + "?yt=badstate" }, body: "" };

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: q.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: origin(event) + "/.netlify/functions/yt-callback",
        grant_type: "authorization_code"
      })
    });
    const j = await res.json();
    if (!j.refresh_token) return { statusCode: 302, headers: { Location: home + "?yt=norefresh" }, body: "" };
    return {
      statusCode: 302,
      headers: {
        Location: home + "?yt=ok#music",
        "Set-Cookie": `ytrt=${encodeURIComponent(j.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=15552000`
      },
      body: ""
    };
  } catch (e) {
    return { statusCode: 302, headers: { Location: home + "?yt=error" }, body: "" };
  }
};
