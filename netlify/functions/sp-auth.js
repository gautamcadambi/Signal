/* Step 1: send the browser to Spotify's consent screen. */
const { origin } = require("./_shared");
const SCOPES = "user-follow-read user-top-read";

exports.handler = async (event) => {
  const id = process.env.SPOTIFY_CLIENT_ID;
  if (!id) return { statusCode: 500, body: "SPOTIFY_CLIENT_ID is not set in Netlify environment variables." };

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const url = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: origin(event) + "/.netlify/functions/sp-callback",
    scope: SCOPES,
    state,
    show_dialog: "true"
  });
  return {
    statusCode: 302,
    headers: {
      Location: url,
      "Set-Cookie": `spst=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    },
    body: ""
  };
};
