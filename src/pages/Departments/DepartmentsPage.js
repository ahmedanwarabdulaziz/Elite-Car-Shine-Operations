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
  Chip,
  Grid,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Palette as PaletteIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const DepartmentsPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: departments, 
    loading, 
    error, 
    subscribeToData, 
    addDocument, 
    updateDocument, 
    deleteDocument 
  } = useFirebase('departments');

  const { 
    data: services, 
    loading: servicesLoading,
    subscribeToData: subscribeToServices
  } = useFirebase('services');

  const { 
    data: bundles, 
    loading: bundlesLoading,
    subscribeToData: subscribeToBundles
  } = useFirebase('bundles');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    isActive: true,
    permissions: {
      // Main navigation
      dashboard: true,
      workOrders: false,
      workOrderDashboard: false,
      
      // Settings group
      categories: false,
      vehicleCategories: false,
      services: false,
      bundles: false,
      paymentMethods: false,
      taxManagement: false,
      customerFields: false,
      vehicleFields: false,
      employees: false,
      departments: false,
      workOrderStatuses: false,
      dataManagement: false,
      bankAccounts: false,
      expenseCategories: false,
      pricingManagement: false,
      
      // Customers group
      corporateCustomers: false,
      individualCustomers: false,
      createCustomer: false,
      
      // Finance group
      expenses: false,
      paymentReports: false,
      vault: false,
      corporateSettlement: false,
      pendingPayments: false,
      issuedInvoices: false,
      invoices: false,
      invoiceReports: false,
      finance: false,
      
      // Analytics
      analytics: false,
    },
    canPerformDetailing: false,
    detailingCapabilities: []
  });

  useEffect(() => {
    subscribeToData();
    subscribeToServices();
    subscribeToBundles();
  }, [subscribeToData, subscribeToServices, subscribeToBundles]);

  const handleOpenDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name || '',
        description: department.description || '',
        color: department.color || '#1976d2',
        isActive: department.isActive !== undefined ? department.isActive : true,
        permissions: department.permissions || {
          // Main navigation
          dashboard: true,
          workOrders: false,
          workOrderDashboard: false,
          
          // Settings group
          categories: false,
          vehicleCategories: false,
          services: false,
          bundles: false,
          paymentMethods: false,
          taxManagement: false,
          customerFields: false,
          vehicleFields: false,
          employees: false,
          departments: false,
          workOrderStatuses: false,
          dataManagement: false,
          bankAccounts: false,
          expenseCategories: false,
          
          // Customers group
          corporateCustomers: false,
          individualCustomers: false,
          createCustomer: false,
          
          // Finance group
          expenses: false,
          paymentReports: false,
          vault: false,
          corporateSettlement: false,
          pendingPayments: false,
          issuedInvoices: false,
          invoices: false,
          invoiceReports: false,
          finance: false,
          
          // Analytics
          analytics: false,
        },
        canPerformDetailing: department.canPerformDetailing || false,
        detailingCapabilities: department.detailingCapabilities || []
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
        color: '#1976d2',
        isActive: true,
        permissions: {
          dashboard: true,
          categories: false,
          services: false,
          customers: false,
          workOrders: false,
          invoices: false,
          employees: false,
          reports: false,
          // New payment management permissions
          pendingPayments: false,
          corporateSettlement: false,
          vault: false,
          bankAccounts: false,
          paymentReports: false,
          expenseCategories: false,
          expenses: false,
        },
        canPerformDetailing: false,
        detailingCapabilities: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      isActive: true,
      permissions: {
        dashboard: true,
        categories: false,
        services: false,
        customers: false,
        workOrders: false,
        invoices: false,
        employees: false,
        reports: false,
        // New payment management permissions
        pendingPayments: false,
        vault: false,
        bankAccounts: false,
        paymentReports: false,
        expenseCategories: false,
        expenses: false,
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        showError('Department name is required');
        return;
      }

      const departmentData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdAt: editingDepartment ? editingDepartment.createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (editingDepartment) {
        await updateDocument(editingDepartment.id, departmentData);
        showSuccess('Department updated successfully');
      } else {
        await addDocument(departmentData);
        showSuccess('Department added successfully');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving department:', error);
      showError('Failed to save department');
    }
  };

  const handleDelete = async (department) => {
    const confirmed = await showConfirm(
      'Delete Department',
      `Are you sure you want to delete the "${department.name}" department? This action cannot be undone and will affect all employees in this department.`
    );
    
    if (confirmed) {
      try {
        await deleteDocument(department.id);
        showSuccess('Department deleted successfully');
      } catch (error) {
        console.error('Error deleting department:', error);
        showError('Failed to delete department');
      }
    }
  };

  const predefinedColors = [
    '#1976d2', // Blue
    '#dc004e', // Red
    '#2e7d32', // Green
    '#ed6c02', // Orange
    '#9c27b0', // Purple
    '#0288d1', // Light Blue
    '#d32f2f', // Dark Red
    '#388e3c', // Dark Green
    '#f57c00', // Dark Orange
    '#7b1fa2', // Dark Purple
  ];

  const getCapabilityName = (capabilityId) => {
    if (capabilityId.startsWith('service-')) {
      const serviceId = capabilityId.replace('service-', '');
      const service = availableServices.find(s => s.id === serviceId);
      return service ? { name: service.name, type: 'service' } : null;
    } else if (capabilityId.startsWith('bundle-')) {
      const bundleId = capabilityId.replace('bundle-', '');
      const bundle = availableBundles.find(b => b.id === bundleId);
      return bundle ? { name: bundle.name, type: 'bundle' } : null;
    }
    return null;
  };

  const permissionLabels = {
    // Main navigation
    dashboard: 'Dashboard Access',
    workOrders: 'Work Orders Management',
    workOrderDashboard: 'Work Order Dashboard',
    
    // Settings group
    categories: 'Categories Management',
    vehicleCategories: 'Vehicle Categories Management',
    services: 'Services Management',
    bundles: 'Service Bundles Management',
    paymentMethods: 'Payment Methods Management',
    taxManagement: 'Tax Management',
    customerFields: 'Customer Fields Management',
    vehicleFields: 'Vehicle Fields Management',
    employees: 'Employee Management',
    departments: 'Department Management',
    workOrderStatuses: 'Work Order Statuses Management',
    dataManagement: 'Data Management',
    bankAccounts: 'Bank Accounts Management',
    expenseCategories: 'Expense Categories Management',
    pricingManagement: 'Pricing Management',
    
    // Customers group
    corporateCustomers: 'Corporate Customers Management',
    individualCustomers: 'Individual Customers Management',
    createCustomer: 'Create Customer Access',
    
    // Finance group
    expenses: 'Expenses Management',
    paymentReports: 'Payment Reports & Analytics',
    vault: 'Vault Management',
    corporateSettlement: 'Corporate Settlement Management',
    pendingPayments: 'Pending Payments Management',
    issuedInvoices: 'Issued Invoices Management',
    invoices: 'Invoices Management',
    invoiceReports: 'Invoice Reports & Analytics',
    finance: 'Finance Management',
    
    // Analytics
    analytics: 'Analytics & Reports',
  };

  // Use existing services and bundles instead of hardcoded capabilities
  const availableServices = services?.filter(service => service.isActive) || [];
  const availableBundles = bundles?.filter(bundle => bundle.isActive) || [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading departments: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Department Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage departments and their access permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
        >
          Add Department
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments && departments.length > 0 ? (
                  departments
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((department) => (
                      <TableRow key={department.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: department.color,
                                width: 40,
                                height: 40
                              }}
                            >
                              <BusinessIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {department.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {department.id.slice(-8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {department.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {/* Permissions */}
                            <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                              {Object.entries(department.permissions || {}).map(([key, value]) => (
                                value && (
                                  <Chip
                                    key={key}
                                    label={permissionLabels[key] || key}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                )
                              ))}
                            </Box>
                            {/* Detailing Capabilities */}
                            {department.canPerformDetailing && department.detailingCapabilities && department.detailingCapabilities.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="textSecondary" gutterBottom>
                                  Capabilities:
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {department.detailingCapabilities.map((capabilityId) => {
                                    const capability = getCapabilityName(capabilityId);
                                    return capability && (
                                      <Chip
                                        key={capabilityId}
                                        label={capability.name}
                                        size="small"
                                        variant="outlined"
                                        color={capability.type === 'service' ? 'primary' : 'secondary'}
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                      />
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={department.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={department.isActive ? 'success' : 'default'}
                            variant={department.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit Department">
                            <IconButton
                              onClick={() => handleOpenDialog(department)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Department">
                            <IconButton
                              onClick={() => handleDelete(department)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box py={4}>
                        <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                          No departments found
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                          Create departments to organize your employees and manage permissions
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                        >
                          Add Department
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Department Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                fullWidth
                required
                placeholder="e.g., Sales, Operations, Management"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Department Color
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {predefinedColors.map((color) => (
                    <Box
                      key={color}
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: color,
                        borderRadius: 1,
                        border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                        cursor: 'pointer',
                        '&:hover': {
                          border: '3px solid #000',
                        }
                      }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the department's role and responsibilities..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Access Permissions
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Select which pages and features this department can access
              </Typography>
            </Grid>

            {Object.entries(permissionLabels).map(([key, label]) => (
              <Grid item xs={12} sm={6} key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.permissions[key] || false}
                      onChange={(e) => handlePermissionChange(key, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={label}
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Detailing Capabilities
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Enable this department to perform detailing work and assign workers to work orders
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.canPerformDetailing}
                    onChange={(e) => handleInputChange('canPerformDetailing', e.target.checked)}
                    color="primary"
                  />
                }
                label="Can Perform Detailing Work"
              />
            </Grid>

            {formData.canPerformDetailing && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Specialized Capabilities
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Select the specific services and bundles this department can perform
                  </Typography>
                </Grid>

                {/* Services Section */}
                {availableServices.length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Services
                      </Typography>
                    </Grid>
                    {availableServices.map((service) => (
                      <Grid item xs={12} sm={6} key={`service-${service.id}`}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.detailingCapabilities.includes(`service-${service.id}`)}
                              onChange={(e) => {
                                const current = formData.detailingCapabilities;
                                const serviceKey = `service-${service.id}`;
                                if (e.target.checked) {
                                  handleInputChange('detailingCapabilities', [...current, serviceKey]);
                                } else {
                                  handleInputChange('detailingCapabilities', current.filter(id => id !== serviceKey));
                                }
                              }}
                              color="primary"
                              size="small"
                            />
                          }
                          label={service.name}
                        />
                      </Grid>
                    ))}
                  </>
                )}

                {/* Bundles Section */}
                {availableBundles.length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="secondary" gutterBottom sx={{ mt: 2 }}>
                        Bundles
                      </Typography>
                    </Grid>
                    {availableBundles.map((bundle) => (
                      <Grid item xs={12} sm={6} key={`bundle-${bundle.id}`}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.detailingCapabilities.includes(`bundle-${bundle.id}`)}
                              onChange={(e) => {
                                const current = formData.detailingCapabilities;
                                const bundleKey = `bundle-${bundle.id}`;
                                if (e.target.checked) {
                                  handleInputChange('detailingCapabilities', [...current, bundleKey]);
                                } else {
                                  handleInputChange('detailingCapabilities', current.filter(id => id !== bundleKey));
                                }
                              }}
                              color="secondary"
                              size="small"
                            />
                          }
                          label={bundle.name}
                        />
                      </Grid>
                    ))}
                  </>
                )}

                {/* No Services or Bundles Available */}
                {availableServices.length === 0 && availableBundles.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No services or bundles available. Create services and bundles first to assign capabilities to departments.
                    </Alert>
                  </Grid>
                )}
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    color="primary"
                  />
                }
                label="Active Department"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDepartment ? 'Update' : 'Add'} Department
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentsPage;
