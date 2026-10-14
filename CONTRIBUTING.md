# Contributing to Motion Studio Pro

Thank you for your interest in contributing to Motion Studio Pro! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Pull Request Process](#pull-request-process)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect differing viewpoints
- Report unacceptable behavior to the maintainers

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Git
- A Supabase account (for testing database features)
- A Kling AI account (for testing API integration)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/motion-studio-pro.git
   cd motion-studio-pro
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/motion-studio-pro.git
   ```

### Set Up Development Environment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Fill in your credentials in `.env`

4. Start development server:
   ```bash
   # Terminal 1
   node server.js
   
   # Terminal 2
   npm run dev
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes** - Fix issues and improve stability
- ✨ **Features** - Add new functionality
- 📝 **Documentation** - Improve docs, add examples
- 🎨 **UI/UX** - Enhance design and user experience
- ⚡ **Performance** - Optimize code and loading times
- ♿ **Accessibility** - Improve a11y compliance
- 🌐 **Translations** - Add multi-language support
- 🧪 **Tests** - Add or improve test coverage

### Finding Issues

- Check [open issues](https://github.com/OWNER/motion-studio-pro/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Feel free to ask questions in issue comments

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Your Changes

- Write clear, concise commit messages
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Test build
npm run build
```

### 4. Commit Your Changes

We use conventional commits:

```bash
git commit -m "feat: add video batch processing"
git commit -m "fix: resolve upload issue on mobile"
git commit -m "docs: update deployment guide"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your fork and branch
- Fill in the PR template
- Submit!

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Export types for reuse

**Example:**
```typescript
interface GenerationSettings {
  motionStrength: number;
  matchMode: 'structure' | 'motion';
  quality: '720p' | '1080p';
}

export async function createGeneration(
  settings: GenerationSettings
): Promise<Generation> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- One component per file
- Use meaningful prop names
- Add JSDoc comments for complex components

**Example:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Custom button component with variants
 */
export const Button = ({ variant = 'primary', onClick, children }: ButtonProps) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `GenerateButton.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `camelCase.ts` (e.g., `database.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters
- Run `npm run lint` before committing

## Testing

### Writing Tests

Place tests in the same directory as the code or in `src/test/`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatDuration } from './utils';

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3599)).toBe('59:59');
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage
```

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Document complex logic inline
- Update README for major features
- Keep docs/ folder updated

### Documentation Files

- `README.md` - Project overview and quick start
- `docs/SETUP-GUIDE.md` - Detailed setup instructions
- `docs/DEPLOYMENT.md` - Deployment guides
- `docs/DATABASE.md` - Database schema and queries
- `SECURITY.md` - Security policies
- `CONTRIBUTING.md` - This file

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Description

Use the template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated Checks** - CI must pass
2. **Code Review** - At least one approval needed
3. **Testing** - Reviewer will test functionality
4. **Merge** - Maintainer will merge when ready

### After Merge

- Delete your branch:
  ```bash
  git branch -d feature/your-feature-name
  git push origin --delete feature/your-feature-name
  ```

- Sync your fork:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

## Common Issues

### "Tests fail locally but pass in CI"

- Ensure you're using Node.js 18+
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for environment-specific issues

### "Type errors in TypeScript"

- Run `npm run type-check` to see all errors
- Ensure types are properly imported
- Check for missing type definitions

### "Lint errors"

- Run `npm run lint` to see all issues
- Many can be auto-fixed: `npm run lint -- --fix`
- Update ESLint config if needed

## Questions?

- 💬 Open a [Discussion](https://github.com/OWNER/motion-studio-pro/discussions)
- 🐛 Report issues on [GitHub Issues](https://github.com/OWNER/motion-studio-pro/issues)
- 📧 Email maintainers (see README)

## Recognition

Contributors will be:
- Added to the README contributors section
- Mentioned in release notes
- Credited in commit history

Thank you for contributing to Motion Studio Pro! 🎉
