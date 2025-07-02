import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Step7Submit = ({ 
  workOrderData,
  onComplete,
  onNavigateToDashboard,
  loading,
  setLoading
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('pending'); // pending, status-selection, success, error
  const [savedWorkOrder, setSavedWorkOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Load work order statuses
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workOrderStatuses'), orderBy('order', 'asc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStatuses(data);
        
        // Set default status to first non-end status
        const firstNonEndStatus = data.find(s => !s.isEndStatus);
        if (firstNonEndStatus) {
          setSelectedStatus(firstNonEndStatus.name);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const getInitialStatus = () => {
    // Get the first status (lowest order) that is not a canceled status
    const firstStatus = statuses.find(s => !s.isCanceledStatus);
    return firstStatus ? firstStatus.name : 'Pending';
  };

  const handleStatusSelection = () => {
    console.log('Step7Submit: handleStatusSelection called with selectedStatus:', selectedStatus);
    
    if (!selectedStatus) {
      alert('Please select a status to continue');
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting || submissionStatus === 'creating') {
      console.log('Step7Submit: Already submitting, ignoring duplicate call');
      return;
    }
    
    console.log('Step7Submit: Setting submission status to creating');
    setSubmissionStatus('creating');
    handleSubmitWorkOrder();
  };

  const handleSubmitWorkOrder = useCallback(async () => {
    if (!workOrderData) {
      setSubmissionStatus('error');
      setErrorMessage('No work order data available');
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Step7Submit: Already submitting, ignoring duplicate call');
      return;
    }
    
    console.log('Step7Submit: Creating work order with data:', workOrderData);
    console.log('Step7Submit: Invoice number:', workOrderData.invoiceNumber);
    console.log('Step7Submit: Selected status:', selectedStatus);
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const workOrderToSave = {
        ...workOrderData,
        status: selectedStatus || getInitialStatus(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('Step7Submit: Final work order to save:', workOrderToSave);
      
      const docRef = await addDoc(collection(db, 'workOrders'), workOrderToSave);
      
      console.log('Work order created with ID:', docRef.id);
      
      const savedData = {
        ...workOrderToSave,
        id: docRef.id,
        createdAt: new Date()
      };
      
      setSavedWorkOrder(savedData);
      setSubmissionStatus('success');
      
      // Call completion handler
      if (onComplete) {
        onComplete(savedData);
      }
      
    } catch (error) {
      console.error('Error creating work order:', error);
      setSubmissionStatus('error');
      setErrorMessage('Error creating work order. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }, [workOrderData, onComplete, setLoading, statuses, selectedStatus, isSubmitting]);

  // Auto-show status selection when component mounts
  useEffect(() => {
    console.log('Step7Submit: useEffect triggered with:', {
      workOrderData: !!workOrderData,
      submissionStatus,
      statusesLength: statuses.length
    });
    
    if (workOrderData && submissionStatus === 'pending' && statuses.length > 0) {
      console.log('Step7Submit: Setting submission status to status-selection');
      setSubmissionStatus('status-selection');
    }
  }, [workOrderData, submissionStatus, statuses]);

  const handleNavigateToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

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

  const getVehicleInfo = () => {
    if (!workOrderData?.vehicle) return 'No vehicle selected';
    
    const vehicleFieldsData = workOrderData.vehicle.vehicleFields || {};
    const makeField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      key.toLowerCase().includes('make') || value?.toLowerCase().includes('make')
    );
    const modelField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      key.toLowerCase().includes('model') || value?.toLowerCase().includes('model')
    );
    
    const make = makeField ? makeField[1] : 'Unknown';
    const model = modelField ? modelField[1] : 'Unknown';
    
    return `${make} ${model}`;
  };

  const calculateTotal = () => {
    if (!workOrderData) return 0;
    
    const servicesTotal = (workOrderData.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (workOrderData.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    return servicesTotal + bundlesTotal;
  };

  // Status Selection Dialog
  if (submissionStatus === 'status-selection') {
    const availableStatuses = statuses.filter(s => !s.isEndStatus);
    
    return (
      <Dialog open={true} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon color="primary" />
            <Typography variant="h6">Select Initial Status</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Choose the initial status for this work order. This will determine where the work order starts in your workflow.
          </Typography>
          
          {/* Work Order Summary */}
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Work Order Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Customer:</strong> {getCustomerName()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Vehicle:</strong> {getVehicleInfo()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Services:</strong> {workOrderData.services?.length || 0} selected
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total:</strong> ${(Number(calculateTotal()) || 0).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Status Selection Cards */}
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Available Statuses
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {availableStatuses.map((status) => (
              <Grid item xs={12} sm={6} md={4} key={status.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedStatus === status.name ? 3 : 1,
                    borderColor: selectedStatus === status.name ? 'primary.main' : 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                      borderColor: 'primary.main'
                    },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => setSelectedStatus(status.name)}
                >
                  {/* Status Color Bar */}
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: status.color,
                      width: '100%'
                    }}
                  />
                  
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    {/* Status Color Circle */}
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: status.color,
                        borderRadius: '50%',
                        mx: 'auto',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: 'white',
                          fontWeight: 'bold',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}
                      >
                        {status.name.charAt(0)}
                      </Typography>
                    </Box>
                    
                    {/* Status Name */}
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {status.name}
                    </Typography>
                    
                    {/* Status Type Badge */}
                    {status.isCanceledStatus ? (
                      <Chip 
                        label="Canceled Status" 
                        size="small" 
                        color="error" 
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    ) : (
                      <Chip 
                        label="Workflow Status" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    )}
                    
                    {/* Selection Indicator */}
                    {selectedStatus === status.name && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 24,
                          height: 24,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Selected Status Confirmation */}
          {selectedStatus && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Selected Status:</strong> {selectedStatus}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                This work order will start with the "{selectedStatus}" status in your workflow.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionStatus('pending')}>
            Back
          </Button>
          <Button 
            onClick={handleStatusSelection} 
            variant="contained"
            disabled={!selectedStatus}
            startIcon={<AssignmentIcon />}
          >
            Create Work Order
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (submissionStatus === 'pending' || isSubmitting) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Preparing Work Order...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please wait while we prepare your work order for creation.
        </Typography>
      </Box>
    );
  }

  if (submissionStatus === 'error') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
        <Button
          variant="contained"
          onClick={() => setSubmissionStatus('status-selection')}
          disabled={isSubmitting}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  if (submissionStatus === 'success' && savedWorkOrder) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
        
        <Typography variant="h4" gutterBottom color="success.main">
          Work Order Created Successfully!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Work Order #{savedWorkOrder.invoiceNumber}
        </Typography>

        <Card sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Work Order Details</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Customer:</strong> {getCustomerName()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Vehicle:</strong> {getVehicleInfo()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Services:</strong> {workOrderData.services?.length || 0} selected
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Bundles:</strong> {workOrderData.bundles?.length || 0} selected
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total:</strong> ${(Number(calculateTotal()) || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Initial Status:</strong> {selectedStatus || getInitialStatus()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleNavigateToDashboard}
            startIcon={<AssignmentIcon />}
          >
            View in Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default Step7Submit; 