<table align="center">
  <tr>
    <td>
      <img src="https://github.com/Privex-chat/sentinel/blob/10876a3b78636b7005dbef21938a0fe70108a6ce/assets/cropped_circle_image.png" alt="Sentinel Logo" width="220" style="vertical-align: middle;">
    </td>
    <td>
      <h1>🔌 sentinel-plugin</h1>
      <h3><em>The Sentinel dashboard — embedded directly inside Discord</em></h3>
      <p>A Vencord plugin that renders real-time behavioral analytics, timelines, and alerts without ever leaving Discord.</p>
    </td>
  </tr>
</table>

Part of the [Sentinel](https://github.com/Privex-chat/sentinel) project.
<p align="center">
  <a href="https://github.com/Privex-chat/sentinel-plugin"><img src="https://img.shields.io/github/stars/Privex-chat/sentinel-plugin?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/Privex-chat/sentinel-plugin"><img src="https://img.shields.io/github/forks/Privex-chat/sentinel-plugin?style=social" alt="GitHub forks"></a>
  <br>
  <a href="https://polyformproject.org/licenses/noncommercial/1.0.0"><img src="https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-blue" alt="License"></a>
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Project Status">
  <img src="https://img.shields.io/badge/platform-Vencord-7289DA?logo=discord&logoColor=white" alt="Platform">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" alt="TypeScript">
</p>

---

## 🧠 What It Does

The plugin adds a full **SentinelUI** panel inside Discord's native settings. From there you can:

- 📊 **Live target overview** — all tracked users with real-time status, current activity, and platform
- 🔍 **Per-target deep dives** — presence analytics, gaming stats, voice habits, message analysis, music profile, social graph
- 🕒 **Behavioral insights** — sleep schedule estimation, weekly routine heatmap, anomaly detection
- 🗑️ **Deleted & edited messages** — full message history including content preserved before deletion
- 👻 **Ghost typing stats** — messages started but never sent
- 🔔 **Alert rules** — configure per-target alert conditions and view alert history in real time
- 📰 **Daily briefs** — AI-generated intelligence summaries per target
- 🔄 **Historical backfill** — trigger and monitor channel backfill progress per target
- ⚙️ **Runtime config** — hot-swap selfbot settings without restarting
- 🖱️ **Right-click tracking** — right-click any user in Discord to instantly start or stop tracking
- 📡 **Live event feed** — real-time SSE stream shows events as they arrive

Everything is pulled from your selfbot's local API. No data is sent anywhere else.

---

## 🛡️ OPSEC Mode

OPSEC Mode removes all visible traces of Sentinel from Discord's UI — useful if you want the tool to go unnoticed:

- 🚫 **No context menu items** — "Track User" and "Stop Tracking" entries are hidden from all right-click menus
- 🏷️ **Disguise name** — the settings panel displays as "Discord Utilities" (or any name you choose) instead of "Sentinel"
- ⌨️ **Panic key** — press `Ctrl+Shift+.` to instantly close the dashboard from anywhere in Discord
- 🔇 **Generic log prefix** — all console output uses `[Plugin]` instead of `[Sentinel]`

Enable it in **Settings → Plugins → SentinelUI → OPSEC Mode**.

---

## ⚡ Quick Start

### Requirements

- **Vencord** installed in your Discord client — [vencord.dev](https://vencord.dev)
- A running [sentinel-selfbot](https://github.com/Privex-chat/sentinel-selfbot) instance

### Step 1 — Copy the plugin

```bash
git clone https://github.com/Privex-chat/sentinel-plugin.git

# Copy into Vencord's plugins directory
cp -r sentinel-plugin/Vencord/src/plugins/sentinel-ui /path/to/Vencord/src/plugins/sentinel-ui
```

**Default Vencord plugins path:**

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\Vencord\src\plugins\` |
| Linux / macOS | `~/.config/Vencord/src/plugins/` |
| Dev install | `Vencord/src/plugins/` |

On Windows (PowerShell):

```powershell
Copy-Item -Recurse sentinel-plugin\Vencord\src\plugins\sentinel-ui "$env:APPDATA\Vencord\src\plugins\sentinel-ui"
```

### Step 2 — Build Vencord

```bash
cd /path/to/Vencord
pnpm build
pnpm inject
```

### Step 3 — Enable in Discord

1. Open Discord
2. Go to **Settings → Plugins**
3. Search for **SentinelUI** and toggle it on

### Step 4 — Configure

Click the **SentinelUI** plugin name and set:

| Setting | Description |
|---------|-------------|
| **Sentinel URL** | Where your selfbot runs — default `http://localhost:48923` |
| **Sentinel Token** | Your `API_AUTH_TOKEN` from the selfbot's `.env` |
| **Enable SSE** | Keep on for real-time event streaming |
| **Dashboard Refresh Interval** | Auto-refresh rate in seconds (default 30) |
| **OPSEC Mode** | Hide all Sentinel traces from Discord's UI |
| **Disguise Name** | Name shown instead of "Sentinel" when OPSEC Mode is active |

Full setup guide: [docs/plugin.md](https://github.com/Privex-chat/sentinel/blob/main/docs/plugin.md)

---

## 📋 Plugin Tabs

### Dashboard (top-level)

| Tab | Description |
|-----|-------------|
| **Dashboard** | All tracked targets with live status, current activity, and a real-time event feed |
| **Runtime Config** | Hot-swap selfbot settings without restarting — changes apply immediately |

### Per-Target (click any target to open)

| Tab | What's in it |
|-----|-------------|
| **Overview** | Current status, activity, today's stats, anomaly flags, recent events |
| **Timeline** | Gantt chart of today's sessions + filterable, paginated event log |
| **Analytics** | Presence distribution, gaming profile, messages, voice, music, social graph |
| **Messages** | All messages, deleted messages, edited messages, ghost typing stats |
| **Profile** | Avatar history, profile change timeline, connected accounts |
| **Insights** | Sleep schedule estimate, weekly routine heatmap, anomaly feed |
| **Alerts** | Per-target alert rule configuration and alert history |
| **Briefs** | AI-generated daily intelligence summaries |
| **Backfill** | Trigger and monitor historical channel backfill progress |
| **Config** | Per-target tracking configuration |

---

## 🔗 Connecting to a Remote Selfbot

If your selfbot runs on a VPS or cloud platform:

- **[sentinel-proxy](https://github.com/Privex-chat/sentinel-proxy)** — runs locally on Windows, forwards all plugin requests (including SSE) to your remote selfbot. Handles CORS and buffering issues automatically.
- **Direct connection** — set the Sentinel URL to your server's public address. Requires correct CORS headers and reverse-proxy SSE passthrough.
- **[sentinel-web](https://github.com/Privex-chat/sentinel-web)** — browser-based alternative to the plugin, accessible from any device.

---

## 🛠️ Tech Stack

| | |
|---|---|
| **Platform** | Vencord plugin system |
| **Language** | TypeScript 5 |
| **UI** | React (via Vencord's `@webpack/common`) |
| **API transport** | REST + SSE (to sentinel-selfbot) |
| **Build** | esbuild via `pnpm build` |

---

## 🔄 Updating

```bash
cd sentinel-plugin
git pull
cp -r Vencord/src/plugins/sentinel-ui /path/to/Vencord/src/plugins/sentinel-ui
cd /path/to/Vencord && pnpm build && pnpm inject
```

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [docs/plugin.md](https://github.com/Privex-chat/sentinel/blob/main/docs/plugin.md) | Full setup, features, and troubleshooting |
| [docs/selfbot.md](https://github.com/Privex-chat/sentinel/blob/main/docs/selfbot.md) | Setting up the selfbot this plugin connects to |
| [docs/proxy.md](https://github.com/Privex-chat/sentinel/blob/main/docs/proxy.md) | Proxy setup for remote selfbot access |

---

## 🔗 Related

- [sentinel-selfbot](https://github.com/Privex-chat/sentinel-selfbot) — The data collection engine
- [sentinel-web](https://github.com/Privex-chat/sentinel-web) — Browser dashboard (no Vencord required)
- [sentinel-proxy](https://github.com/Privex-chat/sentinel-proxy) — Windows proxy for remote selfbot
- [sentinel-desktop](https://github.com/Privex-chat/sentinel-desktop) — One-click Windows installer (selfbot + dashboard)

---

## 📜 License

[PolyForm Noncommercial License 1.0.0](LICENSE)
