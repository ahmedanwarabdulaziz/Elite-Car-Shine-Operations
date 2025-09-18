import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNotification } from '../../components/Common/NotificationSystem';

const CorporateSettlementPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // State management
  const [corporateCustomers, setCorporateCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settlementDialog, setSettlementDialog] = useState({ open: false, data: null });
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'all', // 'all', 'thisMonth', 'lastMonth', 'custom'
    customStartDate: '',
    customEndDate: '',
    status: 'all', // 'all', 'pending', 'overdue'
    amountMin: '',
    amountMax: '',
    searchTerm: ''
  });
  
  // Settlement form
  const [settlementForm, setSettlementForm] = useState({
    paymentMethod: '',
    notes: '',
    referenceNumber: '',
    settlementDate: new Date().toISOString().split('T')[0]
  });

  // Load data on component mount
  useEffect(() => {
    loadCorporateCustomers();
    loadPaymentMethods();
  }, []);

  // Load invoices when customer or filters change
  useEffect(() => {
    if (selectedCustomer) {
      loadInvoices();
    }
  }, [selectedCustomer, filters]);

  const loadCorporateCustomers = async () => {
    try {
      setLoading(true);
      const customersRef = collection(db, 'corporateCustomers');
      const snapshot = await getDocs(customersRef);
      const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCorporateCustomers(customers.filter(customer => customer.isActive));
    } catch (error) {
      console.error('Error loading corporate customers:', error);
      showError('Failed to load corporate customers');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const paymentMethodsRef = collection(db, 'paymentMethods');
      const snapshot = await getDocs(paymentMethodsRef);
      const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentMethods(methods.filter(method => method.isActive));
    } catch (error) {
      console.error('Error loading payment methods:', error);
      showError('Failed to load payment methods');
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoicesRef = collection(db, 'invoices');
      let q = query(
        invoicesRef,
        where('customer.id', '==', selectedCustomer),
        where('customerType', '==', 'corporate')
      );

      // Apply date filter
      if (filters.dateRange === 'thisMonth') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        q = query(q, where('issuedAt', '>=', startOfMonth));
      } else if (filters.dateRange === 'lastMonth') {
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);
        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        q = query(q, where('issuedAt', '>=', startOfLastMonth), where('issuedAt', '<=', endOfLastMonth));
      }

      const snapshot = await getDocs(q);
      let invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Apply additional filters
      if (filters.status === 'pending') {
        invoicesData = invoicesData.filter(invoice => invoice.paymentStatus === 'pending');
      } else if (filters.status === 'overdue') {
        invoicesData = invoicesData.filter(invoice => invoice.paymentStatus === 'overdue');
      }

      if (filters.amountMin) {
        invoicesData = invoicesData.filter(invoice => invoice.total >= parseFloat(filters.amountMin));
      }

      if (filters.amountMax) {
        invoicesData = invoicesData.filter(invoice => invoice.total <= parseFloat(filters.amountMax));
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        invoicesData = invoicesData.filter(invoice => 
          invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
          invoice.customer?.name?.toLowerCase().includes(searchLower)
        );
      }

      setInvoices(invoicesData);
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInvoiceSelect = (invoiceId, checked) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectByStatus = (status) => {
    const filteredInvoices = invoices.filter(invoice => {
      if (status === 'pending') return invoice.paymentStatus === 'pending';
      if (status === 'overdue') return invoice.paymentStatus === 'overdue';
      return true;
    });
    setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
  };

  const getSelectedInvoicesData = () => {
    return invoices.filter(invoice => selectedInvoices.includes(invoice.id));
  };

  const calculateTotalAmount = () => {
    const selectedData = getSelectedInvoicesData();
    return selectedData.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  };

  const handleOpenSettlementDialog = () => {
    if (selectedInvoices.length === 0) {
      showError('Please select at least one invoice to settle');
      return;
    }

    setSettlementDialog({
      open: true,
      data: {
        invoices: getSelectedInvoicesData(),
        totalAmount: calculateTotalAmount(),
        customer: corporateCustomers.find(c => c.id === selectedCustomer)
      }
    });
  };

  const handleCloseSettlementDialog = () => {
    setSettlementDialog({ open: false, data: null });
    setSettlementForm({
      paymentMethod: '',
      notes: '',
      referenceNumber: '',
      settlementDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleSettlementFormChange = (field, value) => {
    setSettlementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmSettlement = async () => {
    try {
      const { invoices: selectedInvoicesData, totalAmount, customer } = settlementDialog.data;
      
      // Validate form
      if (!settlementForm.paymentMethod) {
        showError('Please select a payment method');
        return;
      }

      const confirmed = await showConfirm(
        'Confirm Settlement',
        `Are you sure you want to settle ${selectedInvoicesData.length} invoices for a total of $${totalAmount.toFixed(2)}?`
      );

      if (!confirmed) return;

      setLoading(true);

      // Create settlement record
      const settlementData = {
        customerId: selectedCustomer,
        customerName: customer?.name,
        settlementDate: new Date(settlementForm.settlementDate),
        totalAmount,
        paymentMethod: settlementForm.paymentMethod,
        settlementType: 'bulk',
        invoices: selectedInvoicesData.map(invoice => ({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total
        })),
        notes: settlementForm.notes,
        referenceNumber: settlementForm.referenceNumber,
        status: 'completed',
        createdAt: new Date(),
        createdBy: 'current_user' // TODO: Get from auth context
      };

      const settlementRef = await addDoc(collection(db, 'settlements'), settlementData);

      // Update invoices and create vault entries
      const batch = writeBatch(db);
      
      for (const invoice of selectedInvoicesData) {
        // Update invoice status
        const invoiceRef = doc(db, 'invoices', invoice.id);
        batch.update(invoiceRef, {
          paymentStatus: 'paid',
          settlementId: settlementRef.id,
          settledAt: new Date(),
          settlementMethod: settlementForm.paymentMethod
        });

        // Create vault entry for each invoice
        const vaultEntry = {
          type: 'settlement',
          amount: invoice.total,
          description: `Settlement for invoice ${invoice.invoiceNumber}`,
          reference: settlementForm.referenceNumber,
          settlementId: settlementRef.id,
          invoiceId: invoice.id,
          customerId: selectedCustomer,
          customerName: customer?.name,
          createdAt: new Date(),
          createdBy: 'current_user'
        };
        
        const vaultRef = doc(collection(db, 'vaultEntries'));
        batch.set(vaultRef, vaultEntry);
      }

      await batch.commit();

      showSuccess(`Successfully settled ${selectedInvoicesData.length} invoices for $${totalAmount.toFixed(2)}`);
      
      // Refresh data
      await loadInvoices();
      handleCloseSettlementDialog();
      
    } catch (error) {
      console.error('Error processing settlement:', error);
      showError('Failed to process settlement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const selectedInvoicesData = getSelectedInvoicesData();
  const totalAmount = calculateTotalAmount();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        Corporate Settlement Management
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage bulk settlements for corporate customers
      </Typography>

      {/* Customer Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Corporate Customer
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Corporate Customer</InputLabel>
            <Select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              label="Corporate Customer"
            >
              {corporateCustomers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <Accordion expanded={expandedFilters} onChange={() => setExpandedFilters(!expandedFilters)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon />
                  <Typography variant="h6">Filters & Search</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Date Range</InputLabel>
                      <Select
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        label="Date Range"
                      >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="thisMonth">This Month</MenuItem>
                        <MenuItem value="lastMonth">Last Month</MenuItem>
                        <MenuItem value="custom">Custom Range</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="overdue">Overdue</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Min Amount"
                      type="number"
                      value={filters.amountMin}
                      onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Max Amount"
                      type="number"
                      value={filters.amountMax}
                      onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Search Invoices"
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Invoice List */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Invoices ({invoices.length} found)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleSelectByStatus('pending')}
                    startIcon={<CheckCircleIcon />}
                  >
                    Select Pending
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleSelectByStatus('overdue')}
                    startIcon={<WarningIcon />}
                  >
                    Select Overdue
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleSelectAll(true)}
                    startIcon={<CheckCircleIcon />}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedInvoices([])}
                    startIcon={<CancelIcon />}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                            indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < invoices.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Days Overdue</TableCell>
                        <TableCell>Due Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={(e) => handleInvoiceSelect(invoice.id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            {invoice.issuedAt?.toDate ? 
                              invoice.issuedAt.toDate().toLocaleDateString() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>${(invoice.total || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.paymentStatus || 'unknown'}
                              color={getStatusColor(invoice.paymentStatus)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {invoice.paymentStatus === 'overdue' ? getDaysOverdue(invoice.dueDate) : '-'}
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate?.toDate ? 
                              invoice.dueDate.toDate().toLocaleDateString() : 
                              'N/A'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Settlement Summary */}
          {selectedInvoices.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Settlement Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Selected Invoices
                    </Typography>
                    <Typography variant="h6">
                      {selectedInvoices.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${totalAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Average Amount
                    </Typography>
                    <Typography variant="h6">
                      ${(totalAmount / selectedInvoices.length).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PaymentIcon />}
                      onClick={handleOpenSettlementDialog}
                      sx={{ mt: 1 }}
                    >
                      Process Settlement
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Settlement Dialog */}
      <Dialog open={settlementDialog.open} onClose={handleCloseSettlementDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirm Settlement
        </DialogTitle>
        <DialogContent>
          {settlementDialog.data && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                You are about to settle {settlementDialog.data.invoices.length} invoices for a total of ${settlementDialog.data.totalAmount.toFixed(2)}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={settlementForm.paymentMethod}
                      onChange={(e) => handleSettlementFormChange('paymentMethod', e.target.value)}
                      label="Payment Method"
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.id} value={method.id}>
                          {method.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Settlement Date"
                    type="date"
                    value={settlementForm.settlementDate}
                    onChange={(e) => handleSettlementFormChange('settlementDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Reference Number"
                    value={settlementForm.referenceNumber}
                    onChange={(e) => handleSettlementFormChange('referenceNumber', e.target.value)}
                    placeholder="e.g., SET-2024-001"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Settlement Notes"
                    multiline
                    rows={3}
                    value={settlementForm.notes}
                    onChange={(e) => handleSettlementFormChange('notes', e.target.value)}
                    placeholder="Add any notes about this settlement..."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Selected Invoices
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settlementDialog.data.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {invoice.issuedAt?.toDate ? 
                            invoice.issuedAt.toDate().toLocaleDateString() : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>${(invoice.total || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.paymentStatus || 'unknown'}
                            color={getStatusColor(invoice.paymentStatus)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettlementDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmSettlement}
            variant="contained"
            disabled={loading || !settlementForm.paymentMethod}
            startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {loading ? 'Processing...' : 'Confirm Settlement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CorporateSettlementPage;
