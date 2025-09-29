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
  LocalOffer as BundleIcon,
  AttachMoney as PriceIcon,
  DragIndicator as DragIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const BundlesPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: bundles, 
    loading: bundlesLoading, 
    error: bundlesError, 
    subscribeToData: subscribeToBundles, 
    addDocument: addBundle, 
    updateDocument: updateBundle, 
    deleteDocument: deleteBundle,
  } = useFirebase('bundles');

  const { 
    data: services, 
    loading: servicesLoading, 
    error: servicesError, 
    subscribeToData: subscribeToServices,
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
  const [editingBundle, setEditingBundle] = useState(null);
  const [expandedBundle, setExpandedBundle] = useState(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [draggedBundle, setDraggedBundle] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    isActive: true,
    selectedServices: [],
    prices: {},
    categoryStatus: {},
  });

  // Subscribe to real-time data with retry mechanism
  useEffect(() => {
    const subscribeWithRetry = async () => {
      try {
        console.log('🔄 Subscribing to bundles data...');
        console.log('📊 Query parameters:', { orderBy: 'order', orderDirection: 'asc' });
        
        // Try with order query first
        subscribeToBundles({ orderBy: 'order', orderDirection: 'asc' });
        
        // Also try without order query as fallback
        setTimeout(() => {
          if (!bundles || bundles.length === 0) {
            console.log('🔄 Fallback: Trying without order query...');
            subscribeToBundles({}); // No order query
          }
        }, 2000);
        subscribeToServices({ orderBy: 'order', orderDirection: 'asc' });
        subscribeToCategories({ orderBy: 'order', orderDirection: 'asc' });
        subscribeToVehicleCategories({ orderBy: 'order', orderDirection: 'asc' });
        
        console.log('✅ All subscriptions initiated');
      } catch (error) {
        console.error('❌ Error subscribing to data:', error);
        // Retry after 3 seconds
        setTimeout(() => {
          console.log('🔄 Retrying subscription...');
          subscribeWithRetry();
        }, 3000);
      }
    };

    subscribeWithRetry();
  }, [subscribeToBundles, subscribeToServices, subscribeToCategories, subscribeToVehicleCategories]);

  // Debug: Log bundles data when it changes
  useEffect(() => {
    console.log('🔍 Bundles Debug Info:', {
      count: bundles?.length || 0,
      bundles: bundles?.map(b => ({ 
        id: b.id, 
        name: b.name, 
        order: b.order,
        isActive: b.isActive 
      })) || [],
      loading: bundlesLoading,
      error: bundlesError,
      hasData: !!bundles && bundles.length > 0
    });
    
    if (bundles && bundles.length > 0) {
      console.log('✅ Bundles found! Your existing data is still there.');
      console.log('📋 Bundle names:', bundles.map(b => b.name));
    } else if (!bundlesLoading && !bundlesError) {
      console.log('⚠️ No bundles found. This could mean:');
      console.log('1. Data was deleted from Firebase');
      console.log('2. Connection issues preventing data loading');
      console.log('3. Firebase query problems');
      console.log('4. Order field query issues');
      
      // Try to fetch without order query
      console.log('🔄 Trying to fetch bundles without order query...');
    }
  }, [bundles, bundlesLoading, bundlesError]);

  // Handle errors with better messaging
  useEffect(() => {
    if (bundlesError) {
      if (bundlesError.includes('network') || bundlesError.includes('disconnected')) {
        showError('Network connection issue. Please check your internet connection and refresh the page.');
      } else {
        showError(`Error loading bundles: ${bundlesError}`);
      }
    }
    if (servicesError) {
      if (servicesError.includes('network') || servicesError.includes('disconnected')) {
        showError('Network connection issue. Please check your internet connection and refresh the page.');
      } else {
        showError(`Error loading services: ${servicesError}`);
      }
    }
    if (categoriesError) {
      if (categoriesError.includes('network') || categoriesError.includes('disconnected')) {
        showError('Network connection issue. Please check your internet connection and refresh the page.');
      } else {
        showError(`Error loading categories: ${categoriesError}`);
      }
    }
    if (vehicleCategoriesError) {
      if (vehicleCategoriesError.includes('network') || vehicleCategoriesError.includes('disconnected')) {
        showError('Network connection issue. Please check your internet connection and refresh the page.');
      } else {
        showError(`Error loading vehicle categories: ${vehicleCategoriesError}`);
      }
    }
  }, [bundlesError, servicesError, categoriesError, vehicleCategoriesError, showError]);

  const handleOpenDialog = (bundle = null) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        name: bundle.name,
        description: bundle.description,
        duration: bundle.duration,
        isActive: bundle.isActive,
        selectedServices: bundle.selectedServices || [],
        prices: bundle.prices || {},
        categoryStatus: bundle.categoryStatus || {},
      });
    } else {
      setEditingBundle(null);
      setFormData({
        name: '',
        description: '',
        duration: '',
        isActive: true,
        selectedServices: [],
        prices: {},
        categoryStatus: {},
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBundle(null);
    setServiceSearchTerm('');
    setFormData({
      name: '',
      description: '',
      duration: '',
      isActive: true,
      selectedServices: [],
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

  const handleServiceToggle = (serviceId) => {
    const isSelected = formData.selectedServices.includes(serviceId);
    if (isSelected) {
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.filter(id => id !== serviceId),
      });
    } else {
      setFormData({
        ...formData,
        selectedServices: [...formData.selectedServices, serviceId],
      });
    }
  };

  const handleServiceSearch = (event) => {
    setServiceSearchTerm(event.target.value);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
  );

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

  const handleToggleExpanded = (bundleId) => {
    setExpandedBundle(expandedBundle === bundleId ? null : bundleId);
  };

  // Handle toggle status directly from table
  const handleToggleStatus = async (bundle) => {
    try {
      const newStatus = !bundle.isActive;
      
      await updateBundle(bundle.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Bundle ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, bundle) => {
    e.stopPropagation();
    console.log('Drag started for bundle:', bundle.name);
    setDraggedBundle(bundle);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bundle.id);
  };

  const handleDragOver = (e, bundle) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    console.log('Dragging over bundle:', bundle.name);
    setDraggedOver(bundle);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(null);
  };

  const handleDrop = async (e, targetBundle) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedBundle && draggedBundle.id !== targetBundle.id) {
      console.log(`Reordering bundle: ${draggedBundle.name} to position of ${targetBundle.name}`);

      try {
        // Get current bundles array
        const currentBundles = [...bundles];

        // Find indices of dragged and target bundles
        const draggedIndex = currentBundles.findIndex(b => b.id === draggedBundle.id);
        const targetIndex = currentBundles.findIndex(b => b.id === targetBundle.id);

        if (draggedIndex === -1 || targetIndex === -1) {
          showError('Error: Could not find bundles to reorder');
          return;
        }

        // Remove dragged bundle from its current position
        const [draggedItem] = currentBundles.splice(draggedIndex, 1);

        // Insert it at the target position
        currentBundles.splice(targetIndex, 0, draggedItem);

        // Update order field for all bundles with proper numbering (1, 2, 3, etc.)
        const updatePromises = currentBundles.map(async (bundle, index) => {
          return updateBundle(bundle.id, { order: index + 1 }); // Start from 1, not 0
        });

        await Promise.all(updatePromises);

        showSuccess(`Moved ${draggedBundle.name} to position of ${targetBundle.name}`);
        console.log('Bundles reordered successfully');

      } catch (error) {
        console.error('Error reordering bundles:', error);
        showError(`Error reordering bundles: ${error.message}`);
      }
    }

    setDraggedBundle(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedBundle(null);
    setDraggedOver(null);
  };

  // Initialize order field for existing bundles that don't have one
  const initializeBundleOrder = async () => {
    if (bundles && bundles.length > 0) {
      // Check if any bundles need order initialization
      const bundlesNeedingOrder = bundles.filter(bundle => bundle.order === undefined);

      if (bundlesNeedingOrder.length > 0) {
        console.log(`Initializing order field for ${bundlesNeedingOrder.length} bundles`);

        try {
          // Set order numbers 1, 2, 3, etc. for all bundles based on current name order
          const sortedBundles = [...bundles].sort((a, b) => a.name.localeCompare(b.name));
          const updatePromises = sortedBundles.map((bundle, index) => {
            return updateBundle(bundle.id, { order: index + 1 }); // Start from 1, not 0
          });

          await Promise.all(updatePromises);
          console.log('Order fields initialized successfully with numbers 1, 2, 3...');
          showSuccess('Bundle order initialized successfully');
        } catch (error) {
          console.error('Error initializing order fields:', error);
          showError('Error initializing bundle order');
        }
      }
    }
  };

  // Initialize order when bundles are loaded
  useEffect(() => {
    if (bundles && bundles.length > 0) {
      initializeBundleOrder();
    }
  }, [bundles]);


  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Bundle name is required');
      return;
    }

    if (!formData.duration.trim()) {
      showError('Bundle duration is required');
      return;
    }

    if (formData.selectedServices.length === 0) {
      showError('Please select at least one service for the bundle');
      return;
    }

    try {
      if (editingBundle) {
        // Update existing bundle
        await updateBundle(editingBundle.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          isActive: formData.isActive,
          selectedServices: formData.selectedServices,
          prices: formData.prices,
          categoryStatus: formData.categoryStatus,
        });
        showSuccess('Bundle updated successfully');
      } else {
        // Add new bundle with order field (set to end of list + 1)
        const newOrder = bundles.length + 1;
        await addBundle({
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          isActive: formData.isActive,
          selectedServices: formData.selectedServices,
          prices: formData.prices,
          categoryStatus: formData.categoryStatus,
          order: newOrder,
        });
        showSuccess('Bundle added successfully');
      }
      
      // Close dialog and reset state
      setOpenDialog(false);
      setEditingBundle(null);
      setFormData({
        name: '',
        description: '',
        duration: '',
        isActive: true,
        selectedServices: [],
        prices: {},
        categoryStatus: {},
      });
    } catch (error) {
      showError('Error saving bundle');
    }
  };

  const handleDelete = async (bundleId) => {
    showConfirm({
      title: 'Delete Bundle',
      message: 'Are you sure you want to delete this bundle? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteBundle(bundleId);
          showSuccess('Bundle deleted successfully');
        } catch (error) {
          showError('Error deleting bundle');
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

  const getPriceForBundle = (bundle, categoryId, vehicleTypeId) => {
    return bundle.prices?.[`${categoryId}_${vehicleTypeId}`] || '';
  };

  const isCategoryActive = (bundle, categoryId) => {
    return bundle.categoryStatus?.[categoryId] !== false; // Default to true if not set
  };

  const getSelectedServicesNames = (bundle) => {
    if (!bundle.selectedServices || bundle.selectedServices.length === 0) {
      return 'No services selected';
    }
    
    const serviceNames = bundle.selectedServices
      .map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        return service ? service.name : 'Unknown Service';
      })
      .join(', ');
    
    return serviceNames.length > 50 ? serviceNames.substring(0, 50) + '...' : serviceNames;
  };

  if (bundlesLoading || servicesLoading || categoriesLoading || vehicleCategoriesLoading) {
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
          Bundles Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Refresh
          </Button>
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
            Add Bundle
          </Button>
        </Box>
      </Box>

      {/* Bundles Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Bundle</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Services</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Prices</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bundles && bundles.length > 0 ? (
                  bundles
                    .sort((a, b) => {
                      // Sort by order first, then by name as fallback
                      const orderA = a.order || 0; // Put items without order at the beginning
                      const orderB = b.order || 0;
                      
                      if (orderA !== orderB) {
                        return orderA - orderB;
                      }
                      
                      // If order is the same, sort by name
                      return a.name.localeCompare(b.name);
                    })
                    .map((bundle) => (
                  <React.Fragment key={bundle.id}>
                    <TableRow 
                      hover
                      draggable
                      onDragStart={(e) => handleDragStart(e, bundle)}
                      onDragOver={(e) => handleDragOver(e, bundle)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, bundle)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        opacity: draggedBundle?.id === bundle.id ? 0.5 : 1,
                        backgroundColor: draggedOver?.id === bundle.id ? theme.palette.warning.light : 'inherit',
                        border: draggedOver?.id === bundle.id ? `2px solid ${theme.palette.warning.main}` : 'none',
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* Drag Handle */}
                          <Box
                            sx={{
                              cursor: 'grab',
                              color: theme.palette.primary.main,
                              backgroundColor: theme.palette.primary.light,
                              border: `2px solid ${theme.palette.primary.main}`,
                              borderRadius: 1,
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              '&:active': {
                                cursor: 'grabbing',
                                backgroundColor: theme.palette.primary.main,
                                color: 'white'
                              },
                              '&:hover': {
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                transform: 'scale(1.1)'
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            ⋮⋮
                          </Box>
                          <BundleIcon sx={{ color: theme.palette.primary.main }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {bundle.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {bundle.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {getSelectedServicesNames(bundle)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatDuration(bundle.duration)}
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
                          {bundle.isActive ? (
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
                          onClick={() => handleToggleExpanded(bundle.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          {expandedBundle === bundle.id ? 'Hide' : 'View'} Prices
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Toggle Status">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(bundle)}
                              sx={{
                                color: bundle.isActive ? 'success.main' : 'text.secondary',
                                '&:hover': {
                                  backgroundColor: bundle.isActive ? 'success.light' : 'grey.100',
                                },
                              }}
                            >
                              {bundle.isActive ? <ViewIcon /> : <HideIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Bundle">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(bundle)}
                              sx={{
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'primary.light' },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Bundle">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(bundle.id)}
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
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedBundle === bundle.id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Pricing Matrix for {bundle.name}
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
                                    const isActive = isCategoryActive(bundle, category.id);
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
                                          const price = getPriceForBundle(bundle, category.id, vehicleType.id);
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
                ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <BundleIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                        <Typography variant="h6" color="text.secondary">
                          No bundles found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bundlesLoading ? 'Loading bundles...' : 'Create your first bundle to get started'}
                        </Typography>
                        {!bundlesLoading && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{ mt: 1 }}
                          >
                            Add Bundle
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Bundle Dialog */}
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
            {editingBundle ? 'Edit Bundle' : 'Add New Bundle'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Bundle Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Bundle Details
                </Typography>
                
                <TextField
                  fullWidth
                  label="Bundle Name"
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

                {/* Selected Services Summary */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Selected Services ({formData.selectedServices.length})
                  </Typography>
                  {formData.selectedServices.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.selectedServices.map(serviceId => {
                        const service = services.find(s => s.id === serviceId);
                        return service ? (
                          <Chip
                            key={serviceId}
                            label={service.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : null;
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No services selected
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Service Selection */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Select Services
                </Typography>
                
                <TextField
                  fullWidth
                  label="Search Services"
                  value={serviceSearchTerm}
                  onChange={handleServiceSearch}
                  placeholder="Search by name or description..."
                  size="small"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ color: 'text.secondary', mr: 1 }}>
                        🔍
                      </Box>
                    ),
                  }}
                />
                
                <Box sx={{ maxHeight: 400, overflow: 'auto', border: 1, borderColor: 'grey.300', borderRadius: 2, p: 2 }}>
                  {filteredServices.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {serviceSearchTerm ? 'No services found matching your search.' : 'No services available.'}
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={1}>
                      {filteredServices.map((service) => {
                        const isSelected = formData.selectedServices.includes(service.id);
                        return (
                          <Grid item xs={12} key={service.id}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 1,
                                border: 1,
                                borderColor: isSelected ? 'success.main' : 'grey.300',
                                backgroundColor: isSelected ? 'success.light' : 'transparent',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: isSelected ? 'success.light' : 'grey.50',
                                  borderColor: isSelected ? 'success.dark' : 'primary.main',
                                },
                                transition: 'all 0.2s',
                              }}
                              onClick={() => handleServiceToggle(service.id)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '4px',
                                    border: 2,
                                    borderColor: isSelected ? 'success.main' : 'grey.400',
                                    backgroundColor: isSelected ? 'success.main' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2,
                                    flexShrink: 0,
                                  }}
                                >
                                  {isSelected && (
                                    <Box
                                      component="span"
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {service.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    {service.description || 'No description'}
                                  </Typography>
                                  <Chip
                                    label={formatDuration(service.duration)}
                                    size="small"
                                    sx={{
                                      backgroundColor: theme.palette.primary.light,
                                      color: theme.palette.primary.contrastText,
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      height: 20,
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              </Grid>

              {/* Pricing Matrix */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Pricing Matrix
                </Typography>
                
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
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
            {editingBundle ? 'Update' : 'Add'} Bundle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BundlesPage; 