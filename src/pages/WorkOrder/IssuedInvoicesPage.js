import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DirectionsCar as VehicleIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const IssuedInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');

  // Load issued invoices
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'invoices'), orderBy('issuedAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvoices(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading invoices:', error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Helper functions
  const getCustomerName = (invoice) => {
    if (!invoice?.customer) return 'Unknown Customer';
    if (invoice.customerType === 'corporate') {
      const c = invoice.customer;
      return (
        c.corporateName ||
        c.name ||
        c.companyName ||
        'Unnamed Corporate Customer'
      );
    } else {
      const customerFieldsData = invoice.customer.customerFields || {};
      const nameKeys = ['name', 'fullName', 'firstName', 'lastName'];
      for (const key of nameKeys) {
        if (customerFieldsData[key] && typeof customerFieldsData[key] === 'string' && customerFieldsData[key].trim().length > 0) {
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
          return value;
        }
      }
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
    const servicesTotal = (invoice.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (invoice.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    return servicesTotal + bundlesTotal;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCustomerTypeFilter('all');
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(invoice).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(invoice).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCustomerType = customerTypeFilter === 'all' || invoice.customerType === customerTypeFilter;
    
    return matchesSearch && matchesCustomerType;
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

      {/* Invoices Grid */}
      {filteredInvoices.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No issued invoices found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || customerTypeFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Complete work orders to see issued invoices here'
            }
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredInvoices.map((invoice) => {
            const vehicleType = invoice.group?.name || invoice.vehicle?.vehicleType || 'Unknown Type';
            const vehicleFieldsData = invoice.vehicle?.vehicleFields || {};
            const vehicleFieldEntries = Object.entries(vehicleFieldsData).filter(([key, value]) => value && value !== '');
            const keyVehicleFields = vehicleFieldEntries.slice(0, 2);
            const serviceNames = (invoice.services || []).map(s => s.name).join(', ');
            const bundleNames = (invoice.bundles || []).map(b => b.name).join(', ');
            const issuedDate = formatDate(invoice.issuedAt);
            const total = (Number(calculateTotal(invoice)) || 0).toFixed(2);

            return (
              <Grid item xs={12} md={6} lg={4} key={invoice.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'row', boxShadow: 6, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  {/* Vertical Status Bar */}
                  <Box sx={{ width: 16, bgcolor: 'success.main', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                    <Typography sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 'bold', color: 'white', letterSpacing: 2, fontSize: 14 }}>
                      ISSUED
                    </Typography>
                  </Box>
                  
                  {/* Card Content */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header with Invoice and Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'success.main', color: 'white', px: 2, py: 1.5, borderTopRightRadius: 12 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                        #{invoice.invoiceNumber}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {getCustomerName(invoice)}
                      </Typography>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      {/* Vehicle Type & Fields Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, mt: 1 }}>
                        <VehicleIcon sx={{ color: 'primary.main', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                          {vehicleType}
                        </Typography>
                        {keyVehicleFields.map(([key, value], idx) => (
                          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {key.replace(/_/g, ' ')}:
                            </Typography>
                            <Typography variant="body2">{value}</Typography>
                            {idx < keyVehicleFields.length - 1 && <span style={{ margin: '0 4px' }}>|</span>}
                          </Box>
                        ))}
                      </Box>
                      
                      {/* Services & Bundles Names */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Services: <span style={{ color: '#1976d2', fontWeight: 500 }}>{serviceNames || 'None'}</span>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bundles: <span style={{ color: '#9c27b0', fontWeight: 500 }}>{bundleNames || 'None'}</span>
                        </Typography>
                      </Box>
                      
                      {/* Issued Date */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Issued: {issuedDate}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    {/* Total - Highlighted */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e8f5e8', borderBottomRightRadius: 12, borderTop: '1px solid #4caf50', py: 1.5, mt: 'auto' }}>
                      <ReceiptIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                      <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ letterSpacing: 2, textShadow: '0 2px 8px #c8e6c9' }}>
                        ${total}
                      </Typography>
                    </Box>
                    
                    {/* Actions */}
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 1 }}>
                      <Box>
                        <IconButton
                          size="small"
                          color="primary"
                          title="View Invoice"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          title="Download PDF"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          title="Email Invoice"
                        >
                          <EmailIcon />
                        </IconButton>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                      >
                        Paid
                      </Button>
                    </CardActions>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default IssuedInvoicesPage; 