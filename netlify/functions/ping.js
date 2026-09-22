/* Deployment probe. If /.netlify/functions/ping returns JSON, functions are live. */
exports.handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" },
  body: JSON.stringify({
    ok: true,
    node: process.version,
    oauth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    time: new Date().toISOString()
  })
});
