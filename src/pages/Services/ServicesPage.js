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
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
  CircularProgress,
  Collapse,
  Chip,
  Grid,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Build as ServiceIcon,
  AttachMoney as PriceIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const ServicesPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: services, 
    loading: servicesLoading, 
    error: servicesError, 
    subscribeToData: subscribeToServices, 
    addDocument: addService, 
    updateDocument: updateService, 
    deleteDocument: deleteService,
  } = useFirebase('services');

  const { 
    data: categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    subscribeToData: subscribeToCategories,
  } = useFirebase('categories');

  const { 
    data: vehicleCategories, 
    loading: vehicleCategoriesLoading, 
    error: vehicleCategoriesError, 
    subscribeToData: subscribeToVehicleCategories,
  } = useFirebase('vehicleCategories');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    isActive: true,
    prices: {},
    categoryStatus: {}, // New: tracks category-level activation
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToServices({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToCategories({ orderBy: 'order', orderDirection: 'asc' });
    subscribeToVehicleCategories({ orderBy: 'order', orderDirection: 'asc' });
  }, [subscribeToServices, subscribeToCategories, subscribeToVehicleCategories]);

  // Handle errors
  useEffect(() => {
    if (servicesError) {
      showError(`Error loading services: ${servicesError}`);
    }
    if (categoriesError) {
      showError(`Error loading categories: ${categoriesError}`);
    }
    if (vehicleCategoriesError) {
      showError(`Error loading vehicle categories: ${vehicleCategoriesError}`);
    }
  }, [servicesError, categoriesError, vehicleCategoriesError, showError]);

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        duration: service.duration,
        isActive: service.isActive,
        prices: service.prices || {},
        categoryStatus: service.categoryStatus || {},
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration: '',
        isActive: true,
        prices: {},
        categoryStatus: {},
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration: '',
      isActive: true,
      prices: {},
      categoryStatus: {},
    });
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: field === 'isActive' ? event.target.checked : event.target.value,
    });
  };

  const handlePriceChange = (categoryId, vehicleTypeId, value) => {
    setFormData({
      ...formData,
      prices: {
        ...formData.prices,
        [`${categoryId}_${vehicleTypeId}`]: value,
      },
    });
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData({
      ...formData,
      categoryStatus: {
        ...formData.categoryStatus,
        [categoryId]: !formData.categoryStatus[categoryId],
      },
    });
  };

  const handleToggleExpanded = (serviceId) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  // Handle toggle status directly from table
  const handleToggleStatus = async (service) => {
    try {
      const newStatus = !service.isActive;
      
      await updateService(service.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Service ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Service name is required');
      return;
    }

    if (!formData.duration.trim()) {
      showError('Service duration is required');
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        await updateService(editingService.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          isActive: formData.isActive,
          prices: formData.prices,
          categoryStatus: formData.categoryStatus,
        });
        showSuccess('Service updated successfully');
      } else {
        // Add new service
        await addService({
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          isActive: formData.isActive,
          prices: formData.prices,
          categoryStatus: formData.categoryStatus,
        });
        showSuccess('Service added successfully');
      }
      
      // Close dialog and reset state
      setOpenDialog(false);
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration: '',
        isActive: true,
        prices: {},
        categoryStatus: {},
      });
    } catch (error) {
      showError('Error saving service');
    }
  };

  const handleDelete = async (serviceId) => {
    showConfirm({
      title: 'Delete Service',
      message: 'Are you sure you want to delete this service? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteService(serviceId);
          showSuccess('Service deleted successfully');
        } catch (error) {
          showError('Error deleting service');
        }
      },
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    
    // Handle different duration formats
    if (duration.includes(':')) {
      const [hours, minutes] = duration.split(':');
      return `${hours}h ${minutes}m`;
    }
    
    if (duration.includes('h') || duration.includes('hour')) {
      return duration;
    }
    
    // Assume minutes if just a number
    const minutes = parseInt(duration);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m`;
  };

  const getPriceForService = (service, categoryId, vehicleTypeId) => {
    return service.prices?.[`${categoryId}_${vehicleTypeId}`] || '';
  };

  const isCategoryActive = (service, categoryId) => {
    return service.categoryStatus?.[categoryId] !== false; // Default to true if not set
  };

  if (servicesLoading || categoriesLoading || vehicleCategoriesLoading) {
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
          Services Management
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
          Add Service
        </Button>
      </Box>

      {/* Services Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Prices</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <React.Fragment key={service.id}>
                    <TableRow hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ServiceIcon sx={{ color: theme.palette.primary.main }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {service.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {service.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatDuration(service.duration)}
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.primary.light,
                            color: theme.palette.primary.contrastText,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {service.isActive ? (
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
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PriceIcon />}
                          onClick={() => handleToggleExpanded(service.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          {expandedService === service.id ? 'Hide' : 'View'} Prices
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Toggle Status">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(service)}
                              sx={{
                                color: service.isActive ? 'success.main' : 'text.secondary',
                                '&:hover': {
                                  backgroundColor: service.isActive ? 'success.light' : 'grey.100',
                                },
                              }}
                            >
                              {service.isActive ? <ViewIcon /> : <HideIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Service">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(service)}
                              sx={{
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'primary.light' },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Service">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(service.id)}
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
                    
                    {/* Expandable Price Table */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={expandedService === service.id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Pricing Matrix for {service.name}
                            </Typography>
                            <Paper sx={{ overflow: 'auto' }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                    <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 600, textAlign: 'center', width: 100 }}>Active</TableCell>
                                    {vehicleCategories.map((vehicleType) => (
                                      <TableCell key={vehicleType.id} sx={{ fontWeight: 600, textAlign: 'center', minWidth: 120 }}>
                                        {vehicleType.name}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {categories.map((category) => {
                                    const isActive = isCategoryActive(service, category.id);
                                    return (
                                      <TableRow key={category.id}>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                          {category.name}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                          <Switch
                                            size="small"
                                            checked={isActive}
                                            disabled
                                            sx={{ transform: 'scale(0.8)' }}
                                          />
                                        </TableCell>
                                        {vehicleCategories.map((vehicleType) => {
                                          const price = getPriceForService(service, category.id, vehicleType.id);
                                          return (
                                            <TableCell key={vehicleType.id} sx={{ textAlign: 'center' }}>
                                              {isActive ? (
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                  {price ? `$${price}` : 'Not set'}
                                                </Typography>
                                              ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                  Inactive
                                                </Typography>
                                              )}
                                            </TableCell>
                                          );
                                        })}
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </Paper>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Service Dialog */}
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
            {editingService ? 'Edit Service' : 'Add New Service'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Service Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Service Details
                </Typography>
                
                <TextField
                  fullWidth
                  label="Service Name"
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
                
                <TextField
                  fullWidth
                  label="Duration"
                  value={formData.duration}
                  onChange={handleInputChange('duration')}
                  margin="normal"
                  required
                  placeholder="e.g., 2:30 or 2h 30m"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleInputChange('isActive')}
                      color="primary"
                    />
                  }
                  label="Active"
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Pricing Matrix */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Pricing Matrix
                </Typography>
                
                <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>Active</TableCell>
                        {vehicleCategories.map((vehicleType) => (
                          <TableCell key={vehicleType.id} sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>
                            {vehicleType.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.map((category) => {
                        const isActive = formData.categoryStatus[category.id] !== false;
                        return (
                          <TableRow key={category.id}>
                            <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                              {category.name}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Switch
                                size="small"
                                checked={isActive}
                                onChange={() => handleCategoryToggle(category.id)}
                                sx={{ transform: 'scale(0.8)' }}
                              />
                            </TableCell>
                            {vehicleCategories.map((vehicleType) => {
                              const price = formData.prices[`${category.id}_${vehicleType.id}`] || '';
                              return (
                                <TableCell key={vehicleType.id} sx={{ textAlign: 'center' }}>
                                  <TextField
                                    size="small"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => handlePriceChange(category.id, vehicleType.id, e.target.value)}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ width: 80 }}
                                    disabled={!isActive}
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
            {editingService ? 'Update' : 'Add'} Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesPage; 