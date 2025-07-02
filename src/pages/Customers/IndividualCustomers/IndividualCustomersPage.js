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
  Checkbox,
  FormGroup,
  Avatar,
  InputAdornment,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  AttachMoney as PriceIcon,
} from '@mui/icons-material';
import { useNotification } from '../../../components/Common/NotificationSystem';
import useFirebase from '../../../hooks/useFirebase';

const IndividualCustomersPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // Firebase hooks for different collections
  const { 
    data: individualCustomers, 
    loading: individualCustomersLoading, 
    error: individualCustomersError, 
    subscribeToData: subscribeToIndividualCustomers, 
    addDocument: addIndividualCustomer, 
    updateDocument: updateIndividualCustomer, 
    deleteDocument: deleteIndividualCustomer,
  } = useFirebase('individualCustomers');

  const { 
    data: categories, 
    loading: categoriesLoading, 
    subscribeToData: subscribeToCategories, 
  } = useFirebase('categories');

  const { 
    data: paymentMethods, 
    loading: paymentMethodsLoading, 
    subscribeToData: subscribeToPaymentMethods, 
  } = useFirebase('paymentMethods');

  const { 
    data: services, 
    loading: servicesLoading, 
    subscribeToData: subscribeToServices, 
  } = useFirebase('services');

  const { 
    data: bundles, 
    loading: bundlesLoading, 
    subscribeToData: subscribeToBundles, 
  } = useFirebase('bundles');

  const { 
    data: vehicleCategories, 
    loading: vehicleCategoriesLoading, 
    subscribeToData: subscribeToVehicleCategories, 
  } = useFirebase('vehicleCategories');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryType: '',
    paymentMethods: [],
    defaultPaymentMethod: '',
    isActive: true,
    color: '#1976d2',
    icon: '',
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToIndividualCustomers({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToCategories({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToPaymentMethods({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToServices({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToBundles({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToVehicleCategories({ orderBy: 'order', orderDirection: 'asc' });
  }, [subscribeToIndividualCustomers, subscribeToCategories, subscribeToPaymentMethods, subscribeToServices, subscribeToBundles, subscribeToVehicleCategories]);

  // Handle errors
  useEffect(() => {
    if (individualCustomersError) {
      showError(`Error loading individual customers: ${individualCustomersError}`);
    }
  }, [individualCustomersError, showError]);

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        description: customer.description,
        categoryType: customer.categoryType || '',
        paymentMethods: customer.paymentMethods || [],
        defaultPaymentMethod: customer.defaultPaymentMethod || '',
        isActive: customer.isActive,
        color: customer.color || '#1976d2',
        icon: customer.icon || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        description: '',
        categoryType: '',
        paymentMethods: [],
        defaultPaymentMethod: '',
        isActive: true,
        color: '#1976d2',
        icon: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      description: '',
      categoryType: '',
      paymentMethods: [],
      defaultPaymentMethod: '',
      isActive: true,
      color: '#1976d2',
      icon: '',
    });
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handlePaymentMethodChange = (paymentMethodId) => {
    const newMethods = formData.paymentMethods.includes(paymentMethodId)
      ? formData.paymentMethods.filter(id => id !== paymentMethodId)
      : [...formData.paymentMethods, paymentMethodId];
    
    setFormData({
      ...formData,
      paymentMethods: newMethods,
      // Reset default if the removed method was the default
      defaultPaymentMethod: formData.defaultPaymentMethod === paymentMethodId ? '' : formData.defaultPaymentMethod,
    });
  };

  const handleDefaultPaymentMethodChange = (paymentMethodId) => {
    setFormData({
      ...formData,
      defaultPaymentMethod: paymentMethodId,
    });
  };

  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = !customer.isActive;
      
      await updateIndividualCustomer(customer.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Individual customer group ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Group name is required');
      return;
    }

    if (!formData.categoryType) {
      showError('Please select a category type');
      return;
    }

    if (formData.paymentMethods.length === 0) {
      showError('Please select at least one payment method');
      return;
    }

    if (!formData.defaultPaymentMethod) {
      showError('Please select a default payment method');
      return;
    }

    try {
      const customerData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryType: formData.categoryType,
        paymentMethods: formData.paymentMethods,
        defaultPaymentMethod: formData.defaultPaymentMethod,
        isActive: formData.isActive,
        color: formData.color,
        icon: formData.icon,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingCustomer) {
        // Update existing customer
        await updateIndividualCustomer(editingCustomer.id, customerData);
        showSuccess('Individual customer group updated successfully');
      } else {
        // Add new customer
        await addIndividualCustomer(customerData);
        showSuccess('Individual customer group added successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      showError('Error saving individual customer group');
    }
  };

  const handleDelete = async (customerId) => {
    showConfirm({
      title: 'Delete Individual Customer Group',
      message: 'Are you sure you want to delete this individual customer group? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteIndividualCustomer(customerId);
          showSuccess('Individual customer group deleted successfully');
        } catch (error) {
          showError('Error deleting individual customer group');
        }
      },
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getPaymentMethodName = (paymentMethodId) => {
    const method = paymentMethods.find(pm => pm.id === paymentMethodId);
    return method ? method.name : 'Unknown Method';
  };

  const getDefaultPaymentMethodName = (customer) => {
    if (!customer.defaultPaymentMethod) return 'None';
    return getPaymentMethodName(customer.defaultPaymentMethod);
  };

  // Filter active categories only (not deleted)
  const activeCategories = categories.filter(category => 
    category.isActive !== false && !category.deletedAt
  );

  // Get services for selected category
  const getCategoryServices = (categoryId) => {
    if (!categoryId || !services) return [];
    return services.filter(service => 
      service.isActive !== false && 
      service.categoryStatus && 
      service.categoryStatus[categoryId] !== false // Default to true if not set
    );
  };

  // Get bundles for selected category
  const getCategoryBundles = (categoryId) => {
    if (!categoryId || !bundles) return [];
    return bundles.filter(bundle => 
      bundle.isActive !== false && 
      bundle.categoryStatus && 
      bundle.categoryStatus[categoryId] !== false // Default to true if not set
    );
  };

  // Get price for service in category
  const getServicePrice = (service, categoryId) => {
    if (!service.prices || !categoryId) return 0;
    
    // Try to find price for any vehicle type in this category
    const vehicleTypes = vehicleCategories.filter(vc => vc.categoryId === categoryId);
    for (const vehicleType of vehicleTypes) {
      const priceKey = `${categoryId}_${vehicleType.id}`;
      if (service.prices[priceKey]) {
        return service.prices[priceKey];
      }
    }
    return 0;
  };

  // Get price for bundle in category
  const getBundlePrice = (bundle, categoryId) => {
    if (!bundle.prices || !categoryId) return 0;
    
    // Try to find price for any vehicle type in this category
    const vehicleTypes = vehicleCategories.filter(vc => vc.categoryId === categoryId);
    for (const vehicleType of vehicleTypes) {
      const priceKey = `${categoryId}_${vehicleType.id}`;
      if (bundle.prices[priceKey]) {
        return bundle.prices[priceKey];
      }
    }
    return 0;
  };

  // Filter customers based on search term
  const filteredCustomers = individualCustomers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.description?.toLowerCase().includes(searchLower) ||
      getCategoryName(customer.categoryType).toLowerCase().includes(searchLower) ||
      getDefaultPaymentMethodName(customer).toLowerCase().includes(searchLower)
    );
  });

  if (individualCustomersLoading || categoriesLoading || paymentMethodsLoading || servicesLoading || bundlesLoading || vehicleCategoriesLoading) {
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
          Individual Customer Groups
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
          Add Individual Customer Group
        </Button>
      </Box>

      {/* Search Bar */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search individual customer groups by name, description, category, or payment method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ color: 'text.secondary' }}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </CardContent>
      </Card>

      {/* Individual Customers Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem', width: 60 }}>Color</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Group Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Payment Methods</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Avatar
                        src={customer.icon}
                        sx={{
                          bgcolor: customer.color || theme.palette.primary.main,
                          width: 40,
                          height: 40,
                          fontSize: '1.2rem',
                        }}
                      >
                        {!customer.icon && <PersonIcon />}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryName(customer.categoryType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Default: {getDefaultPaymentMethodName(customer)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.paymentMethods?.length || 0} methods
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {customer.isActive ? (
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
                            onClick={() => handleToggleStatus(customer)}
                            sx={{
                              color: customer.isActive ? 'success.main' : 'text.secondary',
                              '&:hover': {
                                backgroundColor: customer.isActive ? 'success.light' : 'grey.100',
                              },
                            }}
                          >
                            {customer.isActive ? <ViewIcon /> : <HideIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Customer Group">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(customer)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.light' },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Customer Group">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(customer.id)}
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

      {/* Add/Edit Individual Customer Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
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
            {editingCustomer ? 'Edit Individual Customer Group' : 'Add New Individual Customer Group'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Individual Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: theme.palette.primary.main }}>
                    Group Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Group Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        required
                        placeholder="e.g., Premium Individual Clients"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        multiline
                        rows={2}
                        placeholder="Brief description of this individual customer group"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Group Icon
                        </Typography>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="icon-upload"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData({ ...formData, icon: event.target.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="icon-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<PersonIcon />}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Upload Icon
                          </Button>
                        </label>
                        {formData.icon && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={formData.icon}
                              sx={{ width: 32, height: 32 }}
                            />
                            <Typography variant="caption" color="success.main">
                              Icon uploaded
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Group Color
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#000000'].map((color) => (
                            <Box
                              key={color}
                              onClick={() => setFormData({ ...formData, color })}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: color,
                                cursor: 'pointer',
                                border: formData.color === color ? '3px solid #fff' : '2px solid #ddd',
                                boxShadow: formData.color === color ? '0 0 0 2px #1976d2' : 'none',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Category and Payment Methods */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: theme.palette.primary.main }}>
                    Pricing & Payment Configuration
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Category Type</InputLabel>
                        <Select
                          value={formData.categoryType}
                          onChange={handleInputChange('categoryType')}
                          label="Category Type"
                          sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        >
                          {activeCategories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Category Prices Display */}
                  {formData.categoryType && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
                        Available Services & Bundles for {getCategoryName(formData.categoryType)}:
                      </Typography>
                      
                      {/* Services */}
                      {getCategoryServices(formData.categoryType).length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            Services
                          </Typography>
                          <Grid container spacing={1}>
                            {getCategoryServices(formData.categoryType).map((service) => (
                              <Grid item xs={12} sm={6} md={4} key={service.id}>
                                <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {service.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {service.duration}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <PriceIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        ${getServicePrice(service, formData.categoryType)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}

                      {/* Bundles */}
                      {getCategoryBundles(formData.categoryType).length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            Bundles
                          </Typography>
                          <Grid container spacing={1}>
                            {getCategoryBundles(formData.categoryType).map((bundle) => (
                              <Grid item xs={12} sm={6} md={4} key={bundle.id}>
                                <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {bundle.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {bundle.duration}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <PriceIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        ${getBundlePrice(bundle, formData.categoryType)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}

                      {getCategoryServices(formData.categoryType).length === 0 && getCategoryBundles(formData.categoryType).length === 0 && (
                        <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="warning.dark">
                            No services or bundles found for this category. Please add services/bundles first.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 3 }} />

                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Payment Methods
                    </Typography>
                    
                    <FormGroup>
                      {paymentMethods.map((method) => (
                        <FormControlLabel
                          key={method.id}
                          control={
                            <Checkbox
                              checked={formData.paymentMethods.includes(method.id)}
                              onChange={() => handlePaymentMethodChange(method.id)}
                              color="primary"
                            />
                          }
                          label={method.name}
                        />
                      ))}
                    </FormGroup>

                    {formData.paymentMethods.length > 0 && (
                      <FormControl fullWidth sx={{ mt: 2 }} required>
                        <InputLabel>Default Payment Method</InputLabel>
                        <Select
                          value={formData.defaultPaymentMethod}
                          onChange={(e) => handleDefaultPaymentMethodChange(e.target.value)}
                          label="Default Payment Method"
                          sx={{ borderRadius: 2 }}
                        >
                          {formData.paymentMethods.map((methodId) => {
                            const method = paymentMethods.find(pm => pm.id === methodId);
                            return (
                              <MenuItem key={methodId} value={methodId}>
                                {method ? method.name : 'Unknown Method'}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Field Settings */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                    Settings
                  </Typography>
                  
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
                </Paper>
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
            {editingCustomer ? 'Update' : 'Add'} Individual Customer Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IndividualCustomersPage; 