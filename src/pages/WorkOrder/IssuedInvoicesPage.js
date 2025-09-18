import React, { useState, useEffect } from 'react';
import { 
  getPaymentStatusColor, 
  getPaymentStatusLabel, 
  formatDate,
  getDaysUntilDue 
} from '../../utils/paymentCalculations';
import { 
  Box, 
  Typography, 
  Grid, 
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Visibility as ViewIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const IssuedInvoicesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [reviewDialog, setReviewDialog] = useState({ open: false, invoice: null });

  // Load issued invoices and payment methods
  useEffect(() => {
    const unsubscribeInvoices = onSnapshot(
      query(collection(db, 'invoices'), orderBy('issuedAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvoices(data);
      },
      (error) => {
        console.error('Error loading invoices:', error);
      }
    );

    const unsubscribePaymentMethods = onSnapshot(
      query(collection(db, 'paymentMethods'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentMethods(data);
      },
      (error) => {
        console.error('Error loading payment methods:', error);
      }
    );

    const unsubscribeTaxes = onSnapshot(
      query(collection(db, 'taxes'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTaxes(data);
        console.log('Taxes loaded:', data);
        console.log('Number of taxes loaded:', data.length);
        console.log('Tax IDs:', data.map(t => t.id));
      },
      (error) => {
        console.error('Error loading taxes:', error);
      }
    );

    setLoading(false);
    
    return () => {
      unsubscribeInvoices();
      unsubscribePaymentMethods();
      unsubscribeTaxes();
    };
  }, []);

  // Helper functions
  const getCustomerName = (invoice) => {
    console.log('=== GETTING CUSTOMER NAME ===');
    console.log('Invoice:', invoice);
    console.log('Customer:', invoice?.customer);
    console.log('Customer type:', invoice?.customerType);
    
    if (!invoice?.customer) {
      console.log('No customer data found');
      return 'Unknown Customer';
    }
    
    if (invoice.customerType === 'corporate') {
      const c = invoice.customer;
      console.log('Corporate customer data:', c);
      const name = c.name || c.corporateName || c.companyName || 'Unnamed Corporate Customer';
      console.log('Corporate customer name:', name);
      return name;
    } else {
      const customerFieldsData = invoice.customer.customerFields || {};
      console.log('Individual customer fields:', customerFieldsData);
      
      const nameKeys = ['name', 'fullName', 'firstName', 'lastName'];
      for (const key of nameKeys) {
        if (customerFieldsData[key] && typeof customerFieldsData[key] === 'string' && customerFieldsData[key].trim().length > 0) {
          console.log('Found name in key:', key, '=', customerFieldsData[key]);
          return customerFieldsData[key];
        }
      }
      
      for (const [key, value] of Object.entries(customerFieldsData)) {
        if (
          value &&
          typeof value === 'string' &&
          value.trim().length > 0 &&
          !value.includes('@') &&
          !/^[A-Za-z0-9]{16,}$/.test(value)
        ) {
          console.log('Found name in field:', key, '=', value);
          return value;
        }
      }
      
      console.log('No valid name found in customer fields');
      return 'Unnamed Customer';
    }
  };

  const getVehicleInfo = (invoice) => {
    if (!invoice?.vehicle) return 'No vehicle';
    
    const vehicleFieldsData = invoice.vehicle.vehicleFields || {};
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

  const calculateTotal = (invoice) => {
    // Use stored total if available, otherwise calculate from services + bundles
    if (invoice.total !== undefined && invoice.total !== null) {
      console.log('Using stored total from invoice:', invoice.total);
      return Number(invoice.total) || 0;
    }
    
    // Calculate total from services and bundles
    const servicesTotal = (invoice.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (invoice.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    console.log('Calculated total from services + bundles:', servicesTotal + bundlesTotal);
    return servicesTotal + bundlesTotal;
  };

  const calculateSubtotal = (invoice) => {
    // Use stored subtotal if available, otherwise calculate from services + bundles
    if (invoice.subtotal !== undefined && invoice.subtotal !== null) {
      console.log('Using stored subtotal from invoice:', invoice.subtotal);
      return Number(invoice.subtotal) || 0;
    }
    
    // Calculate subtotal from services and bundles (base prices)
    const servicesTotal = (invoice.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (invoice.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    console.log('Calculated subtotal from services + bundles:', servicesTotal + bundlesTotal);
    return servicesTotal + bundlesTotal;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  // Tax calculation functions (same logic as work order)
  const calculateItemTax = (item, invoice) => {
    console.log('=== INVOICE TAX CALCULATION DEBUG ===');
    console.log('Item:', item.name);
    console.log('Item taxIds:', item.taxIds);
    console.log('Invoice customer type:', invoice.customerType);
    console.log('Available taxes:', taxes);
    console.log('Invoice data:', invoice);
    
    // Special debugging for Standard Car Cleaning Package
    if (item.name === 'Standard Car Cleaning Package') {
      console.log('🔍 SPECIAL DEBUG FOR STANDARD BUNDLE');
      console.log('Item taxIds:', item.taxIds);
      console.log('Invoice customerGroupTaxIds:', invoice.customerGroupTaxIds);
      console.log('Invoice customerGroup:', invoice.customerGroup);
      console.log('Invoice customerGroup.taxIds:', invoice.customerGroup?.taxIds);
      console.log('Invoice customer.group:', invoice.customer?.group);
      console.log('Invoice customer.group.taxIds:', invoice.customer?.group?.taxIds);
      console.log('Invoice customer.taxIds:', invoice.customer?.taxIds);
    }
    
    if (!item.taxIds || !taxes || taxes.length === 0) {
      console.log('❌ No taxIds or taxes available, returning 0');
      return 0;
    }
    
    // Get customer group tax IDs from invoice
    let customerGroupTaxIds = [];
    
    // Try different ways to get customer group tax IDs from invoice
    if (invoice.customerGroupTaxIds) {
      customerGroupTaxIds = invoice.customerGroupTaxIds;
      console.log('Using invoice.customerGroupTaxIds:', customerGroupTaxIds);
    } else if (invoice.customerGroup?.taxIds) {
      customerGroupTaxIds = invoice.customerGroup.taxIds;
      console.log('Using invoice.customerGroup.taxIds:', customerGroupTaxIds);
    } else if (invoice.customer?.group?.taxIds) {
      customerGroupTaxIds = invoice.customer.group.taxIds;
      console.log('Using invoice.customer.group.taxIds:', customerGroupTaxIds);
    } else if (invoice.customer?.taxIds) {
      customerGroupTaxIds = invoice.customer.taxIds;
      console.log('Using invoice.customer.taxIds:', customerGroupTaxIds);
    } else {
      console.log('❌ No customer group tax IDs found in invoice');
      console.log('Invoice customer:', invoice.customer);
      console.log('Invoice customer group:', invoice.customer?.group);
      console.log('Invoice customerGroup:', invoice.customerGroup);
      console.log('Invoice customerGroupTaxIds:', invoice.customerGroupTaxIds);
      return 0;
    }
    
    // Find intersection of item tax IDs and customer group tax IDs
    const applicableTaxIds = item.taxIds.filter(taxId => 
      customerGroupTaxIds.includes(taxId)
    );
    
    console.log('Applicable tax IDs (intersection):', applicableTaxIds);
    
    if (applicableTaxIds.length === 0) {
      console.log('❌ No taxes applicable - customer group not assigned to any of the item taxes');
      console.log('Item taxIds:', item.taxIds);
      console.log('Customer group taxIds:', customerGroupTaxIds);
      return 0;
    }
    
    let totalTax = 0;
    const basePrice = Number(item.price) || 0;
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
          const customerTypeMatches = tax.customerTypes.includes(invoice.customerType) || tax.customerTypes.includes('both');
          console.log(`Tax ${tax.name} customer types:`, tax.customerTypes);
          console.log(`Current customer type: ${invoice.customerType}, matches: ${customerTypeMatches}`);
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
    console.log('=== END INVOICE TAX CALCULATION DEBUG ===');
    return totalTax;
  };

  const calculateTotalTax = (invoice) => {
    console.log('=== CALCULATING TOTAL TAX ===');
    console.log('Invoice taxAmount:', invoice.taxAmount);
    console.log('Invoice tax field:', invoice.tax);
    
    // Method 1: Use stored tax amount (preferred for new invoices)
    if (invoice.taxAmount !== undefined && invoice.taxAmount !== null && invoice.taxAmount > 0) {
      console.log('✓ Using stored tax amount:', invoice.taxAmount);
      return Number(invoice.taxAmount);
    }
    
    // Method 2: Calculate from individual item tax amounts
    const servicesTax = (invoice.services || []).reduce((sum, service) => {
      const tax = Number(service.taxAmount) || 0;
      console.log(`Service ${service.name} tax:`, tax);
      return sum + tax;
    }, 0);
    
    const bundlesTax = (invoice.bundles || []).reduce((sum, bundle) => {
      const tax = Number(bundle.taxAmount) || 0;
      console.log(`Bundle ${bundle.name} tax:`, tax);
      return sum + tax;
    }, 0);
    
    const calculatedTax = servicesTax + bundlesTax;
    console.log('Services tax total:', servicesTax);
    console.log('Bundles tax total:', bundlesTax);
    console.log('Combined tax total:', calculatedTax);
    
    if (calculatedTax > 0) {
      console.log('✓ Using individual item tax amounts:', calculatedTax);
      return calculatedTax;
    }
    
    // Method 3: Calculate difference between total and subtotal
    const subtotal = calculateSubtotal(invoice);
    const total = calculateTotal(invoice);
    const differenceTax = total - subtotal;
    console.log('Subtotal:', subtotal, 'Total:', total, 'Difference (tax):', differenceTax);
    
    if (differenceTax > 0) {
      console.log('✓ Using difference between total and subtotal:', differenceTax);
      return differenceTax;
    }
    
    // Method 4: Use stored tax field
    const storedTax = invoice.tax || 0;
    console.log('Using stored tax field:', storedTax);
    console.log('=== END TAX CALCULATION ===');
    return Number(storedTax);
  };

  const calculateServiceTax = (service, invoice) => {
    console.log('=== CALCULATING SERVICE TAX ===');
    console.log('Service:', service);
    console.log('Service taxIds:', service.taxIds);
    console.log('Invoice:', invoice);
    console.log('Available taxes:', taxes);
    
    if (!service.taxIds || service.taxIds.length === 0) {
      console.log('❌ No tax IDs found for service');
      return 0;
    }

    // Try multiple paths for customer group tax IDs
    const customerGroupTaxIds = invoice?.customerGroupTaxIds || 
                                invoice?.customer?.group?.taxIds || 
                                invoice?.customer?.taxIds || [];
    
    console.log('Using customer group tax IDs:', customerGroupTaxIds);
    
    if (customerGroupTaxIds.length === 0) {
      console.log('❌ No customer group tax IDs found in invoice');
      return 0;
    }

    const applicableTaxIds = service.taxIds.filter(taxId => 
      customerGroupTaxIds.includes(taxId)
    );
    
    console.log('Applicable tax IDs:', applicableTaxIds);
    
    if (applicableTaxIds.length === 0) {
      console.log('❌ No applicable tax IDs found');
      return 0;
    }

    const applicableTaxes = taxes.filter(tax => 
      applicableTaxIds.includes(tax.id)
    );
    
    console.log('Applicable taxes:', applicableTaxes);
    
    if (applicableTaxes.length === 0) {
      console.log('❌ No applicable taxes found');
      return 0;
    }

    const basePrice = Number(service.price) || 0;
    const totalTaxRate = applicableTaxes.reduce((sum, tax) => sum + (Number(tax.rate) || 0), 0);
    const taxAmount = basePrice * (totalTaxRate / 100);
    
    console.log('Base price:', basePrice);
    console.log('Total tax rate:', totalTaxRate);
    console.log('Calculated tax amount:', taxAmount);
    console.log('=== END SERVICE TAX CALCULATION ===');
    
    return taxAmount;
  };

  const calculateBundleTax = (bundle, invoice) => {
    console.log('=== CALCULATING BUNDLE TAX ===');
    console.log('Bundle:', bundle);
    console.log('Bundle taxIds:', bundle.taxIds);
    console.log('Invoice:', invoice);
    console.log('Available taxes:', taxes);
    
    if (!bundle.taxIds || bundle.taxIds.length === 0) {
      console.log('❌ No tax IDs found for bundle');
      return 0;
    }

    // Try multiple paths for customer group tax IDs
    const customerGroupTaxIds = invoice?.customerGroupTaxIds || 
                                invoice?.customer?.group?.taxIds || 
                                invoice?.customer?.taxIds || [];
    
    console.log('Using customer group tax IDs:', customerGroupTaxIds);
    
    if (customerGroupTaxIds.length === 0) {
      console.log('❌ No customer group tax IDs found in invoice');
      return 0;
    }

    const applicableTaxIds = bundle.taxIds.filter(taxId => 
      customerGroupTaxIds.includes(taxId)
    );
    
    console.log('Applicable tax IDs:', applicableTaxIds);
    
    if (applicableTaxIds.length === 0) {
      console.log('❌ No applicable tax IDs found');
      return 0;
    }

    const applicableTaxes = taxes.filter(tax => 
      applicableTaxIds.includes(tax.id)
    );
    
    console.log('Applicable taxes:', applicableTaxes);
    
    if (applicableTaxes.length === 0) {
      console.log('❌ No applicable taxes found');
      return 0;
    }

    const basePrice = Number(bundle.price) || 0;
    const totalTaxRate = applicableTaxes.reduce((sum, tax) => sum + (Number(tax.rate) || 0), 0);
    const taxAmount = basePrice * (totalTaxRate / 100);
    
    console.log('Base price:', basePrice);
    console.log('Total tax rate:', totalTaxRate);
    console.log('Calculated tax amount:', taxAmount);
    console.log('=== END BUNDLE TAX CALCULATION ===');
    
    return taxAmount;
  };

  const getPaymentMethodName = (paymentMethodId) => {
    if (!paymentMethodId) return 'Not specified';
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    return method ? method.name : 'Unknown method';
  };

  const handleReviewInvoice = (invoice) => {
    console.log('=== REVIEWING INVOICE ===');
    console.log('Invoice data:', invoice);
    console.log('Services:', invoice.services);
    console.log('Bundles:', invoice.bundles);
    console.log('Customer type:', invoice.customerType);
    console.log('Customer:', invoice.customer);
    console.log('Customer group tax IDs:', invoice.customerGroupTaxIds);
    console.log('Customer group:', invoice.customer?.group);
    console.log('Invoice customerGroup:', invoice.customerGroup);
    console.log('Invoice customerGroup.taxIds:', invoice.customerGroup?.taxIds);
    
    // Debug the specific bundle that should have tax
    if (invoice.bundles) {
      const standardBundle = invoice.bundles.find(b => b.name === 'Standard Car Cleaning Package');
      if (standardBundle) {
        console.log('=== STANDARD BUNDLE DEBUG ===');
        console.log('Bundle name:', standardBundle.name);
        console.log('Bundle taxIds:', standardBundle.taxIds);
        console.log('Bundle taxAmount:', standardBundle.taxAmount);
        console.log('Bundle price:', standardBundle.price);
        console.log('=== END STANDARD BUNDLE DEBUG ===');
      }
    }
    console.log('Taxes loaded:', taxes);
    console.log('Invoice subtotal:', invoice.subtotal);
    console.log('Invoice tax amount:', invoice.taxAmount);
    console.log('Invoice total:', invoice.total);
    console.log('Services with tax data:', invoice.services?.map(s => ({ name: s.name, price: s.price, taxAmount: s.taxAmount, totalWithTax: s.totalWithTax })));
    console.log('Bundles with tax data:', invoice.bundles?.map(b => ({ name: b.name, price: b.price, taxAmount: b.taxAmount, totalWithTax: b.totalWithTax })));
    
    // Debug individual service tax amounts
    if (invoice.services) {
      console.log('=== INDIVIDUAL SERVICE TAX DEBUG ===');
      invoice.services.forEach((service, index) => {
        console.log(`Service ${index + 1}: ${service.name}`);
        console.log('  - Price:', service.price);
        console.log('  - Tax Amount:', service.taxAmount);
        console.log('  - Total With Tax:', service.totalWithTax);
        console.log('  - Tax IDs:', service.taxIds);
        console.log('  - All service data:', service);
        console.log('  - Service keys:', Object.keys(service));
        console.log('  - Service taxAmount type:', typeof service.taxAmount);
        console.log('  - Service taxAmount value:', service.taxAmount);
        console.log('  - Service taxAmount converted:', Number(service.taxAmount));
        
        // Check if service has tax in database
        const hasTax = service.taxAmount && Number(service.taxAmount) > 0;
        console.log(`  - Service has tax in database: ${hasTax}`);
        if (hasTax) {
          console.log(`  - ✅ Service ${service.name} HAS TAX: $${service.taxAmount}`);
        } else {
          console.log(`  - ❌ Service ${service.name} NO TAX: $${service.taxAmount || 0}`);
        }
      });
    }
    
    // Debug individual bundle tax amounts
    if (invoice.bundles) {
      console.log('=== INDIVIDUAL BUNDLE TAX DEBUG ===');
      invoice.bundles.forEach((bundle, index) => {
        console.log(`Bundle ${index + 1}: ${bundle.name}`);
        console.log('  - Price:', bundle.price);
        console.log('  - Tax Amount:', bundle.taxAmount);
        console.log('  - Total With Tax:', bundle.totalWithTax);
        console.log('  - Tax IDs:', bundle.taxIds);
        console.log('  - All bundle data:', bundle);
        console.log('  - Bundle keys:', Object.keys(bundle));
        console.log('  - Bundle taxAmount type:', typeof bundle.taxAmount);
        console.log('  - Bundle taxAmount value:', bundle.taxAmount);
        console.log('  - Bundle taxAmount converted:', Number(bundle.taxAmount));
        
        // Check if bundle has tax in database
        const hasTax = bundle.taxAmount && Number(bundle.taxAmount) > 0;
        console.log(`  - Bundle has tax in database: ${hasTax}`);
        if (hasTax) {
          console.log(`  - ✅ Bundle ${bundle.name} HAS TAX: $${bundle.taxAmount}`);
        } else {
          console.log(`  - ❌ Bundle ${bundle.name} NO TAX: $${bundle.taxAmount || 0}`);
        }
      });
    }
    
    console.log('=== END INVOICE REVIEW ===');
    
    // Test tax calculation for Standard bundle
    if (invoice.bundles) {
      const standardBundle = invoice.bundles.find(b => b.name === 'Standard Car Cleaning Package');
      if (standardBundle) {
        console.log('🧪 TESTING TAX CALCULATION FOR STANDARD BUNDLE');
        const testTax = calculateItemTax(standardBundle, invoice);
        console.log('🧪 TEST RESULT - Standard bundle tax:', testTax);
      }
    }
    
    setReviewDialog({ open: true, invoice });
  };

  const handleCloseReviewDialog = () => {
    setReviewDialog({ open: false, invoice: null });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCustomerTypeFilter('all');
    setPaymentStatusFilter('all');
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(invoice).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(invoice).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCustomerType = customerTypeFilter === 'all' || invoice.customerType === customerTypeFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || (invoice.paymentStatus || 'pending') === paymentStatusFilter;
    
    return matchesSearch && matchesCustomerType && matchesPaymentStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ReceiptIcon sx={{ mr: 2, color: 'success.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Issued Invoices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {filteredInvoices.length} of {invoices.length} issued invoices
              {(customerTypeFilter !== 'all' || paymentStatusFilter !== 'all') && (
                <span>
                  {' '}(filtered by: {[
                    customerTypeFilter !== 'all' ? `${customerTypeFilter} customers` : null,
                    paymentStatusFilter !== 'all' ? `${paymentStatusFilter} payments` : null
                  ].filter(Boolean).join(', ')})
                </span>
              )}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                label="Customer Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="corporate">Corporate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                label="Payment Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="settled">Settled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No issued invoices found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || customerTypeFilter !== 'all' || paymentStatusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Complete work orders to see issued invoices here'
            }
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 500 }} size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Invoice #</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Customer Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Total</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Payment Method</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const total = (Number(calculateTotal(invoice)) || 0).toFixed(2);

                return (
                  <TableRow key={invoice.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        #{invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {invoice.customerType === 'corporate' ? (
                          <BusinessIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        ) : (
                          <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        )}
                        <Typography variant="body2" fontWeight="medium">
                          {getCustomerName(invoice)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.customerType === 'corporate' ? 'Corporate' : 'Individual'} 
                        size="small" 
                        color={invoice.customerType === 'corporate' ? 'primary' : 'secondary'}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <ReceiptIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          ${total}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {getPaymentMethodName(invoice.paymentMethod)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentStatusLabel(invoice.paymentStatus || 'pending')}
                        size="small"
                        color={getPaymentStatusColor(invoice.paymentStatus || 'pending')}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                      </Typography>
                      {invoice.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          {getDaysUntilDue(invoice.dueDate) > 0 
                            ? `${getDaysUntilDue(invoice.dueDate)} days left`
                            : getDaysUntilDue(invoice.dueDate) < 0 
                            ? `${Math.abs(getDaysUntilDue(invoice.dueDate))} days overdue`
                            : 'Due today'
                          }
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Review Invoice">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleReviewInvoice(invoice)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Professional Invoice Dialog */}
      <Dialog 
        open={reviewDialog.open} 
        onClose={handleCloseReviewDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            '@media print': {
              maxHeight: 'none',
              boxShadow: 'none',
              margin: 0,
              width: '100%',
              height: '100%'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'none',
          '@media print': { display: 'none' }
        }}>
          Professional Invoice
        </DialogTitle>
        <DialogContent sx={{ 
          p: 0,
          '@media print': { 
            p: 0,
            overflow: 'visible'
          }
        }}>
          {reviewDialog.invoice && (
            <Box 
              id="invoice-print" 
              sx={{ 
                width: '100%',
                minHeight: '297mm',
                backgroundColor: 'white',
                color: 'black',
                fontFamily: 'Arial, sans-serif',
                padding: '20mm',
                boxSizing: 'border-box',
                '@media print': {
                  width: '210mm',
                  minHeight: '297mm',
                  margin: 0,
                  padding: '20mm',
                  boxSizing: 'border-box'
                }
              }}
            >
              {/* Company Header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 4,
                pb: 3,
                borderBottom: '2px solid #333'
              }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box 
                      component="img" 
                      src="./ELite Logo Black and white.png" 
                      alt="Elite Car Shine Logo"
                      sx={{ 
                        height: 60, 
                        width: 'auto',
                        mr: 2,
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      onLoad={() => console.log('Logo loaded successfully')}
                      onError={(e) => {
                        console.log('Logo failed to load:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                    <Box>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 'bold', 
                        color: '#333',
                        fontSize: '24px',
                        lineHeight: 1.2,
                        letterSpacing: '1px'
                      }}>
                        Elite Car Shine
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#666',
                        fontSize: '12px',
                        fontWeight: 'normal'
                      }}>
                        Professional Auto Detailing Services
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ textAlign: 'right', flex: 0.5 }}>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 'bold', 
                    color: '#333',
                    fontSize: '36px',
                    mb: 2,
                    letterSpacing: '1px'
                  }}>
                    INVOICE
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    Invoice #: {reviewDialog.invoice.invoiceNumber}
                  </Typography>
                </Box>
              </Box>

              {/* Customer Information */}
              <Box sx={{ mb: 6 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 3,
                  bgcolor: '#f8f9fa',
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: '#333',
                      fontSize: '16px',
                      mr: 3,
                      minWidth: '100px'
                    }}>
                      BILL TO:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      {getCustomerName(reviewDialog.invoice)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" sx={{ 
                      fontSize: '14px',
                      color: '#333',
                      mb: 0.5
                    }}>
                      Date: {formatDate(reviewDialog.invoice.issuedAt)}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontSize: '14px',
                      color: '#333'
                    }}>
                      Payment: {getPaymentMethodName(reviewDialog.invoice.paymentMethod)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Services and Items Table */}
              <Box sx={{ mb: 6 }}>
                <TableContainer sx={{ 
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#333' }}>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '14px',
                          py: 3,
                          border: 'none'
                        }}>
                          DESCRIPTION
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '14px',
                          py: 3,
                          textAlign: 'right',
                          width: '100px',
                          border: 'none'
                        }}>
                          AMOUNT
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '14px',
                          py: 3,
                          textAlign: 'right',
                          width: '100px',
                          border: 'none'
                        }}>
                          TAX
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '14px',
                          py: 3,
                          textAlign: 'right',
                          width: '100px',
                          border: 'none'
                        }}>
                          TOTAL
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Services */}
                      {reviewDialog.invoice.services && reviewDialog.invoice.services.map((service, index) => {
                        // Get tax from database - this is the source of truth
                        let serviceTax = Number(service.taxAmount) || 0;
                        console.log(`Service ${service.name} - DATABASE taxAmount:`, service.taxAmount, 'converted to number:', serviceTax);
                        
                        // Use stored tax amount from database (same as totals)
                        console.log(`Service ${service.name} - DATABASE taxAmount:`, service.taxAmount, 'converted to number:', serviceTax);
                        
                        // Use stored tax amount from database (no calculations needed)
                        console.log(`Service ${service.name} - Using stored tax from database: $${serviceTax}`);
                        
                        if (serviceTax > 0) {
                          console.log(`✅ Service ${service.name} HAS TAX: $${serviceTax}`);
                        } else {
                          console.log(`❌ Service ${service.name} NO TAX: $${serviceTax}`);
                        }
                        
                        const serviceTotal = Number(service.price || 0) + serviceTax;
                        return (
                          <TableRow key={`service-${index}`} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8f9fa' } }}>
                            <TableCell sx={{ 
                              py: 3, 
                              fontSize: '14px',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                                {service.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                Service
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'right', 
                              py: 3,
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#333',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              ${Number(service.price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'right', 
                              py: 3,
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: serviceTax > 0 ? '#1976d2' : '#666',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              {serviceTax > 0 ? `$${serviceTax.toFixed(2)}` : '$0.00'}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'right', 
                              py: 3,
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#333',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              ${serviceTotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Bundles */}
                      {reviewDialog.invoice.bundles && reviewDialog.invoice.bundles.map((bundle, index) => {
                        // Get tax from database - this is the source of truth
                        let bundleTax = Number(bundle.taxAmount) || 0;
                        console.log(`Bundle ${bundle.name} - DATABASE taxAmount:`, bundle.taxAmount, 'converted to number:', bundleTax);
                        
                        // Use stored tax amount from database (same as totals)
                        console.log(`Bundle ${bundle.name} - DATABASE taxAmount:`, bundle.taxAmount, 'converted to number:', bundleTax);
                        
                        // Use stored tax amount from database (no calculations needed)
                        console.log(`Bundle ${bundle.name} - Using stored tax from database: $${bundleTax}`);
                        
                        if (bundleTax > 0) {
                          console.log(`✅ Bundle ${bundle.name} HAS TAX: $${bundleTax}`);
                        } else {
                          console.log(`❌ Bundle ${bundle.name} NO TAX: $${bundleTax}`);
                        }
                        
                        const bundleTotal = Number(bundle.price || 0) + bundleTax;
                        return (
                          <TableRow key={`bundle-${index}`} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8f9fa' } }}>
                            <TableCell sx={{ 
                              py: 3, 
                              fontSize: '14px',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                                {bundle.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                                Bundle Package
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'right', 
                              py: 3,
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#333',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              ${Number(bundle.price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'right', 
                              py: 3,
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: bundleTax > 0 ? '#1976d2' : '#666',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              {bundleTax > 0 ? `$${bundleTax.toFixed(2)}` : '$0.00'}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'right', 
                              py: 3,
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#333',
                              border: 'none',
                              borderBottom: '1px solid #ddd'
                            }}>
                              ${bundleTotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Tax Row - Show if tax exists */}
                      {(() => {
                        const taxAmount = calculateTotalTax(reviewDialog.invoice);
                        console.log('Tax amount for display:', taxAmount);
                        
                        // Show tax row if there's tax
                        if (taxAmount > 0) {
                          return (
                            <TableRow sx={{ '&:nth-of-type(even)': { bgcolor: '#f8f9fa' } }}>
                              <TableCell sx={{ 
                                py: 3, 
                                fontSize: '14px',
                                border: 'none',
                                borderBottom: '1px solid #ddd'
                              }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                                  Tax
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ 
                                textAlign: 'right', 
                                py: 3,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#333',
                                border: 'none',
                                borderBottom: '1px solid #ddd'
                              }}>
                                -
                              </TableCell>
                              <TableCell sx={{ 
                                textAlign: 'right', 
                                py: 3,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#1976d2',
                                border: 'none',
                                borderBottom: '1px solid #ddd'
                              }}>
                                ${Number(taxAmount).toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ 
                                textAlign: 'right', 
                                py: 3,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#333',
                                border: 'none',
                                borderBottom: '1px solid #ddd'
                              }}>
                                ${(Number(calculateSubtotal(reviewDialog.invoice)) + Number(taxAmount)).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return null;
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Total Section */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                mb: 8
              }}>
                <Box sx={{ 
                  width: '300px',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 3,
                    px: 3,
                    bgcolor: '#f8f9fa',
                    borderBottom: '1px solid #ddd'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      SUBTOTAL:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      ${(Number(calculateSubtotal(reviewDialog.invoice)) || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Tax Row in Total Section */}
                  {(() => {
                    const taxAmount = calculateTotalTax(reviewDialog.invoice);
                    console.log('Tax amount for total section:', taxAmount);
                    
                    // Show tax row if there's tax
                    if (taxAmount > 0) {
                      return (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 2,
                          px: 3,
                          bgcolor: '#f8f9fa',
                          borderBottom: '1px solid #ddd'
                        }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#333'
                          }}>
                            TAX:
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#333'
                          }}>
                            ${Number(taxAmount).toFixed(2)}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  })()}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 4,
                    px: 3,
                    bgcolor: '#333'
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: 'white'
                    }}>
                      TOTAL:
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: 'white'
                    }}>
                      ${(Number(calculateTotal(reviewDialog.invoice)) || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Footer */}
              <Box sx={{ 
                mt: 8,
                pt: 4,
                borderTop: '2px solid #333',
                textAlign: 'center',
                bgcolor: '#f8f9fa',
                p: 4,
                borderRadius: 1
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#333',
                  fontSize: '16px',
                  mb: 2,
                  fontWeight: 'bold'
                }}>
                  Thank you for choosing Elite Car Shine!
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#666',
                  fontSize: '14px',
                  mb: 2
                }}>
                  For questions about this invoice, please contact us at +1 905-467-9274
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#999',
                  fontSize: '12px',
                  mb: 1
                }}>
                  467 Speers Rd unit 2, Oakville, ON L6K 3S4, Canada
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#999',
                  fontSize: '12px'
                }}>
                  Professional Auto Detailing Services
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          gap: 2,
          justifyContent: 'space-between',
          '@media print': { display: 'none' }
        }}>
          <Button 
            variant="outlined" 
            onClick={handleCloseReviewDialog}
            sx={{ minWidth: 100 }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={() => {
              // Simple approach - use browser's print with CSS media queries
              const printContent = document.getElementById('invoice-print');
              
              if (!printContent) {
                alert('Invoice content not found');
                return;
              }
              
              // Add print styles to the current page
              const printStyles = document.createElement('style');
              printStyles.textContent = `
                @media print {
                  @page { 
                    size: A4; 
                    margin: 20mm; 
                  }
                  body * {
                    visibility: hidden;
                  }
                  #invoice-print, #invoice-print * {
                    visibility: visible;
                  }
                  #invoice-print {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100% !important;
                    height: auto !important;
                    padding: 20mm !important;
                    margin: 0 !important;
                    background: white !important;
                    color: black !important;
                  }
                  .MuiDialogActions-root,
                  .MuiDialogTitle-root {
                    display: none !important;
                  }
                  
                  /* Force all text to be black */
                  #invoice-print * {
                    color: black !important;
                  }
                  
                  /* Override all gray colors */
                  .MuiTypography-colorTextSecondary,
                  .MuiTypography-colorTextSecondary *,
                  [style*="color: #666"],
                  [style*="color: #999"],
                  [style*="color: #9e9e9e"],
                  [style*="color: rgba(0, 0, 0, 0.6)"],
                  [style*="color: rgba(0, 0, 0, 0.54)"],
                  [style*="color: rgb(158, 158, 158)"],
                  [style*="color: rgb(117, 117, 117)"] {
                    color: black !important;
                  }
                  
                  /* Override any Material-UI gray text */
                  .MuiTypography-root[style*="color: #666"],
                  .MuiTypography-root[style*="color: #999"],
                  .MuiTypography-root[style*="color: #9e9e9e"] {
                    color: black !important;
                  }
                  
                  /* Force table headers to stay white on dark background */
                  .MuiTableHead-root .MuiTableCell-root {
                    color: white !important;
                    background-color: #333 !important;
                  }
                }
              `;
              
              document.head.appendChild(printStyles);
              
              // Print the current page
              window.print();
              
              // Remove the print styles after printing
              setTimeout(() => {
                document.head.removeChild(printStyles);
              }, 1000);
            }}
            sx={{ 
              minWidth: 150,
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IssuedInvoicesPage; 