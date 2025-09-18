import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, where, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { 
  getPaymentStatusColor, 
  getPaymentStatusLabel, 
  formatDate, 
  getDaysUntilDue,
  canBeUsedForSettlement
} from '../../utils/paymentCalculations';
import { 
  isInvoiceOverdue, 
  getOverdueStatus, 
  batchUpdateOverdueStatuses 
} from '../../utils/overdueDetection';

const PendingPaymentsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]); // For debugging
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [settlementDialog, setSettlementDialog] = useState({ open: false, invoice: null });
  const [selectedSettlementMethod, setSelectedSettlementMethod] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [settlementLocation, setSettlementLocation] = useState('vault');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [confirmSettlement, setConfirmSettlement] = useState(false);
  const [settlingInvoice, setSettlingInvoice] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [updatingOverdue, setUpdatingOverdue] = useState(false);

  // Load pending invoices and payment methods
  useEffect(() => {
    console.log('🔍 PendingPaymentsPage: Loading pending invoices...');
    
    // First, let's check all invoices to see what payment statuses exist
    const unsubscribeAllInvoices = onSnapshot(
      query(collection(db, 'invoices'), orderBy('issuedAt', 'desc')),
      (snapshot) => {
        const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔍 PendingPaymentsPage: All invoices found:', allData.length);
        console.log('🔍 PendingPaymentsPage: Payment statuses:', allData.map(inv => ({ 
          id: inv.id, 
          invoiceNumber: inv.invoiceNumber, 
          paymentStatus: inv.paymentStatus,
          dueDate: inv.dueDate,
          dueDateType: typeof inv.dueDate,
          dueDateValue: inv.dueDate?.toDate ? inv.dueDate.toDate() : inv.dueDate
        })));
        
        // Store all invoices for debugging
        setAllInvoices(allData);
        
        // Filter for pending/overdue invoices
        const pendingInvoices = allData.filter(invoice => 
          invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'overdue'
        );
        console.log('🔍 PendingPaymentsPage: Pending invoices:', pendingInvoices.length);
        setInvoices(pendingInvoices);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading all invoices:', error);
        setLoading(false);
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

    // Load bank accounts
    const unsubscribeBankAccounts = onSnapshot(
      query(collection(db, 'bankAccounts'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBankAccounts(data);
      },
      (error) => {
        console.error('Error loading bank accounts:', error);
      }
    );

    return () => {
      unsubscribeAllInvoices();
      unsubscribePaymentMethods();
      unsubscribeBankAccounts();
    };
  }, []);

  // Helper functions
  const getCustomerName = (invoice) => {
    if (invoice.customerType === 'corporate' && invoice.customer?.companyName) {
      return invoice.customer.companyName;
    } else if (invoice.customerType === 'individual') {
      const firstName = invoice.customer?.firstName || '';
      const lastName = invoice.customer?.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown Customer';
    }
    return 'Unknown Customer';
  };

  const getVehicleInfo = (invoice) => {
    if (invoice.vehicle?.year && invoice.vehicle?.make && invoice.vehicle?.model) {
      return `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`;
    }
    return 'Vehicle info not available';
  };

  const calculateTotal = (invoice) => {
    if (invoice.total !== undefined && invoice.total !== null) {
      return Number(invoice.total) || 0;
    }
    
    const servicesTotal = (invoice.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (invoice.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    const subtotal = servicesTotal + bundlesTotal;
    const taxAmount = Number(invoice.taxAmount) || 0;
    
    return subtotal + taxAmount;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon sx={{ color: 'warning.main' }} />;
      case 'overdue':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      case 'paid':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      default:
        return <PaymentIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getDaysUntilDueText = (dueDate) => {
    if (!dueDate) return 'No due date';
    
    const days = getDaysUntilDue(dueDate);
    if (days === null || isNaN(days)) return 'Invalid date';
    
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else {
      return `${days} days remaining`;
    }
  };

  const getDaysUntilDueColor = (dueDate) => {
    if (!dueDate) return 'info';
    
    const days = getDaysUntilDue(dueDate);
    if (days === null || isNaN(days)) return 'info';
    
    if (days < 0) return 'error';
    if (days === 0) return 'warning';
    if (days <= 3) return 'warning';
    return 'success';
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(invoice).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(invoice).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (invoice.paymentStatus || 'pending') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('pending');
  };

  // Settlement functions
  const handleOpenSettlementDialog = (invoice) => {
    setSettlementDialog({ open: true, invoice });
    setSelectedSettlementMethod('');
    setSettlementNotes('');
    setConfirmSettlement(false);
  };

  const handleCloseSettlementDialog = () => {
    setSettlementDialog({ open: false, invoice: null });
    setSelectedSettlementMethod('');
    setSettlementNotes('');
    setSettlementLocation('vault');
    setSelectedBankAccount('');
    setConfirmSettlement(false);
    setSettlingInvoice(false);
  };

  const handleSettleInvoice = async () => {
    if (!settlementDialog.invoice || !selectedSettlementMethod) return;

    setSettlingInvoice(true);

    try {
      const settlementMethodDetails = paymentMethods.find(method => method.id === selectedSettlementMethod);
      
      await updateDoc(doc(db, 'invoices', settlementDialog.invoice.id), {
        paymentStatus: 'settled',
        settlementMethod: selectedSettlementMethod,
        settlementMethodDetails: settlementMethodDetails,
        settlementNotes: settlementNotes.trim() || null,
        settledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add settlement to vault
      try {
        const vaultEntry = {
          type: 'settlement',
          amount: calculateTotal(settlementDialog.invoice),
          description: `Settlement for invoice ${settlementDialog.invoice.invoiceNumber}`,
          paymentMethod: selectedSettlementMethod,
          paymentMethodDetails: settlementMethodDetails,
          invoiceId: settlementDialog.invoice.id,
          invoiceNumber: settlementDialog.invoice.invoiceNumber,
          customerName: getCustomerName(settlementDialog.invoice),
          settlementNotes: settlementNotes.trim() || null,
          location: settlementLocation,
          bankAccountId: settlementLocation === 'bank' ? selectedBankAccount : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'vaultEntries'), vaultEntry);
        console.log('✅ Vault entry added for settlement');
      } catch (vaultError) {
        console.error('❌ Error adding vault entry for settlement:', vaultError);
        // Don't fail the settlement if vault entry fails
      }

      console.log('✅ Invoice settled successfully:', settlementDialog.invoice.invoiceNumber);
      setShowSuccessAlert(true);
      handleCloseSettlementDialog();
      
      // Hide success alert after 3 seconds
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error) {
      console.error('❌ Error settling invoice:', error);
      alert('Error settling invoice. Please try again.');
    } finally {
      setSettlingInvoice(false);
    }
  };

  const handleConfirmSettlement = () => {
    if (!selectedSettlementMethod) {
      alert('Please select a settlement method');
      return;
    }
    if (settlementLocation === 'bank' && !selectedBankAccount) {
      alert('Please select a bank account');
      return;
    }
    setConfirmSettlement(true);
  };

  const handleUpdateOverdueStatuses = async () => {
    try {
      setUpdatingOverdue(true);
      const results = await batchUpdateOverdueStatuses();
      
      console.log('✅ Overdue update completed:', results);
      
      // Show success message
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
    } catch (error) {
      console.error('❌ Error updating overdue statuses:', error);
      alert('Error updating overdue statuses. Please try again.');
    } finally {
      setUpdatingOverdue(false);
    }
  };

  // Get available settlement methods (only immediate cash methods)
  const getAvailableSettlementMethods = () => {
    return paymentMethods.filter(method => canBeUsedForSettlement(method));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AccountBalanceIcon sx={{ mr: 2, color: 'warning.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Pending Payments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredInvoices.length} of {invoices.length} pending invoices
            {statusFilter !== 'all' && (
              <span> (filtered by: {statusFilter} payments)</span>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by invoice number, customer, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="warning"
              onClick={handleUpdateOverdueStatuses}
              startIcon={updatingOverdue ? <CircularProgress size={20} /> : <WarningIcon />}
              disabled={updatingOverdue}
              fullWidth
            >
              {updatingOverdue ? 'Updating...' : 'Update Overdue'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Debug Info */}
      {invoices.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Debug Info:</strong> No pending invoices found. 
            Check browser console for detailed logs.
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => window.open('/issued-invoices', '_blank')}
            sx={{ mt: 1 }}
          >
            Check Issued Invoices Page
          </Button>
        </Alert>
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowSuccessAlert(false)}>
          <Typography variant="body2">
            <strong>Success!</strong> Invoice has been settled successfully.
          </Typography>
        </Alert>
      )}

      {/* Debug: Show all invoices */}
      {allInvoices.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Debug:</strong> Found {allInvoices.length} total invoices in database:
          </Typography>
          {allInvoices.map((invoice, index) => (
            <Typography key={invoice.id} variant="caption" display="block">
              {index + 1}. {invoice.invoiceNumber || 'No Invoice #'} - Status: {invoice.paymentStatus || 'No Status'} - Due: {invoice.dueDate ? formatDate(invoice.dueDate) : 'No Due Date'} 
              {invoice.dueDate && (
                <span> (Raw: {JSON.stringify(invoice.dueDate)})</span>
              )}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No pending payments found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'All invoices are paid or no invoices exist'
            }
          </Typography>
          {invoices.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Found {invoices.length} invoices in database, but none match pending/overdue status
            </Typography>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 500 }} size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Invoice #</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vehicle</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const total = (Number(calculateTotal(invoice)) || 0).toFixed(2);
                const daysUntilDue = getDaysUntilDueText(invoice.dueDate);
                const daysColor = getDaysUntilDueColor(invoice.dueDate);
                
                // Debug due date
                console.log('🔍 Invoice due date debug:', {
                  invoiceNumber: invoice.invoiceNumber,
                  dueDate: invoice.dueDate,
                  dueDateType: typeof invoice.dueDate,
                  dueDateValue: invoice.dueDate?.toDate ? invoice.dueDate.toDate() : invoice.dueDate,
                  daysUntilDue: daysUntilDue,
                  daysColor: daysColor
                });

                return (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {invoice.invoiceNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getCustomerName(invoice)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.customerType === 'corporate' ? 'Corporate' : 'Individual'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getVehicleInfo(invoice)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        ${total}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(invoice.paymentStatus || 'pending')}
                        label={getPaymentStatusLabel(invoice.paymentStatus || 'pending')}
                        color={getPaymentStatusColor(invoice.paymentStatus || 'pending')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={`${daysColor}.main`}>
                        {formatDate(invoice.dueDate)}
                      </Typography>
                      <Typography variant="caption" color={`${daysColor}.main`}>
                        {daysUntilDue}
                      </Typography>
                      {/* Debug info */}
                      {!invoice.dueDate && (
                        <Typography variant="caption" color="error" display="block">
                          No due date set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Settle Payment">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenSettlementDialog(invoice)}
                          disabled={getAvailableSettlementMethods().length === 0}
                        >
                          Settle
                        </Button>
                      </Tooltip>
                      {getAvailableSettlementMethods().length === 0 && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          No settlement methods
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Enhanced Settlement Dialog */}
      <Dialog 
        open={settlementDialog.open} 
        onClose={handleCloseSettlementDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">
              Settle Payment - {settlementDialog.invoice?.invoiceNumber}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {settlementDialog.invoice && (
            <Box>
              {/* Invoice Summary */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Invoice Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Customer:</strong> {getCustomerName(settlementDialog.invoice)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Type:</strong> {settlementDialog.invoice.customerType === 'corporate' ? 'Corporate' : 'Individual'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Amount:</strong> ${calculateTotal(settlementDialog.invoice).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Due Date:</strong> {formatDate(settlementDialog.invoice.dueDate)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Settlement Method Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Settlement Method *</InputLabel>
                <Select
                  value={selectedSettlementMethod}
                  onChange={(e) => setSelectedSettlementMethod(e.target.value)}
                  label="Settlement Method *"
                  error={!selectedSettlementMethod && confirmSettlement}
                >
                  {getAvailableSettlementMethods().map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{method.name}</Typography>
                        {method.isImmediateCash && <Typography>💰</Typography>}
                        <Typography variant="caption" color="text.secondary">
                          ({method.type})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {!selectedSettlementMethod && confirmSettlement && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    Please select a settlement method
                  </Typography>
                )}
              </FormControl>

              {/* Location Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Money Location *</InputLabel>
                <Select
                  value={settlementLocation}
                  onChange={(e) => {
                    setSettlementLocation(e.target.value);
                    if (e.target.value === 'vault') {
                      setSelectedBankAccount('');
                    }
                  }}
                  label="Money Location *"
                >
                  <MenuItem value="vault">Vault (Cash)</MenuItem>
                  <MenuItem value="bank">Bank Account</MenuItem>
                </Select>
              </FormControl>

              {/* Bank Account Selection */}
              {settlementLocation === 'bank' && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Bank Account *</InputLabel>
                  <Select
                    value={selectedBankAccount}
                    onChange={(e) => setSelectedBankAccount(e.target.value)}
                    label="Bank Account *"
                    error={!selectedBankAccount && confirmSettlement}
                  >
                    <MenuItem value="">Select Bank Account</MenuItem>
                    {bankAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} - {account.bankName}
                      </MenuItem>
                    ))}
                  </Select>
                  {!selectedBankAccount && confirmSettlement && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      Please select a bank account
                    </Typography>
                  )}
                </FormControl>
              )}

              {/* Settlement Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Settlement Notes (Optional)"
                placeholder="Add any notes about this settlement..."
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Available Methods Info */}
              {getAvailableSettlementMethods().length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>No settlement methods available.</strong> You need to create payment methods 
                    marked as "Immediate Cash" to settle invoices.
                  </Typography>
                </Alert>
              )}

              {/* Settlement Method Info */}
              {selectedSettlementMethod && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Settlement Method:</strong> {paymentMethods.find(m => m.id === selectedSettlementMethod)?.name}
                    <br />
                    <strong>Type:</strong> {paymentMethods.find(m => m.id === selectedSettlementMethod)?.type}
                    <br />
                    <strong>Note:</strong> This will mark the invoice as settled and update the payment status.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseSettlementDialog}
            disabled={settlingInvoice}
          >
            Cancel
          </Button>
          {!confirmSettlement ? (
            <Button 
              onClick={handleConfirmSettlement}
              variant="contained"
              color="primary"
              disabled={!selectedSettlementMethod || getAvailableSettlementMethods().length === 0 || (settlementLocation === 'bank' && !selectedBankAccount)}
            >
              Continue to Confirmation
            </Button>
          ) : (
            <Button 
              onClick={handleSettleInvoice}
              variant="contained"
              color="success"
              disabled={settlingInvoice || !selectedSettlementMethod}
              startIcon={settlingInvoice ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {settlingInvoice ? 'Settling...' : 'Confirm Settlement'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingPaymentsPage;
