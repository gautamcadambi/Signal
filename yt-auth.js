/* Step 1: send the browser to Google's consent screen. */
const { origin, SCOPE } = require("./_shared");

exports.handler = async (event) => {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return { statusCode: 500, body: "GOOGLE_CLIENT_ID is not set in Netlify environment variables." };

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const url = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
    client_id: id,
    redirect_uri: origin(event) + "/.netlify/functions/yt-callback",
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state
  });
  return {
    statusCode: 302,
    headers: {
      Location: url,
      "Set-Cookie": `ytstate=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    },
    body: ""
  };
};
