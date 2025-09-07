# Orbit Graph Component - Detailed Explanation

## High-Level Overview

The Orbit app is a **Visual Knowledge Graph** that lets users create, organize, and connect ideas in a tree-like structure. Think of it like a mind map where you can:

- Create nodes (boxes/circles) that represent ideas, topics, or information
- Connect these nodes in parent-child relationships
- Collapse groups of nodes into clusters to keep things organized
- Add URLs and notes to each node
- Switch between dark and light themes

## File Structure & Main Components

### 1. **Imports & Setup**

```jsx
import React, { useRef, useEffect, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
```

- **React hooks**: `useRef`, `useEffect`, `useState` for managing component state
- **vis-network**: A powerful library for creating interactive network graphs
- **DataSet & Network**: Core classes from vis-network for managing graph data

---

## Function Breakdown (High Level)

### **Data Storage Functions (2 functions)**

1. `saveDataToLocalStorage()` - Saves your graph to browser storage
2. `loadDataFromLocalStorage()` - Loads your saved graph when you return

### **UI Helper Functions (4 functions)**

3. `generateNodeTitle()` - Creates the hover tooltips for nodes
4. `ThemeToggle()` - The sun/moon button for switching themes
5. `FixedToolbar()` - The sidebar with Add/Delete/Edit buttons
6. `ProjectHeader()` - The "Orbit" title at the top left

### **Graph Logic Functions (6 functions)**

7. `createInitialData()` - Creates the starting "Root" node
8. `handleAddNode()` - Creates new nodes when you click "Add Child"
9. `handleEditNode()` - Edits existing nodes
10. `handleAddEditNote()` - Adds/edits notes on nodes
11. `handleDeleteNode()` - Deletes nodes and their children
12. `collapseNode()` - Groups child nodes into colored clusters

### **Main Component (1 function)**

13. `Graph()` - The main React component that ties everything together

---

## Detailed Function Explanations

### **1. Data Storage Functions**

#### `saveDataToLocalStorage(nodes, edges, collapsedIds)`

```jsx
const saveDataToLocalStorage = (nodes, edges, collapsedIds) => {
  try {
    const plainNodes = nodes.get({ returnType: "Array" });
    const plainEdges = edges.get({ returnType: "Array" });
    const plainCollapsed = Array.from(collapsedIds);
    const dataToStore = JSON.stringify({
      nodes: plainNodes,
      edges: plainEdges,
      collapsed: plainCollapsed,
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
  } catch (error) {
    console.error("Failed to save graph data:", error);
  }
};
```

**What it does**: Saves your entire graph to the browser's local storage so it persists when you refresh the page.

**How it works**:

- `nodes.get({ returnType: 'Array' })`: Converts the vis-network DataSet into a plain JavaScript array
- `JSON.stringify()`: Converts the data into a text string that can be stored
- `localStorage.setItem()`: Browser API that saves data locally (like a simple database)
- `try/catch`: Error handling - if saving fails, it logs an error instead of crashing

**Concepts**:

- **Local Storage**: Browser feature that saves data on your computer (persists between sessions)
- **JSON**: JavaScript Object Notation - a way to convert objects to text and back

#### `loadDataFromLocalStorage()`

```jsx
const loadDataFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData === null) return null;
    return JSON.parse(savedData);
  } catch (error) {
    console.error("Failed to load graph data:", error);
    return null;
  }
};
```

**What it does**: Retrieves your saved graph when you open the app.

**How it works**:

- `localStorage.getItem()`: Gets the saved data from browser storage
- `JSON.parse()`: Converts the text string back into JavaScript objects
- Returns `null` if no data exists (first time using the app)

---

### **2. UI Helper Functions**

#### `generateNodeTitle(node)`

```jsx
const generateNodeTitle = (node) => {
  const container = document.createElement("div");
  container.style.padding = "8px";
  container.style.fontFamily = "Electrolize, sans-serif";
  // ... more styling and content
  return container;
};
```

**What it does**: Creates the tooltip that appears when you hover over a node.

**How it works**:

- `document.createElement()`: Creates HTML elements dynamically (not using JSX here)
- Builds a tooltip showing: node label, URL (if exists), and notes (if exists)
- Uses inline styles for formatting
- Returns an HTML element that vis-network can display

**Concepts**:

- **DOM Manipulation**: Creating HTML elements using JavaScript instead of JSX
- **Dynamic Content**: The tooltip content changes based on the node's data

#### `ThemeToggle({ isDark, onToggle })`

```jsx
const ThemeToggle = ({ isDark, onToggle }) => (
  <div
    style={getThemeToggleStyle(isDark)}
    onClick={onToggle}
    title="Toggle theme"
  >
    <span style={{ fontSize: "20px" }}>{isDark ? "🌞" : "🌙"}</span>
  </div>
);
```

**What it does**: The sun/moon button that switches between dark and light themes.

**How it works**:

- **Functional Component**: A simple React component that takes props
- **Conditional Rendering**: Shows sun emoji in dark mode, moon emoji in light mode
- **Event Handling**: `onClick={onToggle}` calls a function when clicked
- **Props**: Receives `isDark` (boolean) and `onToggle` (function) from parent component

**Concepts**:

- **Props**: Data passed from parent component to child component
- **Conditional Rendering**: `{isDark ? '🌞' : '🌙'}` - shows different content based on condition
- **Event Handling**: Responding to user clicks

---

### **3. Main Component & React Hooks**

#### `Graph()` - The Main Component

```jsx
export default function Graph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  // ... more state and logic
}
```

**What it does**: This is the main React component that contains all the graph functionality.

**React Hooks Used**:

##### **`useRef`**

```jsx
const containerRef = useRef(null);
const networkRef = useRef(null);
```

- **Purpose**: Create references to DOM elements and objects that persist across re-renders
- `containerRef`: Points to the HTML div where the graph will be drawn
- `networkRef`: Points to the vis-network instance for controlling the graph
- **Why not state**: These don't trigger re-renders when changed (unlike useState)

##### **`useState`**

```jsx
const [selectedNodeId, setSelectedNodeId] = useState(null);
const [isDark, setIsDark] = useState(true);
```

- **Purpose**: Manage component state that triggers re-renders when changed
- `selectedNodeId`: Tracks which node is currently selected (null = no selection)
- `isDark`: Boolean flag for dark/light theme
- **Pattern**: `[value, setter] = useState(initialValue)`

##### **Complex State Initialization**

```jsx
const [data] = useState(() => {
  const savedData = loadDataFromLocalStorage();
  if (savedData && savedData.nodes) {
    // Load saved data
    const nodes = new DataSet(savedData.nodes);
    const edges = new DataSet(savedData.edges);
    return { nodes, edges };
  }
  return createInitialData(); // Create fresh data
});
```

**What this does**: Initializes the graph data, either from saved data or creates a new "Root" node.

**Concepts**:

- **Lazy Initial State**: The function `() => {...}` only runs once on first render
- **DataSet**: vis-network's way of storing node and edge data (like a smart array)
- **Conditional Logic**: Checks if saved data exists, otherwise creates new data

##### **`useEffect`**

```jsx
useEffect(() => {
  // Setup code
  const network = new Network(containerRef.current, data, options);

  // Cleanup function
  return () => {
    network.destroy();
  };
}, [data]); // Dependency array
```

**What it does**: Handles side effects (things that happen outside of React's render cycle).

**Concepts**:

- **Side Effects**: DOM manipulation, API calls, event listeners, etc.
- **Dependency Array**: `[data]` - effect runs when `data` changes
- **Cleanup Function**: The returned function runs when component unmounts or dependencies change
- **Network Creation**: Creates the vis-network graph instance

---

### **4. Event Handlers**

#### `handleAddNode()`

```jsx
const handleAddNode = () => {
  if (!selectedNodeId) return;

  const label = prompt("Enter a label for the new node:", "New Node");
  if (!label) return;

  const newNode = {
    id: Date.now(), // Unique ID using timestamp
    label,
    url: url || "",
    isParent: isParent,
    shape: isParent ? "ellipse" : "box",
  };

  data.nodes.add(newNode);
  data.edges.add({ from: selectedNodeId, to: newNode.id });
};
```

**What it does**: Creates a new child node connected to the selected node.

**How it works**:

1. **Guard Clause**: `if (!selectedNodeId) return;` - exit if no node selected
2. **User Input**: `prompt()` asks user for node name and URL
3. **Data Creation**: Creates node object with unique ID (using timestamp)
4. **Graph Updates**: Adds node to nodes DataSet and creates edge connection

**Concepts**:

- **Guard Clauses**: Early return statements to handle invalid conditions
- **Unique IDs**: `Date.now()` gives current timestamp (guaranteed unique)
- **Data Mutation**: Adding to DataSet automatically updates the visual graph

#### `collapseNode(networkInstance, parentId)`

```jsx
const collapseNode = (networkInstance, parentId) => {
  // Find all child nodes
  const childNodes = data.edges
    .get({ filter: (edge) => edge.from === parentId })
    .map((edge) => edge.to);

  // Create cluster with dynamic sizing and random colors
  const clusterNodeProperties = {
    id: `cluster-${parentId}`,
    label: `${node.label} (+${childCount})`,
    size: finalSize, // Based on number of children
    color: { background: clusterColor.bg, border: clusterColor.border },
  };

  networkInstance.cluster({
    joinCondition: (childNode) =>
      childNodes.includes(childNode.id) || childNode.id === parentId,
    clusterNodeProperties: clusterNodeProperties,
  });
};
```

**What it does**: Groups a parent node and all its children into a single colored cluster node.

**How it works**:

1. **Find Children**: Uses `filter()` to find all edges going out from the parent
2. **Calculate Size**: Normalizes child count (0-1) then scales to reasonable size range
3. **Random Colors**: Uses parent ID to consistently pick same color from color array
4. **Create Cluster**: vis-network's clustering feature groups nodes visually

**Concepts**:

- **Array Methods**: `filter()`, `map()` for data manipulation
- **Normalization**: Converting values to 0-1 range, then scaling to desired range
- **Consistent Randomness**: Using `parentId % colors.length` gives same color each time
- **Clustering**: vis-network feature that visually groups nodes

---

### **5. Data Flow & Architecture**

#### **State Management Pattern**:

```
User Action → Event Handler → State Update → Re-render → Visual Update
```

Example: Adding a node:

1. User clicks "Add Child" button
2. `handleAddNode()` function runs
3. Updates `data.nodes` and `data.edges`
4. vis-network automatically re-renders the graph
5. Auto-save triggers to localStorage

#### **Component Hierarchy**:

```
Graph (main component)
├── GridBg (background)
├── ProjectHeader (title)
├── ThemeToggle (sun/moon button)
├── FixedToolbar (action buttons)
└── vis-network graph (in containerRef div)
```

#### **Data Persistence**:

```
Browser Refresh → loadDataFromLocalStorage() → Initialize state → Render graph
User Action → Update state → saveDataToLocalStorage() → Data persisted
```

---

## Key React Concepts Used

### **1. Component Props**

```jsx
<FixedToolbar
  onAdd={handleAddNode}
  onDelete={handleDeleteNode}
  isDark={isDark}
/>
```

- Data flows down from parent to child components
- Functions can be passed as props to handle events

### **2. State vs Refs**

- **useState**: For data that affects rendering (theme, selected node)
- **useRef**: For values that don't affect rendering (DOM elements, network instance)

### **3. Effect Dependencies**

```jsx
useEffect(() => {
  /* setup graph */
}, [data]); // Runs when data changes
useEffect(() => {
  /* update theme */
}, [isDark]); // Runs when
```
