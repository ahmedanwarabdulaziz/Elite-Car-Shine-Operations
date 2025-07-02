import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Notification context
const NotificationContext = createContext();

// Custom hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification provider component
const NotificationProvider = ({ children }) => {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    duration: 4000,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    severity: 'warning',
  });

  // Show notification
  const showNotification = useCallback((message, severity = 'success', duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity,
      duration,
    });
  }, []);

  // Show success notification
  const showSuccess = useCallback((message, duration = 4000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  // Show error notification
  const showError = useCallback((message, duration = 6000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  // Show warning notification
  const showWarning = useCallback((message, duration = 5000) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  // Show info notification
  const showInfo = useCallback((message, duration = 4000) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  // Close notification
  const closeNotification = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Show confirmation dialog
  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    severity = 'warning',
  }) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      severity,
    });
  }, []);

  // Close confirmation dialog
  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  }, []);

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirm();
  }, [confirmDialog, closeConfirm]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (confirmDialog.onCancel) {
      confirmDialog.onCancel();
    }
    closeConfirm();
  }, [confirmDialog, closeConfirm]);

  // Get icon based on severity
  const getIcon = (severity) => {
    switch (severity) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Get color based on severity
  const getColor = (severity) => {
    switch (severity) {
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
    showConfirm,
    closeConfirm,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Professional Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbar-root': {
            top: 80, // Below header
          },
        }}
      >
        <Alert
          onClose={closeNotification}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            minWidth: 300,
            maxWidth: 400,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: 24,
            },
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={closeNotification}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Professional Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                color: getColor(confirmDialog.severity),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {getIcon(confirmDialog.severity)}
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {confirmDialog.title}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 0, pb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            {confirmDialog.cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={confirmDialog.severity === 'error' ? 'error' : 'primary'}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </NotificationContext.Provider>
  );
};

// Export both the provider and the hook
export { NotificationProvider };
export default NotificationProvider; 