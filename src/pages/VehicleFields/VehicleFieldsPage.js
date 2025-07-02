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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text input' },
  { value: 'email', label: 'Email', description: 'Email address input' },
  { value: 'phone', label: 'Phone', description: 'Phone number input' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'time', label: 'Time', description: 'Time picker' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'yes_no', label: 'Yes/No', description: 'Boolean choice' },
  { value: 'checkbox', label: 'Checkbox', description: 'Checkbox input' },
  { value: 'radio', label: 'Radio Buttons', description: 'Single choice from options' },
  { value: 'select', label: 'Dropdown', description: 'Dropdown selection' },
  { value: 'multiselect', label: 'Multi-Select', description: 'Multiple choice dropdown' },
  { value: 'file', label: 'File Upload', description: 'File upload input' },
  { value: 'url', label: 'URL', description: 'Website URL input' },
  { value: 'address', label: 'Address', description: 'Address input fields' },
];

const CUSTOMER_TYPES = [
  { value: 'individual', label: 'Individual', icon: <PersonIcon /> },
  { value: 'corporate', label: 'Corporate', icon: <BusinessIcon /> },
  { value: 'both', label: 'Both', icon: <SettingsIcon /> },
];

const VehicleFieldsPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: vehicleFields, 
    loading: vehicleFieldsLoading, 
    error: vehicleFieldsError, 
    subscribeToData: subscribeToVehicleFields, 
    addDocument: addVehicleField, 
    updateDocument: updateVehicleField, 
    deleteDocument: deleteVehicleField,
  } = useFirebase('vehicleFields');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    isRequired: false,
    isActive: true,
    order: 0,
    customerTypes: [],
    options: [], // For radio, select, multiselect fields
    validation: {
      minLength: '',
      maxLength: '',
      minValue: '',
      maxValue: '',
      pattern: '',
    },
  });

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToVehicleFields({ orderBy: 'order', orderDirection: 'asc' });
  }, [subscribeToVehicleFields]);

  // Handle errors
  useEffect(() => {
    if (vehicleFieldsError) {
      showError(`Error loading vehicle fields: ${vehicleFieldsError}`);
    }
  }, [vehicleFieldsError, showError]);

  const handleOpenDialog = (field = null) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        type: field.type,
        description: field.description,
        isRequired: field.isRequired || false,
        isActive: field.isActive,
        order: field.order || 0,
        customerTypes: field.customerTypes || [],
        options: field.options || [],
        validation: field.validation || {
          minLength: '',
          maxLength: '',
          minValue: '',
          maxValue: '',
          pattern: '',
        },
      });
    } else {
      setEditingField(null);
      setFormData({
        name: '',
        type: '',
        description: '',
        isRequired: false,
        isActive: true,
        order: 0,
        customerTypes: [],
        options: [],
        validation: {
          minLength: '',
          maxLength: '',
          minValue: '',
          maxValue: '',
          pattern: '',
        },
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingField(null);
    setFormData({
      name: '',
      type: '',
      description: '',
      isRequired: false,
      isActive: true,
      order: 0,
      customerTypes: [],
      options: [],
      validation: {
        minLength: '',
        maxLength: '',
        minValue: '',
        maxValue: '',
        pattern: '',
      },
    });
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'isRequired' || field === 'isActive' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleCustomerTypeChange = (customerType) => {
    const newTypes = formData.customerTypes.includes(customerType)
      ? formData.customerTypes.filter(type => type !== customerType)
      : [...formData.customerTypes, customerType];
    
    setFormData({
      ...formData,
      customerTypes: newTypes,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    });
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const handleValidationChange = (field) => (event) => {
    setFormData({
      ...formData,
      validation: {
        ...formData.validation,
        [field]: event.target.value,
      },
    });
  };

  const handleToggleStatus = async (field) => {
    try {
      const newStatus = !field.isActive;
      
      await updateVehicleField(field.id, {
        isActive: newStatus,
      });
      
      showSuccess(`Vehicle field ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showError('Error updating status');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Field name is required');
      return;
    }

    if (!formData.type) {
      showError('Please select a field type');
      return;
    }

    if (formData.customerTypes.length === 0) {
      showError('Please select at least one customer type');
      return;
    }

    // Validate options for choice-based fields
    if (['radio', 'select', 'multiselect'].includes(formData.type) && formData.options.length === 0) {
      showError('Please add at least one option for choice-based fields');
      return;
    }

    // Validate options are not empty
    if (['radio', 'select', 'multiselect'].includes(formData.type)) {
      const emptyOptions = formData.options.some(option => !option.trim());
      if (emptyOptions) {
        showError('All options must have values');
        return;
      }
    }

    try {
      const fieldData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        isRequired: formData.isRequired,
        isActive: formData.isActive,
        order: parseInt(formData.order) || 0,
        customerTypes: formData.customerTypes,
        validation: formData.validation,
      };

      // Only include options for choice-based fields
      if (['radio', 'select', 'multiselect'].includes(formData.type)) {
        fieldData.options = formData.options.filter(option => option.trim());
      }

      if (editingField) {
        // Update existing field
        await updateVehicleField(editingField.id, fieldData);
        showSuccess('Vehicle field updated successfully');
      } else {
        // Add new field
        await addVehicleField(fieldData);
        showSuccess('Vehicle field added successfully');
      }
      
      // Close dialog and reset state
      setOpenDialog(false);
      setEditingField(null);
      setFormData({
        name: '',
        type: '',
        description: '',
        isRequired: false,
        isActive: true,
        order: 0,
        customerTypes: [],
        options: [],
        validation: {
          minLength: '',
          maxLength: '',
          minValue: '',
          maxValue: '',
          pattern: '',
        },
      });
    } catch (error) {
      showError('Error saving vehicle field');
    }
  };

  const handleDelete = async (fieldId) => {
    showConfirm({
      title: 'Delete Vehicle Field',
      message: 'Are you sure you want to delete this vehicle field? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error',
      onConfirm: async () => {
        try {
          await deleteVehicleField(fieldId);
          showSuccess('Vehicle field deleted successfully');
        } catch (error) {
          showError('Error deleting vehicle field');
        }
      },
    });
  };

  const getFieldTypeInfo = (type) => {
    return FIELD_TYPES.find(ft => ft.value === type) || FIELD_TYPES[0];
  };

  const getCustomerTypesDisplay = (types) => {
    if (types.includes('both')) {
      return 'Both';
    }
    return types.map(type => {
      const typeInfo = CUSTOMER_TYPES.find(ct => ct.value === type);
      return typeInfo ? typeInfo.label : type;
    }).join(', ');
  };

  const getFieldTypeColor = (type) => {
    switch (type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'url':
        return 'primary';
      case 'number':
      case 'date':
      case 'time':
      case 'datetime':
        return 'info';
      case 'yes_no':
      case 'checkbox':
      case 'radio':
      case 'select':
      case 'multiselect':
        return 'success';
      case 'file':
      case 'address':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isChoiceField = (type) => {
    return ['radio', 'select', 'multiselect'].includes(type);
  };

  const individualFields = vehicleFields.filter(field => 
    field.customerTypes.includes('individual') || field.customerTypes.includes('both')
  );

  const corporateFields = vehicleFields.filter(field => 
    field.customerTypes.includes('corporate') || field.customerTypes.includes('both')
  );

  if (vehicleFieldsLoading) {
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
          Vehicle Fields Management
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
          Add Vehicle Field
        </Button>
      </Box>

      {/* Vehicle Fields Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Individual Customer Vehicle Fields
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {individualFields.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Custom vehicle fields for individual customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Corporate Customer Vehicle Fields
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {corporateFields.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Custom vehicle fields for corporate customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vehicle Fields Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem', width: 50 }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Field Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Customer Types</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Required</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleFields.map((field) => (
                  <TableRow key={field.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DragIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {field.order || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {field.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFieldTypeInfo(field.type).label}
                        size="small"
                        color={getFieldTypeColor(field.type)}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {field.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getCustomerTypesDisplay(field.customerTypes)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={field.isRequired ? 'Required' : 'Optional'}
                        size="small"
                        color={field.isRequired ? 'error' : 'default'}
                        variant={field.isRequired ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {field.isActive ? (
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
                            onClick={() => handleToggleStatus(field)}
                            sx={{
                              color: field.isActive ? 'success.main' : 'text.secondary',
                              '&:hover': {
                                backgroundColor: field.isActive ? 'success.light' : 'grey.100',
                              },
                            }}
                          >
                            {field.isActive ? <ViewIcon /> : <HideIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Field">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(field)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.light' },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Field">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(field.id)}
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

      {/* Add/Edit Vehicle Field Dialog */}
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
            {editingField ? 'Edit Vehicle Field' : 'Add New Vehicle Field'}
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
                  label="Field Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  margin="normal"
                  required
                  placeholder="e.g., Engine Size, Vehicle Color"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="Brief description of what this field is for"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Display Order"
                  value={formData.order}
                  onChange={handleInputChange('order')}
                  type="number"
                  margin="normal"
                  placeholder="0"
                  helperText="Order in which this field appears (lower numbers appear first)"
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Field Type Selection */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Field Type
                </Typography>
                
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Field Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={handleInputChange('type')}
                    label="Field Type"
                  >
                    {FIELD_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="body1">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Customer Types */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Customer Types
                </Typography>
                
                <FormGroup>
                  {CUSTOMER_TYPES.map((type) => (
                    <FormControlLabel
                      key={type.value}
                      control={
                        <Checkbox
                          checked={formData.customerTypes.includes(type.value)}
                          onChange={() => handleCustomerTypeChange(type.value)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          <Typography>{type.label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Grid>

              {/* Options for Choice Fields */}
              {isChoiceField(formData.type) && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Field Options
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    {formData.options.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          label={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          size="small"
                          required
                        />
                        <IconButton
                          onClick={() => removeOption(index)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      onClick={addOption}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Add Option
                    </Button>
                  </Box>
                </Grid>
              )}

              {/* Validation Rules */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Validation Rules (Optional)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Minimum Length"
                          value={formData.validation.minLength}
                          onChange={handleValidationChange('minLength')}
                          type="number"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Maximum Length"
                          value={formData.validation.maxLength}
                          onChange={handleValidationChange('maxLength')}
                          type="number"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Minimum Value"
                          value={formData.validation.minValue}
                          onChange={handleValidationChange('minValue')}
                          type="number"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Maximum Value"
                          value={formData.validation.maxValue}
                          onChange={handleValidationChange('maxValue')}
                          type="number"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Pattern (Regex)"
                          value={formData.validation.pattern}
                          onChange={handleValidationChange('pattern')}
                          size="small"
                          helperText="Regular expression pattern for validation"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Field Settings */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Field Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRequired}
                      onChange={handleInputChange('isRequired')}
                      color="primary"
                    />
                  }
                  label="Required Field"
                  sx={{ mb: 1 }}
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
            {editingField ? 'Update' : 'Add'} Vehicle Field
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleFieldsPage; 