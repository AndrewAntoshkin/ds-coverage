# ds-coverage

Measure design system component adoption across your codebase. Find which components are used, unused, or duplicated.

Adoption is the #1 challenge in design systems. ds-coverage gives you the numbers.

## Install

```bash
npm i -g ds-coverage
# or run directly
npx ds-coverage src/ --ds @acme/ui
```

## Usage

```bash
# Basic scan
ds-coverage src/ --ds @acme/ui

# Multiple packages
ds-coverage . --ds @acme/ui,@acme/icons

# With component inventory (to find unused)
ds-coverage src/ --ds @acme/ui --inventory components.json

# Markdown report for PR
ds-coverage src/ --ds @acme/ui --format markdown --out coverage.md

# CI threshold
ds-coverage src/ --ds @acme/ui --inventory components.json --min 70
```

## What it measures

| Metric | Description |
|--------|-------------|
| **Components used** | How many DS components appear in imports |
| **Total imports** | Total number of DS import statements |
| **Custom components** | Local components imported from relative paths |
| **Duplicates** | Local components with same name as DS components |
| **Unused** | DS components never imported (requires `--inventory`) |
| **Top used** | Most frequently imported components |
| **Least used** | Components with 1-2 imports (deprecation candidates) |

## Inventory file

To detect unused components, provide a JSON file listing all DS exports:

```json
["Button", "Card", "Modal", "Tooltip", "Badge", "Input", "Select"]
```

Or an object with a `components` key:

```json
{ "components": ["Button", "Card", "Modal"] }
```

## Output formats

- `terminal` (default) — summary with top/bottom lists
- `markdown` — tables for PRs, docs, or dashboards
- `json` — machine-readable for CI

## CI integration

```yaml
# GitHub Actions
- run: npx ds-coverage src/ --ds @acme/ui --inventory components.json --min 60
```

Exits with code 1 if coverage is below `--min` threshold.

## Pipeline

```
design-system-ai-starter → define tokens
figma-to-design-md       → extract from Figma
ds-lint                  → enforce in code
ds-coverage              → measure adoption ← you are here
ds-health                → check live site
```

## License

MIT
