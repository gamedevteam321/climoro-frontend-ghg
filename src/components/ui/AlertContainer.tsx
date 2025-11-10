import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';
import Alert, { type AlertProps } from './Alert';

export interface AlertItem extends AlertProps {
  id: string;
  duration?: number;
}

interface AlertContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Global alert state
let alertQueue: AlertItem[] = [];
let listeners: Array<(alerts: AlertItem[]) => void> = [];

// Global function to show alerts
export const showAlert = (alert: Omit<AlertItem, 'id'>): string => {
  const id = `alert-${Date.now()}-${Math.random()}`;
  const newAlert: AlertItem = {
    ...alert,
    id,
    duration: alert.duration || 4000,
  };

  alertQueue = [...alertQueue, newAlert];
  listeners.forEach((listener) => listener(alertQueue));

  // Auto-remove after duration
  if (newAlert.duration && newAlert.duration > 0) {
    setTimeout(() => {
      removeAlert(id);
    }, newAlert.duration);
  }

  return id;
};

export const removeAlert = (id: string) => {
  alertQueue = alertQueue.filter((alert) => alert.id !== id);
  listeners.forEach((listener) => listener(alertQueue));
};

export const clearAllAlerts = () => {
  alertQueue = [];
  listeners.forEach((listener) => listener(alertQueue));
};

const AlertContainer: React.FC<AlertContainerProps> = ({ position = 'bottom-right' }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    // Subscribe to alert changes
    const listener = (newAlerts: AlertItem[]) => {
      setAlerts(newAlerts);
    };

    listeners.push(listener);
    setAlerts(alertQueue);

    // Cleanup
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const handleClose = useCallback((id: string) => {
    removeAlert(id);
  }, []);

  // Position styles
  const positionStyles = {
    'top-right': {
      top: '24px',
      right: '24px',
    },
    'top-left': {
      top: '24px',
      left: '24px',
    },
    'bottom-right': {
      bottom: '24px',
      right: '24px',
    },
    'bottom-left': {
      bottom: '24px',
      left: '24px',
    },
    'top-center': {
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    'bottom-center': {
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto',
        },
      }}
    >
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            id={alert.id}
            type={alert.type}
            message={alert.message}
            onClose={handleClose}
          />
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default AlertContainer;

