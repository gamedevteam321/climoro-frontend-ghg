import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Login from './features/auth/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import { routesConfig, flattenRoutes } from './config/routes.config';
import AlertContainer from './components/ui/AlertContainer';

// Create Climoro theme with cyan/turquoise color scheme
const theme = createTheme({
  palette: {
    primary: {
      main: '#00BCD4', // Climoro cyan
      light: '#62EFFF',
      dark: '#008BA3',
    },
    secondary: {
      main: '#FF5252',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  // Generate all routes from config (including nested routes)
  const allRoutes = flattenRoutes(routesConfig);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with Main Layout - Generated Dynamically */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {allRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Alert Container - Bottom Right Corner */}
        <AlertContainer position="bottom-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
