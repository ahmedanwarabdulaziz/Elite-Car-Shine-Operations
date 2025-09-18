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
    console.log('=== SERVICE PRICE DEBUG ===');
    console.log('Service:', service.name);
    console.log('Selected group (selectedGroup):', selectedGroup);
    console.log('Selected customer (selectedCustomer):', selectedCustomer);
    console.log('Selected vehicle:', selectedVehicle);
    console.log('Selected vehicle category:', selectedVehicleCategory);
    console.log('Customer type:', customerType);
    console.log('Service prices object:', service.prices);
    console.log('Service default price:', service.price);
    
    // Try to get the category type from different sources
    let categoryId = null;
    let categorySource = 'none';
    
    // Priority 1: Use selectedGroup.categoryType (for both corporate and individual)
    if (selectedGroup?.categoryType) {
      categoryId = selectedGroup.categoryType;
      categorySource = 'selectedGroup.categoryType';
      console.log('✓ Using selectedGroup.categoryType:', categoryId);
    }
    // Priority 2: Use selectedCustomer.group.categoryType
    else if (selectedCustomer?.group?.categoryType) {
      categoryId = selectedCustomer.group.categoryType;
      categorySource = 'selectedCustomer.group.categoryType';
      console.log('✓ Using selectedCustomer.group.categoryType:', categoryId);
    }
    // Priority 3: Check if selectedCustomer itself has categoryType (for corporate customers)
    else if (selectedCustomer?.categoryType) {
      categoryId = selectedCustomer.categoryType;
      categorySource = 'selectedCustomer.categoryType';
      console.log('✓ Using selectedCustomer.categoryType:', categoryId);
    }
    // Priority 4: Use selectedCustomer.groupId to find the group
    else if (selectedCustomer?.groupId) {
      console.log('Found groupId but no categoryType, using default price');
      categorySource = 'groupId-only';
    }
    
    console.log('Final category ID:', categoryId);
    console.log('Category source:', categorySource);
    
    if (!categoryId) {
      console.log('❌ No category type found, using default price:', service.price || 0);
      return Number(service.price) || 0;
    }
    
    // Check if service has category-specific pricing
    if (service.prices && categoryId) {
      const priceKeys = Object.keys(service.prices);
      console.log('Available price keys:', priceKeys);
      
      // First, try to find exact match with vehicle category
      if (selectedVehicleCategory?.id) {
        const exactKey = `${categoryId}_${selectedVehicleCategory.id}`;
        console.log('Looking for exact vehicle category key:', exactKey);
        
        if (service.prices[exactKey]) {
          const categoryPrice = service.prices[exactKey];
          console.log('✓ Using exact vehicle category price:', categoryPrice, 'for key:', exactKey);
          return Number(categoryPrice) || 0;
        }
      }
      
      // If no exact match, try any price for this category
      console.log('No exact vehicle category match, looking for any category price starting with:', `${categoryId}_`);
      
      for (const priceKey of priceKeys) {
        if (priceKey.startsWith(`${categoryId}_`)) {
          const categoryPrice = service.prices[priceKey];
          console.log('✓ Using category price (any vehicle type):', categoryPrice, 'for key:', priceKey);
          return Number(categoryPrice) || 0;
        }
      }
      console.log('❌ No matching price key found for category:', categoryId);
    }
    
    console.log('❌ Using default price:', service.price || 0);
    console.log('=== END SERVICE PRICE DEBUG ===');
    return Number(service.price) || 0;
  };

  const getBundlePrice = (bundle) => {
    console.log('=== BUNDLE PRICE DEBUG ===');
    console.log('Bundle:', bundle.name);
    console.log('Selected group (selectedGroup):', selectedGroup);
    console.log('Selected customer (selectedCustomer):', selectedCustomer);
    console.log('Selected vehicle:', selectedVehicle);
    console.log('Selected vehicle category:', selectedVehicleCategory);
    console.log('Customer type:', customerType);
    console.log('Bundle prices object:', bundle.prices);
    console.log('Bundle default price:', bundle.price);
    
    // Try to get the category type from different sources
    let categoryId = null;
    let categorySource = 'none';
    
    // Priority 1: Use selectedGroup.categoryType (for both corporate and individual)
    if (selectedGroup?.categoryType) {
      categoryId = selectedGroup.categoryType;
      categorySource = 'selectedGroup.categoryType';
      console.log('✓ Using selectedGroup.categoryType:', categoryId);
    }
    // Priority 2: Use selectedCustomer.group.categoryType
    else if (selectedCustomer?.group?.categoryType) {
      categoryId = selectedCustomer.group.categoryType;
      categorySource = 'selectedCustomer.group.categoryType';
      console.log('✓ Using selectedCustomer.group.categoryType:', categoryId);
    }
    // Priority 3: Check if selectedCustomer itself has categoryType (for corporate customers)
    else if (selectedCustomer?.categoryType) {
      categoryId = selectedCustomer.categoryType;
      categorySource = 'selectedCustomer.categoryType';
      console.log('✓ Using selectedCustomer.categoryType:', categoryId);
    }
    // Priority 4: Use selectedCustomer.groupId to find the group
    else if (selectedCustomer?.groupId) {
      console.log('Found groupId but no categoryType, using default price');
      categorySource = 'groupId-only';
    }
    
    console.log('Final category ID:', categoryId);
    console.log('Category source:', categorySource);
    
    if (!categoryId) {
      console.log('❌ No category type found, using default price:', bundle.price || 0);
      return Number(bundle.price) || 0;
    }
    
    // Check if bundle has category-specific pricing
    if (bundle.prices && categoryId) {
      const priceKeys = Object.keys(bundle.prices);
      console.log('Available price keys:', priceKeys);
      
      // First, try to find exact match with vehicle category
      if (selectedVehicleCategory?.id) {
        const exactKey = `${categoryId}_${selectedVehicleCategory.id}`;
        console.log('Looking for exact vehicle category key:', exactKey);
        
        if (bundle.prices[exactKey]) {
          const categoryPrice = bundle.prices[exactKey];
          console.log('✓ Using exact vehicle category price:', categoryPrice, 'for key:', exactKey);
          return Number(categoryPrice) || 0;
        }
      }
      
      // If no exact match, try any price for this category
      console.log('No exact vehicle category match, looking for any category price starting with:', `${categoryId}_`);
      
      for (const priceKey of priceKeys) {
        if (priceKey.startsWith(`${categoryId}_`)) {
          const categoryPrice = bundle.prices[priceKey];
          console.log('✓ Using category price (any vehicle type):', categoryPrice, 'for key:', priceKey);
          return Number(categoryPrice) || 0;
        }
      }
      console.log('❌ No matching price key found for category:', categoryId);
    }
    
    console.log('❌ Using default price:', bundle.price || 0);
    console.log('=== END BUNDLE PRICE DEBUG ===');
    return Number(bundle.price) || 0;
  };

  // Tax calculation functions
  const calculateItemTax = (item) => {
    console.log('=== TAX CALCULATION DEBUG ===');
    console.log('Item:', item.name);
    console.log('Item taxIds:', item.taxIds);
    console.log('Selected group:', selectedGroup);
    console.log('Selected customer:', selectedCustomer);
    console.log('Customer type:', customerType);
    console.log('Available taxes:', taxes);
    console.log('Taxes length:', taxes?.length || 0);
    
    if (!item.taxIds || !taxes || taxes.length === 0) {
      console.log('❌ No taxIds or taxes available, returning 0');
      return 0;
    }
    
    // Get customer group tax IDs
    let customerGroupTaxIds = [];
    
    console.log('🔍 DEBUGGING CUSTOMER GROUP TAX IDs:');
    console.log('  - Customer type:', customerType);
    console.log('  - Selected group:', selectedGroup);
    console.log('  - Selected group taxIds:', selectedGroup?.taxIds);
    console.log('  - Selected customer:', selectedCustomer);
    console.log('  - Selected customer group:', selectedCustomer?.group);
    console.log('  - Selected customer group taxIds:', selectedCustomer?.group?.taxIds);
    
    // Debug available taxes in the system
    console.log('🔍 AVAILABLE TAXES IN SYSTEM:');
    if (taxes && taxes.length > 0) {
      taxes.forEach((tax, index) => {
        console.log(`  Tax ${index + 1}: ${tax.name} (ID: ${tax.id}, Rate: ${tax.rate}%, Active: ${tax.isActive})`);
      });
    } else {
      console.log('  - No taxes loaded in system');
    }
    
    if (customerType === 'corporate' && selectedGroup?.taxIds) {
      customerGroupTaxIds = selectedGroup.taxIds;
      console.log('Corporate customer group tax IDs:', customerGroupTaxIds);
    } else if (customerType === 'individual' && selectedGroup?.taxIds) {
      customerGroupTaxIds = selectedGroup.taxIds;
      console.log('Individual customer group tax IDs:', customerGroupTaxIds);
    } else if (selectedCustomer?.group?.taxIds) {
      customerGroupTaxIds = selectedCustomer.group.taxIds;
      console.log('Using customer group tax IDs from selectedCustomer:', customerGroupTaxIds);
    } else {
      console.log('❌ NO CUSTOMER GROUP TAX IDs FOUND');
      console.log('  - selectedGroup:', selectedGroup);
      console.log('  - selectedCustomer.group:', selectedCustomer?.group);
    }
    
    // Find intersection of item tax IDs and customer group tax IDs
    const applicableTaxIds = item.taxIds.filter(taxId => 
      customerGroupTaxIds.includes(taxId)
    );
    
    console.log('Applicable tax IDs (intersection):', applicableTaxIds);
    
    if (applicableTaxIds.length === 0) {
      console.log('❌ No taxes applicable - customer group not assigned to any of the item taxes');
      console.log('🔍 DETAILED TAX ID DEBUGGING:');
      console.log('  - Item taxIds:', item.taxIds);
      console.log('  - Customer group taxIds:', customerGroupTaxIds);
      console.log('  - Item taxIds type:', typeof item.taxIds, 'length:', item.taxIds?.length);
      console.log('  - Customer group taxIds type:', typeof customerGroupTaxIds, 'length:', customerGroupTaxIds?.length);
      
      // Check if there are any matches
      if (item.taxIds && customerGroupTaxIds) {
        console.log('  - Checking for matches:');
        item.taxIds.forEach(itemTaxId => {
          const isMatch = customerGroupTaxIds.includes(itemTaxId);
          console.log(`    - Item taxId ${itemTaxId} matches customer group: ${isMatch}`);
        });
        
        customerGroupTaxIds.forEach(customerTaxId => {
          const isMatch = item.taxIds.includes(customerTaxId);
          console.log(`    - Customer group taxId ${customerTaxId} matches item: ${isMatch}`);
        });
      }
      
      return 0;
    }
    
    let totalTax = 0;
    const basePrice = getServicePrice(item) || getBundlePrice(item) || 0;
    console.log('Base price for tax calculation:', basePrice);
    
    applicableTaxIds.forEach(taxId => {
      console.log('Processing applicable tax ID:', taxId);
      const tax = taxes.find(t => t.id === taxId);
      console.log('Found tax:', tax);
      
      if (tax && tax.isActive !== false) {
        // Check tax conditions
        let shouldApplyTax = true;
        
        // Tax condition 1: Check if tax is inclusive (already included in price)
        if (tax.isInclusive === true) {
          console.log(`Tax ${tax.name} is inclusive (already included in price), skipping`);
          shouldApplyTax = false;
        }
        
        // Tax condition 2: Check if tax has specific customer type conditions
        if (tax.customerTypes && tax.customerTypes.length > 0) {
          const customerTypeMatches = tax.customerTypes.includes(customerType) || tax.customerTypes.includes('both');
          console.log(`Tax ${tax.name} customer types:`, tax.customerTypes);
          console.log(`Current customer type: ${customerType}, matches: ${customerTypeMatches}`);
          if (!customerTypeMatches) {
            shouldApplyTax = false;
          }
        }
        
        // Tax condition 3: Check if tax has minimum amount condition
        if (tax.minimumAmount && basePrice < tax.minimumAmount) {
          console.log(`Tax ${tax.name} minimum amount: $${tax.minimumAmount}, current price: $${basePrice}, below minimum`);
          shouldApplyTax = false;
        }
        
        // Tax condition 4: Check if tax has maximum amount condition
        if (tax.maximumAmount && basePrice > tax.maximumAmount) {
          console.log(`Tax ${tax.name} maximum amount: $${tax.maximumAmount}, current price: $${basePrice}, above maximum`);
          shouldApplyTax = false;
        }
        
        if (shouldApplyTax) {
          const taxAmount = (basePrice * tax.rate) / 100;
          console.log(`✓ Tax ${tax.name}: ${tax.rate}% of $${basePrice} = $${taxAmount.toFixed(2)}`);
          totalTax += taxAmount;
        } else {
          console.log(`❌ Tax ${tax.name} conditions not met, skipping`);
        }
      } else {
        console.log('❌ Tax not found or inactive:', taxId);
      }
    });
    
    console.log('Total tax calculated:', totalTax.toFixed(2));
    console.log('=== END TAX CALCULATION DEBUG ===');
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
    if (customerType === 'corporate' && (!selectedCustomer.name && !selectedCustomer.corporateName || !selectedCustomer.id)) {
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
    // Calculate tax for each service and bundle
    const servicesWithTax = selectedServices.map(service => {
      const basePrice = getServicePrice(service);
      const taxAmount = calculateItemTax(service);
      return {
        ...service,
        price: basePrice,
        taxAmount: taxAmount,
        totalWithTax: basePrice + taxAmount,
        notes: serviceNotes[service.id] || ''
      };
    });

    const bundlesWithTax = selectedBundles.map(bundle => {
      const basePrice = getBundlePrice(bundle);
      const taxAmount = calculateItemTax(bundle);
      
      // Debug Standard bundle specifically
      if (bundle.name === 'Standard Car Cleaning Package') {
        console.log('🔍 STANDARD BUNDLE TAX CALCULATION:');
        console.log('  - Bundle name:', bundle.name);
        console.log('  - Bundle taxIds:', bundle.taxIds);
        console.log('  - Base price:', basePrice);
        console.log('  - Calculated tax:', taxAmount);
        console.log('  - Total with tax:', basePrice + taxAmount);
        console.log('  - Selected group:', selectedGroup);
        console.log('  - Customer type:', customerType);
        console.log('  - Available taxes:', taxes);
        
        // If tax is 0, let's debug why
        if (taxAmount === 0) {
          console.log('❌ STANDARD BUNDLE TAX IS 0 - DEBUGGING WHY:');
          console.log('  - Bundle has taxIds:', bundle.taxIds && bundle.taxIds.length > 0);
          console.log('  - Selected group has taxIds:', selectedGroup?.taxIds && selectedGroup.taxIds.length > 0);
          console.log('  - Customer type matches:', customerType);
          console.log('  - Taxes loaded:', taxes && taxes.length > 0);
          
          if (bundle.taxIds && selectedGroup?.taxIds) {
            const applicableTaxIds = bundle.taxIds.filter(taxId => selectedGroup.taxIds.includes(taxId));
            console.log('  - Applicable tax IDs:', applicableTaxIds);
          }
        }
      }
      
      return {
        ...bundle,
        price: basePrice,
        taxAmount: taxAmount,
        totalWithTax: basePrice + taxAmount,
        notes: bundleNotes[bundle.id] || ''
      };
    });

    // Calculate total tax amount
    const totalTaxAmount = calculateTotalTax();

    const workOrderData = {
      customerType,
      customer: customerToUse,
      group: selectedVehicleCategory,
      vehicle: selectedVehicle,
      // Add customer group information for tax calculation
      customerGroup: selectedGroup,
      services: servicesWithTax,
      bundles: bundlesWithTax,
      // Store calculated tax amounts
      subtotal: calculateSubtotal(),
      taxAmount: totalTaxAmount,
      total: calculateTotal(),
      status: 'pending',
      createdAt: new Date()
    };
    
    console.log('Step5ServicesBundles: Passing work order data to Step6Summary:', workOrderData);
    console.log('Step5ServicesBundles: Customer type:', customerType);
    console.log('Step5ServicesBundles: Services count:', selectedServices.length);
    
    // Debug Standard bundle in work order data
    const standardBundleInWorkOrder = workOrderData.bundles?.find(b => b.name === 'Standard Car Cleaning Package');
    if (standardBundleInWorkOrder) {
      console.log('🔍 STANDARD BUNDLE IN WORK ORDER DATA:');
      console.log('  - Name:', standardBundleInWorkOrder.name);
      console.log('  - Price:', standardBundleInWorkOrder.price);
      console.log('  - Tax Amount:', standardBundleInWorkOrder.taxAmount);
      console.log('  - Total With Tax:', standardBundleInWorkOrder.totalWithTax);
      console.log('  - Tax IDs:', standardBundleInWorkOrder.taxIds);
      
      if (standardBundleInWorkOrder.taxAmount === 0) {
        console.log('❌ STANDARD BUNDLE TAX IS 0 IN WORK ORDER DATA!');
        console.log('  - This means the tax calculation failed during work order creation');
        console.log('  - Check the tax calculation debugging above');
      } else {
        console.log('✅ STANDARD BUNDLE TAX IS STORED CORRECTLY:', standardBundleInWorkOrder.taxAmount);
      }
    }
    
    // Debug all bundles in work order data
    console.log('🔍 ALL BUNDLES IN WORK ORDER DATA:');
    workOrderData.bundles?.forEach((bundle, index) => {
      console.log(`  Bundle ${index + 1}: ${bundle.name}`);
      console.log(`    - Price: ${bundle.price}`);
      console.log(`    - Tax Amount: ${bundle.taxAmount}`);
      console.log(`    - Total With Tax: ${bundle.totalWithTax}`);
      console.log(`    - Tax IDs: ${bundle.taxIds}`);
    });
    console.log('Step5ServicesBundles: Bundles count:', selectedBundles.length);
    
    onComplete(workOrderData);
  };

  const getCustomerName = () => {
    if (!selectedCustomer) return 'Unknown Customer';
    
    if (customerType === 'corporate') {
      return selectedCustomer.name || selectedCustomer.corporateName || 'Unnamed Corporate Customer';
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