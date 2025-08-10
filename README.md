
# Virtualized Table (React + Vite)

This project is a performant, responsive, and feature-rich virtualized table built with React, Vite, Tailwind CSS, and TanStack Table. It supports row virtualization, column resizing, pinning, drag-and-drop reordering, and more.


## Features
- All table features are prop-driven for maximum flexibility:
  - **Row virtualization** (`enableVirtualization`): Fast rendering for large datasets
  - **Column resizing** (`enableColumnResizing`): Resize columns interactively
  - **Column pinning** (`enablePinning`): Pin columns left/right
  - **Drag-and-drop reordering** (`enableDragDrop`): Reorder columns by dragging
  - **Settings dropdown** (`showSettingsDropdown`): Manage column visibility
  - **Custom row height** (`rowHeight`): Set row height in pixels
  - **Overscan** (`overscan`): Control virtualization overscan
- Responsive design with Tailwind CSS
- Reusable button component for consistent UI
- Aliased imports for maintainable code structure

## Folder Structure

```
Virtualized_Table/
├── public/
│   └── vite.svg
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── DataTable/
│   │   │   ├── DataTable.jsx
│   │   │   └── index.js
│   │   └── ReusableButton/
│   │       ├── ReusableButton.jsx
│   │       └── index.js
│   ├── constants/
│   │   └── tableStrings.js
│   └── data/
│       └── makeData.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Aliased Imports

Vite is configured to support the following aliases:

- `@component` → `src/components`
- `@constants` → `src/constants`
- `@data` → `src/data`

Example usage:

```js
import DataTable from '@component/DataTable';
import { TABLE_STRINGS } from '@constants/tableStrings';
import { makeData } from '@data/makeData';
```


## DataTable Usage

All features are controlled via props:

```jsx
<DataTable
  columns={columns}
  data={data}
  title="TanStack Virtualized Table"
  enableVirtualization={true}        // Enable row virtualization
  enableColumnResizing={true}        // Enable column resizing
  enablePinning={true}               // Enable column pinning
  enableDragDrop={true}              // Enable drag-and-drop column reordering
  showSettingsDropdown={true}        // Show settings dropdown for column visibility
  rowHeight={44}                     // Row height in pixels
  overscan={8}                       // Overscan rows for virtualization
/>
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).
GitHub Repo Link => https://github.com/Parikshit2108/FRONTEND_ASSIGNMENT
App is live on =>   https://virtualizedtanstacktable.netlify.app/

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

### 5. Lint the code

```bash
npm run lint
```

## Main Dependencies

- React
- Vite
- Tailwind CSS
- @tanstack/react-table
- @tanstack/react-virtual
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- react-icons

## Customization

- Edit `src/components/DataTable/DataTable.jsx` for table logic and UI
- Edit `src/constants/tableStrings.js` for UI strings
- Edit `src/data/makeData.js` for mock data generation
- Use `@component/ReusableButton/ReusableButton` for consistent buttons

## License

MIT
