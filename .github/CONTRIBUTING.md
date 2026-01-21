# Contributing to S - URL Shortener

Thank you for considering contributing to this project! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/thenolle/url-shortener.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Code Style

- Use TypeScript
- Follow existing code patterns
- No semicolons
- Single quotes for strings
- DRY principles
- Add comments for complex logic
- Use descriptive variable names

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat: add QR code download button`

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update documentation for new features
3. Ensure all tests pass
4. Request review from maintainers
5. Address review feedback
6. Merge will be done by maintainers after approval

## Testing

- Test your changes locally with Docker
- Verify database migrations work
- Test both authenticated and non-authenticated flows
- Check mobile responsiveness for UI changes

## Reporting Bugs

Use the Bug Report template when creating an issue. Include:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Logs if applicable

## Feature Requests

Use the Feature Request template. Explain:

- The problem you're solving
- Your proposed solution
- Why this benefits other users

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## Questions?

Open a discussion or ask in the issue tracker.

Thank you for contributing!