#!/bin/bash
# Release script for blankmd
# Bumps the version, creates a release branch, and opens a PR.
# When the PR is merged, GitHub Actions auto-tags and creates the release.
#
# Usage:
#   ./scripts/release.sh patch   # 1.0.0 -> 1.0.1
#   ./scripts/release.sh minor   # 1.0.0 -> 1.1.0
#   ./scripts/release.sh major   # 1.0.0 -> 2.0.0

set -e

BUMP="${1:-patch}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
    echo "Usage: ./scripts/release.sh [patch|minor|major]"
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
    --body "Bumps version to $NEW_VERSION. Merging this will auto-tag \`$TAG\` and create a GitHub release." \
    --base main \
    --head "$BRANCH"

echo ""
echo "PR created. Once CI passes and you merge it, the release is automatic."
