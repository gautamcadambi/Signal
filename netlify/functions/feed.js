/* Server-side feed reader. Runs on Netlify, so there is no browser
   cross-origin restriction and no third-party relay in the path. */
const ALLOWED = /^https?:\/\//i;

exports.handler = async (event) => {
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  const target = (event.queryStringParameters || {}).url;
  if (!target || !ALLOWED.test(target)) {
    return { statusCode: 400, headers: cors, body: "bad url" };
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const res = await fetch(target, {
      signal: ctl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SignalReader/1.0; +https://netlify.app)",
        "accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "accept-language": "en"
      }
    });
    clearTimeout(timer);
    const body = await res.text();
    if (!res.ok) {
      return { statusCode: 502, headers: cors, body: "upstream " + res.status };
    }
    return {
      statusCode: 200,
      headers: { ...cors, "content-type": "text/xml; charset=utf-8", "cache-control": "public, max-age=300" },
      body
    };
  } catch (err) {
    clearTimeout(timer);
    return { statusCode: 504, headers: cors, body: String(err && err.name === "AbortError" ? "timeout" : err) };
  }
};
