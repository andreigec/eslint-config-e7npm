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
