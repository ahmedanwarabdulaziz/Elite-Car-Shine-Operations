import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Timeline as LifecycleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Assessment as AuditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { auditInvoiceNumbers, getInvoiceLifecycleSummary, findInvoiceByNumber } from '../../../firebase/invoiceAudit';
import { getCurrentCounters, fixCounterSync } from '../../../firebase/invoiceCounter';

const InvoiceLifecyclePage = () => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  
  // Audit functionality
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [lifecycleSummary, setLifecycleSummary] = useState(null);
  const [counters, setCounters] = useState({ C: 0, D: 0 });

  // Load work orders
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workOrders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading work orders:', error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Load summary data
  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        const [summary, currentCounters] = await Promise.all([
          getInvoiceLifecycleSummary(),
          getCurrentCounters()
        ]);
        setLifecycleSummary(summary);
        setCounters(currentCounters);
      } catch (error) {
        console.error('Error loading summary data:', error);
      }
    };

    loadSummaryData();
  }, []);

  // Audit functions
  const handleAudit = async () => {
    setAuditLoading(true);
    try {
      const audit = await auditInvoiceNumbers();
      setAuditData(audit);
      setAuditDialogOpen(true);
    } catch (error) {
      console.error('Error performing audit:', error);
      alert('Error performing audit. Please try again.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSearchMissingInvoice = async (invoiceNumber) => {
    try {
      const found = await findInvoiceByNumber(invoiceNumber);
      if (found) {
        alert(`Invoice ${invoiceNumber} found! Work Order ID: ${found.id}`);
      } else {
        alert(`Invoice ${invoiceNumber} not found in the system.`);
      }
    } catch (error) {
      console.error('Error searching for invoice:', error);
      alert('Error searching for invoice.');
    }
  };

  const handleFixCounter = async (customerType) => {
    try {
      const result = await fixCounterSync(customerType);
      alert(`Counter fixed! Set to ${result}. Please refresh the page.`);
      window.location.reload();
    } catch (error) {
      console.error('Error fixing counter:', error);
      alert('Error fixing counter. Please try again.');
    }
  };

  // Helper functions
  const getCustomerName = (workOrder) => {
    if (!workOrder?.customer) return 'Unknown Customer';
    
    if (workOrder.customerType === 'corporate') {
      return workOrder.customer.corporateName || 'Unnamed Corporate Customer';
    } else {
      const customerFieldsData = workOrder.customer.customerFields || {};
      const nameField = Object.values(customerFieldsData).find(value => value);
      return nameField || 'Unnamed Customer';
    }
  };

  const getVehicleInfo = (workOrder) => {
    if (!workOrder?.vehicle) return 'No vehicle';
    
    const vehicleFieldsData = workOrder.vehicle.vehicleFields || {};
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

  const calculateTotal = (workOrder) => {
    const servicesTotal = (workOrder.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (workOrder.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    return servicesTotal + bundlesTotal;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'info';
      case 'final':
        return 'success';
      case 'deleted':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInvoiceStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'final':
        return 'Final';
      case 'deleted':
        return 'Deleted';
      default:
        return status || 'Draft';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'step1':
        return 'Customer Type';
      case 'step2':
        return 'Customer Selection';
      case 'step3':
        return 'Customer Details';
      case 'step4':
        return 'Vehicle Selection';
      case 'step5':
        return 'Services & Bundles';
      case 'step6':
        return 'Summary';
      case 'step7':
        return 'Submission';
      default:
        return stage;
    }
  };

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(workOrder => {
    const matchesSearch = 
      workOrder.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(workOrder).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(workOrder).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workOrder.status === statusFilter;
    const matchesCustomerType = customerTypeFilter === 'all' || workOrder.customerType === customerTypeFilter;
    const matchesInvoiceStatus = invoiceStatusFilter === 'all' || workOrder.invoiceStatus === invoiceStatusFilter;
    
    return matchesSearch && matchesStatus && matchesCustomerType && matchesInvoiceStatus;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCustomerTypeFilter('all');
    setInvoiceStatusFilter('all');
  };

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
          <IconButton onClick={() => navigate('/invoice-reports')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <LifecycleIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Invoice Lifecycle Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {filteredWorkOrders.length} of {workOrders.length} invoices
            </Typography>
            {lifecycleSummary && (
              <Typography variant="body2" color="text.secondary">
                Corporate: {counters.C} | Individual: {counters.D} | Draft: {lifecycleSummary.byStatus.draft} | Final: {lifecycleSummary.byStatus.final}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AuditIcon />}
            onClick={handleAudit}
            disabled={auditLoading}
          >
            {auditLoading ? 'Auditing...' : 'Audit Invoices'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
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
                <InputLabel>Work Order Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Work Order Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
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
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Invoice Status</InputLabel>
                <Select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  label="Invoice Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                  <MenuItem value="deleted">Deleted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                startIcon={<FilterIcon />}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Work Order Status</TableCell>
              <TableCell>Invoice Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWorkOrders.map((workOrder) => (
              <TableRow key={workOrder.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {workOrder.invoiceNumber || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {getCustomerName(workOrder)}
                    </Typography>
                    <Chip 
                      label={workOrder.customerType === 'corporate' ? 'Corporate' : 'Individual'} 
                      size="small" 
                      color={workOrder.customerType === 'corporate' ? 'primary' : 'secondary'}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getVehicleInfo(workOrder)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    ${calculateTotal(workOrder).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusLabel(workOrder.status)} 
                    size="small" 
                    color={getStatusColor(workOrder.status)}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getInvoiceStatusLabel(workOrder.invoiceStatus)} 
                    size="small" 
                    color={getInvoiceStatusColor(workOrder.invoiceStatus)}
                  />
                  {workOrder.deletedStage && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Deleted at: {getStageLabel(workOrder.deletedStage)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(workOrder.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(workOrder.updatedAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error">
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

      {filteredWorkOrders.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No invoices found matching your criteria
          </Typography>
        </Box>
      )}

      {/* Audit Dialog */}
      <Dialog 
        open={auditDialogOpen} 
        onClose={() => setAuditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AuditIcon sx={{ mr: 1, color: 'primary.main' }} />
            Invoice Number Audit Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {auditData && (
            <Box>
              {/* Corporate Invoices */}
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Corporate Invoices (C)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Expected: {auditData.corporate.expectedCount} | Actual: {auditData.corporate.actualCount}
              </Alert>
              
              {auditData.corporate.missing.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Missing Invoice Numbers:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {auditData.corporate.missing.map(number => (
                      <Chip
                        key={number}
                        label={`C${number.toString().padStart(5, '0')}`}
                        color="warning"
                        variant="outlined"
                        clickable
                        onClick={() => handleSearchMissingInvoice(`C${number.toString().padStart(5, '0')}`)}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => handleFixCounter('corporate')}
                    sx={{ mt: 1 }}
                  >
                    Fix Corporate Counter
                  </Button>
                </Alert>
              )}
              
              <List dense>
                {auditData.corporate.invoices.map(invoice => (
                  <ListItem key={invoice.invoiceNumber}>
                    <ListItemText
                      primary={invoice.invoiceNumber}
                      secondary={`Status: ${invoice.status} | Created: ${formatDate(invoice.createdAt)}`}
                    />
                    <Chip 
                      label={invoice.status} 
                      size="small" 
                      color={getInvoiceStatusColor(invoice.status)}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 3 }} />

              {/* Individual Invoices */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                Individual Invoices (D)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Expected: {auditData.individual.expectedCount} | Actual: {auditData.individual.actualCount}
              </Alert>
              
              {auditData.individual.missing.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Missing Invoice Numbers:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {auditData.individual.missing.map(number => (
                      <Chip
                        key={number}
                        label={`D${number.toString().padStart(5, '0')}`}
                        color="warning"
                        variant="outlined"
                        clickable
                        onClick={() => handleSearchMissingInvoice(`D${number.toString().padStart(5, '0')}`)}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => handleFixCounter('individual')}
                    sx={{ mt: 1 }}
                  >
                    Fix Individual Counter
                  </Button>
                </Alert>
              )}
              
              <List dense>
                {auditData.individual.invoices.map(invoice => (
                  <ListItem key={invoice.invoiceNumber}>
                    <ListItemText
                      primary={invoice.invoiceNumber}
                      secondary={`Status: ${invoice.status} | Created: ${formatDate(invoice.createdAt)}`}
                    />
                    <Chip 
                      label={invoice.status} 
                      size="small" 
                      color={getInvoiceStatusColor(invoice.status)}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Summary */}
              <Divider sx={{ my: 3 }} />
              <Alert severity="info">
                <Typography variant="subtitle2">
                  Total Missing: {auditData.corporate.missing.length + auditData.individual.missing.length} invoices
                </Typography>
                <Typography variant="body2">
                  Click on missing invoice numbers to search for them in the system.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceLifecyclePage; 