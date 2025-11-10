import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

export interface AlertProps {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}

const typeStyles = {
  success: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderColor: '#A7F3D0',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderColor: '#FECACA',
  },
  warning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderColor: '#FDE68A',
  },
  info: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    borderColor: '#BFDBFE',
  },
};

const fadeInBlur = {
  initial: { 
    opacity: 0, 
    filter: 'blur(10px)', 
    y: 10, 
    x: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    x: 0,
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: 'easeInOut' as const,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: { 
      duration: 0.2, 
      ease: 'easeOut' as const,
    },
  },
};

const Alert: React.FC<AlertProps> = ({
  id = 'alert',
  type = 'info',
  message,
  onClose,
}) => {
  const styles = typeStyles[type];

  return (
    <motion.div
      variants={fadeInBlur}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{
        scale: 1.02,
        transition: {
          duration: 0.2,
          ease: 'easeInOut',
        },
      }}
      style={{
        cursor: onClose ? 'pointer' : 'default',
      }}
      onClick={() => onClose && onClose(id)}
    >
      <Box
        sx={{
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '300px',
          maxWidth: '400px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'capitalize',
          }}
        >
          {type}:
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: '14px',
            flex: 1,
          }}
        >
          {message}
        </Typography>
      </Box>
    </motion.div>
  );
};

export default Alert;

