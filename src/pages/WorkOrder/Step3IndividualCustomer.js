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
  InputAdornment, 
  CircularProgress,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  SwapHoriz as TransferIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNotification } from '../../components/Common/NotificationSystem';

const Step3IndividualCustomer = ({ 
  selectedGroup, 
  onSelect, 
  onAddNew,
  searchTerm, 
  setSearchTerm, 
  loading, 
  setLoading,
  onGroupChange
}) => {
  const { showSuccess, showError } = useNotification();
  const [individualCustomers, setIndividualCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerFields, setCustomerFields] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [individualGroups, setIndividualGroups] = useState([]);

  // Load individual customers for the selected group
  useEffect(() => {
    console.log('Loading all individual customers...');
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'customers'), 
        where('category', '==', 'individual'),
        where('isActive', '==', true)
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('All individual customers loaded:', data.length, data);
        setIndividualCustomers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading individual customers:', error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [setLoading]);

  // Load individual groups
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'individualCustomers'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIndividualGroups(data);
      },
      (error) => {
        console.error('Error loading individual groups:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Load customer fields
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'customerFields'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const individualFields = data.filter(field => 
          field.customerTypes?.includes('individual') || field.customerTypes?.includes('both')
        );
        setCustomerFields(individualFields);
      },
      (error) => {
        console.error('Error loading customer fields:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers([]); // Don't show any customers when no search term
    } else {
      const filtered = individualCustomers.filter(customer => {
        const searchLower = searchTerm.toLowerCase();
        const customerFieldsData = customer.customerFields || {};
        
        // Search in customer fields
        for (const field of customerFields) {
          const fieldValue = customerFieldsData[field.id];
          if (fieldValue && fieldValue.toString().toLowerCase().includes(searchLower)) {
            return true;
          }
        }
        
        return false;
      });
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, individualCustomers, customerFields]);

  const handleCustomerSelect = (customer) => {
    console.log('Individual customer selected:', customer);
    
    // Check if customer is from a different group
    if (customer.groupId !== selectedGroup?.id) {
      setSelectedCustomer(customer);
      setConfirmationDialog(true);
    } else {
      // Same group, proceed normally
      onSelect(customer);
    }
  };

  const handleTransferCustomer = async () => {
    if (!selectedCustomer) return;
    
    setTransferring(true);
    try {
      // Update the customer's group
      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        groupId: selectedGroup.id,
        updatedAt: new Date()
      });
      
      showSuccess('Customer transferred successfully');
      setConfirmationDialog(false);
      setSelectedCustomer(null);
      onSelect(selectedCustomer);
    } catch (error) {
      console.error('Error transferring customer:', error);
      showError('Error transferring customer');
    } finally {
      setTransferring(false);
    }
  };

  const handleChangeWorkOrderGroup = () => {
    if (!selectedCustomer) return;
    
    // Find the customer's group from individualGroups
    const customerGroup = individualGroups.find(group => group.id === selectedCustomer.groupId);
    
    if (customerGroup && onGroupChange) {
      onGroupChange(customerGroup);
      showSuccess(`Work order group changed to: ${customerGroup.name}`);
    } else {
      showError('Could not find customer group information');
    }
    
    setConfirmationDialog(false);
    setSelectedCustomer(null);
    onSelect(selectedCustomer);
  };

  const handleCancelSelection = () => {
    setConfirmationDialog(false);
    setSelectedCustomer(null);
  };

  const handleAddNew = () => {
    console.log('Open add new customer dialog');
    setFormData({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
  };

  const handleInputChange = (fieldId) => (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      [fieldId]: value,
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = customerFields.filter(field => field.isRequired);
    const missingFields = requiredFields.filter(field => !formData[field.id]);
    
    if (missingFields.length > 0) {
      showError(`Please fill in required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const customerData = {
        category: 'individual',
        groupId: selectedGroup.id,
        customerFields: formData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await addDoc(collection(db, 'customers'), customerData);
      showSuccess('Customer created successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating customer:', error);
      showError('Error creating customer');
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Select Individual Customer
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Group: <strong>{selectedGroup?.name}</strong> • Search all individual customers
      </Typography>

      {/* Search and Add New Section */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search all individual customers by name, email, phone, or address..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleAddNew}
          sx={{ minWidth: 160 }}
        >
          Add New Customer
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Results Section */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading customers...
          </Typography>
        </Box>
      ) : !searchTerm.trim() ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Enter a search term to find customers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Search by name, email, phone, or any other customer field
          </Typography>
        </Box>
      ) : filteredCustomers.length > 0 ? (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Found {filteredCustomers.length} matching customer(s)
          </Typography>
          <Grid container spacing={3}>
            {filteredCustomers.map(customer => {
              const customerFieldsData = customer.customerFields || {};
              
              // Get field definitions to find name, email, phone fields
              const nameField = customerFields.find(f => f.name?.toLowerCase().includes('name'));
              const emailField = customerFields.find(f => f.type === 'email');
              const phoneField = customerFields.find(f => f.type === 'phone');
              
              // Get values from customer data
              const name = nameField ? customerFieldsData[nameField.id] : 'Unnamed Customer';
              const email = emailField ? customerFieldsData[emailField.id] : 'No email';
              const phone = phoneField ? customerFieldsData[phoneField.id] : 'No phone';

              // Get group name
              const customerGroup = individualGroups.find(group => group.id === customer.groupId);
              const groupName = customerGroup ? customerGroup.name : `Group ID: ${customer.groupId}`;

              return (
                <Grid item xs={12} sm={6} md={4} key={customer.id}>
                  <Card 
                    onClick={() => handleCustomerSelect(customer)} 
                    sx={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s', 
                      '&:hover': { boxShadow: 6 },
                      border: customer.groupId === selectedGroup?.id ? 2 : 1,
                      borderColor: customer.groupId === selectedGroup?.id ? 'primary.main' : 'divider'
                    }}
                  >
                    <CardActionArea>
                      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" noWrap>
                            {name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {phone}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            color: customer.groupId === selectedGroup?.id ? 'primary.main' : 'text.secondary',
                            fontWeight: customer.groupId === selectedGroup?.id ? 600 : 400
                          }}>
                            {groupName}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No customers found matching your search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search terms or click "Add New Customer" to create one
          </Typography>
        </Box>
      )}

      {/* Add New Customer Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Customer</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Group: <strong>{selectedGroup?.name}</strong>
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {customerFields.map(field => (
              <Grid item xs={12} sm={6} key={field.id}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? 'Creating...' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Mismatch Confirmation Dialog */}
      <Dialog 
        open={confirmationDialog} 
        onClose={handleCancelSelection} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TransferIcon color="primary" />
            <Typography variant="h6">Customer from Different Group</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            The selected customer belongs to a different group than the current work order.
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Customer:</strong> {selectedCustomer?.customerFields?.name || 'Unnamed Customer'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            What would you like to do?
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, border: 1, borderColor: 'primary.main', borderRadius: 1, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                Option 1: Transfer Customer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Move this customer to the current work order group ({selectedGroup?.name})
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, border: 1, borderColor: 'secondary.main', borderRadius: 1, bgcolor: 'secondary.50' }}>
              <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
                Option 2: Change Work Order Group
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Change the work order to use the customer's current group
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancelSelection} 
            variant="outlined"
            disabled={transferring}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangeWorkOrderGroup} 
            variant="outlined"
            color="primary"
            disabled={transferring}
          >
            Change Work Order Group
          </Button>
          <Button 
            onClick={handleTransferCustomer} 
            variant="contained"
            color="primary"
            disabled={transferring}
            startIcon={transferring ? <CircularProgress size={16} /> : <TransferIcon />}
          >
            {transferring ? 'Transferring...' : 'Transfer Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step3IndividualCustomer; 