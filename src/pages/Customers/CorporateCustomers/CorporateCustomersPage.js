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
  Business as BusinessIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  AttachMoney as PriceIcon,
} from '@mui/icons-material';
import { useNotification } from '../../../components/Common/NotificationSystem';
import useFirebase from '../../../hooks/useFirebase';

const CorporateCustomersPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // Firebase hooks for different collections
  const { 
    data: corporateCustomers, 
    loading: corporateCustomersLoading, 
    error: corporateCustomersError, 
    subscribeToData: subscribeToCorporateCustomers, 
    addDocument: addCorporateCustomer, 
    updateDocument: updateCorporateCustomer, 
    deleteDocument: deleteCorporateCustomer,
  } = useFirebase('corporateCustomers');

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
    icon: '',
    color: '#1976d2',
    address: '',
    email: '',
    delegationPersons: [],
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToCorporateCustomers({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToCategories({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToPaymentMethods({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToServices({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToBundles({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToVehicleCategories({ orderBy: 'order', orderDirection: 'asc' });
  }, [subscribeToCorporateCustomers, subscribeToCategories, subscribeToPaymentMethods, subscribeToServices, subscribeToBundles, subscribeToVehicleCategories]);

  // Handle errors
  useEffect(() => {
    if (corporateCustomersError) {
      showError(`Error loading corporate customers: ${corporateCustomersError}`);
    }
  }, [corporateCustomersError, showError]);

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
        icon: customer.icon || '',
        color: customer.color || '#1976d2',
        address: customer.address || '',
        email: customer.email || '',
        delegationPersons: customer.delegationPersons || [],
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
        icon: '',
        color: '#1976d2',
        address: '',
        email: '',
        delegationPersons: [],
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
      icon: '',
      color: '#1976d2',
      address: '',
      email: '',
      delegationPersons: [],
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

  const handleDelegationPersonChange = (index, field, value) => {
    const newPersons = [...formData.delegationPersons];
    newPersons[index] = {
      ...newPersons[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      delegationPersons: newPersons,
    });
  };

  const addDelegationPerson = () => {
    setFormData({
      ...formData,
      delegationPersons: [
        ...formData.delegationPersons,
        {
          name: '',
          position: '',
          email: '',
          phone: '',
          isPrimary: false,
        },
      ],
    });
  };

  const removeDelegationPerson = (index) => {
    const newPersons = formData.delegationPersons.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      delegationPersons: newPersons,
    });
  };

  const handlePrimaryContact = (index) => {
    const newPersons = formData.delegationPersons.map((person, i) => ({
      ...person,
      isPrimary: i === index ? !person.isPrimary : person.isPrimary,
    }));
    setFormData({
      ...formData,
      delegationPersons: newPersons,
    });
  };

  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = !customer.isActive;
      
      await updateCorporateCustomer(customer.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Corporate customer ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Corporate name is required');
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

    if (!formData.email.trim()) {
      showError('Corporate email is required');
      return;
    }

    // Validate delegation persons
    const hasValidPersons = formData.delegationPersons.every(person => 
      person.name.trim() && person.email.trim()
    );
    if (formData.delegationPersons.length > 0 && !hasValidPersons) {
      showError('All delegation persons must have name and email');
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
        icon: formData.icon,
        color: formData.color,
        address: formData.address.trim(),
        email: formData.email.trim(),
        delegationPersons: formData.delegationPersons.filter(person => 
          person.name.trim() && person.email.trim()
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingCustomer) {
        // Update existing customer
        await updateCorporateCustomer(editingCustomer.id, customerData);
        showSuccess('Corporate customer updated successfully');
      } else {
        // Add new customer
        await addCorporateCustomer(customerData);
        showSuccess('Corporate customer added successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      showError('Error saving corporate customer');
    }
  };

  const handleDelete = async (customerId) => {
    showConfirm({
      title: 'Delete Corporate Customer',
      message: 'Are you sure you want to delete this corporate customer? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteCorporateCustomer(customerId);
          showSuccess('Corporate customer deleted successfully');
        } catch (error) {
          showError('Error deleting corporate customer');
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

  const getPrimaryContacts = (customer) => {
    const primaryPersons = customer.delegationPersons?.filter(person => person.isPrimary);
    if (primaryPersons?.length > 0) {
      return primaryPersons.map(person => person.name).join(', ');
    }
    return 'None';
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
  const filteredCustomers = corporateCustomers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.description?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower) ||
      customer.delegationPersons?.some(person => 
        person.name.toLowerCase().includes(searchLower) ||
        person.email.toLowerCase().includes(searchLower) ||
        person.phone?.toLowerCase().includes(searchLower)
      ) ||
      getCategoryName(customer.categoryType).toLowerCase().includes(searchLower) ||
      getDefaultPaymentMethodName(customer).toLowerCase().includes(searchLower)
    );
  });

  if (corporateCustomersLoading || categoriesLoading || paymentMethodsLoading || servicesLoading || bundlesLoading || vehicleCategoriesLoading) {
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
          Corporate Customer Groups
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
          Add Corporate Customer
        </Button>
      </Box>

      {/* Search Bar */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search corporate customers by name, email, phone, category, or payment method..."
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

      {/* Corporate Customers Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem', width: 60 }}>Icon</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Corporate Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Corporate Info</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Payment Methods</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Primary Contacts</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Avatar
                        sx={{
                          bgcolor: customer.color || theme.palette.primary.main,
                          width: 40,
                          height: 40,
                          fontSize: '1.2rem',
                        }}
                      >
                        {customer.icon || <BusinessIcon />}
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
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {customer.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.address}
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
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getPrimaryContacts(customer)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.delegationPersons?.length || 0} persons
                      </Typography>
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
                        <Tooltip title="Edit Customer">
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
                        <Tooltip title="Delete Customer">
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

      {/* Add/Edit Corporate Customer Dialog */}
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
            {editingCustomer ? 'Edit Corporate Customer' : 'Add New Corporate Customer'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Corporate Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: theme.palette.primary.main }}>
                    Corporate Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Corporate Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        required
                        placeholder="e.g., Premium Fleet Services"
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
                        label="Corporate Email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        required
                        type="email"
                        placeholder="contact@abccorp.com"
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Corporate Address"
                        value={formData.address}
                        onChange={handleInputChange('address')}
                        multiline
                        rows={2}
                        placeholder="Full corporate address"
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
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        multiline
                        rows={2}
                        placeholder="Brief description of this corporate customer group"
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
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Brand Identity
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Icon Upload */}
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                              Corporate Icon
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
                                startIcon={<BusinessIcon />}
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
                          
                          {/* Color Picker */}
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                              Brand Color
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

              {/* Delegation Persons */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                      Delegation Persons
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addDelegationPerson}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Add Person
                    </Button>
                  </Box>
                  
                  {formData.delegationPersons.map((person, index) => (
                    <Card key={index} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={person.name}
                            onChange={(e) => handleDelegationPersonChange(index, 'name', e.target.value)}
                            size="small"
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Position"
                            value={person.position}
                            onChange={(e) => handleDelegationPersonChange(index, 'position', e.target.value)}
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Email"
                            value={person.email}
                            onChange={(e) => handleDelegationPersonChange(index, 'email', e.target.value)}
                            size="small"
                            type="email"
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={person.phone}
                            onChange={(e) => handleDelegationPersonChange(index, 'phone', e.target.value)}
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={person.isPrimary}
                                  onChange={() => handlePrimaryContact(index)}
                                  color="primary"
                                  size="small"
                                />
                              }
                              label="Primary"
                              sx={{ fontSize: '0.75rem' }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => removeDelegationPerson(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
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
            {editingCustomer ? 'Update' : 'Add'} Corporate Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CorporateCustomersPage; 