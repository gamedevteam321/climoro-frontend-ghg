import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FrappeProvider } from 'frappe-react-sdk';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import App from './App.tsx';

// Use empty string for relative URLs (proxied by Vite)
const FRAPPE_URL = '';

console.log('🔧 Frappe SDK URL (relative - proxied):', FRAPPE_URL || 'relative URLs');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrappeProvider 
      url={FRAPPE_URL}
      socketPort={import.meta.env.VITE_SOCKET_PORT}
      enableSocket={false}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </FrappeProvider>
  </StrictMode>
);
