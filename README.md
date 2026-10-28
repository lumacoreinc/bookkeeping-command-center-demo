# Office Command Center (demo)

A sample command center for a multi-manager bookkeeping office: one dashboard with a filter for each FOM (field office manager) and a "Whole office" view for the owner. All firm, client and staff names and numbers are fictional.

Built as the Claude Code demo for the Lumacore AI training.

## What it shows

- **KPIs**: clients, % closed, overdue closes, clients with critical flags, open to-dos, monthly fees
- **Needs attention today**: one line per client, worst problem first
- **Close progress** and a **scorecard** (by FOM in the whole-office view, by accountant in an FOM view)
- **Clients table** with filters (critical, overdue, package not sent, advisory) and sortable columns
- **Client detail**: every check and balance, the month's numbers, notes, to-dos
- **To-dos**: assign, check off
- **Morning brief**: plain-text summary of the current view, ready to paste into an email or Slack

## How it's put together

| File | What it is |
|---|---|
| `data/control-sheet.js` | The client control sheet (one row per client per close) and the to-do tab, as CSV |
| `config.js` | Firm name, close period, and the **rules** that decide what's a warning or critical |
| `app.js` | Reads the data, runs the checks, draws the page |
| `index.html`, `styles.css` | Layout and look |

To change what counts as a problem (for example, flag uncategorized transactions at 10 instead of 20), edit `rules` in `config.js`. No other code changes needed.

## Run it

Open `index.html` in a browser. No install, no build step.

## Going live (the training path)

1. **Data**: keep the real control sheet in Google Sheets with the same column names as `data/control-sheet.js`. Claude fills it during close (QuickBooks health check skill, HubSpot pull); accountants update status.
2. **Hosting inside the firm's Google Workspace**: serve this page from a Google Apps Script web app restricted to the firm's domain, reading the sheet directly. Client data never leaves Google.
3. **Do not** use Google Sheets "Publish to web" or a public GitHub Pages site for real client data. Both make the data public.
4. To-dos in this demo save only in the viewer's browser. The live version writes them back to the sheet's to-do tab.
