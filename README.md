# Open Bible Text

![Open Bible Text logo](./src/docs/images/logo_obt.png)

Open Bible Text (OBT) is a React web application for reading and studying Scripture and Open Bible Stories with open resources from Door43.

It is designed for translators, reviewers, and church users who need to compare multiple resources side by side, save layouts, and share study workspaces.

## Links

- Production: [openbibletext.com](https://openbibletext.com/)
- Repository: [github.com/unfoldingWord/obt](https://github.com/unfoldingWord/obt)
- Issues: [github.com/unfoldingWord/obt/issues](https://github.com/unfoldingWord/obt/issues)
- Translation project: [Crowdin](https://crowdin.com/project/obt)
- Changelog: [src/docs/CHANGELOG.md](./src/docs/CHANGELOG.md)

## What the app does

- Opens Bible and OBS resources from Door43 in a multi-card workspace
- Supports parallel reading of literal text, simplified text, translation notes, translation academy, translation words links, and other available resources
- Provides first-run guidance with an in-app walkthrough
- Shows an initial loading indicator on cold startup so first load does not look frozen
- Saves layouts locally and supports importing or sharing layouts by URL
- Lets users reset cards back to the default workspace for the current mode
- Supports multiple interface languages through i18next and Crowdin-managed translations
- Includes typo reporting and feedback flows for supported deployments

## Default study layout

When no saved Bible layout exists and the necessary English core resources are available, OBT opens a five-card default workspace:

- Left third: literal translation, full height
- Middle third: simplified translation above translation words links
- Right third: translation notes above translation academy

If one or more of those resources are unavailable, the app falls back to opening the core resources that are available instead of showing an incomplete or blank workspace.

## Technology stack

- React 18
- CRACO on top of Create React App
- Material UI v4 and MUI v7-based dependencies
- Netlify Functions for feedback delivery in hosted environments
- Workbox service worker support
- Door43 / DCS-hosted content and related resource component libraries

## Data and external services

OBT does not require a local database to run. The app primarily reads resource metadata and content from Door43/DCS-hosted repositories.

Optional integrations:

- Typo reporting backend via `REACT_APP_SERVER_LINK`
- Netlify feedback function backed by Telegram via `API_TELEGRAM_TOKEN` and `GROUP_TELEGRAM`

## Getting started

### Prerequisites

Use a current Node.js and npm environment. Netlify is currently building this app with Node `22.22.1`, and local development has been validated with modern npm-based installs.

You will need:

- Node.js 20+ or 22+
- npm

### Installation

1. Clone the repository.

```bash
git clone https://github.com/unfoldingWord/obt.git
cd obt
```

2. Install dependencies.

```bash
npm install
```

3. Copy the example environment file.

```bash
cp .env.example .env
```

4. Start the development server.

```bash
npm start
```

The app runs at `http://localhost:3000` by default.

## Environment variables

The app can run with no secrets for basic local UI work, but some feedback/reporting features require configuration.

| Variable | Required | Purpose |
| --- | --- | --- |
| `REACT_APP_SERVER_LINK` | Optional | Endpoint used by typo reporting |
| `GENERATE_SOURCEMAP` | Optional | Set to `false` to reduce build artifact size |
| `API_TELEGRAM_TOKEN` | Optional for Netlify feedback | Telegram bot token used by `netlify/functions/sendFeedback.js` |
| `GROUP_TELEGRAM` | Optional for Netlify feedback | Telegram chat ID used by `netlify/functions/sendFeedback.js` |

Example values are provided in [`.env.example`](./.env.example).

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Run the app locally in development mode |
| `npm run build` | Create a production build |
| `npm test` | Run the test suite through CRACO |
| `npm run serve` | Serve the built app locally |
| `npm run analyze` | Inspect production bundle composition |

## Local development workflow

Typical maintainer workflow:

1. Run `npm install`
2. Run `npm start`
3. Validate behavior in the browser
4. Run focused tests or the full test suite with `npm test`
5. Run `CI=true npm run build` before pushing release-sensitive changes

Using `CI=true` locally matters because Create React App treats warnings as build failures in CI environments.

## Deployment notes

### Netlify

The repository includes a Netlify function at [netlify/functions/sendFeedback.js](./netlify/functions/sendFeedback.js).

For hosted feedback submission to work, the deployment environment must provide:

- `API_TELEGRAM_TOKEN`
- `GROUP_TELEGRAM`

The production build is generated with:

```bash
npm run build
```

To smoke-test the production artifact locally:

```bash
npm run build
npm run serve
```

### Typo reporting backend

Typo reporting is separate from the Netlify feedback function. If you want typo-report submissions to work, point `REACT_APP_SERVER_LINK` at a compatible backend.

The historic backend reference in this project is [texttree/tsv-send-backend](https://github.com/texttree/tsv-send-backend).

## User-facing capabilities

### Study modes

- Bible mode
- OBS mode

### Workspace behavior

- Add cards from the main menu
- Rearrange cards in a responsive grid layout
- Save and restore layouts
- Import a shared layout
- Generate a shareable layout URL
- Reset cards back to the default layout for the active mode

### First-run experience

- Guided walkthrough for new users
- Immediate startup loader on cold load
- Loading placeholders while initial resources are still being discovered

## Project structure

```text
.
├── netlify/functions/      # Hosted feedback function
├── public/                 # HTML shell and static assets
├── src/
│   ├── components/         # UI components
│   ├── config/             # locale and app configuration
│   ├── context/            # application state context
│   ├── docs/               # changelog, images, supporting docs
│   ├── helper.js           # layout/resource helper logic
│   └── styles/             # app styling
├── craco.config.js         # webpack and build overrides
├── package.json            # scripts and dependencies
└── README.md
```

## Known maintenance realities

- Some shared resource-component dependencies are coordinated across multiple projects, so dependency upgrades may require team agreement rather than project-local changes.
- CI and Netlify builds are sensitive to warnings because Create React App treats warnings as errors when `CI=true`.
- Runtime behavior depends on resource availability in external Door43 repositories, so startup and default layout behavior must tolerate missing repositories.

## Contributing

1. Create a branch from `develop`
2. Make the change
3. Run the relevant tests and `CI=true npm run build`
4. Update [src/docs/CHANGELOG.md](./src/docs/CHANGELOG.md) when the change affects a release
5. Open a pull request

Use [github.com/unfoldingWord/obt/issues](https://github.com/unfoldingWord/obt/issues) for bugs and feature requests.

## License

Distributed under the MIT License. See [LICENSE](./LICENSE).
