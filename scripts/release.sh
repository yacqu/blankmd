#!/bin/bash
# Release script for blankmd
# Creates a release branch and opens a PR. After the PR is merged,
# run with --tag to tag the merge commit and trigger the release workflow.
#
# Usage:
#   ./scripts/release.sh patch         # 1.0.0 -> 1.0.1, opens PR
#   ./scripts/release.sh minor         # 1.0.0 -> 1.1.0, opens PR
#   ./scripts/release.sh major         # 1.0.0 -> 2.0.0, opens PR
#   ./scripts/release.sh --tag v1.0.1  # Tag latest main and push (after merge)

set -e

# --- Tag mode: tag a merged release on main ---
if [[ "$1" == "--tag" ]]; then
    TAG="$2"
    if [[ -z "$TAG" ]]; then
        echo "Usage: ./scripts/release.sh --tag v1.0.1"
        exit 1
    fi

    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        echo "Switching to main..."
        git checkout main
    fi

    git pull origin main
    git tag "$TAG"
    git push origin "$TAG"
    echo "Done — pushed $TAG. GitHub Actions will build and create the release."
    exit 0
fi

# --- PR mode: bump version and open a PR ---
BUMP="${1:-patch}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
    echo "Usage: ./scripts/release.sh [patch|minor|major]"
    echo "       ./scripts/release.sh --tag v1.0.1"
    exit 1
fi

# Check gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "Error: gh CLI is required. Install it: https://cli.github.com"
    exit 1
fi

# Read current version from package.json
CURRENT=$(grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
TAG="v$NEW_VERSION"
BRANCH="release/$TAG"

echo "Bumping version: $CURRENT -> $NEW_VERSION"

# Make sure we're on main and up to date
git checkout main
git pull origin main

# Create release branch
git checkout -b "$BRANCH"

# Update package.json version
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
else
  sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

# Commit and push
git add package.json
git commit -m "release: $TAG"
git push -u origin "$BRANCH"

# Open PR
gh pr create \
    --title "release: $TAG" \
    --body "Bumps version to $NEW_VERSION. After merging, run: \`bun run release:tag $TAG\`" \
    --base main \
    --head "$BRANCH"

echo ""
echo "PR created. Once CI passes and the PR is merged, run:"
echo "  bun run release:tag $TAG"
