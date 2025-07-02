import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Paper,
  useTheme,
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
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
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../../components/Common/NotificationSystem';
import useFirebase from '../../../hooks/useFirebase';

const CreateCustomerPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  
  // Firebase hooks
  const { 
    data: customers, 
    loading: customersLoading, 
    subscribeToData: subscribeToCustomers,
    updateDocument: updateCustomer,
    deleteDocument: deleteCustomer,
  } = useFirebase('customers');

  const { 
    data: customerFields, 
    loading: customerFieldsLoading, 
    subscribeToData: subscribeToCustomerFields, 
  } = useFirebase('customerFields');

  const { 
    data: individualGroups, 
    loading: individualGroupsLoading, 
    subscribeToData: subscribeToIndividualGroups, 
  } = useFirebase('individualCustomers');

  const { 
    addDocument: addCustomer, 
  } = useFirebase('customers');

  // State
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check for groupId in URL params (from Work Order page)
  useEffect(() => {
    const groupId = searchParams.get('groupId');
    if (groupId && individualGroups) {
      const group = individualGroups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroup(groupId);
        console.log('Pre-selected group from URL:', group.name);
      }
    }
  }, [searchParams, individualGroups]);

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToCustomers({ orderBy: 'createdAt', orderDirection: 'desc' });
    subscribeToCustomerFields({ orderBy: 'order', orderDirection: 'asc' });
    subscribeToIndividualGroups({ orderBy: 'name', orderDirection: 'asc' });
  }, [subscribeToCustomers, subscribeToCustomerFields, subscribeToIndividualGroups]);

  const handleBackToWorkOrder = () => {
    navigate('/work-orders');
  };

  const handleOpenDialog = (customer = null) => {
    setEditingCustomer(customer);
    if (customer) {
      setSelectedGroup(customer.groupId || '');
      setFormData(customer.customerFields || {});
    } else {
      setSelectedGroup('');
      setFormData({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setSelectedGroup('');
    setFormData({});
  };

  const handleGroupChange = (event) => {
    const group = event.target.value;
    setSelectedGroup(group);
    if (!editingCustomer) {
      setFormData({});
    }
  };

  const handleInputChange = (fieldName) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [fieldName]: value,
    });
  };

  const getCustomerFieldsForIndividual = () => {
    if (!customerFields) return [];
    return customerFields.filter(field => 
      field.isActive !== false && 
      (field.customerTypes?.includes('individual') || field.customerTypes?.includes('both'))
    );
  };

  const getActiveIndividualGroups = () => {
    if (!individualGroups) return [];
    return individualGroups.filter(group => group.isActive !== false);
  };

  const getIndividualCustomers = () => {
    if (!customers) return [];
    return customers.filter(customer => 
      customer.category === 'individual' && customer.isActive !== false
    );
  };

  const getFilteredCustomers = () => {
    const customers = getIndividualCustomers();
    if (!searchTerm.trim()) return customers;

    const searchLower = searchTerm.toLowerCase();
    
    return customers.filter(customer => {
      // Search in group name
      const groupName = getGroupName(customer.groupId);
      if (groupName.toLowerCase().includes(searchLower)) return true;

      // Search in customer fields
      const customerFields = customer.customerFields || {};
      const individualFields = getCustomerFieldsForIndividual();
      
      for (const field of individualFields) {
        const fieldValue = customerFields[field.id];
        if (fieldValue && fieldValue.toString().toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      // Search in creation date
      if (customer.createdAt) {
        const dateStr = new Date(customer.createdAt.toDate()).toLocaleDateString();
        if (dateStr.toLowerCase().includes(searchLower)) return true;
      }

      return false;
    });
  };

  const getGroupName = (groupId) => {
    if (!individualGroups) return 'Unknown Group';
    const group = individualGroups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const required = field.isRequired;

    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.name}
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            label={field.name}
            type="email"
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );

      case 'phone':
        return (
          <TextField
            fullWidth
            label={field.name}
            type="tel"
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.name}
            multiline
            rows={3}
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            label={field.name}
            type="number"
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );

      case 'select':
        const options = field.options ? field.options : [];
        return (
          <FormControl fullWidth required={required}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value}
              onChange={handleInputChange(field.id)}
              label={field.name}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value}
                onChange={handleInputChange(field.id)}
                color="primary"
              />
            }
            label={field.name}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            label={field.name}
            type="date"
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={field.name}
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        );
    }
  };

  const handleSubmit = async () => {
    if (!selectedGroup) {
      showError('Please select an individual customer group');
      return;
    }

    // Validate required fields
    const customerFieldsForIndividual = getCustomerFieldsForIndividual();
    
    const missingRequiredFields = customerFieldsForIndividual
      .filter(field => field.isRequired && !formData[field.id])
      .map(field => field.name);

    if (missingRequiredFields.length > 0) {
      showError(`Please fill in required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      if (editingCustomer) {
        // Update existing customer
        const customerData = {
          ...editingCustomer,
          groupId: selectedGroup,
          customerFields: formData,
          updatedAt: new Date(),
        };
        await updateCustomer(editingCustomer.id, customerData);
        showSuccess('Customer updated successfully');
      } else {
        // Create new customer
        const customerData = {
          category: 'individual',
          groupId: selectedGroup,
          customerFields: formData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await addCustomer(customerData);
        showSuccess('Customer created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      showError(editingCustomer ? 'Error updating customer' : 'Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        showSuccess('Customer deleted successfully');
      } catch (error) {
        showError('Error deleting customer');
      }
    }
  };

  if (customersLoading || customerFieldsLoading || individualGroupsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const individualCustomers = getFilteredCustomers();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackToWorkOrder}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Back to Work Orders
          </Button>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              Individual Customers
            </Typography>
            {selectedGroup && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Pre-selected group: <strong>{getGroupName(selectedGroup)}</strong>
              </Typography>
            )}
          </Box>
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
          Add New Customer
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SearchIcon color="action" />
          <TextField
            fullWidth
            placeholder="Search customers by name, email, phone, group, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'white',
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          {searchTerm && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSearchTerm('')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Clear
            </Button>
          )}
        </Box>
        {searchTerm && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Found {individualCustomers.length} customer{individualCustomers.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </Typography>
        )}
      </Paper>

      {/* Customers Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Group</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {individualCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No individual customers found. Click "Add New Customer" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                individualCustomers.map((customer) => {
                  const customerFields = customer.customerFields || {};
                  const nameField = getCustomerFieldsForIndividual().find(f => f.name.toLowerCase().includes('name'));
                  const emailField = getCustomerFieldsForIndividual().find(f => f.type === 'email');
                  const phoneField = getCustomerFieldsForIndividual().find(f => f.type === 'phone');
                  
                  const name = nameField ? customerFields[nameField.id] : 'N/A';
                  const email = emailField ? customerFields[emailField.id] : 'N/A';
                  const phone = phoneField ? customerFields[phoneField.id] : 'N/A';

                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="primary" />
                          <Typography variant="body1" fontWeight={500}>
                            {name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getGroupName(customer.groupId)} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{phone}</TableCell>
                      <TableCell>
                        {customer.createdAt ? new Date(customer.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenDialog(customer)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Customer">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenDialog(customer)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Customer">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          py: 3,
          px: 4
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingCustomer ? 'Edit Individual Customer' : 'Add New Individual Customer'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', height: '70vh' }}>
            {/* Form Section */}
            <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
              <Grid container spacing={3}>
                {/* Group Selection */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                      Customer Group
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Select Individual Customer Group</InputLabel>
                      <Select
                        value={selectedGroup}
                        onChange={handleGroupChange}
                        label="Select Individual Customer Group"
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      >
                        {getActiveIndividualGroups().map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>

                {/* Customer Fields */}
                {selectedGroup && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: theme.palette.primary.main }}>
                        Customer Information
                      </Typography>
                      <Grid container spacing={3}>
                        {getCustomerFieldsForIndividual().map((field) => (
                          <Grid item xs={12} md={6} key={field.id}>
                            <Box>
                              {renderField(field)}
                              {field.isRequired && (
                                <Chip 
                                  label="Required" 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Review Section */}
            {selectedGroup && (
              <Box sx={{ 
                width: 350, 
                bgcolor: 'grey.100', 
                p: 3, 
                borderLeft: `1px solid ${theme.palette.divider}`,
                overflowY: 'auto'
              }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: theme.palette.primary.main }}>
                  Review Information
                </Typography>
                
                {/* Group Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                    Customer Group
                  </Typography>
                  <Chip 
                    label={getGroupName(selectedGroup)} 
                    color="primary" 
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Customer Fields Review */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                    Customer Details
                  </Typography>
                  {customerFields
                    ?.filter(field => 
                      field.isActive !== false && 
                      (field.customerTypes?.includes('individual') || field.customerTypes?.includes('both')) &&
                      formData[field.id]
                    )
                    .map((field) => {
                      const value = formData[field.id];
                      
                      return (
                        <Box key={field.id} sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {field.name}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                            {field.type === 'checkbox' ? (value ? 'Yes' : 'No') : value}
                          </Typography>
                        </Box>
                      );
                    })}
                  
                  {customerFields
                    ?.filter(field => 
                      field.isActive !== false && 
                      (field.customerTypes?.includes('individual') || field.customerTypes?.includes('both')) &&
                      formData[field.id]
                    )
                    .length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No information entered yet
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, bgcolor: 'grey.50' }}>
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
            disabled={loading || !selectedGroup}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
            }}
          >
            {loading ? <CircularProgress size={20} /> : (editingCustomer ? 'Update Customer' : 'Create Customer')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateCustomerPage; 