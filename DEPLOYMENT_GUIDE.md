# 🚀 Orbit Deployment Guide - Release to the World

This guide will walk you through releasing your Orbit knowledge graph application to the world, from setting up the infrastructure to marketing your project.

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation

- [ ] Update `package.json` version and metadata
- [ ] Add proper README.md with setup instructions
- [ ] Ensure all environment variables are documented
- [ ] Add error handling and loading states
- [ ] Test keyboard shortcuts across different browsers
- [ ] Optimize bundle size and performance
- [ ] Add proper meta tags for SEO

### ✅ Security & Privacy

- [ ] Implement rate limiting for API calls
- [ ] Add CORS configuration
- [ ] Secure environment variables
- [ ] Add privacy policy and terms of service
- [ ] Implement proper authentication flow
- [ ] Add data export functionality for GDPR compliance

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for React Apps)

**Why Vercel?**

- ✅ Zero-config deployment for React/Vite apps
- ✅ Automatic HTTPS and global CDN
- ✅ Git integration with preview deployments
- ✅ Serverless functions support
- ✅ Free tier with generous limits

**Step-by-Step Deployment:**

1. **Prepare Your Repository**

```bash
# Ensure your code is committed and pushed to GitHub
git add .
git commit -m "Ready for production deployment"
git push origin main
```

2. **Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from your project root)
vercel

# Follow the prompts:
# - Link to existing project? No
# - What's your project's name? orbit-knowledge-graph
# - In which directory is your code located? ./
# - Want to override the settings? No
```

3. **Configure Environment Variables**

```bash
# Add environment variables through Vercel dashboard or CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Redeploy with environment variables
vercel --prod
```

4. **Custom Domain (Optional)**

```bash
# Add your custom domain
vercel domains add yourdomain.com
vercel alias your-deployment-url.vercel.app yourdomain.com
```

### Option 2: Netlify

**Setup:**

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Enable automatic deployments

### Option 3: GitHub Pages + GitHub Actions

**Setup:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

```bash
# Go to https://supabase.com
# Create new project
# Note down your project URL and anon key
```

### 2. Set up Database Schema

```sql
-- Enable Row Level Security
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

-- Create nodes table
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
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create edges table
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
CREATE POLICY "Users can only see their own nodes" ON nodes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own edges" ON edges
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_edges_user_id ON edges(user_id);
CREATE INDEX idx_edges_from_node ON edges(from_node_id);
CREATE INDEX idx_edges_to_node ON edges(to_node_id);
```

### 3. Configure Authentication

```sql
-- Enable Google OAuth in Supabase Dashboard
-- Authentication > Providers > Google
-- Add your OAuth credentials
```

### 4. Set up hCaptcha (Optional but Recommended)

1. **Create hCaptcha Account**:

   - Go to https://www.hcaptcha.com/
   - Sign up for a free account

2. **Create a Site**:

   - Click "New Site" in your dashboard
   - Add your domains:
     - `localhost` (for development)
     - Your Vercel domain
     - Any custom domains
   - Copy your **Site Key**

3. **Configure in Supabase**:

   - Go to Authentication → Settings → Security and Protection
   - Enable "Enable CAPTCHA protection"
   - Select "hCaptcha" as provider
   - Enter your **Secret Key** from hCaptcha

4. **Add to Environment Variables**:

   ```bash
   VITE_HCAPTCHA_SITE_KEY=your_site_key_here
   ```

5. **Local Development**:
   - For localhost testing, hCaptcha works out of the box
   - For custom local domains, add them to your hCaptcha site settings

## 📱 Progressive Web App (PWA) Setup

### 1. Add PWA Manifest

```json
// public/manifest.json
{
  "name": "Orbit - Visual Knowledge Graph",
  "short_name": "Orbit",
  "description": "Build and explore your knowledge graph visually",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#007acc",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Add Service Worker

```javascript
// public/sw.js
const CACHE_NAME = "orbit-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 🔧 Production Optimizations

### 1. Update Package.json

```json
{
  "name": "orbit-knowledge-graph",
  "version": "1.0.0",
  "description": "Visual Knowledge Graph for organizing and exploring ideas",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "homepage": "https://orbit-knowledge-graph.vercel.app",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/orbit-knowledge-graph.git"
  },
  "keywords": [
    "knowledge-graph",
    "visualization",
    "note-taking",
    "mind-mapping",
    "research-tool"
  ]
}
```

### 2. Add Performance Monitoring

```javascript
// src/utils/analytics.js
export const trackEvent = (eventName, properties = {}) => {
  // Add your analytics service (Google Analytics, Mixpanel, etc.)
  if (typeof gtag !== "undefined") {
    gtag("event", eventName, properties);
  }
};

// Usage in components
trackEvent("node_created", { nodeType: "root" });
trackEvent("search_performed", { queryLength: searchTerm.length });
```

### 3. Error Boundary

```jsx
// src/components/ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## 📈 Marketing & Distribution

### 1. Product Hunt Launch

- Create compelling screenshots and GIFs
- Write engaging description highlighting unique features
- Schedule launch for Tuesday-Thursday
- Prepare maker comment and updates

### 2. Social Media Strategy

```markdown
**Twitter/X:**

- Share development journey with #BuildInPublic
- Post feature demos and keyboard shortcuts
- Engage with productivity and note-taking communities

**LinkedIn:**

- Write article about visual knowledge management
- Share in relevant professional groups
- Connect with researchers and knowledge workers

**Reddit:**

- r/productivity
- r/notetaking
- r/webdev
- r/reactjs
- r/SideProject
```

### 3. Content Marketing

- Write blog posts about knowledge graphs
- Create YouTube tutorials
- Guest post on productivity blogs
- Participate in knowledge management forums

### 4. Community Building

- Create Discord server for users
- Start GitHub discussions
- Respond to user feedback quickly
- Build roadmap based on user needs

## 📊 Analytics & Monitoring

### 1. User Analytics

```javascript
// Google Analytics 4 setup
gtag("config", "GA_MEASUREMENT_ID", {
  custom_map: {
    custom_parameter_1: "node_type",
    custom_parameter_2: "search_type",
  },
});

// Track key user actions
gtag("event", "node_created", {
  custom_parameter_1: "root",
  event_category: "engagement",
});
```

### 2. Performance Monitoring

```javascript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  gtag("event", metric.name, {
    value: Math.round(
      metric.name === "CLS" ? metric.value * 1000 : metric.value
    ),
    event_category: "Web Vitals",
    event_label: metric.id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 3. Error Tracking

```javascript
// Sentry setup for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

## 🚀 Launch Checklist

### Pre-Launch (1 week before)

- [ ] Test on multiple devices and browsers
- [ ] Verify all keyboard shortcuts work
- [ ] Test offline functionality
- [ ] Prepare marketing materials
- [ ] Set up analytics and monitoring
- [ ] Create support documentation

### Launch Day

- [ ] Deploy to production
- [ ] Submit to Product Hunt
- [ ] Post on social media
- [ ] Share in relevant communities
- [ ] Monitor for issues and user feedback
- [ ] Respond to comments and questions

### Post-Launch (1 week after)

- [ ] Analyze user behavior and feedback
- [ ] Fix any critical bugs
- [ ] Plan next features based on feedback
- [ ] Thank early users and supporters
- [ ] Write post-mortem blog post

## 💰 Monetization Options

### 1. Freemium Model

- **Free Tier**: Local storage, basic features
- **Pro Tier ($5/month)**: Cloud sync, advanced search, collaboration
- **Team Tier ($15/month)**: Shared workspaces, admin controls

### 2. One-time Purchase

- **Lifetime License ($49)**: All features, future updates included

### 3. Enterprise

- **Custom Pricing**: Self-hosted, SSO, advanced security

## 🔮 Future Development

### Immediate (v1.1)

- Mobile responsiveness improvements
- Export functionality (JSON, PNG, PDF)
- Bulk operations
- Advanced search filters

### Short-term (v1.2-1.5)

- Real-time collaboration
- Public knowledge graphs
- API for integrations
- Custom themes

### Long-term (v2.0+)

- AI-powered suggestions
- Mobile app (React Native)
- Obsidian/Notion integrations
- Advanced analytics

---

## 🎯 Quick Start Deployment

**Want to deploy right now? Here's the fastest path:**

```bash
# 1. Prepare your repo
git add .
git commit -m "Ready for production"
git push origin main

# 2. Deploy to Vercel
npx vercel --prod

# 3. Set up Supabase
# - Go to supabase.com
# - Create project
# - Run SQL schema (from above)
# - Add environment variables to Vercel

# 4. Test your live app!
```

Your Orbit knowledge graph is now live and ready for the world! 🌍✨

Remember: **Launch early, iterate fast, and listen to your users!**
