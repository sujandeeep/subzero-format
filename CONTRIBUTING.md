# Contributing to Tool-Native Dispatcher

Thank you for your interest in contributing to Tool-Native Dispatcher! We welcome contributions to make text-to-UI formatting faster, more versatile, and robust.

## Getting Started

1. Fork the repository.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/sujandeeep/subzero-format.git
   cd subzero-format
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the interactive test portal:
   ```bash
   npm run dev
   ```

## Development Guidelines

- **Zero External Dependencies in Dispatcher**: Keep `src/services/toolNativeDispatcher.ts` 100% self-contained without adding runtime dependencies.
- **Zero Hallucination / Zero Synthetic Fallbacks**: Never hardcode dummy company names, statuses, or fake data.
- **Verify Lint and Build**:
  ```bash
  npm run lint
  npm run build
  ```

## Submitting Pull Requests

1. Create a feature branch (`git checkout -b feature/my-new-feature`).
2. Commit your changes (`git commit -am 'Add some feature'`).
3. Push to the branch (`git push origin feature/my-new-feature`).
4. Create a new Pull Request.
