# Contributing to SubZero-Format

Thank you for your interest in contributing to SubZero-Format! We welcome contributions to make text-to-UI formatting faster, more versatile, and robust.

---

## 🛠️ Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/subzero-format.git
   cd subzero-format
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```

4. **Run type-checking and build:**
   ```bash
   npm run build
   ```

---

## 📋 Pull Request Guidelines

1. **Deterministic Speed is King:** Never introduce secondary network calls, external API dependencies, or blocking operations into `toolNativeDispatcher.ts`. All parsers must complete in `< 1.0ms`.
2. **Zero Data Loss:** Any new pattern must preserve 100% of UUIDs, identifiers, and custom colon-ended fields.
3. **Format Support:** If adding a new delimiter or pattern (e.g., YAML, XML, JSONL), include test cases in the test suite.

---

## 📄 License
By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
