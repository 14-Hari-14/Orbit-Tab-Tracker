# Orbit Project Documentation

## Overview

Orbit is a visual knowledge graph application that allows users to create hierarchical networks of information with intelligent clustering and search capabilities. This document explains the technical implementation decisions and concepts used throughout the project, assuming a beginner's proficiency in JavaScript and React.

---

## Core React Concepts Explained

### `useState` vs `useRef`

- **`useState`**: Creates a "state variable". When you update it with its setter function (e.g., `setMyState(...)`), React **re-renders** the component and any children to reflect the change. It's used for data that directly drives the UI.

  - _Example_: `const [isDark, setIsDark] = useState(true);` Changing this immediately re-renders the component with the new theme.

- **`useRef`**: Creates a mutable "box" that can hold any value. Updating this value (e.g., `myRef.current = ...`) **does not** cause a re-render. It's used for storing data that needs to persist across renders without affecting the UI directly, or for accessing DOM elements.

**Why we chose `useRef` for graph data:**

```jsx
const nodes = useRef(new DataSet([]));
const edges = useRef(new DataSet([]));
const allNodesRef = useRef(new Map());
```

**Reasoning**: The `vis-network` library handles its own rendering and DOM updates internally. If we stored the graph `nodes` and `edges` in `useState`, every time we added or removed a node, two things would happen:

1.  `vis-network` would update the graph.
2.  React would re-render the entire `<Graph />` component.

This double-rendering is inefficient and causes visual flickering. By using `useRef`, we let `vis-network` manage the visual graph state while React remains unaware of the frequent data changes, preventing unnecessary re-renders and keeping the UI smooth.

### `useEffect`: Handling Side Effects

- **What it is**: A hook that lets you run "side effects" in your component. A side effect is any code that interacts with the world _outside_ of React, such as fetching data, setting up event listeners, or manually manipulating the DOM.

- **How it works**:

  1.  You provide a function to `useEffect`.
  2.  React renders your component to the screen.
  3.  **After** the render is complete, React runs your effect function. This prevents side effects from blocking the UI.

- **The Dependency Array `[...]`**: This is the most important part. It tells React _when_ to re-run your effect.

  - `[]` (empty array): The effect runs **only once**, after the component's initial render. Perfect for setting up things that don't change, like a global event listener or an initial data fetch.
    ```jsx
    useEffect(() => {
      // This runs only once when the component mounts
      fetchInitialData();
    }, []);
    ```
  - `[session, isDark]` (with dependencies): The effect runs once on mount, and then **re-runs only if `session` or `isDark` has changed** since the last render. This is how you react to state or prop changes.
    ```jsx
    useEffect(() => {
      // This re-runs whenever the theme changes
      const options = getNetworkOptions(isDark);
      networkRef.current.setOptions(options);
    }, [isDark]);
    ```
  - No array (omitted): The effect runs after **every single render**. This is rarely what you want and often leads to infinite loops.

- **The Cleanup Function**: The function you `return` from `useEffect` is the cleanup function. React runs it right before the component unmounts (is removed) or before the effect re-runs. This is crucial for preventing memory leaks.

  ```jsx
  useEffect(() => {
    // Effect: Add the listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup: Remove the listener when done
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  ```

### `useCallback`: Memoizing Functions

- **What it is**: A hook that returns a _memoized_ version of a function. "Memoized" means React will remember the function. On subsequent renders, if its dependencies haven't changed, React will give you back the _exact same function instance_ from memory instead of creating a new one.

- **The Problem it Solves (Referential Equality)**: In JavaScript, `function() {} === function() {}` is always `false`. They are two different functions in memory, even with identical code. Every time a React component re-renders, any function defined inside it is re-created. If you pass this "new" function as a prop to a child or as a dependency to `useEffect`, React sees it as a change, which can cause unnecessary re-renders or effects to re-run.

- **Our Use Case**:

  ```jsx
  const handleKeyDown = useCallback(
    async (event) => {
      // ...logic that uses selectedNodeId...
    },
    [selectedNodeId, modalState.isOpen]
  ); // Dependencies

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]); // Dependency on the function itself
  ```

  **Why**: Without `useCallback`, `handleKeyDown` would be a new function on every render. This would cause the `useEffect` to clean up and re-add the event listener on _every single render_, which is very inefficient. With `useCallback`, `handleKeyDown` only changes when `selectedNodeId` or `modalState.isOpen` changes, so the `useEffect` runs much less often.

---

## Data Architecture Decisions

### Three-Layer Data Storage

1.  **Visual Layer (`nodes.current` & `edges.current`)**: `vis-network` DataSet objects containing only _visible_ nodes. This is what the user sees.
2.  **Reference Layer (`allNodesRef.current`)**: A JavaScript `Map` containing _all_ nodes, including those hidden inside collapsed clusters.
3.  **Persistence Layer (Supabase DB & localStorage)**: The permanent storage for the graph data.

**Why this architecture?**
When a node is collapsed, its children are removed from the **Visual Layer** to clean up the UI. However, we still need to be able to search for them. The **Reference Layer** makes this possible by always keeping a complete record of every node, regardless of its visibility. The **Persistence Layer** ensures the data is saved for future sessions.

---

## Clustering System Implementation

### Recursive Collapse & Shallow Expand

- **Recursive Collapse**: When you collapse a parent node, we decided to also collapse all of its descendants that are also parents. This prevents confusing, partially-collapsed states and keeps the graph tidy.
- **Shallow Expand**: When you expand a collapsed node, we only reveal its _direct_ children. Any of those children that were themselves collapsed remain so. This allows users to explore large hierarchies step-by-step without being overwhelmed.

### Database-Driven State

We added an `is_collapsed` boolean column to the `nodes` table in our database. This is the "single source of truth" for the collapsed state. When the app loads, it reads this column to draw the graph correctly from the start. This is simpler and more reliable than trying to sync state changes manually.

---

## Search System Design

### The "Hidden Node" Problem

**Challenge**: How do you find a node that's hidden inside a collapsed cluster?

**Our Solution**: A "Smart Search" that uses the `allNodesRef` reference layer.

1.  The search function (using Fuse.js) queries `allNodesRef`, so it can find any node.
2.  If the found node is not in the visible `nodes.current` DataSet, we know it's hidden.
3.  The code then traces the node's ancestry to find which collapsed parent is hiding it.
4.  It prompts the user: "This node is hidden in 'Cluster X'. Expand it?"
5.  If the user agrees, the code programmatically expands the necessary clusters to reveal the node.

**Why this way?** It provides the best of both worlds: a clean, organized graph and the ability to find anything, no matter how deeply it's nested.

### Fuzzy Search Implementation with Fuse.js

- **What**: To power our search, we use a lightweight and powerful third-party library called **Fuse.js**. This library specializes in "fuzzy searching," which means it can find matches even if the user's search term contains typos or is only a partial match.

- **Why Fuse.js?**: We chose it because it's dependency-free, very fast for client-side searching, and highly configurable. It allows us to fine-tune the search behavior to get the most relevant results without needing a complex backend search engine.

- **How We Implemented It**:

  1.  We create a new `Fuse` instance and provide it with our complete list of nodes from `allNodesRef.current`.
  2.  We configure it to search specific fields (`keys`) within each node object and set a `threshold` for how "fuzzy" the search should be.

  ```jsx
  // Inside the FuzzySearch.jsx component
  import Fuse from "fuse.js";

  const fuse = new Fuse(nodes, {
    // `nodes` is the full list from allNodesRef
    keys: ["label", "note", "url"],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
  });

  // When the user types, we call the search method
  const searchResults = fuse.search(searchTerm);
  ```

  - `keys: ['label', 'note', 'url']`: This tells Fuse.js to only look for matches within these three properties of our node objects.
  - `threshold: 0.3`: This is the core of the "fuzziness". A threshold of `0.0` would require a perfect match, while `1.0` would match anything. `0.3` is a good balance, allowing for minor typos and variations without returning too many irrelevant results.
  - `includeScore: true`: This asks Fuse.js to return a "score" for each result, from `0` (perfect match) to `1` (worst match). We convert this score into the user-friendly percentage that you see in the search results.

### How the Fuzzy Search Algorithm (Bitap) Works

Fuse.js primarily uses an algorithm called **Bitap** (also known as shift-or or shift-and). Here’s a simplified explanation of how it works:

- **The Goal**: Find a search `pattern` (e.g., "search") inside a `text` (e.g., a node's label) while allowing for a certain number of errors (insertions, deletions, or substitutions).

- **The Core Idea (Bitmasking)**: Instead of comparing characters one by one, Bitap uses a clever trick with numbers called **bitmasks**. A bitmask is just a sequence of 0s and 1s (like `01101001`).

  1.  First, it creates a bitmask for each character in the search pattern. This mask essentially says, "This character appears at these positions in the pattern."
  2.  It then maintains a "state" bitmask that represents how much of the pattern has been successfully matched so far as it scans through the text.
  3.  As it moves character by character through the text, it performs bitwise operations (like `SHIFT` and `OR`, hence the name) on the state mask. These operations are extremely fast for a computer to execute.

- **An Analogy**: Imagine you have a cardboard stencil of your search word ("SEARCH"). You slide this stencil across the text you're searching.

  - A normal search is like having a rigid stencil; it only matches if the letters line up perfectly.
  - Bitap is like having a **stretchy stencil**. As you slide it, you can tolerate a little bit of stretching (an **insertion**), squishing (a **deletion**), or having a letter not quite line up (a **substitution**). The `threshold` determines how much stretching and mismatch is allowed before you decide it's not a match.

- **Why It's Good for Our Use Case**: The Bitap algorithm is exceptionally fast for finding relatively short patterns (like user search queries) in text, making it perfect for the instant, client-side search experience we wanted in Orbit.

### A Quick Look at Other Fuzzy Search Algorithms

While Fuse.js uses Bitap, it's helpful to know about other common algorithms to understand the landscape of fuzzy searching.

- **Levenshtein Distance**:

  - **What it is**: The most famous "edit distance" algorithm. It measures the difference between two strings by counting the minimum number of single-character edits (insertions, deletions, or substitutions) required to change one string into the other.
  - **Example**: The Levenshtein distance between "saturday" and "sunday" is 3 (delete 'a' and 't', change 'r' to 'n').
  - **Use Case**: Excellent for spell-checking and finding the "closest" possible match. It's very accurate but can be computationally slower than Bitap for simply finding if a pattern exists within a larger text.

- **Jaro-Winkler Distance**:

  - **What it is**: A measure of similarity that is particularly effective for short strings like personal names. It gives a score from 0 (no similarity) to 1 (identical).
  - **How it works**: It focuses on the number of matching characters and the number of "transpositions" (characters that are swapped, like `martha` vs. `marhta`). The "Winkler" part of the name adds a bonus for strings that match from the beginning, making it great for autocomplete-style matching.
  - **Use Case**: Ideal for comparing names or short identifiers, but less effective for searching for a small pattern within a large body of text.

- **N-grams**:
  - **What it is**: This approach breaks down strings into overlapping chunks of N characters. For example, the 2-grams (or "bigrams") of "search" are "se", "ea", "ar", "rc", "ch".
  - **How it works**: To compare two strings, you compare their sets of n-grams. The more n-grams they have in common, the more similar they are considered.
  - **Use Case**: Very good at finding partial matches (e.g., finding "search" inside "research") and is resilient to word order changes, but can be less precise than edit-distance algorithms for typo correction.

**Conclusion**: While all these algorithms are powerful, **Bitap (used by Fuse.js)** provides the best balance of speed, accuracy, and configuration for our specific need: finding short user queries inside node properties, instantly, on the client's browser.

---

## Asynchronous Operations (`async/await`)

**Why `async/await`?**
Database calls and animations are not instant. `async/await` is modern JavaScript syntax that lets us write asynchronous code that looks and reads like synchronous code, avoiding messy `.then()` chains (known as "callback hell").

```jsx
const collapseNode = useCallback(async (parentId) => {
  // Wait for the database update to complete before proceeding
  await updateNodeInSupabase({ id: parentId, is_collapsed: true });
  // Now update the UI
  nodes.current.update(clusteredParent);
}, []);
```

This ensures operations happen in the correct, predictable order.

---

## Event Handling & UI Patterns

### Context-Aware Keyboard Shortcuts

- **What**: We implemented global keyboard shortcuts (`Ctrl+A` to add, `Delete` to remove, etc.) that are context-aware.
- **Why**: To provide a fast "power user" experience without interfering with basic text input. A user typing "A" in the node label form shouldn't trigger the "Add Node" action.
- **How**: The global `handleKeyDown` function first checks if the user is currently focused on an input field. If they are, the function immediately returns and does nothing.
  ```jsx
  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return; // Do nothing if typing in a form
      }
      // ... handle shortcuts ...
    },
    [
      /* dependencies */
    ]
  );
  ```

### Centralized Modal State

- **What**: Instead of having multiple `useState` flags like `isAddModalOpen`, `isEditModalOpen`, etc., we use a single state object to manage all modals.
- **Why**: This pattern is cleaner and prevents bugs where multiple modals could be open simultaneously. It centralizes all the information needed for any modal into one place.
- **How**: We use a state object that holds the open/closed status, the current `mode` ('add', 'edit', 'note'), and any data the modal needs, like the node being edited.
  ```jsx
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    nodeData: null,
    parentId: null,
  });
  ```

---

## Data Integrity and Safety

### Recursive Deletion

- **What**: When a user deletes a parent node, all of its children, grandchildren, and so on (all descendants) are also deleted.
- **Why**: This prevents "orphaned" nodes from floating around in the database, disconnected from the main graph. It aligns with the user's mental model: deleting a folder should also delete its contents.
- **How**: Before deleting the selected node, the `handleDeleteNode` function first calls a helper, `getAllDescendants()`, to build a complete list of all nodes to be removed. It then iterates through this list, deleting each one from the database and the visual graph, before finally deleting the parent itself. A confirmation prompt always warns the user of the total number of nodes that will be deleted.

### Graceful Error Handling

- **What**: If a database operation fails (e.g., due to a network error), the application doesn't crash. Instead, it logs the error and continues to function using local data.
- **Why**: This makes the application more resilient and reliable. The user can continue working, and their changes will be saved to `localStorage`, even if the connection to the database is temporarily lost.
- **How**: We wrap all our Supabase API calls in `try...catch` blocks. If the `catch` block is triggered, we log the error to the console for debugging but allow the application to proceed.

---

## Authentication & Data Flow

### Dual-Mode Operation

- **Anonymous Users**: The app is fully functional without an account. All data is saved to the browser's `localStorage`. This provides a frictionless "try before you buy" experience.
- **Authenticated Users**: Upon logging in with Google, the app switches to using Supabase as the primary data source. This enables cross-device synchronization.

**Why?** This dual-mode approach maximizes accessibility. Casual users can start immediately, while power users get the benefit of a persistent, cloud-synced account.

### CAPTCHA-Protected Login

- **What**: We use hCaptcha to protect the Google login flow.
- **Why**: To prevent bots or automated scripts from abusing the authentication system. This adds a layer of security.
- **How**: The login button is a two-step process. The first click reveals the hCaptcha widget. Only after the user successfully completes the CAPTCHA can they proceed to the Google OAuth login. The verified CAPTCHA token is required for the login attempt to be considered valid.

---

## Performance Optimizations

### Strategic Physics Toggling

**Problem**: The graph's physics simulation can make the layout feel unstable and use unnecessary CPU cycles.

**Solution**: We only enable physics when needed.

- After the initial layout stabilizes, we turn physics **off**.
- When a user starts dragging a node, we turn physics **on**.
- When the user stops dragging, we wait a couple of seconds for the graph to settle, then turn physics **off** again.

This makes the graph feel stable during viewing but dynamic and alive during interaction.

### Efficient Data Updates

Instead of removing and re-adding nodes to update them, we use `nodes.current.update(...)` wherever possible. We also add nodes in batches (`nodes.current.add([...])`) instead of one by one in a loop. This minimizes the number of expensive DOM manipulations `vis-network` has to perform, keeping the app fast even with large graphs.
