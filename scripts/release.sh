#!/bin/bash

CHANGELOG_FILE="packages/vscode/CHANGELOG.md"

# Must prepare changelog for release
if git diff --quiet -- "$CHANGELOG_FILE" && git diff --cached --quiet -- "$CHANGELOG_FILE"; then
    echo "No changes detected in $CHANGELOG_FILE."
    exit 1
fi

# Run a fresh build
npm run build

# Update version in all package.json
npm exec lerna version

RELEASE_VERSION=$(grep '"version":' lerna.json | head -n 1 | cut -d'"' -f4)
echo "Release as $RELEASE_VERSION"

# Commit and tag to git
git add .
git commit -m "chore: release $RELEASE_VERSION"
git tag v$RELEASE_VERSION
