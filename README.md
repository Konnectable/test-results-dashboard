# test-results-dashboard

Public GitHub Pages site for sanitized test summaries from Papieya backend repositories.

## What This Repo Publishes

This dashboard is intended to publish only non-sensitive test metadata:

- repository name
- latest pass or fail status
- test and suite counts
- branch name
- commit SHA
- updated timestamp

It does not need source code from the private repositories.

## GitHub Setup

1. Create a public GitHub repository named `test-results-dashboard`.
2. Push this folder to that repository.
3. In GitHub, enable Pages for this repository and set the source to `GitHub Actions`.
4. In each private service repository, add:
   - repository secret `TEST_RESULTS_DASHBOARD_TOKEN`
   - optional repository variable `TEST_RESULTS_DASHBOARD_REPO`

Use `TEST_RESULTS_DASHBOARD_REPO=Konnectable/test-results-dashboard` unless the dashboard repository name changes.

## Token Scope

Create a fine-grained personal access token with write access only to the public dashboard repository. Store it as `TEST_RESULTS_DASHBOARD_TOKEN` in each private repository that should publish results.

## Published File Layout

- `data/repos.json`: dashboard repo list
- `results/<repo>/summary.json`: latest sanitized summary from each private repo

## Pages Workflow

This repo includes a Pages workflow that deploys the static dashboard after each push to `main`.
