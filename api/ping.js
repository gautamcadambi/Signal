/* Deployment probe, same idea as the old Netlify one. */
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.status(200).send(JSON.stringify({ ok: true, node: process.version, time: new Date().toISOString() }));
};
