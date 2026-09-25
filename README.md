# ECGenius

ECGenius is a responsive, Duolingo-inspired ECG learning application for students. It includes a 27-rhythm course path, reusable five-step lessons, a reference browser, an interpretable rule-based pattern matcher, an ECG fundamentals guide, and a Challenge integration route.

## Source of truth

- `pathologies_with_classifier.json` supplies all pathology content and classifier rules.
- `assets/characters/` contains the supplied character SVGs.

The React adapter in `src/data/appData.js` normalizes the source JSON at runtime. Medical content is not duplicated in components.

## Local development

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Useful checks:

```bash
pnpm test
pnpm build
pnpm preview
```

## Routing and persistence

The app uses `HashRouter`, so routes such as `#/learn/sinus-rhythm` survive direct navigation and refreshes on static hosting. Local storage keeps completed lessons, the last lesson, Practice selection, and manual theme preference. No backend or login is required.

## Classifier scoring

The pure engine in `src/utils/classifier.js` evaluates every pathology’s configured `required`, `supporting`, and `conflicts` rules. Contradicted required rules or active conflicts exclude a candidate. Supporting weights are normalized to a 0–100 **Pattern match score**. This score is not a probability, confidence estimate, diagnostic accuracy, or clinical diagnosis. Unknown required values keep a candidate possible but prevent a strong-match result.

## GitHub Pages deployment

The included workflow at `.github/workflows/deploy.yml` builds and publishes `dist/` whenever the default branch is pushed. In the GitHub repository settings, set **Pages → Source** to **GitHub Actions**. The Vite base is relative and character assets are copied into the static bundle.

## Challenge integration

`#/challenge` is a polished unavailable state for now. Replace the body of `ChallengePage` with the future game component or URL while keeping the route and shared data adapter unchanged.

> ECGenius is an educational simulation only. It is not a substitute for professional clinical diagnosis, medical advice, or treatment.

