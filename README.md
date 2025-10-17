# 🌌 Orbit - Visual Knowledge Graph

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-646cff.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ecf8e.svg)](https://supabase.com/)

> Transform your scattered thoughts into a connected universe of knowledge

**Orbit** is a powerful, interactive visual knowledge graph that helps you organize, connect, and explore your ideas in an intuitive network visualization. Build your personal Wikipedia that grows with your thoughts and discoveries.

![Orbit Demo](https://via.placeholder.com/800x400/007acc/ffffff?text=Orbit+Knowledge+Graph+Demo)

## ✨ Features

🧠 **Visual Knowledge Management** - Transform ideas into connected networks  
⚡ **Lightning-Fast Search** - Fuzzy search with `Ctrl+K`  
⌨️ **Keyboard-First Interface** - Complete keyboard navigation  
🌙 **Dark/Light Themes** - Beautiful adaptive interface  
☁️ **Cloud Sync** - Seamless sync across devices  
🔒 **Privacy-First** - Work offline, sync when ready  
🎨 **Interactive Visualization** - Dynamic clustering and animations

## 🚀 Quick Start

### Online Demo

🔗 **[Try Orbit Live](https://your-orbit-app.vercel.app)**

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/orbit-knowledge-graph.git
cd orbit-knowledge-graph

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials (optional for local development)

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## ⌨️ Keyboard Shortcuts

| Shortcut           | Action                 |
| ------------------ | ---------------------- |
| `Ctrl+K`           | Open fuzzy search      |
| `Ctrl+Q`           | Add new root node      |
| `Ctrl+A`           | Add child node         |
| `Enter/F2`         | Edit selected node     |
| `Delete/Backspace` | Delete selected node   |
| `Space`            | Toggle collapse/expand |
| `Ctrl+O`           | Open URL in new tab    |
| `Escape`           | Clear selection        |

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vis-Network
- **Backend**: Supabase (PostgreSQL)
- **Search**: Fuse.js fuzzy search
- **Authentication**: Google OAuth via Supabase
- **Deployment**: Vercel/Netlify ready

## 📖 Documentation

- 📚 **[Complete Documentation](./PROJECT_DOCUMENTATION.md)**
- 🚀 **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**
- 🎯 **[Usage Examples](./examples/)**

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

If you find Orbit helpful, please ⭐ star this repository!

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/orbit/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/orbit/discussions)
- 💬 **Community**: [Discord Server](https://discord.gg/orbit)

---


