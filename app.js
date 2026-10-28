(function () {
  "use strict";

  const CFG = window.DASHBOARD_CONFIG;
  const R = CFG.rules;
  const SEV = { critical: 3, warn: 2, advisory: 1, pass: 0 };
  const SEV_LABEL = { critical: "Critical", warn: "Warning", advisory: "Advisory", pass: "OK" };
  const STATUSES = [
    { name: "Not started", cls: "st-not" },
    { name: "In progress", cls: "st-prog" },
    { name: "In review", cls: "st-rev" },
    { name: "Closed", cls: "st-closed" }
  ];
  const NUMERIC = ["monthly_fee", "uncategorized", "ama_balance", "undeposited", "ar_total", "ar_over_90",
    "revenue", "revenue_prior", "net_income", "cash"];
  const STORE_KEY = "cc-demo-todos-v1";
  const ATTENTION_LIMIT = 8;

  const state = {
    view: "All",
    chip: "all",
    search: "",
    sort: { key: "severity", dir: -1 },
    showAllAttention: false,
    clients: [],
    todos: []
  };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- dates & formatting ----------
  const toDate = (s) => (s ? new Date(s + "T00:00:00Z") : null);
  const daysBetween = (later, earlier) => Math.round((later - earlier) / 86400000);
  const AS_OF = toDate(CFG.asOf);
  const PERIOD_END = toDate(CFG.periodEnd);
  const fmtDate = (d) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "—");
  const fmtMoney = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  const fmtK = (n) => {
    const a = Math.abs(n);
    const s = a >= 1000 ? "$" + (a / 1000).toFixed(a >= 100000 ? 0 : 1) + "k" : "$" + Math.round(a);
    return (n < 0 ? "-" : "") + s;
  };
  const pct = (n) => Math.round(n * 100) + "%";

  // ---------- data ----------
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field);
    if (row.some((v) => v.trim())) rows.push(row);
    const head = rows.shift().map((h) => h.trim());
    return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }

  async function loadText(url, fallback) {
    if (!url) return fallback;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load " + url + " (" + res.status + ")");
    return res.text();
  }

  function normalizeClient(row) {
    const c = Object.assign({}, row);
    NUMERIC.forEach((k) => { c[k] = Number(c[k]) || 0; });
    ["close_due", "bank_rec_through", "cc_rec_through", "last_touch"].forEach((k) => { c[k] = toDate(c[k]); });
    c.package_sent = c.package_sent.toUpperCase() === "Y";
    c.checks = evaluate(c);
    c.issues = c.checks.filter((k) => k.status !== "pass");
    c.severity = c.checks.reduce((m, k) => Math.max(m, SEV[k.status]), 0);
    c.overdue = c.close_status !== "Closed" && daysBetween(AS_OF, c.close_due) > 0;
    c.revChange = c.revenue_prior ? (c.revenue - c.revenue_prior) / c.revenue_prior : 0;
    return c;
  }

  // ---------- checks & balances ----------
  function level(value, rule) {
    if (value >= rule.critical) return "critical";
    if (value >= rule.warn) return "warn";
    return "pass";
  }

  function evaluate(c) {
    const checks = [];
    const add = (status, label, detail) => checks.push({ status, label, detail });

    if (c.close_status === "Closed") {
      add("pass", "Close", "Closed for " + CFG.periodLabel);
    } else {
      const late = daysBetween(AS_OF, c.close_due);
      if (late > 0) add("critical", "Close overdue", c.close_status + " · due " + fmtDate(c.close_due) + " (" + late + " days late)");
      else add("pass", "Close on track", c.close_status + " · due " + fmtDate(c.close_due));
    }

    [["Bank reconciliation", c.bank_rec_through], ["Credit card reconciliation", c.cc_rec_through]].forEach(([label, d]) => {
      const lag = d ? daysBetween(PERIOD_END, d) : 999;
      const st = level(lag, R.recLagDays);
      add(st, label, st === "pass" ? "Reconciled through " + fmtDate(d) : "Only through " + fmtDate(d) + " (" + lag + " days behind)");
    });

    const unc = level(c.uncategorized, R.uncategorized);
    add(unc, "Uncategorized transactions", c.uncategorized ? c.uncategorized + " waiting to be categorized" : "None");

    const ama = level(c.ama_balance, R.amaBalance);
    add(ama, "Ask My Accountant", c.ama_balance ? fmtMoney(c.ama_balance) + " sitting in AMA" : "Zero balance");

    const und = level(c.undeposited, R.undeposited);
    add(und, "Undeposited funds", c.undeposited ? fmtMoney(c.undeposited) + " not yet deposited" : "Zero balance");

    if (c.ar_total > 0) {
      const share = c.ar_over_90 / c.ar_total;
      const st = level(share, R.arOver90Pct);
      add(st, "AR over 90 days", fmtMoney(c.ar_over_90) + " (" + pct(share) + " of " + fmtMoney(c.ar_total) + ")");
    }

    if (c.close_status === "Closed") {
      add(c.package_sent ? "pass" : "warn", "Financial package", c.package_sent ? "Sent to client" : "Closed but package not sent");
    }

    const touch = c.last_touch ? daysBetween(AS_OF, c.last_touch) : 999;
    const tl = level(touch, R.noTouchDays);
    add(tl, "Client contact", "Last touch " + fmtDate(c.last_touch) + " (" + touch + " days ago)");

    if (c.hubspot_health === "Red") add("warn", "HubSpot health", "Marked Red in HubSpot");

    const change = c.revenue_prior ? (c.revenue - c.revenue_prior) / c.revenue_prior : 0;
    if (change <= -R.revenueDropPct) add("advisory", "Revenue drop", "Down " + pct(-change) + " vs prior month · advisory call");
    if (c.net_income < 0) add("advisory", "Net loss", fmtMoney(c.net_income) + " for the month · review margins");

    return checks;
  }

  // ---------- to-dos (base data + this browser's changes) ----------
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { status: {}, added: [] }; }
    catch (e) { return { status: {}, added: [] }; }
  }
  function writeStore(store) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage blocked: changes last until reload */ }
  }
  let store = readStore();

  function buildTodos(base) {
    return base.concat(store.added).map((t) => Object.assign({}, t, {
      status: store.status[t.id] || t.status,
      dueDate: toDate(t.due)
    }));
  }

  // ---------- selectors ----------
  const foms = () => Array.from(new Set(state.clients.map((c) => c.fom)));
  const inView = (c) => state.view === "All" || c.fom === state.view;
  const viewClients = () => state.clients.filter(inView);
  const clientById = (id) => state.clients.find((c) => c.client_id === id);
  const viewTodos = () => state.todos.filter((t) => {
    const c = clientById(t.client_id);
    return c && inView(c);
  });

  // ---------- render ----------
  function render() {
    renderHeader();
    renderViews();
    renderKPIs();
    renderAttention();
    renderProgress();
    renderScorecard();
    renderChips();
    renderClients();
    renderTodos();
  }

  function renderHeader() {
    $("#firm").textContent = CFG.firmName + " · " + (state.view === "All" ? "Office Command Center" : state.view);
    $("#subtitle").textContent = CFG.officeName + " · " + CFG.periodLabel + " close · data as of " +
      AS_OF.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    document.title = state.view === "All" ? "Office Command Center" : state.view + " · FOM Dashboard";
  }

  function renderViews() {
    const views = ["All"].concat(foms());
    $("#views").innerHTML = views.map((v) => {
      const crit = state.clients.filter((c) => (v === "All" || c.fom === v) && c.severity === 3).length;
      const label = v === "All" ? "Whole office" : v;
      return '<button class="view-btn" data-view="' + esc(v) + '" aria-pressed="' + (state.view === v) + '">' +
        esc(label) + (crit ? '<span class="badge">' + crit + "</span>" : "") + "</button>";
    }).join("");
  }

  function renderKPIs() {
    const cs = viewClients();
    const closed = cs.filter((c) => c.close_status === "Closed").length;
    const overdue = cs.filter((c) => c.overdue).length;
    const critical = cs.filter((c) => c.severity === 3).length;
    const todos = viewTodos().filter((t) => t.status !== "Done");
    const lateTodos = todos.filter((t) => t.dueDate && t.dueDate < AS_OF).length;
    const fees = cs.reduce((s, c) => s + c.monthly_fee, 0);
    const packagesOut = cs.filter((c) => c.close_status === "Closed" && !c.package_sent).length;

    const tiles = [
      { label: "Clients", value: cs.length, hint: state.view === "All" ? foms().length + " FOMs" : uniq(cs.map((c) => c.accountant)).length + " accountants" },
      { label: "Closed", value: pct(cs.length ? closed / cs.length : 0), hint: closed + " of " + cs.length + " for " + CFG.periodLabel.split(" ")[0], cls: closed === cs.length ? "good" : "" },
      { label: "Overdue closes", value: overdue, hint: "past their due date", cls: overdue ? "bad" : "good" },
      { label: "Critical flags", value: critical, hint: "clients needing action", cls: critical ? "bad" : "good" },
      { label: "Open to-dos", value: todos.length, hint: lateTodos + " past due", cls: lateTodos ? "bad" : "" },
      { label: "Monthly fees", value: fmtK(fees), hint: packagesOut + " packages not sent" }
    ];
    $("#kpis").innerHTML = tiles.map((t) =>
      '<div class="kpi ' + (t.cls || "") + '"><div class="label">' + t.label + '</div><div class="value">' + esc(t.value) +
      '</div><div class="hint">' + esc(t.hint) + "</div></div>").join("");
  }

  function renderAttention() {
    // One line per client, worst problem first, so the list reads as "who do I chase".
    const items = viewClients()
      .filter((c) => c.issues.length)
      .map((c) => ({ c, issues: c.issues.slice().sort((a, b) => SEV[b.status] - SEV[a.status]) }))
      .sort((a, b) => b.c.severity - a.c.severity ||
        b.issues.filter((k) => k.status === "critical").length - a.issues.filter((k) => k.status === "critical").length ||
        b.issues.length - a.issues.length);
    const shown = state.showAllAttention ? items : items.slice(0, ATTENTION_LIMIT);
    const total = items.reduce((s, x) => s + x.issues.length, 0);
    $("#attentionCount").textContent = items.length + " clients · " + total + " open items";
    $("#attention").innerHTML = shown.length ? shown.map(({ c, issues }) => {
      const top = issues[0];
      const sev = Object.keys(SEV).find((k) => SEV[k] === c.severity);
      const rest = issues.slice(1).map((k) => k.label).join(" · ");
      return '<li data-client="' + c.client_id + '" tabindex="0">' +
        '<span class="sev ' + sev + '">' + SEV_LABEL[sev] + "</span>" +
        '<div><div class="what">' + esc(c.client) + '</div><div class="detail"><strong>' + esc(top.label) + ":</strong> " + esc(top.detail) +
        (rest ? '<br>Also: ' + esc(rest) : "") + "</div></div>" +
        '<div class="who">' + esc(c.accountant) + (state.view === "All" ? "<br>" + esc(c.fom) : "") + "</div></li>";
    }).join("")
      : '<li class="empty">Nothing needs attention. Every check passes.</li>';
    const more = $("#attentionMore");
    more.hidden = items.length <= ATTENTION_LIMIT;
    more.textContent = state.showAllAttention ? "Show fewer" : "Show all " + items.length;
  }

  function renderProgress() {
    const cs = viewClients();
    const counts = STATUSES.map((s) => ({ s, n: cs.filter((c) => c.close_status === s.name).length }));
    $("#progressLabel").textContent = CFG.periodLabel;
    $("#progress").innerHTML =
      '<div class="bar" role="img" aria-label="' + counts.map((x) => x.n + " " + x.s.name).join(", ") + '">' +
      counts.filter((x) => x.n).map((x) => '<span class="' + x.s.cls + '" style="flex:' + x.n + '" title="' + x.s.name + ": " + x.n + '"></span>').join("") +
      '</div><div class="legend">' + counts.map((x) => '<span><i class="' + x.s.cls + '"></i>' + x.s.name + " · " + x.n + "</span>").join("") + "</div>";
  }

  function renderScorecard() {
    const byFom = state.view === "All";
    const key = byFom ? "fom" : "accountant";
    $("#scorecardTitle").textContent = byFom ? "FOM scorecard" : "Team scorecard";
    const groups = uniq(viewClients().map((c) => c[key]));
    const rows = groups.map((g) => {
      const cs = viewClients().filter((c) => c[key] === g);
      const closed = cs.filter((c) => c.close_status === "Closed").length;
      const openTodos = state.todos.filter((t) => t.status !== "Done" && (byFom ? (clientById(t.client_id) || {}).fom === g : t.owner === g)).length;
      return {
        g, n: cs.length, closed,
        overdue: cs.filter((c) => c.overdue).length,
        crit: cs.filter((c) => c.severity === 3).length,
        warn: cs.filter((c) => c.severity === 2).length,
        todos: openTodos,
        fees: cs.reduce((s, c) => s + c.monthly_fee, 0)
      };
    });
    $("#scorecard").innerHTML =
      "<thead><tr><th>" + (byFom ? "FOM" : "Accountant") + '</th><th class="num">Clients</th><th>Closed</th><th class="num">Overdue</th>' +
      '<th class="num">Critical</th><th class="num hide-sm">Warnings</th><th class="num hide-sm">To-dos</th><th class="num hide-sm">Fees</th></tr></thead><tbody>' +
      rows.map((r) =>
        "<tr" + (byFom ? ' data-view="' + esc(r.g) + '"' : "") + "><td>" + esc(r.g) + '</td><td class="num">' + r.n + "</td>" +
        '<td class="num">' + r.closed + "/" + r.n + '<span class="mini-bar"><span style="width:' + Math.round((r.closed / r.n) * 100) + '%"></span></span></td>' +
        '<td class="num' + (r.overdue ? " late" : "") + '">' + r.overdue + "</td>" +
        '<td class="num' + (r.crit ? " late" : "") + '">' + r.crit + '</td><td class="num hide-sm">' + r.warn + '</td><td class="num hide-sm">' + r.todos +
        '</td><td class="num hide-sm">' + fmtK(r.fees) + "</td></tr>").join("") + "</tbody>";
  }

  const CHIPS = [
    { id: "all", label: "All", test: () => true },
    { id: "critical", label: "Critical", test: (c) => c.severity === 3 },
    { id: "flagged", label: "Any flag", test: (c) => c.severity >= 2 },
    { id: "overdue", label: "Overdue", test: (c) => c.overdue },
    { id: "nopackage", label: "Package not sent", test: (c) => c.close_status === "Closed" && !c.package_sent },
    { id: "advisory", label: "Advisory", test: (c) => c.issues.some((k) => k.status === "advisory") },
    { id: "closed", label: "Closed", test: (c) => c.close_status === "Closed" }
  ];

  function renderChips() {
    $("#chips").innerHTML = CHIPS.map((ch) => {
      const n = viewClients().filter(ch.test).length;
      return '<button class="chip" data-chip="' + ch.id + '" aria-pressed="' + (state.chip === ch.id) + '">' + ch.label + " · " + n + "</button>";
    }).join("");
  }

  const COLUMNS = [
    { key: "client", label: "Client", get: (c) => c.client },
    { key: "accountant", label: "Accountant", get: (c) => c.accountant, cls: "hide-sm" },
    { key: "status", label: "Close status", get: (c) => STATUSES.findIndex((s) => s.name === c.close_status) },
    { key: "due", label: "Due", get: (c) => c.close_due, cls: "hide-sm" },
    { key: "bank", label: "Bank rec", get: (c) => c.bank_rec_through, cls: "hide-sm" },
    { key: "severity", label: "Flags", get: (c) => c.severity * 100 + c.issues.length },
    { key: "revenue", label: "Revenue", get: (c) => c.revenue, num: true, cls: "hide-sm" },
    { key: "revChange", label: "vs prior", get: (c) => c.revChange, num: true }
  ];

  function renderClients() {
    const chip = CHIPS.find((c) => c.id === state.chip);
    const q = state.search.toLowerCase();
    const col = COLUMNS.find((c) => c.key === state.sort.key);
    const rows = viewClients()
      .filter(chip.test)
      .filter((c) => !q || (c.client + " " + c.accountant + " " + c.fom + " " + c.industry).toLowerCase().includes(q))
      .sort((a, b) => {
        const x = col.get(a), y = col.get(b);
        const cmp = typeof x === "string" ? x.localeCompare(y) : (x || 0) - (y || 0);
        return cmp * state.sort.dir || a.client.localeCompare(b.client);
      });

    const head = "<thead><tr>" + COLUMNS.map((c) =>
      '<th data-sort="' + c.key + '" class="' + (c.num ? "num " : "") + (c.cls || "") + '" aria-sort="' +
      (state.sort.key === c.key ? (state.sort.dir > 0 ? "ascending" : "descending") : "none") + '">' + c.label +
      (state.sort.key === c.key ? '<span class="arrow">' + (state.sort.dir > 0 ? "▲" : "▼") + "</span>" : "") + "</th>").join("") + "</tr></thead>";

    const body = rows.length ? rows.map((c) => {
      const st = STATUSES.find((s) => s.name === c.close_status);
      const counts = { critical: 0, warn: 0, advisory: 0 };
      c.issues.forEach((k) => counts[k.status]++);
      const flags = Object.keys(counts).filter((k) => counts[k]).map((k) => '<span class="sev ' + k + '">' + counts[k] + " " + SEV_LABEL[k].toLowerCase() + "</span>").join("");
      const bankLag = c.bank_rec_through ? daysBetween(PERIOD_END, c.bank_rec_through) : 999;
      return '<tr data-client="' + c.client_id + '" tabindex="0">' +
        '<td><div class="client-name">' + esc(c.client) + '</div><div class="client-sub">' + esc(c.industry) + " · " + esc(c.tier) +
        (state.view === "All" ? " · " + esc(c.fom) : "") + "</div></td>" +
        '<td class="hide-sm">' + esc(c.accountant) + "</td>" +
        '<td><span class="status"><i class="' + st.cls + '"></i>' + esc(c.close_status) + "</span></td>" +
        '<td class="hide-sm' + (c.overdue ? " late" : "") + '">' + fmtDate(c.close_due) + "</td>" +
        '<td class="hide-sm' + (bankLag > 0 ? " late" : "") + '">' + fmtDate(c.bank_rec_through) + "</td>" +
        '<td><div class="flags">' + (flags || '<span class="sev pass">clean</span>') + "</div></td>" +
        '<td class="num hide-sm">' + fmtK(c.revenue) + "</td>" +
        '<td class="num delta ' + (c.revChange >= 0 ? "up" : "down") + '">' + (c.revChange >= 0 ? "+" : "") + pct(c.revChange) + "</td></tr>";
    }).join("") : '<tr><td colspan="' + COLUMNS.length + '" class="empty">No clients match.</td></tr>';

    $("#clients").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function renderTodos() {
    const todos = viewTodos().sort((a, b) =>
      (a.status === "Done") - (b.status === "Done") || (a.dueDate || 0) - (b.dueDate || 0));
    $("#todos").innerHTML = todos.length ? todos.map((t) => {
      const c = clientById(t.client_id);
      const late = t.status !== "Done" && t.dueDate && t.dueDate < AS_OF;
      const today = t.status !== "Done" && t.dueDate && +t.dueDate === +AS_OF;
      return '<li class="' + (t.status === "Done" ? "done" : "") + '">' +
        '<input type="checkbox" data-todo="' + esc(t.id) + '" ' + (t.status === "Done" ? "checked" : "") + ' aria-label="Mark done: ' + esc(t.task) + '">' +
        '<div><div class="task">' + esc(t.task) + '</div><div class="meta">' + esc(c.client) + " · " + esc(t.owner) +
        " · assigned by " + esc(t.assigned_by) + "</div></div>" +
        '<span class="due ' + (late ? "late" : "") + '">' + (late ? "Late · " : today ? "Today · " : "") + fmtDate(t.dueDate) + "</span></li>";
    }).join("") : '<li class="empty">No to-dos in this view.</li>';

    const cs = viewClients().slice().sort((a, b) => a.client.localeCompare(b.client));
    const clientSel = $("#todoClient");
    const keep = clientSel.value;
    clientSel.innerHTML = '<option value="">Client…</option>' + cs.map((c) => '<option value="' + c.client_id + '">' + esc(c.client) + "</option>").join("");
    if (cs.some((c) => c.client_id === keep)) clientSel.value = keep;
    updateOwnerOptions();
  }

  function updateOwnerOptions() {
    const c = clientById($("#todoClient").value);
    const people = c ? [c.accountant, c.fom] : uniq(viewClients().flatMap((x) => [x.accountant, x.fom]));
    const ownerSel = $("#todoOwner");
    const keep = ownerSel.value;
    ownerSel.innerHTML = '<option value="">Assign to…</option>' + people.map((p) => '<option>' + esc(p) + "</option>").join("");
    if (people.includes(keep)) ownerSel.value = keep;
  }

  // ---------- client drawer ----------
  function openClient(id) {
    const c = clientById(id);
    if (!c) return;
    const todos = state.todos.filter((t) => t.client_id === id);
    const checks = c.checks.slice().sort((a, b) => SEV[b.status] - SEV[a.status]);
    const metric = (label, value) => '<div class="metric"><div class="label">' + label + '</div><div class="value">' + value + "</div></div>";
    $("#drawer").innerHTML =
      '<div class="card-head"><div><h2 id="drawerTitle">' + esc(c.client) + '</h2><div class="muted small">' + esc(c.industry) + " · " + esc(c.tier) +
      " · " + fmtMoney(c.monthly_fee) + "/mo</div></div><button class=\"icon-btn\" data-close-drawer aria-label=\"Close\">&times;</button></div>" +
      '<div class="muted small">FOM ' + esc(c.fom) + " · Accountant " + esc(c.accountant) + " · HubSpot health " + esc(c.hubspot_health) + "</div>" +
      "<section><h3>Checks and balances</h3><ul class=\"checks\">" + checks.map((k) =>
        '<li><span class="sev ' + k.status + '">' + SEV_LABEL[k.status] + '</span><span class="label">' + esc(k.label) +
        '<span class="detail">' + esc(k.detail) + "</span></span></li>").join("") + "</ul></section>" +
      "<section><h3>" + esc(CFG.periodLabel) + "</h3><div class=\"metrics\">" +
      metric("Revenue", fmtMoney(c.revenue) + ' <span class="small delta ' + (c.revChange >= 0 ? "up" : "down") + '">' + (c.revChange >= 0 ? "+" : "") + pct(c.revChange) + "</span>") +
      metric("Net income", fmtMoney(c.net_income)) +
      metric("Cash", fmtMoney(c.cash)) +
      metric("AR total", fmtMoney(c.ar_total)) +
      "</div></section>" +
      (c.note ? '<section><h3>Notes</h3><div class="note">' + esc(c.note) + "</div></section>" : "") +
      "<section><h3>To-dos</h3>" + (todos.length ? '<ul class="todos">' + todos.map((t) =>
        '<li class="' + (t.status === "Done" ? "done" : "") + '"><span></span><div><div class="task">' + esc(t.task) + '</div><div class="meta">' +
        esc(t.owner) + "</div></div><span class=\"due\">" + fmtDate(t.dueDate) + "</span></li>").join("") + "</ul>"
        : '<p class="muted">No to-dos for this client.</p>') + "</section>";
    $("#drawer").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#scrim").hidden = false;
    $("#drawer .icon-btn").focus();
  }

  function closeDrawer() {
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#scrim").hidden = true;
  }

  // ---------- morning brief ----------
  function buildBrief() {
    const cs = viewClients();
    const who = state.view === "All" ? CFG.ownerName + " (whole office)" : state.view;
    const lines = ["MORNING BRIEF · " + who, CFG.periodLabel + " close · " + fmtDate(AS_OF), ""];
    const closed = cs.filter((c) => c.close_status === "Closed").length;
    lines.push("Close: " + closed + " of " + cs.length + " closed, " + cs.filter((c) => c.overdue).length + " overdue.", "");
    const section = (title, status) => {
      const items = [];
      cs.forEach((c) => {
        const hits = c.issues.filter((k) => k.status === status);
        if (!hits.length) return;
        items.push("- " + c.client + " → " + c.accountant);
        hits.forEach((k) => items.push("    • " + k.label + ": " + k.detail));
      });
      if (items.length) lines.push(title, ...items, "");
    };
    section("CRITICAL", "critical");
    section("WARNINGS", "warn");
    section("ADVISORY OPPORTUNITIES", "advisory");
    const due = viewTodos().filter((t) => t.status !== "Done" && t.dueDate && t.dueDate <= AS_OF);
    if (due.length) {
      lines.push("TO-DOS DUE TODAY OR LATE");
      due.forEach((t) => lines.push("- " + t.task + " · " + clientById(t.client_id).client + " · " + t.owner + " (" + fmtDate(t.dueDate) + ")"));
    }
    return lines.join("\n").trim();
  }

  // ---------- events ----------
  function bind() {
    document.addEventListener("click", (e) => {
      const view = e.target.closest("[data-view]");
      if (view) { state.view = view.dataset.view; state.chip = "all"; state.showAllAttention = false; render(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const chip = e.target.closest("[data-chip]");
      if (chip) { state.chip = chip.dataset.chip; renderChips(); renderClients(); return; }
      const th = e.target.closest("th[data-sort]");
      if (th) {
        const key = th.dataset.sort;
        state.sort = { key, dir: state.sort.key === key ? -state.sort.dir : (key === "client" || key === "accountant" || key === "due" || key === "bank" ? 1 : -1) };
        renderClients();
        return;
      }
      const row = e.target.closest("[data-client]");
      if (row) { openClient(row.dataset.client); return; }
      if (e.target.closest("[data-close-drawer]") || e.target === $("#scrim")) { closeDrawer(); return; }
      if (e.target.closest("[data-close-brief]")) { $("#briefModal").hidden = true; }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeDrawer(); $("#briefModal").hidden = true; }
      if (e.key === "Enter" && e.target.matches("[data-client]")) openClient(e.target.dataset.client);
    });

    $("#attentionMore").addEventListener("click", () => { state.showAllAttention = !state.showAllAttention; renderAttention(); });
    $("#search").addEventListener("input", (e) => { state.search = e.target.value; renderClients(); });

    $("#todos").addEventListener("change", (e) => {
      const id = e.target.dataset.todo;
      if (!id) return;
      store.status[id] = e.target.checked ? "Done" : "Open";
      writeStore(store);
      state.todos = buildTodos(baseTodos);
      renderKPIs(); renderScorecard(); renderTodos();
    });

    $("#todoClient").addEventListener("change", updateOwnerOptions);
    $("#todoForm").addEventListener("submit", (e) => {
      e.preventDefault();
      store.added.push({
        id: "N" + Date.now(),
        client_id: $("#todoClient").value,
        owner: $("#todoOwner").value,
        task: $("#todoTask").value.trim(),
        due: $("#todoDue").value,
        status: "Open",
        assigned_by: state.view === "All" ? CFG.ownerName : state.view
      });
      writeStore(store);
      state.todos = buildTodos(baseTodos);
      $("#todoTask").value = "";
      renderKPIs(); renderScorecard(); renderTodos();
    });

    $("#briefBtn").addEventListener("click", () => {
      $("#briefText").value = buildBrief();
      $("#briefTitle").textContent = "Morning brief · " + (state.view === "All" ? "Whole office" : state.view);
      $("#briefModal").hidden = false;
    });
    $("#copyBrief").addEventListener("click", async () => {
      const btn = $("#copyBrief");
      try { await navigator.clipboard.writeText($("#briefText").value); btn.textContent = "Copied"; }
      catch (err) { $("#briefText").select(); btn.textContent = "Press Ctrl+C"; }
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    });
  }

  function uniq(arr) { return Array.from(new Set(arr)); }

  // ---------- start ----------
  let baseTodos = [];
  async function start() {
    try {
      const [clientsCsv, todosCsv] = await Promise.all([
        loadText(CFG.sheetCsvUrl, window.CONTROL_SHEET_CSV),
        loadText(CFG.todosCsvUrl, window.TODOS_CSV)
      ]);
      state.clients = parseCSV(clientsCsv).map(normalizeClient);
      baseTodos = parseCSV(todosCsv);
      state.todos = buildTodos(baseTodos);
      $("#todoDue").value = CFG.asOf;
      $("#footer").textContent = "Source: " + (CFG.sheetCsvUrl ? "live control sheet" : "bundled demo data (fictional)") +
        " · " + state.clients.length + " clients · checks and thresholds live in config.js";
      bind();
      render();
    } catch (err) {
      document.querySelector("main").innerHTML = '<div class="card"><h2>Could not load data</h2><p class="muted">' + esc(err.message) + "</p></div>";
    }
  }
  start();
})();
