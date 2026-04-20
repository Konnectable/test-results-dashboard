# test-results-dashboard

Static dashboard repo for publishing sanitized test results from the Papieya backend repositories.

## What this repo does

- hosts the GitHub Pages dashboard UI in `index.html`, `details.html`, and `assets/`
- stores the repo registry in `data/repos.json`
- publishes per-repo sanitized summaries under `results/<repo>/`
- intentionally avoids pulling private source code into the public dashboard

This repo is the publishable dashboard. The separate workspace-only `local-test-dashboard/` folder is used for local aggregation during development.

## Local workflow

1. Update the UI in `index.html`, `details.html`, or `assets/` when the dashboard layout or rendering changes.
2. Update `data/repos.json` when a repo should appear in the dashboard.
3. Add or refresh sanitized result payloads under `results/` when onboarding or testing a repo locally.
4. Review the pages in a browser before pushing changes.

## Verification

- There is no automated test suite in this repo.
- Verify by opening `index.html` and `details.html` locally and confirming the expected repos and result summaries render.
- The source data should stay sanitized: repo name, status, counts, branch, commit SHA, and timestamps are fine. Source code and secrets are not.

## Ideal development process

1. Make the service repo produce `test-results/` artifacts.
2. Publish only sanitized metadata into this repo's `results/` directory.
3. Keep `data/repos.json` aligned with the repos that are expected to publish.
4. Review the rendered dashboard before merging.
5. Enable or maintain GitHub Pages deployment from `main`.

## Onboarding a new backend repo

- make sure the source repo can generate `junit.xml` and any summary data it needs
- add the repo to `data/repos.json` if it should appear in the dashboard
- publish a sanitized `results/<repo>/summary.json`
- verify the repo shows up in the dashboard UI
