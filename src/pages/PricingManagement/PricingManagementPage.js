import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  AttachMoney as PricingIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';
import PricingMatrix from './components/PricingMatrix';
import CategoryControls from './components/CategoryControls';

const PricingManagementPage = () => {
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  
  // Firebase hooks for data
  const { 
    data: services, 
    loading: servicesLoading, 
    error: servicesError, 
    subscribeToData: subscribeToServices, 
    updateDocument: updateService,
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

  const { 
    data: bundles, 
    loading: bundlesLoading, 
    error: bundlesError, 
    subscribeToData: subscribeToBundles, 
    updateDocument: updateBundle,
  } = useFirebase('bundles');

  const [loading, setLoading] = useState(false);

  // Initialize order field for existing bundles that don't have one
  const initializeBundleOrder = async () => {
    if (bundles && bundles.length > 0) {
      const bundlesNeedingOrder = bundles.filter(bundle => bundle.order === undefined);
      
      if (bundlesNeedingOrder.length > 0) {
        console.log(`Initializing order field for ${bundlesNeedingOrder.length} bundles`);
        
        try {
          const sortedBundles = [...bundles].sort((a, b) => a.name.localeCompare(b.name));
          const updatePromises = sortedBundles.map((bundle, index) => {
            return updateBundle(bundle.id, { order: index + 1 });
          });
          
          await Promise.all(updatePromises);
          console.log('Bundle order fields initialized successfully');
        } catch (error) {
          console.error('Error initializing bundle order fields:', error);
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

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToServices({ orderBy: 'order', orderDirection: 'asc' });
    subscribeToCategories({ orderBy: 'order', orderDirection: 'asc' });
    subscribeToVehicleCategories({ orderBy: 'order', orderDirection: 'asc' });
    subscribeToBundles({ orderBy: 'order', orderDirection: 'asc' });
  }, [subscribeToServices, subscribeToCategories, subscribeToVehicleCategories, subscribeToBundles]);

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
    if (bundlesError) {
      showError(`Error loading bundles: ${bundlesError}`);
    }
  }, [servicesError, categoriesError, vehicleCategoriesError, bundlesError, showError]);

  const handlePriceChange = async (itemId, categoryId, vehicleTypeId, newPrice, itemType) => {
    try {
      setLoading(true);
      
      if (itemType === 'service') {
        const service = services.find(s => s.id === itemId);
        if (!service) return;

        const updatedPrices = {
          ...service.prices,
          [`${categoryId}_${vehicleTypeId}`]: parseFloat(newPrice) || 0,
        };

        await updateService(itemId, { prices: updatedPrices });
      } else if (itemType === 'bundle') {
        const bundle = bundles.find(b => b.id === itemId);
        if (!bundle) return;

        const updatedPrices = {
          ...bundle.prices,
          [`${categoryId}_${vehicleTypeId}`]: parseFloat(newPrice) || 0,
        };

        await updateBundle(itemId, { prices: updatedPrices });
      }
      
      showSuccess('Price updated successfully');
    } catch (error) {
      showError(`Error updating price: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = async (itemId, categoryId, isActive, itemType) => {
    try {
      setLoading(true);
      
      if (itemType === 'service') {
        const service = services.find(s => s.id === itemId);
        if (!service) return;

        const updatedCategoryStatus = {
          ...service.categoryStatus,
          [categoryId]: isActive,
        };

        await updateService(itemId, { categoryStatus: updatedCategoryStatus });
      } else if (itemType === 'bundle') {
        const bundle = bundles.find(b => b.id === itemId);
        if (!bundle) return;

        const updatedCategoryStatus = {
          ...bundle.categoryStatus,
          [categoryId]: isActive,
        };

        await updateBundle(itemId, { categoryStatus: updatedCategoryStatus });
      }
      
      showSuccess(`${itemType === 'service' ? 'Service' : 'Bundle'} ${isActive ? 'enabled' : 'disabled'} for category`);
    } catch (error) {
      showError(`Error updating category status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleExport = () => {
    // Export pricing data to CSV/Excel
    showSuccess('Export functionality coming soon');
  };

  const handleImport = () => {
    // Import pricing data from CSV/Excel
    showSuccess('Import functionality coming soon');
  };

  if (servicesLoading || categoriesLoading || vehicleCategoriesLoading || bundlesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (servicesError || categoriesError || vehicleCategoriesError || bundlesError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading pricing data. Please refresh the page.
        </Alert>
      </Box>
    );
  }

  // Filter active data and sort by order, then by name
  const activeServices = (services?.filter(service => service.isActive !== false) || [])
    .sort((a, b) => {
      const orderA = a.order || 0; // Put items without order at the beginning
      const orderB = b.order || 0;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.name.localeCompare(b.name);
    });
    
  const activeBundles = (bundles?.filter(bundle => bundle.isActive !== false) || [])
    .sort((a, b) => {
      const orderA = a.order || 0; // Put items without order at the beginning
      const orderB = b.order || 0;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.name.localeCompare(b.name);
    });
    
  const activeCategories = categories?.filter(category => category.isActive !== false) || [];
  const activeVehicleCategories = vehicleCategories?.filter(vc => vc.isActive !== false) || [];
  
  // Keep services and bundles separate
  const servicesWithType = activeServices.map(service => ({ ...service, itemType: 'service' }));
  const bundlesWithType = activeBundles.map(bundle => ({ ...bundle, itemType: 'bundle' }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <PricingIcon sx={{ mr: 2, fontSize: 32, color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                Pricing Management
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage service prices across categories and vehicle types
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Pricing">
              <IconButton onClick={handleExport}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import Pricing">
              <IconButton onClick={handleImport}>
                <ImportIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>


        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {activeServices.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Services
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {activeBundles.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Bundles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {activeCategories.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Categories
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {activeVehicleCategories.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Vehicle Types
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {(activeServices.length + activeBundles.length) * activeCategories.length * activeVehicleCategories.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Price Points
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>


      {/* Services Category Controls */}
      <CategoryControls
        items={servicesWithType}
        categories={activeCategories}
        onCategoryToggle={handleCategoryToggle}
        loading={loading}
        title="Services Category Management"
      />

      <Divider sx={{ my: 3 }} />

      {/* Bundles Category Controls */}
      <CategoryControls
        items={bundlesWithType}
        categories={activeCategories}
        onCategoryToggle={handleCategoryToggle}
        loading={loading}
        title="Bundles Category Management"
      />

      <Divider sx={{ my: 3 }} />

      {/* Services Pricing Matrix */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Services Pricing Matrix
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Services as rows, Categories as columns, Vehicle types as sub-columns. 
          Click on any price to edit inline.
        </Typography>
        
        <PricingMatrix
          items={servicesWithType}
          categories={activeCategories}
          vehicleCategories={activeVehicleCategories}
          onPriceChange={handlePriceChange}
          onCategoryToggle={handleCategoryToggle}
          loading={loading}
        />
      </Paper>

      {/* Bundles Pricing Matrix */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Bundles Pricing Matrix
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Bundles as rows, Categories as columns, Vehicle types as sub-columns. 
          Click on any price to edit inline.
        </Typography>
        
        <PricingMatrix
          items={bundlesWithType}
          categories={activeCategories}
          vehicleCategories={activeVehicleCategories}
          onPriceChange={handlePriceChange}
          onCategoryToggle={handleCategoryToggle}
          loading={loading}
        />
      </Paper>
    </Box>
  );
};

export default PricingManagementPage;
