# Workflows & Release Process

How CI, releases, and deployments work together in blankmd.

## Overview

There are three GitHub Actions workflows. Each does one thing.

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| CI | `build.yml` | PR opened/updated against `main` | Verify the build passes before merging |
| Release | `release.yml` | Release PR merged, or `v*` tag pushed | Auto-tag + build + create GitHub Release |
| Deploy | `deploy.yml` | Push to `main` | Build and deploy to GitHub Pages |

## How they connect

```
bun run release:patch
        │
        ▼
  release/v1.0.3 branch created
  PR opened against main
        │
        ▼
  ┌─────────────┐
  │   CI (build) │  ◄── runs on every PR
  └──────┬──────┘
         │ passes
         ▼
    merge the PR
         │
         ├──────────────────────────────┐
         ▼                              ▼
  ┌──────────────┐              ┌──────────────┐
  │ Release (tag)│              │    Deploy     │
  │ auto-creates │              │ GitHub Pages  │
  │   v1.0.3 tag │              └──────────────┘
  └──────┬───────┘
         │ tag push triggers
         ▼
  ┌──────────────┐
  │   Release    │
  │ build + upload│
  │ blankmd.html │
  └──────────────┘
```

## Releasing a new version

One command:

```bash
bun run release:patch   # 1.0.2 -> 1.0.3
bun run release:minor   # 1.0.2 -> 1.1.0
bun run release:major   # 1.0.2 -> 2.0.0
```

This does the following:
1. Checks out `main` and pulls latest
2. Creates a `release/vX.Y.Z` branch
3. Bumps the version in `package.json`
4. Commits, pushes, and opens a PR via `gh` CLI

Then on GitHub:
1. CI runs and verifies the build
2. You merge the PR
3. The release workflow detects the `release/v*` branch was merged and auto-creates the tag
4. The tag push triggers the release job, which builds and uploads `blankmd.html` to a GitHub Release
5. The deploy workflow also runs (since `main` was updated) and deploys to GitHub Pages

Nothing else to do. Merge the PR and everything happens automatically.

## GitHub Pages deployment

The deploy workflow runs on every push to `main` , not just releases. So any merged PR (features, fixes, whatever) will update the live demo at https://yacqu.github.io/blankmd.

You can also trigger it manually from the Actions tab ( `workflow_dispatch` ).

## Branch protection rules

Set these on the `main` branch in GitHub repo settings (Settings > Rules > Rulesets or Branch protection rules):

**Required:**
* **Require a pull request before merging** — no direct pushes to `main`
* **Require status checks to pass** — select the `build` job from the CI workflow
* **Require branches to be up to date before merging** — prevents merging stale PRs

**Recommended:**
* **Do not allow deletions** — protect `main` from being deleted
* **Block force pushes** — prevent history rewrites

That's it. The `build` status check is the only gate. If the build passes, the PR is safe to merge.

## Requirements

* [gh CLI](https://cli.github.com) — the release script uses it to create PRs
* GitHub Pages enabled on the repo (Settings > Pages > Source: GitHub Actions)
