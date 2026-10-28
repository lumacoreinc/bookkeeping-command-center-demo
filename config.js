// Everything the team is likely to change lives here, not in app.js.
window.DASHBOARD_CONFIG = {
  firmName: "Northpoint Ledger Partners",
  officeName: "South Shore Office",
  ownerName: "Erin Walsh",
  periodLabel: "September 2026",
  periodEnd: "2026-09-30",
  asOf: "2026-10-28",

  // Leave blank to use the bundled demo data in data/control-sheet.js.
  // To go live, point these at CSV exports of the control sheet's tabs
  // (see README: never use "Publish to web" for real client data).
  sheetCsvUrl: "",
  todosCsvUrl: "",

  // The "checks and balances". Each rule turns a column into a pass / warn / critical.
  rules: {
    recLagDays: { warn: 1, critical: 45 },        // days a reconciliation is behind period end
    uncategorized: { warn: 20, critical: 75 },    // uncategorized bank/CC transactions
    amaBalance: { warn: 1, critical: 2500 },      // Ask My Accountant balance ($)
    undeposited: { warn: 2500, critical: 7500 },  // Undeposited Funds ($)
    arOver90Pct: { warn: 0.15, critical: 0.3 },   // share of AR older than 90 days
    noTouchDays: { warn: 30, critical: 45 },      // days since last logged client touch (HubSpot)
    revenueDropPct: 0.15                          // advisory flag when revenue falls this much vs prior month
  }
};
