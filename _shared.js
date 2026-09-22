exports.cookies = (event) => {
  const raw = (event.headers && (event.headers.cookie || event.headers.Cookie)) || "";
  const out = {};
  raw.split(";").forEach(p => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
};
exports.origin = (event) => {
  const host = (event.headers && (event.headers["x-forwarded-host"] || event.headers.host)) || "";
  return "https://" + host;
};
exports.SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
