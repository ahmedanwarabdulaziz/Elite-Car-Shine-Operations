import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardActionArea, 
  CardContent, 
  Avatar, 
  TextField, 
  CircularProgress,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert
} from '@mui/material';
import { 
  DirectionsCar as CarIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNotification } from '../../components/Common/NotificationSystem';

const Step4VehicleSelection = ({ 
  customerType,
  selectedCustomer,
  selectedGroup,
  onVehicleSelect,
  loading, 
  setLoading 
}) => {
  const { showSuccess, showError } = useNotification();
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [vehicleFields, setVehicleFields] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load vehicle categories
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'vehicleCategories'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVehicleCategories(data);
      },
      (error) => {
        console.error('Error loading vehicle categories:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Load vehicle fields based on customer type
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'vehicleFields'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter fields based on customer type
        const filteredFields = data.filter(field => {
          if (customerType === 'individual') {
            return field.customerTypes?.includes('individual') || field.customerTypes?.includes('both');
          } else if (customerType === 'corporate') {
            return field.customerTypes?.includes('corporate') || field.customerTypes?.includes('both');
          }
          return false;
        });
        setVehicleFields(filteredFields);
      },
      (error) => {
        console.error('Error loading vehicle fields:', error);
      }
    );
    
    return () => unsubscribe();
  }, [customerType]);

  const handleVehicleTypeSelect = (vehicleType) => {
    console.log('Vehicle type selected:', vehicleType);
    setSelectedVehicleType(vehicleType);
    setFormData({}); // Reset form data when selecting new vehicle type
  };

  const handleInputChange = (fieldId) => (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      [fieldId]: value,
    });
  };

  const handleCreateVehicle = async () => {
    if (!selectedVehicleType) {
      showError('Please select a vehicle type');
      return;
    }

    // Validate required fields
    const requiredFields = vehicleFields.filter(field => field.isRequired);
    const missingFields = requiredFields.filter(field => !formData[field.id]);
    
    if (missingFields.length > 0) {
      showError(`Please fill in required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const vehicleData = {
        customerId: selectedCustomer.id,
        customerType: customerType,
        vehicleType: selectedVehicleType.name, // Save vehicle type name, not ID
        vehicleFields: formData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
      const createdVehicle = { id: docRef.id, ...vehicleData };
      
      showSuccess('Vehicle created successfully');
      onVehicleSelect(createdVehicle, selectedVehicleType);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      showError('Error creating vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const required = field.isRequired;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextField
            fullWidth
            label={field.name}
            type={field.type}
            value={value}
            onChange={handleInputChange(field.id)}
            required={required}
            helperText={field.description}
            sx={{ mb: 2 }}
          />
        );
      case 'select':
        return (
          <FormControl fullWidth required={required} sx={{ mb: 2 }}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value}
              onChange={handleInputChange(field.id)}
              label={field.name}
            >
              {field.options?.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {field.description && (
              <FormHelperText>{field.description}</FormHelperText>
            )}
          </FormControl>
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
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const getCustomerName = () => {
    if (!selectedCustomer) return 'Unknown Customer';
    
    if (customerType === 'corporate') {
      return selectedCustomer.corporateName || 'Unnamed Corporate Customer';
    } else {
      const customerFieldsData = selectedCustomer.customerFields || {};
      const nameField = vehicleFields.find(f => f.name?.toLowerCase().includes('name'));
      return nameField ? customerFieldsData[nameField.id] : 'Unnamed Customer';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Select Vehicle Type & Add Vehicle Details
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Customer: <strong>{getCustomerName()}</strong> • {customerType === 'corporate' ? 'Corporate' : 'Individual'}
      </Typography>

      {/* Vehicle Type Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select Vehicle Type
        </Typography>
        <Grid container spacing={3}>
          {vehicleCategories.map((vehicleType) => (
            <Grid item xs={12} sm={6} md={4} key={vehicleType.id}>
              <Card 
                onClick={() => handleVehicleTypeSelect(vehicleType)} 
                sx={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  border: selectedVehicleType?.id === vehicleType.id ? 2 : 1,
                  borderColor: selectedVehicleType?.id === vehicleType.id ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 6 }
                }}
              >
                <CardActionArea>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        mx: 'auto', 
                        mb: 2,
                        bgcolor: selectedVehicleType?.id === vehicleType.id ? 'primary.main' : 'grey.300'
                      }}
                    >
                      <CarIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {vehicleType.name}
                    </Typography>
                    {vehicleType.description && (
                      <Typography variant="body2" color="text.secondary">
                        {vehicleType.description}
                      </Typography>
                    )}
                    {selectedVehicleType?.id === vehicleType.id && (
                      <Box sx={{ mt: 1 }}>
                        <CheckIcon color="primary" />
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Vehicle Fields Section */}
      {selectedVehicleType && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Vehicle Details - {selectedVehicleType.name}
          </Typography>
          
          {vehicleFields.length > 0 ? (
            <Grid container spacing={3}>
              {vehicleFields.map(field => (
                <Grid item xs={12} sm={6} key={field.id}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              No vehicle fields configured for {customerType} customers. 
              You can add vehicle fields in the Vehicle Fields page.
            </Alert>
          )}

          {/* Create Vehicle Button */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateVehicle}
              disabled={submitting || vehicleFields.length === 0}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 200 }}
            >
              {submitting ? 'Creating Vehicle...' : 'Create Vehicle & Continue'}
            </Button>
          </Box>
        </Box>
      )}

      {!selectedVehicleType && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Please select a vehicle type above to add vehicle details
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Step4VehicleSelection; 