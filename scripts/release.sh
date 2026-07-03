#!/bin/bash
# Release script: bumps version, tags, merges to main, and pushes.
#
# Pushing the vX.Y.Z tag triggers .github/workflows/desktop-release.yml, which builds the
# Windows installer on a clean windows-latest runner and auto-publishes it to the matching
# GitHub Release (electron-builder --publish always). Web (Netlify) + desktop ship from one run.
#
# Usage: ./scripts/release.sh [major|minor|patch]
#   major: 1.5.0 → 2.0.0
#   minor: 1.5.0 → 1.6.0 (default)
#   patch: 1.5.0 → 1.5.1

set -e

BUMP_TYPE="${1:-minor}"
CURRENT_BRANCH=$(git branch --show-current)

# Validate
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "Error: Cannot release from main. Switch to a feature branch first."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
echo "Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  *) echo "Error: Invalid bump type '$BUMP_TYPE'. Use major, minor, or patch."; exit 1 ;;
esac
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Confirm
read -p "Release v$NEW_VERSION from '$CURRENT_BRANCH' → main? [y/N] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Cancelled."
  exit 0
fi

# Bump version in package.json
npm version "$NEW_VERSION" --no-git-tag-version
echo "Updated package.json to $NEW_VERSION"

# Commit and tag
git add package.json package-lock.json
git commit -m "$NEW_VERSION"
git tag "v$NEW_VERSION"
echo "Created commit and tag v$NEW_VERSION"

# Merge to main
git checkout main
git merge "$CURRENT_BRANCH" --no-edit
echo "Merged $CURRENT_BRANCH into main"

# Push
git push origin main
git push origin "v$NEW_VERSION"
echo "Pushed main and tag v$NEW_VERSION to origin"

# Switch back to feature branch
git checkout "$CURRENT_BRANCH"

echo ""
echo "Done! v$NEW_VERSION is tagged, merged, and pushed."
echo "  Web     → Netlify auto-deploys from main"
echo "  Desktop → GitHub Actions builds the Windows installer from tag v$NEW_VERSION and"
echo "            auto-publishes it to the v$NEW_VERSION GitHub Release when the build finishes"
echo "            watch: https://github.com/mmogib/examazej/actions"
echo "  University: email deployment team when ready"
