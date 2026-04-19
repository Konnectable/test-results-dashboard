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

function createRepoCard(repo, summary) {
  const article = document.createElement("article");
  article.className = "repo-card";

  const title = document.createElement("h2");
  title.textContent = repo.displayName;
  article.appendChild(title);

  const pill = document.createElement("span");
  pill.className = `status-pill ${statusClass(summary?.status)}`;
  pill.textContent = statusLabel(summary?.status);
  article.appendChild(pill);

  const meta = document.createElement("div");
  meta.className = "repo-meta";

  const tests = document.createElement("span");
  tests.textContent = `Tests: ${summary?.tests ?? "-"}`;
  meta.appendChild(tests);

  const suites = document.createElement("span");
  suites.textContent = `Suites: ${summary?.suites ?? "-"}`;
  meta.appendChild(suites);

  const branch = document.createElement("span");
  branch.textContent = `Branch: ${summary?.branch ?? repo.defaultBranch ?? "-"}`;
  meta.appendChild(branch);

  const updated = document.createElement("span");
  updated.textContent = `Updated: ${formatDate(summary?.updatedAt)}`;
  meta.appendChild(updated);

  const commit = document.createElement("span");
  commit.className = "commit";
  commit.textContent = `Commit: ${summary?.commit ?? "-"}`;
  meta.appendChild(commit);

  article.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "repo-actions";

  if (summary) {
    const detailsLink = document.createElement("a");
    detailsLink.className = "action-link";
    detailsLink.href = `./details.html?repo=${encodeURIComponent(repo.name)}`;
    detailsLink.textContent = "View details";
    actions.appendChild(detailsLink);
  }

  if (actions.children.length > 0) {
    article.appendChild(actions);
  }

  return article;
}

async function loadDashboard() {
  const repoGrid = document.getElementById("repo-grid");
  const repoCount = document.getElementById("repo-count");
  const passingCount = document.getElementById("passing-count");
  const failingCount = document.getElementById("failing-count");
  const pendingCount = document.getElementById("pending-count");

  const config = await fetchJson("./data/repos.json");
  repoCount.textContent = String(config.repositories.length);

  let passing = 0;
  let failing = 0;
  let pending = 0;

  for (const repo of config.repositories) {
    let summary = null;

    try {
      summary = await fetchJson(`./results/${repo.name}/summary.json`);
    } catch (_error) {
      summary = null;
    }

    if (summary?.status === "passed") {
      passing += 1;
    } else if (summary?.status === "failed") {
      failing += 1;
    } else {
      pending += 1;
    }

    repoGrid.appendChild(createRepoCard(repo, summary));
  }

  passingCount.textContent = String(passing);
  failingCount.textContent = String(failing);
  pendingCount.textContent = String(pending);
}

loadDashboard().catch((error) => {
  const repoGrid = document.getElementById("repo-grid");
  repoGrid.innerHTML = `<article class="repo-card"><h2>Dashboard unavailable</h2><div class="repo-meta"><span>${error.message}</span></div></article>`;
});
