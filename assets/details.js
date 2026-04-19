async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function formatDate(value) {
  if (!value) {
    return "Awaiting first publish";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function statusClass(status) {
  if (status === "passed") {
    return "status-passed";
  }
  if (status === "failed") {
    return "status-failed";
  }
  return "status-pending";
}

function statusLabel(status) {
  if (status === "passed") {
    return "Passed";
  }
  if (status === "failed") {
    return "Failed";
  }
  return "Awaiting publish";
}

function createSummaryCard(label, value) {
  const card = document.createElement("div");
  card.className = "summary-card";

  const key = document.createElement("span");
  key.className = "summary-label";
  key.textContent = label;
  card.appendChild(key);

  const data = document.createElement("strong");
  data.textContent = value;
  card.appendChild(data);

  return card;
}

function createTestRow(test) {
  const row = document.createElement("div");
  row.className = "test-row";

  const header = document.createElement("div");
  header.className = "test-header";

  const name = document.createElement("div");
  name.className = "test-name";
  name.textContent = test.name;
  header.appendChild(name);

  const status = document.createElement("span");
  status.className = `status-pill ${statusClass(test.status)}`;
  status.textContent = statusLabel(test.status);
  header.appendChild(status);

  row.appendChild(header);

  if (test.failureMessage) {
    const message = document.createElement("div");
    message.className = "test-message";
    message.textContent = test.failureMessage;
    row.appendChild(message);
  }

  return row;
}

function createSuiteCard(suite) {
  const article = document.createElement("article");
  article.className = "suite-card";

  const title = document.createElement("h2");
  title.textContent = suite.name;
  article.appendChild(title);

  const stats = document.createElement("div");
  stats.className = "suite-stats";
  stats.innerHTML = `
    <span>Tests: ${suite.tests.length}</span>
    <span>Passed: ${suite.tests.filter((test) => test.status === "passed").length}</span>
    <span>Failed: ${suite.tests.filter((test) => test.status === "failed").length}</span>
    <span>Skipped: ${suite.tests.filter((test) => test.status === "skipped").length}</span>
  `;
  article.appendChild(stats);

  const list = document.createElement("div");
  list.className = "test-list";
  suite.tests.forEach((test) => {
    list.appendChild(createTestRow(test));
  });
  article.appendChild(list);

  return article;
}

function metricClass(value) {
  if (typeof value !== "number") {
    return "";
  }
  if (value >= 80) {
    return "coverage-metric-good";
  }
  if (value >= 50) {
    return "coverage-metric-warn";
  }
  return "coverage-metric-bad";
}

function formatPercent(value) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "-";
}

function createCoverageSection(coverage) {
  const section = document.createElement("section");
  section.className = "coverage-section";

  const title = document.createElement("h2");
  title.textContent = "Coverage";
  section.appendChild(title);

  if (!coverage?.available) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = coverage?.message || "Coverage was not published for this repository.";
    section.appendChild(empty);
    return section;
  }

  const scroll = document.createElement("div");
  scroll.className = "table-scroll";

  const table = document.createElement("table");
  table.className = "coverage-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>File</th>
        <th>% Stmts</th>
        <th>% Branch</th>
        <th>% Funcs</th>
        <th>% Lines</th>
        <th>Uncovered Line #s</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  for (const row of coverage.rows || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="coverage-file">${row.file}</td>
      <td class="${metricClass(row.statementsPct)}">${formatPercent(row.statementsPct)}</td>
      <td class="${metricClass(row.branchesPct)}">${formatPercent(row.branchesPct)}</td>
      <td class="${metricClass(row.functionsPct)}">${formatPercent(row.functionsPct)}</td>
      <td class="${metricClass(row.linesPct)}">${formatPercent(row.linesPct)}</td>
      <td class="coverage-uncovered">${row.uncoveredLines?.length ? row.uncoveredLines.join(", ") : "-"}</td>
    `;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  scroll.appendChild(table);
  section.appendChild(scroll);
  return section;
}

async function loadDetails() {
  const params = new URLSearchParams(window.location.search);
  const repo = params.get("repo");

  const title = document.getElementById("details-title");
  const subtitle = document.getElementById("details-subtitle");
  const summaryRoot = document.getElementById("details-summary");
  const contentRoot = document.getElementById("details-content");

  if (!repo) {
    contentRoot.innerHTML = '<section class="empty-state">Missing repository name in the page URL.</section>';
    return;
  }

  title.textContent = repo;

  const [summary, details, coverage] = await Promise.all([
    fetchJson(`./results/${repo}/summary.json`),
    fetchJson(`./results/${repo}/details.json`),
    fetchJson(`./results/${repo}/coverage.json`).catch(() => ({
      available: false,
      message: "Coverage was not published for this repository."
    }))
  ]);

  subtitle.textContent = `Updated ${formatDate(summary.updatedAt)} on branch ${summary.branch}.`;

  summaryRoot.appendChild(createSummaryCard("Status", statusLabel(summary.status)));
  summaryRoot.appendChild(createSummaryCard("Tests", String(summary.tests)));
  summaryRoot.appendChild(createSummaryCard("Suites", String(summary.suites)));
  summaryRoot.appendChild(createSummaryCard("Failures", String(summary.failures + summary.errors)));

  if (summary.runUrl) {
    const runCard = document.createElement("div");
    runCard.className = "summary-card";
    runCard.innerHTML = `<span class="summary-label">Workflow Run</span><a class="action-link" href="${summary.runUrl}" target="_blank" rel="noreferrer">Open run</a>`;
    summaryRoot.appendChild(runCard);
  }

  if (!details.suites || details.suites.length === 0) {
    contentRoot.appendChild(createCoverageSection(coverage));
    contentRoot.innerHTML += '<section class="empty-state">No suite details were published for this run.</section>';
    return;
  }

  contentRoot.appendChild(createCoverageSection(coverage));

  details.suites.forEach((suite) => {
    contentRoot.appendChild(createSuiteCard(suite));
  });
}

loadDetails().catch((error) => {
  const contentRoot = document.getElementById("details-content");
  contentRoot.innerHTML = `<section class="empty-state">${error.message}</section>`;
});
