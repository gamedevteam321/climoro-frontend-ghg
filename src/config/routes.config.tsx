import React from 'react';
import {
  Dashboard as DashboardIcon,
  Calculate as CalculateIcon,
  VerifiedUser as VerifiedIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Help as HelpIcon,
  Apartment,
  Factory,
  LocalShipping,
  Science,
  Bolt,
  AccountBalance,
  Business,
  Work,
  Inventory,
  Warehouse,
  FlightTakeoff,
  Build,
  DirectionsCar,
  LocalGasStation,
  ShoppingCart,
  HomeWork,
  Delete,
  RestoreFromTrash,
  Store,
  TrendingUp,
  Settings,
  ShoppingBag,
  WbSunny,
  ElectricCar,
  Recycling,
  Verified,
  Power,
} from '@mui/icons-material';

// Lazy load components for better code splitting
import Dashboard from '../features/dashboard/Dashboard';
import StationaryEmissions from '../features/scope1/stationary/StationaryEmissions';
import MobileCombustion from '../features/scope1/mobile/MobileCombustion';
import FugitiveEmissions from '../features/scope1/fugitive/FugitiveEmissions';
import Scope1Overview from '../features/scope1/Scope1Overview';
import ElectricityPurchased from '../features/scope2/Electricity/ElectricityPurchased';
import Scope2Overview from '../features/scope2/Scope2Overview';
import BusinessTravel from '../features/scope3/business-travel/BusinessTravel';

export interface RouteConfig {
  path: string;
  label: string;
  icon: React.ReactElement;
  component: React.ComponentType;
  children?: RouteConfig[];
  // For grouping in navigation without a route
  isGroup?: boolean;
}

/**
 * Central route configuration
 * This single config generates both:
 * 1. React Router routes
 * 2. Sidebar navigation
 */
export const routesConfig: RouteConfig[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    component: Dashboard,
  },
  {
    path: '/ghg-calculator',
    label: 'GHG Calculator',
    icon: <CalculateIcon />,
    component: Dashboard, // Parent route
    isGroup: true, // This is a grouping item, not a direct route
    children: [
      {
        path: '/scope1',
        label: 'Scope 1',
        icon: <Factory />,
        component: Scope1Overview,
        children: [
          {
            path: '/scope1/stationary',
            label: 'Stationary Emissions',
            icon: <Factory />,
            component: StationaryEmissions,
          },
          {
            path: '/scope1/mobile',
            label: 'Mobile Combustion',
            icon: <LocalShipping />,
            component: MobileCombustion,
          },
          {
            path: '/scope1/fugitive',
            label: 'Fugitive Emissions',
            icon: <Science />,
            component: FugitiveEmissions,
          },
          {
            path: '/scope1/process',
            label: 'Process',
            icon: <Science />,
            component: Dashboard,
          },
        ],
      },
      {
        path: '/scope2',
        label: 'Scope 2',
        icon: <Bolt />,
        component: Scope2Overview,
        children: [
          {
            path: '/scope2/electricity',
            label: 'Electricity Purchased',
            icon: <Bolt />,
            component: ElectricityPurchased,
          },
        ],
      },
      {
        path: '/scope3',
        label: 'Scope 3',
        icon: <Business />,
        component: Dashboard,
        isGroup: true,
        children: [
          {
            path: '/scope3/upstream',
            label: 'Upstream',
            icon: <Warehouse />,
            component: Dashboard,
            isGroup: true,
            children: [
              {
                path: '/scope3/upstream/business-travel',
                label: 'Business Travel',
                icon: <FlightTakeoff />,
                component: BusinessTravel,
              },
              {
                path: '/scope3/upstream/capital-goods',
                label: 'Capital Goods',
                icon: <Build />,
                component: Dashboard,
              },
              {
                path: '/scope3/upstream/employee-commuting',
                label: 'Employee Commuting',
                icon: <DirectionsCar />,
                component: Dashboard,
              },
              {
                path: '/scope3/upstream/fuel-energy',
                label: 'Fuel and Energy Related Activities',
                icon: <LocalGasStation />,
                component: Dashboard,
              },
              {
                path: '/scope3/upstream/purchased-goods-services',
                label: 'Purchased Goods and Services',
                icon: <ShoppingCart />,
                component: Dashboard,
              },
              {
                path: '/scope3/upstream/upstream-leased-assets',
                label: 'Upstream Leased Assets',
                icon: <HomeWork />,
                component: Dashboard,
              },
              {
                path: '/scope3/upstream/transportation-distribution',
                label: 'Upstream Transportation and Distribution',
                icon: <LocalShipping />,
                component: Dashboard,
                isGroup: true,
                children: [
                  {
                    path: '/scope3/upstream/transportation-distribution/distribution',
                    label: 'Distribution',
                    icon: <LocalShipping />,
                    component: Dashboard,
                  },
                  {
                    path: '/scope3/upstream/transportation-distribution/transportation',
                    label: 'Transportation',
                    icon: <LocalShipping />,
                    component: Dashboard,
                  },
                ],
              },
              {
                path: '/scope3/upstream/waste-operations',
                label: 'Waste Generated in Operations',
                icon: <Delete />,
                component: Dashboard,
              },
            ],
          },
          {
            path: '/scope3/downstream',
            label: 'Downstream',
            icon: <Inventory />,
            component: Dashboard,
            isGroup: true,
            children: [
              {
                path: '/scope3/downstream/downstream-leased-assets',
                label: 'Downstream Leased Assets',
                icon: <HomeWork />,
                component: Dashboard,
              },
              {
                path: '/scope3/downstream/transportation-distribution',
                label: 'Downstream Transportation and Distribution',
                icon: <LocalShipping />,
                component: Dashboard,
                isGroup: true,
                children: [
                  {
                    path: '/scope3/downstream/transportation-distribution/distribution',
                    label: 'Distribution',
                    icon: <LocalShipping />,
                    component: Dashboard,
                  },
                  {
                    path: '/scope3/downstream/transportation-distribution/transportation',
                    label: 'Transportation',
                    icon: <LocalShipping />,
                    component: Dashboard,
                  },
                ],
              },
              {
                path: '/scope3/downstream/end-of-life',
                label: 'End-of-Life Treatment of Sold Products',
                icon: <RestoreFromTrash />,
                component: Dashboard,
              },
              {
                path: '/scope3/downstream/franchises',
                label: 'Franchises',
                icon: <Store />,
                component: Dashboard,
              },
              {
                path: '/scope3/downstream/investments',
                label: 'Investments',
                icon: <TrendingUp />,
                component: Dashboard,
                isGroup: true,
                children: [
                  {
                    path: '/scope3/downstream/investments/debt',
                    label: 'Debt Investments',
                    icon: <TrendingUp />,
                    component: Dashboard,
                  },
                  {
                    path: '/scope3/downstream/investments/equity',
                    label: 'Equity Investments',
                    icon: <TrendingUp />,
                    component: Dashboard,
                  },
                  {
                    path: '/scope3/downstream/investments/project-finance',
                    label: 'Project Finance',
                    icon: <TrendingUp />,
                    component: Dashboard,
                  },
                  {
                    path: '/scope3/downstream/investments/total-projected',
                    label: 'Total projected Emissions',
                    icon: <TrendingUp />,
                    component: Dashboard,
                  },
                ],
              },
              {
                path: '/scope3/downstream/processing-sold',
                label: 'Processing of Sold Products',
                icon: <Settings />,
                component: Dashboard,
              },
              {
                path: '/scope3/downstream/use-sold',
                label: 'Use of Sold Products',
                icon: <ShoppingBag />,
                component: Dashboard,
              },
            ],
          },
        ],
      },
      {
        path: '/reduction-factor',
        label: 'Reduction Factor',
        icon: <Science />,
        component: Dashboard,
        isGroup: true,
        children: [
          {
            path: '/reduction-factor/solar',
            label: 'Solar',
            icon: <WbSunny />,
            component: Dashboard,
          },
          {
            path: '/reduction-factor/ev',
            label: 'EV',
            icon: <ElectricCar />,
            component: Dashboard,
          },
          {
            path: '/reduction-factor/waste-manage',
            label: 'Waste Manage',
            icon: <Recycling />,
            component: Dashboard,
          },
          {
            path: '/reduction-factor/carbon-credit',
            label: 'Carbon Credit',
            icon: <Verified />,
            component: Dashboard,
          },
          {
            path: '/reduction-factor/energy-efficiency',
            label: 'Energy Efficiency',
            icon: <Power />,
            component: Dashboard,
          },
          {
            path: '/reduction-factor/methane-recovery',
            label: 'Methane Recovery',
            icon: <LocalGasStation />,
            component: Dashboard,
          },
        ],
      },
    ],
  },
  {
    path: '/users',
    label: 'User Management',
    icon: <PeopleIcon />,
    component: Dashboard,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: <ReportIcon />,
    component: Dashboard,
  },
  {
    path: '/support',
    label: 'Support',
    icon: <HelpIcon />,
    component: Dashboard,
  },
  // Super Admin only routes
  {
    path: '/accounts',
    label: 'Accounts',
    icon: <AccountBalance />,
    component: Dashboard,
  },
  {
    path: '/crm',
    label: 'CRM',
    icon: <Business />,
    component: Dashboard,
  },
  {
    path: '/hr',
    label: 'HR',
    icon: <Work />,
    component: Dashboard,
  },
  {
    path: '/assets',
    label: 'Assets',
    icon: <Apartment />,
    component: Dashboard,
  },
  {
    path: '/stock',
    label: 'Stock',
    icon: <Inventory />,
    component: Dashboard,
  },
  {
    path: '/inventory',
    label: 'Inventory',
    icon: <Warehouse />,
    component: Dashboard,
  },
];

/**
 * Flatten route config to get all routes (including nested)
 */
export function flattenRoutes(routes: RouteConfig[]): RouteConfig[] {
  const flatRoutes: RouteConfig[] = [];

  function traverse(routeArray: RouteConfig[]) {
    routeArray.forEach((route) => {
      // Only add routes that are not just groups
      if (!route.isGroup) {
        flatRoutes.push(route);
      }
      if (route.children) {
        traverse(route.children);
      }
    });
  }

  traverse(routes);
  return flatRoutes;
}

/**
 * Convert route config to navigation items for sidebar
 */
export interface NavItem {
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: NavItem[];
}

export function routesToNavItems(routes: RouteConfig[]): NavItem[] {
  return routes.map((route) => ({
    label: route.label,
    icon: route.icon,
    path: route.isGroup ? undefined : route.path,
    children: route.children ? routesToNavItems(route.children) : undefined,
  }));
}

