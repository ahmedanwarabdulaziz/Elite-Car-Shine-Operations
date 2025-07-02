import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper as TablePaper,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DirectionsCar as VehicleIcon,
  Build as ServiceIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';
import { getNextInvoiceNumber } from '../../firebase/invoiceCounter';
import { onSnapshot, query, where, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Step6Summary = ({ 
  workOrderData,
  onEditCustomer,
  onEditVehicle,
  onEditServices,
  onComplete,
  loading,
  setLoading
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceError, setInvoiceError] = useState('');
  const [notes, setNotes] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState('');
  const [customerEditData, setCustomerEditData] = useState({});
  const [vehicleEditData, setVehicleEditData] = useState({});
  const [customerFields, setCustomerFields] = useState([]);
  const [vehicleFields, setVehicleFields] = useState([]);

  // Load field definitions
  useEffect(() => {
    // Load customer fields
    const customerFieldsUnsubscribe = onSnapshot(
      query(collection(db, 'customerFields'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomerFields(data);
      },
      (error) => {
        console.error('Error loading customer fields:', error);
      }
    );

    // Load vehicle fields
    const vehicleFieldsUnsubscribe = onSnapshot(
      query(collection(db, 'vehicleFields'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVehicleFields(data);
      },
      (error) => {
        console.error('Error loading vehicle fields:', error);
      }
    );

    return () => {
      customerFieldsUnsubscribe();
      vehicleFieldsUnsubscribe();
    };
  }, []);

  // Helper function to get field name by ID
  const getFieldNameById = (fieldId, fields) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  const generateInvoiceNumber = useCallback(async () => {
    try {
      setInvoiceError('');
      const number = await getNextInvoiceNumber(workOrderData?.customerType);
      setInvoiceNumber(number);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setInvoiceError('Failed to generate invoice number. Please try again.');
    }
  }, [workOrderData?.customerType]);

  // Generate invoice number on component mount
  useEffect(() => {
    if (workOrderData?.customerType) {
      generateInvoiceNumber();
    }
  }, [workOrderData?.customerType, generateInvoiceNumber]);

  const getCustomerName = () => {
    if (!workOrderData?.customer) return 'Unknown Customer';
    
    if (workOrderData.customerType === 'corporate') {
      return workOrderData.customer.corporateName || 'Unnamed Corporate Customer';
    } else {
      const customerFieldsData = workOrderData.customer.customerFields || {};
      const nameField = Object.values(customerFieldsData).find(value => value);
      return nameField || 'Unnamed Customer';
    }
  };

  const getCustomerDetails = () => {
    if (!workOrderData?.customer) return [];
    
    const details = [];
    
    if (workOrderData.customerType === 'corporate') {
      if (workOrderData.customer.corporateName) {
        details.push({ label: 'Company Name', value: workOrderData.customer.corporateName });
      }
      if (workOrderData.customer.description) {
        details.push({ label: 'Description', value: workOrderData.customer.description });
      }
      // Add other corporate customer fields
      const corporateFields = workOrderData.customer.corporateFields || {};
      Object.entries(corporateFields).forEach(([key, value]) => {
        if (value) {
          const fieldName = getFieldNameById(key, customerFields);
          details.push({ label: fieldName, value: value });
        }
      });
    } else {
      // Individual customer fields
      const customerFieldsData = workOrderData.customer.customerFields || {};
      Object.entries(customerFieldsData).forEach(([key, value]) => {
        if (value) {
          const fieldName = getFieldNameById(key, customerFields);
          details.push({ label: fieldName, value: value });
        }
      });
    }
    
    return details;
  };

  const getVehicleInfo = () => {
    if (!workOrderData?.vehicle) return 'No vehicle selected';
    
    // Priority 1: Use vehicle category/group name if available
    if (workOrderData.group && workOrderData.group.name) {
      return workOrderData.group.name;
    }
    
    // Priority 2: Use vehicle type from vehicle data if available
    if (workOrderData.vehicle.vehicleType) {
      return workOrderData.vehicle.vehicleType;
    }
    
    // Priority 3: Look for meaningful vehicle information in vehicle fields
    const vehicleFieldsData = workOrderData.vehicle.vehicleFields || {};
    
    // Look for common vehicle identifiers
    const vehicleIdentifiers = [
      'make', 'brand', 'manufacturer',
      'model', 'type', 'series',
      'year', 'plate', 'vin'
    ];
    
    let foundValues = [];
    
    // Check each vehicle field for meaningful data
    Object.entries(vehicleFieldsData).forEach(([fieldId, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Check if this field name contains vehicle-related keywords
        const fieldName = vehicleFields.find(f => f.id === fieldId)?.name || fieldId;
        const isVehicleField = vehicleIdentifiers.some(identifier => 
          fieldName.toLowerCase().includes(identifier) || 
          fieldId.toLowerCase().includes(identifier)
        );
        
        if (isVehicleField) {
          foundValues.push(value.trim());
        }
      }
    });
    
    // If we found vehicle-related values, combine them
    if (foundValues.length > 0) {
      // Remove duplicates and limit to first 2-3 meaningful values
      const uniqueValues = [...new Set(foundValues)].slice(0, 3);
      return uniqueValues.join(' ');
    }
    
    // Priority 4: Fallback to generic vehicle description
    return 'Vehicle';
  };

  const getVehicleDetails = () => {
    if (!workOrderData?.vehicle) return [];
    
    const details = [];
    const vehicleFieldsData = workOrderData.vehicle.vehicleFields || {};
    
    // Show all vehicle fields, including empty ones
    vehicleFields.forEach(field => {
      const value = vehicleFieldsData[field.id] || '';
      if (value) {
        details.push({ label: field.name, value: value });
      }
    });
    
    return details;
  };

  // Calculation functions
  const calculateSubtotal = () => {
    const servicesTotal = (workOrderData.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (workOrderData.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    return servicesTotal + bundlesTotal;
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleEditSection = (section) => {
    if (section === 'services') {
      // For services, go back to Step 5 instead of showing dialog
      if (onEditServices) {
        onEditServices(workOrderData);
      }
      return;
    }
    
    setEditSection(section);
    
    // Prepare edit data based on section
    switch (section) {
      case 'customer':
        setCustomerEditData({
          ...workOrderData.customer,
          customerFields: { ...workOrderData.customer.customerFields },
          corporateFields: { ...workOrderData.customer.corporateFields }
        });
        break;
      case 'vehicle':
        setVehicleEditData({
          ...workOrderData.vehicle,
          vehicleFields: { ...workOrderData.vehicle.vehicleFields }
        });
        break;
      default:
        break;
    }
    
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    // Update workOrderData with edited data
    const updatedWorkOrderData = { ...workOrderData };
    
    switch (editSection) {
      case 'customer':
        updatedWorkOrderData.customer = customerEditData;
        break;
      case 'vehicle':
        updatedWorkOrderData.vehicle = vehicleEditData;
        break;
      default:
        break;
    }
    
    // Update the parent component's workOrderData
    // We'll need to pass this through props or use a callback
    if (onEditCustomer && editSection === 'customer') {
      onEditCustomer(updatedWorkOrderData);
    } else if (onEditVehicle && editSection === 'vehicle') {
      onEditVehicle(updatedWorkOrderData);
    }
    
    setEditDialogOpen(false);
  };

  const renderCustomerEditDialog = useCallback(() => {
    const isCorporate = workOrderData?.customerType === 'corporate';
    const fields = isCorporate ? customerEditData.corporateFields : customerEditData.customerFields;
    
    return (
      <Box sx={{ minWidth: 400 }}>
        <Typography variant="h6" gutterBottom>
          Edit {isCorporate ? 'Corporate' : 'Individual'} Customer
        </Typography>
        
        {isCorporate ? (
          <TextField
            fullWidth
            label="Company Name"
            value={customerEditData.corporateName || ''}
            onChange={(e) => setCustomerEditData(prev => ({
              ...prev,
              corporateName: e.target.value
            }))}
            sx={{ mb: 2 }}
          />
        ) : null}
        
        <TextField
          fullWidth
          label="Description"
          value={customerEditData.description || ''}
          onChange={(e) => setCustomerEditData(prev => ({
            ...prev,
            description: e.target.value
          }))}
          sx={{ mb: 2 }}
        />
        
        <Typography variant="subtitle1" sx={{ mb: 2, mt: 3 }}>
          {isCorporate ? 'Corporate' : 'Customer'} Fields
        </Typography>
        
        {/* Show all customer fields, including empty ones */}
        {customerFields.map(field => {
          const value = fields?.[field.id] || '';
          return (
            <TextField
              key={field.id}
              fullWidth
              label={field.name}
              value={value}
              onChange={(e) => setCustomerEditData(prev => ({
                ...prev,
                [isCorporate ? 'corporateFields' : 'customerFields']: {
                  ...prev[isCorporate ? 'corporateFields' : 'customerFields'],
                  [field.id]: e.target.value
                }
              }))}
              sx={{ mb: 2 }}
            />
          );
        })}
      </Box>
    );
  }, [workOrderData?.customerType, customerEditData, customerFields]);

  const renderVehicleEditDialog = useCallback(() => {
    const fields = vehicleEditData.vehicleFields || {};
    
    return (
      <Box sx={{ minWidth: 400 }}>
        <Typography variant="h6" gutterBottom>
          Edit Vehicle Information
        </Typography>
        
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Vehicle Fields
        </Typography>
        
        {/* Show all vehicle fields, including empty ones */}
        {vehicleFields.map(field => {
          const value = fields?.[field.id] || '';
          return (
            <TextField
              key={field.id}
              fullWidth
              label={field.name}
              value={value}
              onChange={(e) => setVehicleEditData(prev => ({
                ...prev,
                vehicleFields: {
                  ...prev.vehicleFields,
                  [field.id]: e.target.value
                }
              }))}
              sx={{ mb: 2 }}
            />
          );
        })}
      </Box>
    );
  }, [vehicleEditData, vehicleFields]);

  const handleSubmitWorkOrder = () => {
    if (!workOrderData) return;
    
    // Just pass the work order data with invoice number to Step7Submit
    // Don't save to database here - let Step7Submit handle that after status selection
    const workOrderWithInvoice = {
      ...workOrderData,
      invoiceNumber,
      notes
    };
    
    console.log('Step6Summary: Passing work order data to Step7Submit:', workOrderWithInvoice);
    console.log('Step6Summary: Invoice number:', invoiceNumber);
    
    // Call the completion handler with the work order data (not saved yet)
    onComplete(workOrderWithInvoice);
  };

  if (!workOrderData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">No work order data available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <InvoiceIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            Work Order Summary
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="primary">
              Invoice #: {invoiceNumber || 'Generating...'}
            </Typography>
          </Box>
          {invoiceError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {invoiceError}
            </Alert>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {workOrderData.customerType === 'corporate' ? (
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                  ) : (
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  )}
                  <Typography variant="h6">
                    {workOrderData.customerType === 'corporate' ? 'Corporate Customer' : 'Individual Customer'}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => handleEditSection('customer')}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {getCustomerName()}
              </Typography>
              
              {getCustomerDetails().map((detail, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {detail.label}:
                  </Typography>
                  <Typography variant="body1">
                    {detail.value}
                  </Typography>
                </Box>
              ))}
              
              {workOrderData.group && workOrderData.customerType === 'individual' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Group: {workOrderData.group.name}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VehicleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Vehicle</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleEditSection('vehicle')}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {getVehicleInfo()}
              </Typography>
              
              {getVehicleDetails().map((detail, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {detail.label}:
                  </Typography>
                  <Typography variant="body1">
                    {detail.value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Services & Bundles */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ServiceIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Services & Bundles</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleEditSection('services')}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Box>
              
              <TableContainer component={TablePaper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrderData.services?.map(service => {
                      const serviceTotal = (Number(service.price) || 0);
                      return (
                        <TableRow key={`service-${service.id}`}>
                          <TableCell>
                            <Typography variant="subtitle2">{service.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {service.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label="Service" size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {service.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="primary">
                              ${(Number(service.price) || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                              ${serviceTotal.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {workOrderData.bundles?.map(bundle => {
                      const bundleTotal = (Number(bundle.price) || 0);
                      return (
                        <TableRow key={`bundle-${bundle.id}`}>
                          <TableCell>
                            <Typography variant="subtitle2">{bundle.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {bundle.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label="Bundle" size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {bundle.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="primary">
                              ${(Number(bundle.price) || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                              ${bundleTotal.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Subtotal Row */}
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="h6">Subtotal</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          ${calculateSubtotal().toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    
                    {/* Total Row */}
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="h6" fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          ${calculateTotal().toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Add any additional notes or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.history.back()}
          sx={{ minWidth: 120 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmitWorkOrder}
          disabled={!invoiceNumber}
          sx={{ minWidth: 200 }}
        >
          Continue to Status Selection
        </Button>
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit {editSection === 'customer' ? 'Customer' : editSection === 'vehicle' ? 'Vehicle' : 'Services & Bundles'}
        </DialogTitle>
        <DialogContent>
          {editSection === 'customer' && renderCustomerEditDialog()}
          {editSection === 'vehicle' && renderVehicleEditDialog()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step6Summary; 