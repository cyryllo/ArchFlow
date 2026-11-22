# Release notes

One file per release: `vX.Y.Z.md`, written in Markdown, in English.

- Add the file in the same commit as the version bump, before pushing the tag. The "Desktop builds" workflow uses it as the description of the GitHub release it creates (without a file it falls back to GitHub's generated notes).
- Editing or adding a file for a release that already exists and pushing it to `master` updates that release's description (workflow "Release notes").
