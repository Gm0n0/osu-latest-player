# osu-latest-player

An unofficial osu!-themed GitHub Pages tracker. The static site reads `player.json`; GitHub Actions periodically checks a small range of osu! user IDs and updates that JSON file.

## Important limitation

osu! API v2 provides user profiles and `join_date`, but does not document a public endpoint that lists the globally newest registered account. This project therefore scans forward from a manually supplied known user ID. It displays the newest account found in the scanned range, **not a guaranteed global newest registration**. User IDs are used as a discovery heuristic, not as proof of registration order. The scan is limited to 40 IDs per run to avoid excessive API requests.

## 1. Create an osu! API application

1. Open https://osu.ppy.sh/home/account/edit#oauth and create an OAuth application.
2. Use any application name, for example `osu-latest-player`.
3. Copy the Client ID and Client Secret.

## 2. Add GitHub repository secrets

In the `osu-latest-player` repository, open **Settings → Secrets and variables → Actions → New repository secret**.

Add:
- `OSU_CLIENT_ID`
- `OSU_CLIENT_SECRET`

Never put the client secret in `index.html`, `player.json`, or any public file.

## 3. Initialize the scan

Edit `player.json` and set `last_checked_id` to a known recent osu! user ID (a number, not a quoted string), for example:

```json
{
  "id": null,
  "username": null,
  "avatar_url": null,
  "join_date": null,
  "last_checked_id": 0,
  "updated_at": null
}
```

Replace `0` with the ID you want to start scanning after. The workflow checks the next 40 IDs each run. If you want the page to show an initial player immediately, populate `id`, `username`, `avatar_url`, and `join_date` with a verified profile too.

## 4. Enable GitHub Pages

1. Push the files to the `main` branch.
2. Open **Settings → Pages**.
3. Set **Build and deployment → Source** to **Deploy from a branch**.
4. Choose `main` and `/ (root)`, then save.

The page will be available at:

`https://YOUR-GITHUB-USERNAME.github.io/osu-latest-player/`

## 5. Enable the updater

Open **Actions**, enable workflows if prompted, then run **Update latest osu! player** manually once. It also runs on a 10-minute schedule. GitHub scheduled workflows can be delayed during busy periods.

## Notes

- `player.json` is public because GitHub Pages is public. It contains public osu! profile fields only.
- If the workflow hits an API rate limit, it fails without overwriting the existing data.
- Scheduled GitHub Actions workflows run on the default branch and may be delayed.
- This is an unofficial community project and is not affiliated with osu! or ppy Pty Ltd.
