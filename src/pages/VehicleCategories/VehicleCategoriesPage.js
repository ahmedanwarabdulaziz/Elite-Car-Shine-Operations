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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  DirectionsCar as DefaultIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const VehicleCategoriesPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: vehicleCategories, 
    loading, 
    error, 
    subscribeToData, 
    addDocument, 
    updateDocument, 
    deleteDocument,
    batchUpdate 
  } = useFirebase('vehicleCategories');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToData({ orderBy: 'order', orderDirection: 'asc' });
  }, [subscribeToData]);

  // Handle errors
  useEffect(() => {
    if (error) {
      showError(`Error loading vehicle categories: ${error}`);
    }
  }, [error, showError]);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: field === 'isActive' ? event.target.checked : event.target.value,
    });
  };

  // Handle toggle status directly from table
  const handleToggleStatus = async (category) => {
    try {
      const newStatus = !category.isActive;
      
      await updateDocument(category.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Vehicle category ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Vehicle category name is required');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        await updateDocument(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
        showSuccess('Vehicle category updated successfully');
      } else {
        // Add new category
        await addDocument({
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
          order: vehicleCategories.length,
        });
        showSuccess('Vehicle category added successfully');
      }
      
      // Close dialog and reset state
      setOpenDialog(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    } catch (error) {
      showError('Error saving vehicle category');
    }
  };

  const handleDelete = async (categoryId) => {
    showConfirm({
      title: 'Delete Vehicle Category',
      message: 'Are you sure you want to delete this vehicle category? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteDocument(categoryId);
          showSuccess('Vehicle category deleted successfully');
        } catch (error) {
          showError('Error deleting vehicle category');
        }
      },
    });
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    try {
      const updates = [];
      const currentCategory = vehicleCategories[index];
      const previousCategory = vehicleCategories[index - 1];
      
      updates.push({
        id: currentCategory.id,
        data: { order: previousCategory.order }
      });
      
      updates.push({
        id: previousCategory.id,
        data: { order: currentCategory.order }
      });
      
      await batchUpdate(updates);
      showSuccess('Vehicle category moved up successfully');
    } catch (error) {
      showError('Error moving vehicle category');
    }
  };

  const handleMoveDown = async (index) => {
    if (index === vehicleCategories.length - 1) return;
    
    try {
      const updates = [];
      const currentCategory = vehicleCategories[index];
      const nextCategory = vehicleCategories[index + 1];
      
      updates.push({
        id: currentCategory.id,
        data: { order: nextCategory.order }
      });
      
      updates.push({
        id: nextCategory.id,
        data: { order: currentCategory.order }
      });
      
      await batchUpdate(updates);
      showSuccess('Vehicle category moved down successfully');
    } catch (error) {
      showError('Error moving vehicle category');
    }
  };

  if (loading) {
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
          Vehicle Categories Management
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
          Add Vehicle Category
        </Button>
      </Box>

      {/* Vehicle Categories Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleCategories.map((category, index) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {index + 1}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            sx={{ p: 0.5 }}
                          >
                            <UpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === vehicleCategories.length - 1}
                            sx={{ p: 0.5 }}
                          >
                            <DownIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DefaultIcon sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {category.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.isActive ? (
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
                            onClick={() => handleToggleStatus(category)}
                            sx={{
                              color: category.isActive ? 'success.main' : 'text.secondary',
                              '&:hover': {
                                backgroundColor: category.isActive ? 'success.light' : 'grey.100',
                              },
                            }}
                          >
                            {category.isActive ? <ViewIcon /> : <HideIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Vehicle Category">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(category)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.light' },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Vehicle Category">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(category.id)}
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

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingCategory ? 'Edit Vehicle Category' : 'Add New Vehicle Category'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Vehicle Category Name"
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
            {editingCategory ? 'Update' : 'Add'} Vehicle Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleCategoriesPage; 