import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper as TablePaper,
  Chip,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  LocalOffer as BundleIcon,
  Build as ServiceIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Step5ServicesBundles = ({ 
  customerType,
  selectedCustomer,
  selectedGroup,
  selectedVehicle,
  selectedVehicleCategory,
  onComplete,
  loading, 
  setLoading 
}) => {
  const [services, setServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [bundleSearchTerm, setBundleSearchTerm] = useState('');
  const [serviceNotes, setServiceNotes] = useState({});
  const [bundleNotes, setBundleNotes] = useState({});
  const [taxes, setTaxes] = useState([]);

  // Load services
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'services'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(data);
      },
      (error) => {
        console.error('Error loading services:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Load bundles
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'bundles'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBundles(data);
      },
      (error) => {
        console.error('Error loading bundles:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Load taxes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'taxes'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTaxes(data);
      },
      (error) => {
        console.error('Error loading taxes:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Filter services based on search
  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  // Filter bundles based on search
  const filteredBundles = bundles.filter(bundle =>
    bundle.name?.toLowerCase().includes(bundleSearchTerm.toLowerCase()) ||
    bundle.description?.toLowerCase().includes(bundleSearchTerm.toLowerCase())
  );

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleBundleToggle = (bundle) => {
    setSelectedBundles(prev => {
      const isSelected = prev.find(b => b.id === bundle.id);
      if (isSelected) {
        return prev.filter(b => b.id !== bundle.id);
      } else {
        return [...prev, bundle];
      }
    });
  };

  const handleServiceNoteChange = (serviceId) => (event) => {
    setServiceNotes(prev => ({
      ...prev,
      [serviceId]: event.target.value
    }));
  };

  const handleBundleNoteChange = (bundleId) => (event) => {
    setBundleNotes(prev => ({
      ...prev,
      [bundleId]: event.target.value
    }));
  };

  const getServicePrice = (service) => {
    console.log('Getting service price for:', service.name);
    console.log('Selected group:', selectedGroup);
    console.log('Service prices:', service.prices);
    
    if (!selectedGroup) {
      console.log('No group selected, using default price:', service.price || 0);
      return Number(service.price) || 0;
    }
    
    // Check if service has category-specific pricing
    if (service.prices && selectedGroup.categoryType) {
      // Look for any vehicle type price in this category
      const categoryId = selectedGroup.categoryType;
      const priceKeys = Object.keys(service.prices);
      
      for (const priceKey of priceKeys) {
        if (priceKey.startsWith(`${categoryId}_`)) {
          const categoryPrice = service.prices[priceKey];
          console.log('Using category price:', categoryPrice, 'for key:', priceKey);
          return Number(categoryPrice) || 0;
        }
      }
    }
    
    console.log('Using default price:', service.price || 0);
    return Number(service.price) || 0;
  };

  const getBundlePrice = (bundle) => {
    console.log('Getting bundle price for:', bundle.name);
    console.log('Bundle prices:', bundle.prices);
    
    if (!selectedGroup) {
      console.log('No group selected, using default price:', bundle.price || 0);
      return Number(bundle.price) || 0;
    }
    
    // Check if bundle has category-specific pricing
    if (bundle.prices && selectedGroup.categoryType) {
      // Look for any vehicle type price in this category
      const categoryId = selectedGroup.categoryType;
      const priceKeys = Object.keys(bundle.prices);
      
      for (const priceKey of priceKeys) {
        if (priceKey.startsWith(`${categoryId}_`)) {
          const categoryPrice = bundle.prices[priceKey];
          console.log('Using category price:', categoryPrice, 'for key:', priceKey);
          return Number(categoryPrice) || 0;
        }
      }
    }
    
    console.log('Using default price:', bundle.price || 0);
    return Number(bundle.price) || 0;
  };

  // Tax calculation functions
  const calculateItemTax = (item) => {
    if (!item.taxIds || !taxes || taxes.length === 0) return 0;
    
    let totalTax = 0;
    const basePrice = getServicePrice(item) || getBundlePrice(item) || 0;
    
    item.taxIds.forEach(taxId => {
      const tax = taxes.find(t => t.id === taxId);
      if (tax && tax.isActive !== false) {
        const taxAmount = (basePrice * tax.rate) / 100;
        totalTax += taxAmount;
      }
    });
    
    return totalTax;
  };

  const calculateSubtotal = () => {
    const servicesTotal = selectedServices.reduce((sum, service) => {
      return sum + getServicePrice(service);
    }, 0);
    
    const bundlesTotal = selectedBundles.reduce((sum, bundle) => {
      return sum + getBundlePrice(bundle);
    }, 0);
    
    return servicesTotal + bundlesTotal;
  };

  const calculateTotalTax = () => {
    const servicesTax = selectedServices.reduce((sum, service) => {
      return sum + calculateItemTax(service);
    }, 0);
    
    const bundlesTax = selectedBundles.reduce((sum, bundle) => {
      return sum + calculateItemTax(bundle);
    }, 0);
    
    return servicesTax + bundlesTax;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const handleContinue = async () => {
    let customerToUse = selectedCustomer;
    if (customerType === 'corporate' && (!selectedCustomer.corporateName || !selectedCustomer.id)) {
      // Defensive: fetch full corporate customer object by ID
      try {
        const docRef = doc(db, 'corporateCustomers', selectedCustomer.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          customerToUse = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.error('Error fetching corporate customer:', err);
      }
    }
    const workOrderData = {
      customerType,
      customer: customerToUse,
      group: selectedVehicleCategory,
      vehicle: selectedVehicle,
      services: selectedServices.map(service => ({
        ...service,
        price: getServicePrice(service),
        notes: serviceNotes[service.id] || ''
      })),
      bundles: selectedBundles.map(bundle => ({
        ...bundle,
        price: getBundlePrice(bundle),
        notes: bundleNotes[bundle.id] || ''
      })),
      total: calculateTotal(),
      status: 'pending',
      createdAt: new Date()
    };
    
    console.log('Step5ServicesBundles: Passing work order data to Step6Summary:', workOrderData);
    console.log('Step5ServicesBundles: Customer type:', customerType);
    console.log('Step5ServicesBundles: Services count:', selectedServices.length);
    console.log('Step5ServicesBundles: Bundles count:', selectedBundles.length);
    
    onComplete(workOrderData);
  };

  const getCustomerName = () => {
    if (!selectedCustomer) return 'Unknown Customer';
    
    if (customerType === 'corporate') {
      return selectedCustomer.corporateName || 'Unnamed Corporate Customer';
    } else {
      const customerFieldsData = selectedCustomer.customerFields || {};
      const nameField = Object.values(customerFieldsData).find(value => value);
      return nameField || 'Unnamed Customer';
    }
  };

  const getVehicleInfo = () => {
    if (!selectedVehicle) return 'No vehicle selected';
    
    // Priority 1: Use vehicle category/group name if available
    if (selectedGroup && selectedGroup.name) {
      return selectedGroup.name;
    }
    
    // Priority 2: Use vehicle type from vehicle data if available
    if (selectedVehicle.vehicleType) {
      return selectedVehicle.vehicleType;
    }
    
    // Priority 3: Look for meaningful vehicle information in vehicle fields
    const vehicleFieldsData = selectedVehicle.vehicleFields || {};
    
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
        const isVehicleField = vehicleIdentifiers.some(identifier => 
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Select Services & Bundles
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Customer: <strong>{getCustomerName()}</strong> • Vehicle: <strong>{getVehicleInfo()}</strong>
      </Typography>

      <Grid container spacing={4}>
        {/* Services Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ServiceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Services</Typography>
              </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search services..."
                value={serviceSearchTerm}
                onChange={e => setServiceSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {filteredServices.map(service => {
                  const isSelected = selectedServices.find(s => s.id === service.id);
                  const price = getServicePrice(service);
                  const tax = calculateItemTax(service);
                  const total = price + tax;
                  
                  return (
                    <Card key={service.id} sx={{ mb: 2, border: isSelected ? 2 : 1, borderColor: isSelected ? 'primary.main' : 'divider' }}>
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleServiceToggle(service)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {service.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {service.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  ${(Number(price) || 0).toFixed(2)}
                                </Typography>
                                {tax > 0 && (
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      + ${tax.toFixed(2)} tax
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                      = ${total.toFixed(2)}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bundles Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BundleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Bundles</Typography>
              </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search bundles..."
                value={bundleSearchTerm}
                onChange={e => setBundleSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {filteredBundles.map(bundle => {
                  const isSelected = selectedBundles.find(b => b.id === bundle.id);
                  const price = getBundlePrice(bundle);
                  const tax = calculateItemTax(bundle);
                  const total = price + tax;
                  
                  return (
                    <Card key={bundle.id} sx={{ mb: 2, border: isSelected ? 2 : 1, borderColor: isSelected ? 'primary.main' : 'divider' }}>
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleBundleToggle(bundle)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {bundle.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {bundle.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  ${(Number(price) || 0).toFixed(2)}
                                </Typography>
                                {tax > 0 && (
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      + ${tax.toFixed(2)} tax
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                      = ${total.toFixed(2)}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Selected Items Summary */}
      {(selectedServices.length > 0 || selectedBundles.length > 0) && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Selected Items & Pricing
          </Typography>
          
          <TableContainer component={TablePaper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedServices.map(service => {
                  const price = getServicePrice(service);
                  const tax = calculateItemTax(service);
                  const total = price + tax;
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
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add notes..."
                          value={serviceNotes[service.id] || ''}
                          onChange={handleServiceNoteChange(service.id)}
                          multiline
                          rows={2}
                          sx={{ minWidth: 200 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="primary">
                          ${(Number(price) || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          ${tax.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                          ${total.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {selectedBundles.map(bundle => {
                  const price = getBundlePrice(bundle);
                  const tax = calculateItemTax(bundle);
                  const total = price + tax;
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
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add notes..."
                          value={bundleNotes[bundle.id] || ''}
                          onChange={handleBundleNoteChange(bundle.id)}
                          multiline
                          rows={2}
                          sx={{ minWidth: 200 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="primary">
                          ${(Number(price) || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          ${tax.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                          ${total.toFixed(2)}
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
                  <TableCell align="right">
                    <Typography variant="h6" color="text.secondary">
                      ${calculateTotalTax().toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                
                {/* Total Row */}
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="h6" fontWeight="bold">Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      ${(Number(calculateTotal()) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              sx={{ minWidth: 200 }}
            >
              Create Work Order
            </Button>
          </Box>
        </Box>
      )}

      {selectedServices.length === 0 && selectedBundles.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Please select services and/or bundles to continue
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Step5ServicesBundles; 