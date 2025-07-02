import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';
import { useNavigate } from 'react-router-dom';

const TaxesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // Firebase hooks
  const { 
    data: taxes, 
    loading: taxesLoading, 
    subscribeToData: subscribeToTaxes, 
    addDocument: addTax, 
    updateDocument: updateTax, 
    deleteDocument: deleteTax,
  } = useFirebase('taxes');

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
    data: categories, 
    loading: categoriesLoading, 
    subscribeToData: subscribeToCategories, 
  } = useFirebase('categories');

  // State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: '',
    description: '',
    isActive: true,
    isInclusive: false, // true if tax is included in price
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToTaxes({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToServices({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToBundles({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToCategories({ orderBy: 'name', orderDirection: 'asc' });
  }, [subscribeToTaxes, subscribeToServices, subscribeToBundles, subscribeToCategories]);

  const handleOpenDialog = (tax = null) => {
    if (tax) {
      setEditingTax(tax);
      setFormData({
        name: tax.name || '',
        code: tax.code || '',
        rate: tax.rate || '',
        description: tax.description || '',
        isActive: tax.isActive !== false,
        isInclusive: tax.isInclusive || false,
      });
    } else {
      setEditingTax(null);
      setFormData({
        name: '',
        code: '',
        rate: '',
        description: '',
        isActive: true,
        isInclusive: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTax(null);
    setFormData({
      name: '',
      code: '',
      rate: '',
      description: '',
      isActive: true,
      isInclusive: false,
    });
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'isActive' || field === 'isInclusive' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Tax name is required');
      return;
    }

    if (!formData.code.trim()) {
      showError('Tax code is required');
      return;
    }

    if (!formData.rate || parseFloat(formData.rate) < 0) {
      showError('Please enter a valid tax rate');
      return;
    }

    try {
      const taxData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        rate: parseFloat(formData.rate),
        description: formData.description.trim(),
        isActive: formData.isActive,
        isInclusive: formData.isInclusive,
        updatedAt: new Date(),
      };

      if (editingTax) {
        await updateTax(editingTax.id, taxData);
        showSuccess('Tax updated successfully');
      } else {
        taxData.createdAt = new Date();
        await addTax(taxData);
        showSuccess('Tax added successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      showError(editingTax ? 'Error updating tax' : 'Error adding tax');
    }
  };

  const handleDelete = async (taxId) => {
    showConfirm({
      title: 'Delete Tax',
      message: 'Are you sure you want to delete this tax? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteTax(taxId);
          showSuccess('Tax deleted successfully');
        } catch (error) {
          showError('Error deleting tax');
        }
      },
    });
  };

  const getActiveTaxes = () => {
    return taxes?.filter(tax => tax.isActive !== false) || [];
  };

  const getInactiveTaxes = () => {
    return taxes?.filter(tax => tax.isActive === false) || [];
  };

  const getTaxUsage = (taxId) => {
    const usedInServices = services?.filter(service => 
      service.taxIds?.includes(taxId)
    ).length || 0;
    
    const usedInBundles = bundles?.filter(bundle => 
      bundle.taxIds?.includes(taxId)
    ).length || 0;

    return usedInServices + usedInBundles;
  };

  if (taxesLoading || servicesLoading || bundlesLoading || categoriesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeTaxes = getActiveTaxes();
  const inactiveTaxes = getInactiveTaxes();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MoneyIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Tax Management
          </Typography>
        </Box>
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
          Add New Tax
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssignmentIcon />}
          onClick={() => navigate('/tax-assignment')}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            ml: 2,
          }}
        >
          Tax Assignment
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PercentIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {activeTaxes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Taxes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SettingsIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {inactiveTaxes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive Taxes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MoneyIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {taxes?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Taxes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Taxes Table */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Active Taxes
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell sx={{ fontWeight: 600 }}>Tax Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Usage</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeTaxes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No active taxes found. Click "Add New Tax" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activeTaxes.map((tax) => (
                  <TableRow key={tax.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {tax.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tax.code} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                        {tax.rate}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tax.isInclusive ? 'Inclusive' : 'Exclusive'} 
                        color={tax.isInclusive ? 'success' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getTaxUsage(tax.id)} items
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tax.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(tax)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Tax">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(tax)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tax">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(tax.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Inactive Taxes Table */}
      {inactiveTaxes.length > 0 && (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
              Inactive Taxes
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tax Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usage</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactiveTaxes.map((tax) => (
                  <TableRow key={tax.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {tax.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tax.code} 
                        color="default" 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {tax.rate}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tax.isInclusive ? 'Inclusive' : 'Exclusive'} 
                        color="default"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getTaxUsage(tax.id)} items
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit Tax">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(tax)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tax">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(tax.id)}
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
        </Paper>
      )}

      {/* Add/Edit Tax Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          py: 3,
          px: 4
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingTax ? 'Edit Tax' : 'Add New Tax'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                placeholder="e.g., GST, VAT, Service Tax"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Code"
                value={formData.code}
                onChange={handleInputChange('code')}
                required
                placeholder="e.g., GST001, VAT001"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                value={formData.rate}
                onChange={handleInputChange('rate')}
                type="number"
                required
                placeholder="e.g., 10, 15, 20"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tax Type</InputLabel>
                <Select
                  value={formData.isInclusive ? 'inclusive' : 'exclusive'}
                  onChange={(e) => setFormData({
                    ...formData,
                    isInclusive: e.target.value === 'inclusive'
                  })}
                  label="Tax Type"
                >
                  <MenuItem value="exclusive">Exclusive (Added to price)</MenuItem>
                  <MenuItem value="inclusive">Inclusive (Included in price)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
                placeholder="Brief description of what this tax covers"
                sx={{ mb: 2 }}
              />
            </Grid>
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
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 2, bgcolor: 'grey.50' }}>
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
            }}
          >
            {editingTax ? 'Update Tax' : 'Create Tax'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxesPage; 