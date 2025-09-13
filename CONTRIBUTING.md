# Contributing to Orbit

Thank you for your interest in contributing to Orbit! We welcome contributions from everyone.

## How to Contribute

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-username/orbit/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/GIFs if applicable
   - Browser and OS information

### 💡 Suggesting Features

1. Check [Discussions](https://github.com/your-username/orbit/discussions) for existing suggestions
2. Create a new discussion with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### 🔧 Code Contributions

1. **Fork the repository**

```bash
git clone https://github.com/your-username/orbit.git
cd orbit
```

2. **Set up development environment**

```bash
npm install
npm run dev
```

3. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

4. **Make your changes**

   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

5. **Test your changes**

   - Test keyboard shortcuts
   - Test different themes
   - Test offline functionality
   - Test with different data sizes

6. **Commit and push**

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

7. **Create a Pull Request**
   - Clear title and description
   - Reference related issues
   - Include screenshots/GIFs for UI changes

## Development Guidelines

### 🏗️ Code Style

- Use functional components with hooks
- Prefer `const` over `let` when possible
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Follow existing indentation and formatting

### 🧪 Testing

- Test keyboard shortcuts in different browsers
- Test with various graph sizes (1 node to 100+ nodes)
- Test offline/online state transitions
- Test authentication flows

### 📱 Responsive Design

- Test on mobile devices
- Ensure keyboard shortcuts work on tablets
- Verify touch interactions

### ⚡ Performance

- Avoid unnecessary re-renders
- Use `useCallback` and `useMemo` appropriately
- Test with large datasets
- Monitor bundle size impact

## Areas We Need Help With

### 🎨 UI/UX

- Mobile experience improvements
- Accessibility enhancements
- Animation and micro-interactions
- Custom themes and styling

### 🔧 Features

- Export functionality (PDF, PNG, JSON)
- Import from other tools
- Advanced search filters
- Collaboration features

### 📖 Documentation

- Tutorial videos
- Usage examples
- API documentation
- Keyboard shortcut guides

### 🌐 Internationalization

- Multi-language support
- RTL layout support
- Locale-specific formatting

### 🧪 Testing

- Unit tests for core functionality
- E2E tests for user workflows
- Performance benchmarks
- Browser compatibility testing

## Recognition

Contributors will be:

- Added to the README contributors section
- Mentioned in release notes
- Invited to join our Discord community
- Given priority support for their own issues

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please be respectful and inclusive in all interactions.

## Questions?

- 💬 Join our [Discord](https://discord.gg/orbit)
- 📧 Email: contributors@orbit-app.com
- 🐛 Open an [Issue](https://github.com/your-username/orbit/issues)
- 💡 Start a [Discussion](https://github.com/your-username/orbit/discussions)

Thank you for helping make Orbit better! 🌌
