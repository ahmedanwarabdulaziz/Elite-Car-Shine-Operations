import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
  CircularProgress,
  Chip,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const PAYMENT_TYPES = [
  { value: 'immediate_cash', label: 'Immediate Cash Payment', icon: <PaymentIcon />, description: 'Cash payment due immediately upon service completion' },
  { value: 'immediate_digital', label: 'Immediate Digital Payment', icon: <CreditCardIcon />, description: 'Digital payment due immediately upon service completion' },
  { value: 'advance', label: 'Advance Payment', icon: <CreditCardIcon />, description: 'Payment required before service begins' },
  { value: 'standard_credit', label: 'Standard Credit Terms', icon: <ScheduleIcon />, description: 'Payment due within specified number of days' },
  { value: 'end_of_month', label: 'End of Month Terms', icon: <CalendarIcon />, description: 'Payment due at end of month plus specified days' },
];

const PaymentMethodsPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: paymentMethods, 
    loading: paymentMethodsLoading, 
    error: paymentMethodsError, 
    subscribeToData: subscribeToPaymentMethods, 
    addDocument: addPaymentMethod, 
    updateDocument: updatePaymentMethod, 
    deleteDocument: deletePaymentMethod,
  } = useFirebase('paymentMethods');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    daysAllowed: '',
    isActive: true,
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToPaymentMethods({ orderBy: 'name', orderDirection: 'asc' });
  }, [subscribeToPaymentMethods]);

  // Handle errors
  useEffect(() => {
    if (paymentMethodsError) {
      showError(`Error loading payment methods: ${paymentMethodsError}`);
    }
  }, [paymentMethodsError, showError]);

  const handleOpenDialog = (paymentMethod = null) => {
    if (paymentMethod) {
      setEditingPaymentMethod(paymentMethod);
      setFormData({
        name: paymentMethod.name,
        description: paymentMethod.description,
        type: paymentMethod.type,
        daysAllowed: paymentMethod.daysAllowed || '',
        isActive: paymentMethod.isActive,
      });
    } else {
      setEditingPaymentMethod(null);
      setFormData({
        name: '',
        description: '',
        type: '',
        daysAllowed: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPaymentMethod(null);
    setFormData({
      name: '',
      description: '',
      type: '',
      daysAllowed: '',
      isActive: true,
    });
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear daysAllowed when type changes to immediate or advance payment
    if (field === 'type' && (value === 'immediate_cash' || value === 'immediate_digital' || value === 'advance')) {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        daysAllowed: '',
      }));
    }
  };

  const handleToggleStatus = async (paymentMethod) => {
    try {
      const newStatus = !paymentMethod.isActive;
      
      await updatePaymentMethod(paymentMethod.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Payment method ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Payment method name is required');
      return;
    }

    if (!formData.type) {
      showError('Please select a payment type');
      return;
    }

    // Validate days allowed for credit terms
    if (formData.type === 'standard_credit' || formData.type === 'end_of_month') {
      if (!formData.daysAllowed || formData.daysAllowed <= 0) {
        showError('Please enter a valid number of days');
        return;
      }
    }

    try {
      const paymentMethodData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        isActive: formData.isActive,
      };

      // Only include daysAllowed if it's a credit-based payment type
      if (formData.type === 'standard_credit' || formData.type === 'end_of_month') {
        paymentMethodData.daysAllowed = parseInt(formData.daysAllowed);
      }

      if (editingPaymentMethod) {
        // Update existing payment method
        await updatePaymentMethod(editingPaymentMethod.id, paymentMethodData);
        showSuccess('Payment method updated successfully');
      } else {
        // Add new payment method
        await addPaymentMethod(paymentMethodData);
        showSuccess('Payment method added successfully');
      }
      
      // Close dialog and reset state
      setOpenDialog(false);
      setEditingPaymentMethod(null);
      setFormData({
        name: '',
        description: '',
        type: '',
        daysAllowed: '',
        isActive: true,
      });
    } catch (error) {
      showError('Error saving payment method');
    }
  };

  const handleDelete = async (paymentMethodId) => {
    showConfirm({
      title: 'Delete Payment Method',
      message: 'Are you sure you want to delete this payment method? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deletePaymentMethod(paymentMethodId);
          showSuccess('Payment method deleted successfully');
        } catch (error) {
          showError('Error deleting payment method');
        }
      },
    });
  };

  const getPaymentTypeInfo = (type) => {
    return PAYMENT_TYPES.find(pt => pt.value === type) || PAYMENT_TYPES[0];
  };

  const getPaymentTypeDisplay = (paymentMethod) => {
    const typeInfo = getPaymentTypeInfo(paymentMethod.type);
    let displayText = typeInfo.label;
    
    if (paymentMethod.type === 'standard_credit' && paymentMethod.daysAllowed) {
      displayText += ` (${paymentMethod.daysAllowed} days)`;
    } else if (paymentMethod.type === 'end_of_month' && paymentMethod.daysAllowed) {
      displayText += ` (+${paymentMethod.daysAllowed} days)`;
    }
    
    return displayText;
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'immediate_cash':
        return 'error';
      case 'immediate_digital':
        return 'warning';
      case 'advance':
        return 'info';
      case 'standard_credit':
        return 'primary';
      case 'end_of_month':
        return 'success';
      default:
        return 'default';
    }
  };

  if (paymentMethodsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
          Payment Methods Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          Add Payment Method
        </Button>
      </Box>

      {/* Payment Methods Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Terms</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentMethods.map((paymentMethod) => (
                  <TableRow key={paymentMethod.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {paymentMethod.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {paymentMethod.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentTypeInfo(paymentMethod.type).label}
                        size="small"
                        color={getPaymentTypeColor(paymentMethod.type)}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getPaymentTypeDisplay(paymentMethod)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {paymentMethod.isActive ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ViewIcon sx={{ color: 'success.main', fontSize: 18 }} />
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                              Active
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <HideIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Inactive
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Toggle Status">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(paymentMethod)}
                            sx={{
                              color: paymentMethod.isActive ? 'success.main' : 'text.secondary',
                              '&:hover': {
                                backgroundColor: paymentMethod.isActive ? 'success.light' : 'grey.100',
                              },
                            }}
                          >
                            {paymentMethod.isActive ? <ViewIcon /> : <HideIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Payment Method">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(paymentMethod)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.light' },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Payment Method">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(paymentMethod.id)}
                            sx={{
                              color: 'error.main',
                              '&:hover': { backgroundColor: 'error.light' },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Payment Method Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingPaymentMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Basic Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Payment Method Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  margin="normal"
                  required
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  margin="normal"
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Payment Type Selection */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Payment Type
                </Typography>
                
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={handleInputChange('type')}
                    label="Payment Type"
                  >
                    {PAYMENT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          <Box>
                            <Typography variant="body1">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Conditional Fields */}
              {formData.type === 'standard_credit' && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Credit Terms
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Days Allowed for Payment"
                    value={formData.daysAllowed}
                    onChange={handleInputChange('daysAllowed')}
                    type="number"
                    required
                    helperText="Number of days allowed for payment after service completion"
                    inputProps={{ min: 1, max: 365 }}
                  />
                </Grid>
              )}

              {formData.type === 'end_of_month' && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    End of Month Terms
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Additional Days After Month End"
                    value={formData.daysAllowed}
                    onChange={handleInputChange('daysAllowed')}
                    type="number"
                    required
                    helperText="Number of additional days after the current month ends"
                    inputProps={{ min: 0, max: 31 }}
                  />
                </Grid>
              )}

              {/* Status */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleInputChange('isActive')}
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {editingPaymentMethod ? 'Update' : 'Add'} Payment Method
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethodsPage; 