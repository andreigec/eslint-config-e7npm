# eslint-config-e7npm

Shared linting, formatting, and code-quality configuration.

## Oxlint

Extend the packaged Oxlint configuration from a local `.oxlintrc.json` file:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/eslint-config-e7npm/oxlint.json"],
  "settings": {
    "tailwindcss": {
      "entryPoint": "src/styles.css"
    }
  }
}
```

Users must declare `settings.tailwindcss.entryPoint` in their local Oxlint configuration and
set it to their Tailwind CSS entry point. The shared package cannot select this project-specific
file.

`e7-oxlint` automatically uses the project's `.oxlintrc.json` or `oxlint.json` unless `--config` or
`-c` is passed. A project must not contain both conventional config files. `e7-oxfmt` formats the
project, applies Oxlint fixes and suggestions with that configuration, and fails if warnings or
errors remain. Pass `--no-lint` when only the formatter should run.
