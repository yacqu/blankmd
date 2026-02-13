# Contributing to blankmd

Thank you for your interest in contributing to blankmd! This document provides guidelines and instructions for contributing.

## Ways to Contribute

* **Bug Reports**: Found a bug? Open an issue with steps to reproduce
* **Feature Requests**: Have an idea? Open an issue to discuss it
* **Code Contributions**: Submit a pull request with improvements
* **Documentation**: Help improve docs, fix typos, add examples

## Development Setup

1. **Clone the repository**
   

```bash
   git clone https://github.com/yacqu/blankmd.git
   cd blankmd
   ```

2. **Install dependencies**
   

```bash
   bun install
   ```

3. **Start development server**
   

```bash
   bun run dev
   ```

4. **Build for production**
   

```bash
   bun run build
   ```

## Project Structure

```
src/
├── index.ts          # Entry point
├── types.ts          # TypeScript interfaces
├── styles.css        # Global styles
├── config/           # Themes and toolbar config
├── core/             # Editor, storage, markdown logic
└── ui/               # Settings, toolbar, quick actions
```

## Code Guidelines

### TypeScript

* Use strict typing — avoid `any`
* Export types from `types.ts`
* Use descriptive variable names

### CSS

* Use CSS custom properties for theming
* Follow existing naming conventions
* Keep specificity low

### Commits

* Write clear, concise commit messages
* Use present tense ("Add feature" not "Added feature")
* Reference issues when applicable (#123)

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with clear commits
4. **Test thoroughly** — ensure the build works and the editor functions correctly
5. **Push** to your fork (`git push origin feature/amazing-feature`)
6. **Open a Pull Request** with a clear description of changes

### PR Checklist

* [ ] Code follows project style guidelines
* [ ] Changes are tested locally
* [ ] Build completes without errors (`bun run build`)
* [ ] Documentation updated if needed

## Reporting Bugs

When reporting bugs, please include:

* **Description**: What happened vs. what you expected
* **Steps to Reproduce**: Minimal steps to trigger the bug
* **Environment**: Browser, OS, device type
* **Screenshots**: If applicable

## Feature Requests

For feature requests, please describe:

* **Use Case**: What problem does this solve?
* **Proposed Solution**: How should it work?
* **Alternatives**: Other approaches you've considered

## Code of Conduct

Be respectful and constructive. We're all here to build something useful together.

## Questions?

Open an issue or start a discussion. We're happy to help!

---

Thank you for contributing! 🎉
