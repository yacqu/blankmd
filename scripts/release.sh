#!/bin/bash
# Release script for blankmd
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

echo "Bumping version: $CURRENT -> $NEW_VERSION"

# Update package.json version
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
else
  sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

# Commit, tag, and push
git add package.json
git commit -m "release: $TAG"
git tag "$TAG"
git push
git push origin "$TAG"

echo "Done — pushed $TAG. GitHub Actions will build and create the release."
