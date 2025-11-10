import React from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'error' | 'primary' | 'secondary';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Okay',
  cancelText = 'Cancel',
  confirmColor = 'error',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
        },
      }}
    >
      <Box>
        {/* Title */}
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 600,
            fontSize: '28px',
            marginBottom: '16px',
            color: '#000',
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body1"
          sx={{
            fontSize: '16px',
            color: '#6B7280',
            marginBottom: '32px',
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 500,
              padding: '12px 32px',
              borderRadius: '8px',
              borderColor: '#D1D5DB',
              color: '#374151',
              '&:hover': {
                borderColor: '#9CA3AF',
                backgroundColor: '#F9FAFB',
              },
            }}
          >
            {cancelText}
          </Button>

          {/* Confirm Button */}
          <Button
            onClick={onConfirm}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 500,
              padding: '12px 32px',
              borderRadius: '8px',
              backgroundColor: confirmColor === 'error' ? '#EF4444' : '#00BCD4',
              color: '#FFFFFF',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: confirmColor === 'error' ? '#DC2626' : '#008BA3',
              },
            }}
          >
            {confirmText}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ConfirmDialog;
