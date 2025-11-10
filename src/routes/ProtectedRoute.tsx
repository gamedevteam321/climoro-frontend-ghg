import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import { CircularProgress, Box } from '@mui/material';

export default function ProtectedRoute() {
  const { currentUser, isLoading } = useFrappeAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F5F7FA',
        }}
      >
        <CircularProgress sx={{ color: '#00BCD4' }} />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

