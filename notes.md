# 📘 React + Project Learning Notes

This document will grow as you ask questions. Each entry explains **what something is**, **why we use it**, and **the industry standard practice**.

---

## 1. `lucide-react`

- **What it is**: A modern React icon library (successor of Feather Icons).
- **Why we use it**: Provides scalable SVG icons (e.g., search, add, delete, collapse) without needing to design your own.
- **Industry practice**: Frequently used in React projects. Alternatives: Material UI Icons, Heroicons, Font Awesome.
- **Example**:

  ```jsx
  import { Search, Plus } from "lucide-react";

  function Toolbar() {
    return (
      <div>
        <Search /> {/* search icon */}
        <Plus /> {/* plus icon */}
      </div>
    );
  }
  ```

---

## 2. `@radix-ui/react-dialog`

- **What it is**: A headless React component library for building accessible dialogs/modals.
- **Why we use it**: Makes it easy to create modals (e.g., for adding/editing a node) with accessibility built in.
- **Industry practice**: Popular in React community because it handles accessibility and composability. Usually paired with Tailwind for styling.
- **Example**:

  ```jsx
  import * as Dialog from "@radix-ui/react-dialog";

  function AddNodeDialog() {
    return (
      <Dialog.Root>
        <Dialog.Trigger>Add Node</Dialog.Trigger>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="bg-white p-4 rounded">
          <Dialog.Title>Add a New Node</Dialog.Title>
          <input type="text" placeholder="Node name" />
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    );
  }
  ```

---

## 3. React Hooks for Graph Integration

### `useRef`

- **What it is**: A way to hold a reference to a DOM element (or any mutable value) that React doesn’t re-render.
- **Why we use it**: Needed when integrating with non-React libraries like `vis-network` that require a real DOM node.
- **Industry practice**: Common whenever you embed third-party JS libraries (charts, maps, graphs) in React.

### `useEffect`

- **What it is**: A React hook that runs side effects after render (e.g., initializing libraries, adding listeners).
- **Why we use it**: The graph container must exist in the DOM before `vis-network` can attach to it. Running once on mount ensures that.
- **Industry practice**: Standard for wrapping third-party library setup/cleanup.

---

## 4. `vis-network`

- **What it is**: A visualization library for rendering graphs (nodes + edges) with physics and interaction built in.
- **Why we use it**: Avoids reinventing complex graph drawing logic with SVG/Canvas.
- **Industry practice**: Teams often pick specialized libraries like `vis-network`, D3.js, or `react-force-graph` for data visualization.

**Core Pattern**:

1. Create a `ref` → attach to a `<div>` container.
2. Initialize `new Network(container, data, options)` in `useEffect`.
3. Attach event listeners like `network.on("selectNode", callback)`.

This is the **industry-standard React pattern for integrating non-React libraries**.
