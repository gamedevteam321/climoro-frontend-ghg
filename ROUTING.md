# Dynamic Routing System

## Overview

The application now uses a **centralized, dynamic routing system** where routes and navigation are generated from a single configuration file. This makes it much easier to add new pages and maintain consistency between routing and navigation.

## How It Works

### 1. Single Source of Truth: `routes.config.tsx`

All routes are defined in `/src/config/routes.config.tsx`:

```typescript
export const routesConfig: RouteConfig[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    component: Dashboard,
  },
  {
    path: '/scope1',
    label: 'Scope 1',
    icon: <Factory />,
    isGroup: true,  // Navigation group, not a direct route
    children: [
      {
        path: '/scope1/stationary',
        label: 'Stationary Emissions',
        icon: <Factory />,
        component: StationaryEmissions,
      },
      // ... more routes
    ],
  },
];
```

### 2. Automatic Route Generation

**App.tsx** automatically generates all routes:

```typescript
const allRoutes = flattenRoutes(routesConfig);

<Routes>
  {allRoutes.map((route) => (
    <Route key={route.path} path={route.path} element={<route.component />} />
  ))}
</Routes>
```

### 3. Automatic Navigation Generation

**MainLayout.tsx** automatically generates the sidebar:

```typescript
const navigationItems = routesToNavItems(routesConfig);
// This creates the nested navigation structure
```

## Adding a New Page

To add a new page (e.g., "Mobile Combustion"), you only need to:

### Step 1: Create the Component

```bash
src/features/mobile/MobileCombustion.tsx
```

### Step 2: Add to Route Config

Edit `/src/config/routes.config.tsx`:

```typescript
import MobileCombustion from '../features/mobile/MobileCombustion';

// In routesConfig array, find Scope 1 children and update:
{
  path: '/scope1/mobile',
  label: 'Mobile Combustion',
  icon: <LocalShipping />,
  component: MobileCombustion,  // ← Change from Dashboard
}
```

**That's it!** The route and navigation will automatically update.

## Route Configuration Properties

```typescript
interface RouteConfig {
  path: string;              // URL path (e.g., '/scope1/stationary')
  label: string;             // Display name in sidebar
  icon: React.ReactElement;  // Icon component
  component: React.ComponentType; // Page component to render
  children?: RouteConfig[];  // Nested routes/groups
  isGroup?: boolean;         // True if this is just a navigation group (no route)
}
```

## Benefits

✅ **Single Source of Truth** - Define routes once, use everywhere
✅ **Type Safety** - TypeScript ensures all routes are valid
✅ **No Duplication** - Navigation and routing always in sync
✅ **Easy to Maintain** - Add/remove/modify routes in one place
✅ **Code Splitting** - Vite can automatically optimize bundle sizes
✅ **Scalable** - Easy to add 100+ routes without complexity

## File Structure

```
src/
├── config/
│   └── routes.config.tsx       # ← All routes defined here
├── App.tsx                     # Generates routes from config
├── layouts/
│   └── MainLayout.tsx          # Generates navigation from config
└── features/
    ├── dashboard/
    │   └── Dashboard.tsx
    ├── stationary/
    │   └── StationaryEmissions.tsx
    └── mobile/
        └── MobileCombustion.tsx
```

## Examples

### Adding a Top-Level Route

```typescript
// In routes.config.tsx
{
  path: '/settings',
  label: 'Settings',
  icon: <SettingsIcon />,
  component: Settings,
}
```

### Adding a Nested Route

```typescript
// In routes.config.tsx, under GHG Calculator children:
{
  path: '/scope2',
  label: 'Scope 2',
  icon: <Bolt />,
  isGroup: true,
  children: [
    {
      path: '/scope2/electricity',
      label: 'Electricity',
      icon: <Bolt />,
      component: ElectricityPage,
    },
    {
      path: '/scope2/heating',
      label: 'Heating/Cooling',
      icon: <Thermostat />,
      component: HeatingPage,
    },
  ],
}
```

## Migration Notes

**Before (Static Routing):**
- Routes defined in `App.tsx` (45+ lines)
- Navigation defined in `MainLayout.tsx` (40+ lines)
- Had to update 2 files to add a new page
- Easy to create inconsistencies

**After (Dynamic Routing):**
- Everything in `routes.config.tsx`
- Only 1 file to update
- Impossible to have mismatched routes/navigation
- Much easier to maintain

## Future Enhancements

You can extend this system to:

1. **Role-Based Routes** - Filter routes based on user permissions
2. **Backend-Driven Routes** - Fetch routes from Frappe backend
3. **Route Metadata** - Add breadcrumbs, page titles, etc.
4. **Lazy Loading** - Use `React.lazy()` for code splitting

## Questions?

The routing system is now centralized in `/src/config/routes.config.tsx`.
To add, modify, or remove any page, just edit that one file!

