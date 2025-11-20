# Contributing to NeuroNote

First off, thank you for considering contributing to NeuroNote! It's people like you that make NeuroNote such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. Please be kind and constructive in your interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, code snippets, etc.)
- **Describe the behavior you observed and what you expected**
- **Include your environment details** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** - follow the existing code style
3. **Test your changes** - make sure everything works
4. **Update documentation** if needed (README, code comments)
5. **Commit with clear messages** - describe what and why
6. **Push to your fork** and submit a pull request

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Make your changes
5. Test thoroughly

## Project Structure

```
neuronote/
├── components/      # React components
├── services/        # Business logic & APIs
├── utils/          # Helper functions
├── data/           # Note storage
└── server.js       # Express backend
```

## Coding Guidelines

### TypeScript/JavaScript
- Use TypeScript for new files
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions small and focused

### React Components
- Use functional components with hooks
- Keep components focused on a single responsibility
- Use meaningful prop names
- Add TypeScript interfaces for props

### Styling
- Use Tailwind CSS utility classes
- Follow existing color scheme (brand colors)
- Ensure responsive design
- Test on different screen sizes

### Commits
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Reference issues and pull requests when relevant
- Keep commits focused and atomic

Examples:
```
✅ Add slash command for code blocks
✅ Fix graph centering on active node
✅ Update README with new features
❌ Fixed bugs and added stuff
```

## Feature Development Checklist

When adding a new feature:

- [ ] Code implementation
- [ ] TypeScript types/interfaces
- [ ] Error handling
- [ ] User-facing documentation
- [ ] Code comments for complex parts
- [ ] Test the feature thoroughly
- [ ] Update README if needed
- [ ] Consider accessibility

## Areas That Need Help

- **Mobile responsiveness** - Make the app work great on mobile
- **Dark mode** - Complete dark mode implementation
- **Export/Import** - Add note export in various formats
- **Performance** - Optimize for large note collections
- **Tests** - Add unit and integration tests
- **Documentation** - Improve inline documentation
- **Accessibility** - Improve keyboard navigation and screen readers

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Recognition

Contributors will be recognized in the README and release notes.

---

Thank you for contributing to NeuroNote! 🎉
