# Neo Future Dashboard CSS Architecture

This document outlines the CSS architecture for the Neo Future Dashboard project.

## Directory Structure

```
frontend/styles/
├── components/           # Component-specific CSS modules
├── globals.css           # Global styles and CSS reset
├── variables.css         # CSS variables and theming
├── fix-grid-layout.css   # Grid layout fixes for React Grid Layout
└── [feature].module.css  # Page-specific CSS modules
```

## CSS Variables

All CSS variables are defined in `variables.css`. These should be imported before any other CSS files.

## CSS Import Order

The correct order for importing CSS files is:

1. `variables.css` - Contains all theme variables and design tokens
2. `globals.css` - Global styles and resets
3. `fix-grid-layout.css` - Layout-specific fixes
4. Component-specific CSS modules

## Components CSS Modules

Component-specific CSS files should be:

1. Located in `frontend/styles/components/`
2. Named after the component (e.g., `ComponentName.module.css`)
3. Imported in the component using the `@/styles/components/ComponentName.module.css` pattern

## Naming Conventions

- Use kebab-case for class names in global CSS
- Use camelCase for class names in CSS modules
- Use semantic class names that describe the purpose rather than appearance
- Avoid deep nesting of selectors

## Media Queries

Media queries should be defined at the end of each CSS file and should use the following breakpoints:

```css
/* Mobile */
@media (max-width: 480px) {
  ...;
}

/* Tablet */
@media (max-width: 768px) {
  ...;
}

/* Small Desktop */
@media (max-width: 1024px) {
  ...;
}

/* Large Desktop */
@media (min-width: 1200px) {
  ...;
}

/* Ultra Wide */
@media (min-width: 1600px) {
  ...;
}
```

## Best Practices

1. Use CSS variables for colors, spacing, and other design tokens
2. Avoid using !important whenever possible
3. Keep selectors as simple as possible to improve performance
4. Group related styles together
5. Add comments for complex sections
6. Use the appropriate CSS module for each component
7. Don't mix component-specific styles with global styles
