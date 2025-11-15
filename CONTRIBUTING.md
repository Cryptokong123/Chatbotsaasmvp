# Contributing to ChatForge AI

Thank you for your interest in contributing to ChatForge AI! This document provides guidelines for contributing to the project.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase account (for local development)
- OpenAI API key

### Local Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/yourusername/chatforge-ai.git
cd chatforge-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
# Fill in your credentials
```

4. **Run development server**

```bash
npm run dev
```

5. **Run tests**

```bash
npm test
```

---

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - Feature branches
- `fix/bug-name` - Bug fix branches

### Making Changes

1. Create a new branch from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Run tests and linting:

```bash
npm run test
npm run lint
npm run type-check
```

4. Commit your changes:

```bash
git add .
git commit -m "feat: add your feature description"
```

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

5. Push and create a pull request:

```bash
git push origin feature/your-feature-name
```

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types when they're reused

### React

- Use functional components
- Use hooks properly
- Keep components small and focused
- Use proper prop types

### Naming Conventions

- **Files:** `kebab-case.tsx`
- **Components:** `PascalCase`
- **Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase`

### Code Organization

```
/app          - Next.js pages and API routes
/components   - Reusable UI components
/lib          - Utility functions and libraries
/types        - TypeScript type definitions
/__tests__    - Test files
```

---

## Testing

### Writing Tests

- Write tests for new features
- Update tests when modifying code
- Aim for meaningful test coverage
- Test edge cases and error scenarios

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:e2e      # Run end-to-end tests
```

---

## Pull Request Process

1. **Update documentation** if you're changing functionality

2. **Add tests** for new features

3. **Ensure all tests pass**

4. **Update CHANGELOG.md** with your changes

5. **Fill out the PR template** completely

6. **Request review** from maintainers

### PR Title Format

```
feat: Add bot templates feature
fix: Resolve widget loading issue on Safari
docs: Update API documentation
```

### PR Description

Include:
- What changes you made
- Why you made them
- How to test the changes
- Screenshots (for UI changes)
- Related issues

---

## Reporting Bugs

### Before Submitting

- Search existing issues
- Check if it's already fixed in `develop`
- Verify it's reproducible

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 0.1.0]

**Additional Context**
Any other relevant information
```

---

## Feature Requests

We welcome feature suggestions! Please:

1. Check existing feature requests
2. Describe the problem you're trying to solve
3. Explain your proposed solution
4. Consider alternative solutions

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information

---

## Questions?

- GitHub Discussions: Ask questions and share ideas
- Discord: Join our community server
- Email: contributors@chatforge.ai

---

Thank you for contributing to ChatForge AI! 🎉
