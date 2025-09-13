# 🌌 Orbit - Visual Knowledge Graph

![Orbit Logo](https://img.shields.io/badge/Orbit-Knowledge%20Graph-007acc?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-19.1.1-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646cff?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase)

## 📖 Overview

**Orbit** is a powerful, interactive visual knowledge graph application that helps you organize, connect, and explore your ideas, notes, and resources in an intuitive network visualization. Think of it as your personal Wikipedia that grows with your thoughts and discoveries.

### 🎯 What Makes Orbit Special

- **🧠 Visual Knowledge Management**: Transform scattered thoughts into connected knowledge networks
- **⚡ Lightning-Fast Search**: Fuzzy search across all your nodes with intelligent matching
- **⌨️ Keyboard-First**: Complete keyboard navigation for power users
- **🌙 Adaptive Interface**: Beautiful dark/light themes that adapt to your preference
- **☁️ Cloud Sync**: Seamless synchronization across devices with Supabase backend
- **🔒 Privacy-First**: Work offline with local storage, sync when you're ready
- **🎨 Interactive Visualization**: Dynamic graph with clustering, zooming, and smooth animations

## 🚀 Live Demo

🔗 **[Try Orbit Live](https://your-orbit-app.vercel.app)** _(Will be available after deployment)_

## ✨ Key Features

### 🗺️ Visual Graph Navigation

- **Interactive Network**: Drag, zoom, and explore your knowledge graph
- **Smart Clustering**: Automatically groups related nodes for better organization
- **Hierarchical Structure**: Root nodes, parent nodes, and children create natural hierarchies
- **Real-time Updates**: Changes reflect immediately across the interface

### 🔍 Powerful Search & Navigation

- **Fuzzy Search** (`Ctrl+K`): Find anything with typo-tolerant search
- **Multi-field Search**: Search across node titles, URLs, and notes simultaneously
- **Keyboard Navigation**: Arrow keys, Enter to select, Tab to edit
- **Smart Actions**: Open URLs, navigate to nodes, or edit directly from search results

### ⌨️ Complete Keyboard Control

- **`Ctrl+Q`**: Add new root node
- **`Ctrl+A`**: Add child node to selected parent
- **`Insert`**: Alternative add child shortcut
- **`Delete/Backspace`**: Delete selected node (with cascade deletion)
- **`Enter/F2`**: Edit selected node
- **`Ctrl+E`**: Edit note for selected node
- **`Ctrl+O`**: Open URL in new tab
- **`Space`**: Toggle collapse/expand for parent nodes
- **`Escape`**: Clear selection
- **`Ctrl+K`**: Open fuzzy search

### 🔗 Rich Node Types

- **Root Nodes** 🌟: Starting points for your knowledge domains
- **Parent Nodes** 📁: Containers that can have children and be collapsed
- **Child Nodes** 📄: Individual pieces of information
- **URL Integration**: Nodes can link to external resources
- **Rich Notes**: Detailed descriptions and context for each node

### 💾 Flexible Data Persistence

- **Local Storage**: Work offline, data persists in your browser
- **Cloud Sync**: Sign in with Google to sync across devices
- **Migration**: Seamlessly move local data to cloud when you sign up
- **Backup**: Automatic saving prevents data loss

### 🎨 Polished User Experience

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Easy on the eyes, day or night
- **Visual Feedback**: Keyboard shortcuts show helpful feedback messages
- **Intuitive Toolbar**: Fixed toolbar with context-aware button states
- **Smooth Animations**: Delightful transitions and interactions

## 🛠️ Technical Architecture

### Frontend Stack

- **React 19.1.1**: Modern React with hooks and concurrent features
- **Vite 7.1.2**: Lightning-fast build tool and dev server
- **Vis-Network**: Powerful graph visualization library
- **Fuse.js**: Fuzzy search implementation
- **Radix UI**: Accessible, unstyled UI components

### Backend & Services

- **Supabase**: PostgreSQL database with real-time subscriptions
- **Google OAuth**: Secure authentication
- **Vercel**: Deployment and hosting platform

### Key Libraries & Tools

```json
{
  "vis-network": "^10.0.1", // Graph visualization
  "fuse.js": "^7.1.0", // Fuzzy search
  "@supabase/supabase-js": "^2.57.4", // Database client
  "@radix-ui/react-dialog": "^1.1.15", // Modal components
  "clsx": "^2.1.1", // Conditional class names
  "lucide-react": "^0.542.0" // Beautiful icons
}
```

## 📁 Project Structure

```
orbit/
├── src/
│   ├── components/
│   │   ├── Graph.jsx              # Main graph component with all logic
│   │   ├── NodeModal.jsx          # Modal for adding/editing nodes
│   │   ├── FuzzySearch.jsx        # Search interface with fuzzy matching
│   │   ├── AuthPage.jsx           # Authentication interface
│   │   ├── styles.js              # Centralized styling system
│   │   ├── supabaseClient.js      # Database connection configuration
│   │   ├── api.js                 # Database operations (CRUD)
│   │   └── ui/
│   │       └── GridBg.jsx         # Animated background component
│   ├── services/
│   │   ├── AuthContext.jsx        # Authentication state management
│   │   └── DataService.jsx        # Data persistence layer
│   ├── lib/
│   │   └── utils.jsx              # Utility functions
│   ├── assets/                    # Icons and images
│   ├── App.jsx                    # Root application component
│   └── main.jsx                   # Application entry point
├── public/                        # Static assets
├── package.json                   # Dependencies and scripts
├── vite.config.js                # Build configuration
└── README.md                      # Project documentation
```

## 🏗️ Core Components Deep Dive

### Graph.jsx - The Heart of Orbit

The main component that orchestrates the entire application:

**Key Responsibilities:**

- **Network Visualization**: Manages vis-network instance and rendering
- **State Management**: Handles node selection, theme, modals, and user session
- **Event Handling**: Processes keyboard shortcuts, mouse interactions, and double-clicks
- **Data Operations**: CRUD operations on nodes and edges
- **Clustering Logic**: Handles parent node collapse/expand functionality
- **Auto-save**: Persists changes to local storage and cloud

**Key Features:**

- Smart clustering with bottom-up order for initial setup
- Cascade deletion (deleting a parent removes all children)
- Keyboard shortcuts with visual feedback
- Theme-aware styling and network options
- Session management with anonymous/authenticated modes

### FuzzySearch.jsx - Intelligent Search

Advanced search interface powered by Fuse.js:

**Key Features:**

- **Multi-field Search**: Searches node labels, URLs, and notes
- **Fuzzy Matching**: Handles typos and partial matches
- **Real-time Results**: Live search as you type
- **Keyboard Navigation**: Full keyboard control with arrow keys
- **Smart Highlighting**: Shows matching text with visual emphasis
- **Multiple Actions**: Navigate, edit, or open URLs directly from results
- **Performance**: Configurable result limits and search thresholds

### NodeModal.jsx - Node Editor

Flexible modal system for node creation and editing:

**Key Features:**

- **Multi-mode Support**: Add root, add child, edit node, edit note modes
- **Form Validation**: Ensures data integrity
- **Theme Integration**: Adapts to dark/light theme
- **Accessibility**: Built with Radix UI for screen reader support
- **Real-time Preview**: See changes as you type

## 🔧 Database Schema

### Nodes Table

```sql
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT,
  note TEXT,
  is_root BOOLEAN DEFAULT FALSE,
  is_parent BOOLEAN DEFAULT FALSE,
  shape TEXT DEFAULT 'box',
  value INTEGER DEFAULT 20,
  client_id TEXT, -- For temporary client-side IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Edges Table

```sql
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎮 Usage Guide

### Getting Started

1. **Open Orbit**: Navigate to the application
2. **Start Building**: Click "Add Root" or use `Ctrl+Q` to create your first knowledge node
3. **Add Children**: Select a parent node and use `Ctrl+A` or click "Add Child"
4. **Connect Ideas**: Build your knowledge graph by adding related nodes

### Power User Tips

- **Use Keyboard Shortcuts**: Much faster than clicking buttons
- **Organize with Hierarchy**: Use root nodes for major topics, parents for categories
- **Rich Linking**: Add URLs to external resources and websites
- **Search Everything**: Use `Ctrl+K` to quickly find any node
- **Collapse for Focus**: Use `Space` to hide children and focus on structure

### Best Practices

- **Start with Domains**: Create root nodes for major areas of knowledge
- **Use Descriptive Labels**: Make node titles searchable and clear
- **Add Context**: Use notes to provide additional details
- **Link External Resources**: Include URLs for deeper exploration
- **Regular Review**: Use search to rediscover and connect old knowledge

## 🚀 Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for cloud features)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/orbit-knowledge-graph.git
cd orbit-knowledge-graph

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## 🤝 Contributing

We welcome contributions! Here are some ways you can help:

- 🐛 **Bug Reports**: Found an issue? Open a GitHub issue
- 💡 **Feature Requests**: Have an idea? Let's discuss it
- 🔧 **Code Contributions**: Fork, code, and submit a pull request
- 📖 **Documentation**: Help improve guides and examples
- 🧪 **Testing**: Help test new features and edge cases

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

### Near Term (v1.1)

- [ ] 📱 Mobile app with React Native
- [ ] 🔄 Real-time collaboration
- [ ] 📊 Analytics and insights
- [ ] 🎨 Custom themes and styling
- [ ] 📤 Export to various formats (JSON, CSV, PNG)

### Future (v2.0+)

- [ ] 🤖 AI-powered suggestions and connections
- [ ] 🔗 Integration with note-taking apps (Obsidian, Notion)
- [ ] 📚 Public knowledge graphs and sharing
- [ ] 🔍 Advanced query language
- [ ] 🔔 Smart notifications and reminders

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **vis-network** for the amazing graph visualization capabilities
- **Supabase** for the seamless backend-as-a-service
- **Radix UI** for accessible, unstyled components
- **Fuse.js** for powerful fuzzy search functionality
- **React** and **Vite** for the excellent developer experience

## 💬 Support

- 📧 **Email**: support@orbit-app.com
- 💬 **Discord**: [Join our community](https://discord.gg/orbit)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/orbit/issues)
- 📖 **Documentation**: [Full Docs](https://docs.orbit-app.com)

---

**Built with ❤️ for knowledge workers, researchers, students, and anyone who loves connecting ideas.**

_Start building your knowledge universe today!_ 🌌
