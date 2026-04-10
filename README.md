# sentinel-plugin

> Vencord plugin that renders the Sentinel dashboard directly inside Discord's settings panel. Real-time behavioral analytics, timelines, and alerts — without leaving Discord.

Part of the [Sentinel](https://github.com/Privex-chat/sentinel) project.

---

## What It Does

The plugin adds a **SentinelUI** panel inside Discord's settings. From there you can:

- See all your tracked targets with their live status, current activity, and what they're doing right now
- Click any target for a full breakdown: presence timeline, gaming stats, message patterns, voice habits, music taste, sleep schedule estimate, weekly routine heatmap, social connections, and detected behavioral anomalies
- Read deleted and edited messages
- Set alert rules and get notified in real time when something happens
- Right-click any user to instantly start or stop tracking them
- View a live feed of all incoming events as they happen

Everything is pulled from your selfbot's API. No data is sent anywhere else.

---

## Requirements

- **Vencord** installed in your Discord client — [vencord.dev](https://vencord.dev)
- A running [sentinel-selfbot](https://github.com/Privex-chat/sentinel-selfbot) instance

---

## Installation

### Step 1 — Copy the plugin

```bash
git clone https://github.com/Privex-chat/sentinel-plugin.git

# Copy into Vencord's plugins directory
cp -r sentinel-plugin/plugins/sentinel-ui /path/to/Vencord/src/plugins/sentinel-ui
```

**Default Vencord plugins path:**
- Windows: `%APPDATA%\Vencord\src\plugins\`
- Linux/macOS: `~/.config/Vencord/src/plugins/`

### Step 2 — Build Vencord

```bash
cd /path/to/Vencord
pnpm build
```

### Step 3 — Enable in Discord

1. Open Discord
2. **Settings → Plugins**
3. Search for **SentinelUI** and toggle it on

### Step 4 — Configure

Click the plugin name and set:
- **Sentinel URL** — where your selfbot runs (e.g., `http://localhost:48923`)
- **Sentinel Token** — your `API_AUTH_TOKEN` from the selfbot's `.env`
- **Enable SSE** — keep this on for real-time updates

Full setup guide: [docs/plugin.md](https://github.com/Privex-chat/sentinel/blob/main/docs/plugin.md)

---

## Plugin Tabs

| Tab | Description |
|-----|-------------|
| Overview | Live status, current activity, today's stats, anomalies |
| Timeline | Session Gantt chart + filterable event log |
| Analytics | Presence, gaming, messages, voice, music, social graph |
| Messages | All messages, deleted, edited, ghost typing stats |
| Profile | Avatar gallery, profile change timeline |
| Insights | Sleep schedule, weekly routine, anomaly feed |
| Alerts | Alert rule configuration and history |

---

## Connecting to a Remote Selfbot

If your selfbot runs on a VPS or cloud platform, you'll need the [sentinel-proxy](https://github.com/Privex-chat/sentinel-proxy) running locally on Windows, or set the Sentinel URL directly to your server's public address.

Alternatively, use [sentinel-web](https://github.com/Privex-chat/sentinel-web) to access your data from any browser.

---

## Updating

```bash
cd sentinel-plugin
git pull
cp -r plugins/sentinel-ui /path/to/Vencord/src/plugins/sentinel-ui
cd /path/to/Vencord && pnpm build
```

---

## Related

- [sentinel-selfbot](https://github.com/Privex-chat/sentinel-selfbot) — The data collection engine
- [sentinel-web](https://github.com/Privex-chat/sentinel-web) — Browser dashboard (no Vencord required)
- [sentinel-proxy](https://github.com/Privex-chat/sentinel-proxy) — Windows proxy for remote selfbot

---

## License

[PolyForm Noncommercial License 1.0.0](LICENSE)
