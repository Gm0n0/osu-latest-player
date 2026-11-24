const fs = require("node:fs/promises");

const clientId = process.env.OSU_CLIENT_ID;
const clientSecret = process.env.OSU_CLIENT_SECRET;
if (!clientId || !clientSecret) throw new Error("Missing OSU_CLIENT_ID or OSU_CLIENT_SECRET secrets.");

const file = "player.json";
const state = JSON.parse(await fs.readFile(file, "utf8"));
if (!Number.isInteger(state.last_checked_id) || state.last_checked_id < 1) {
  throw new Error("Initialize player.json: set last_checked_id to a known recent osu! user ID.");
}

async function getToken() {
  const response = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: {"Content-Type":"application/json","Accept":"application/json"},
    body: JSON.stringify({
      client_id: Number(clientId),
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "public"
    })
  });
  if (!response.ok) throw new Error(`osu! OAuth failed: HTTP ${response.status}`);
  return (await response.json()).access_token;
}

const token = await getToken();
let latest = state.id ? {
  id: state.id, username: state.username,
  avatar_url: state.avatar_url, join_date: state.join_date
} : null;

const start = state.last_checked_id + 1;
const batchSize = 40;
let lastChecked = state.last_checked_id;
let found = 0;

for (let id = start; id < start + batchSize; id++) {
  const response = await fetch(`https://osu.ppy.sh/api/v2/users/${id}/osu`, {
    headers: {Authorization: `Bearer ${token}`, Accept: "application/json"}
  });

  if (response.status === 404) {
    lastChecked = id;
    continue;
  }
  if (response.status === 429) throw new Error("osu! API rate limit reached. Try again on the next scheduled run.");
  if (!response.ok) throw new Error(`osu! API returned HTTP ${response.status} for user ${id}.`);

  const user = await response.json();
  lastChecked = id;
  found++;

  if (!latest || new Date(user.join_date) > new Date(latest.join_date)) {
    latest = {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      join_date: user.join_date
    };
  }
}

if (!latest) {
  throw new Error("No valid user has been discovered. Check your starting ID.");
}

const updated = {
  ...latest,
  last_checked_id: lastChecked,
  updated_at: new Date().toISOString(),
  discovery_note: "Latest account found in the scanned ID range; this is not a guaranteed global newest-user feed."
};
await fs.writeFile(file, JSON.stringify(updated, null, 2) + "\n");
console.log(`Checked IDs ${start}-${lastChecked}; valid accounts found: ${found}; latest discovered: ${latest.username} (#${latest.id}).`);
