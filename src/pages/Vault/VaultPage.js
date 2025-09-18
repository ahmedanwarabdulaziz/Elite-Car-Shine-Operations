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
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  AccountBalance as VaultIcon,
  AttachMoney as CashIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as BankIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  formatDate, 
  getPaymentStatusColor, 
  getPaymentStatusLabel 
} from '../../utils/paymentCalculations';

const VaultPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [vaultEntries, setVaultEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [addEntryDialog, setAddEntryDialog] = useState({ open: false });
  const [depositDialog, setDepositDialog] = useState({ open: false });
  const [newEntry, setNewEntry] = useState({
    type: 'cash_received',
    amount: '',
    description: '',
    paymentMethod: '',
    invoiceId: '',
    location: 'vault',
    bankAccountId: ''
  });
  const [depositData, setDepositData] = useState({
    amount: '',
    bankAccountId: '',
    description: '',
    depositReference: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load vault entries and related data
  useEffect(() => {
    console.log('🔍 VaultPage: Loading vault data...');
    
    // Load vault entries
    const unsubscribeVault = onSnapshot(
      query(collection(db, 'vaultEntries'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔍 VaultPage: Vault entries loaded:', data.length);
        console.log('🔍 VaultPage: Sample vault entries:', data.slice(0, 3));
        setVaultEntries(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading vault entries:', error);
        setLoading(false);
      }
    );

    // Load invoices for reference
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

    // Load payment methods
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

    // Load expense categories
    const unsubscribeExpenseCategories = onSnapshot(
      query(collection(db, 'expenseCategories'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenseCategories(data);
      },
      (error) => {
        console.error('Error loading expense categories:', error);
      }
    );

    return () => {
      unsubscribeVault();
      unsubscribeInvoices();
      unsubscribePaymentMethods();
      unsubscribeBankAccounts();
      unsubscribeExpenseCategories();
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

  const getEntryTypeIcon = (type) => {
    switch (type) {
      case 'cash_received':
        return <CashIcon sx={{ color: 'success.main' }} />;
      case 'settlement':
        return <PaymentIcon sx={{ color: 'primary.main' }} />;
      case 'manual_entry':
        return <AddIcon sx={{ color: 'info.main' }} />;
      case 'deposit':
        return <BankIcon sx={{ color: 'warning.main' }} />;
      case 'expense':
        return <ReceiptIcon sx={{ color: 'error.main' }} />;
      default:
        return <VaultIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getEntryTypeColor = (type) => {
    switch (type) {
      case 'cash_received':
        return 'success';
      case 'settlement':
        return 'primary';
      case 'manual_entry':
        return 'info';
      case 'deposit':
        return 'warning';
      case 'expense':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEntryTypeLabel = (type) => {
    switch (type) {
      case 'cash_received':
        return 'Cash Received';
      case 'settlement':
        return 'Settlement';
      case 'manual_entry':
        return 'Manual Entry';
      case 'deposit':
        return 'Deposit';
      case 'expense':
        return 'Expense Payment';
      default:
        return 'Unknown';
    }
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'vault':
        return <VaultIcon sx={{ color: 'warning.main' }} />;
      case 'bank':
        return <BankIcon sx={{ color: 'primary.main' }} />;
      default:
        return <LocationIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getLocationColor = (location) => {
    switch (location) {
      case 'vault':
        return 'warning';
      case 'bank':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getLocationLabel = (location) => {
    switch (location) {
      case 'vault':
        return 'Vault (Cash)';
      case 'bank':
        return 'Bank Account';
      default:
        return 'Unknown';
    }
  };

  const getBankAccountName = (bankAccountId) => {
    const account = bankAccounts.find(acc => acc.id === bankAccountId);
    return account ? account.name : 'Unknown Account';
  };

  const getExpenseCategoryName = (categoryId) => {
    if (!categoryId) return 'No Category';
    const category = expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getExpenseCategoryColor = (categoryId) => {
    if (!categoryId) return '#1976d2';
    const category = expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.color : '#1976d2';
  };

  // Calculate totals
  const calculateTotals = () => {
    console.log('🔍 VaultPage: All vault entries:', vaultEntries);
    
    // Cash in vault (entries with location 'vault' OR no location field for backward compatibility)
    const cashInVault = vaultEntries
      .filter(entry => entry.location === 'vault' || !entry.location)
      .reduce((sum, entry) => {
        const amount = Number(entry.amount) || 0;
        console.log('🔍 Cash entry:', { type: entry.type, amount, location: entry.location });
        return sum + amount;
      }, 0);
    
    // Money in bank accounts (entries with location 'bank')
    const moneyInBank = vaultEntries
      .filter(entry => entry.location === 'bank')
      .reduce((sum, entry) => {
        const amount = Number(entry.amount) || 0;
        console.log('🔍 Bank entry:', { type: entry.type, amount, location: entry.location });
        return sum + amount;
      }, 0);
    
    // Expenses (all expense entries, regardless of location) - for display purposes
    const expenses = vaultEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount) || 0), 0);
    
    // Total Assets = (Cash in Vault + Money in Bank) - Total Expenses
    const total = (cashInVault + moneyInBank) - expenses;
    
    console.log('🔍 VaultPage: Calculate totals:', {
      vaultEntries: vaultEntries.length,
      cashInVault,
      moneyInBank,
      expenses,
      total,
      calculation: `${cashInVault} + ${moneyInBank} - ${expenses} = ${total}`,
      sampleEntries: vaultEntries.slice(0, 3),
      explanation: 'Total = (Cash in Vault + Money in Bank) - Total Expenses'
    });
    
    return { 
      cashInVault, 
      moneyInBank, 
      expenses,
      total 
    };
  };

  // Filter entries
  const filteredEntries = vaultEntries.filter(entry => {
    const matchesSearch = 
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  // Add entry functions
  const handleOpenAddDialog = () => {
    setAddEntryDialog({ open: true });
    setNewEntry({
      type: 'manual_entry',
      amount: '',
      description: '',
      paymentMethod: '',
      invoiceId: '',
      location: 'vault',
      bankAccountId: ''
    });
  };

  const handleCloseAddDialog = () => {
    setAddEntryDialog({ open: false });
    setNewEntry({
      type: 'manual_entry',
      amount: '',
      description: '',
      paymentMethod: '',
      invoiceId: '',
      location: 'vault',
      bankAccountId: ''
    });
    setSubmitting(false);
  };

  const handleAddEntry = async () => {
    if (!newEntry.amount || !newEntry.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (newEntry.location === 'bank' && !newEntry.bankAccountId) {
      alert('Please select a bank account');
      return;
    }

    setSubmitting(true);

    try {
      const entryData = {
        type: newEntry.type,
        amount: Number(newEntry.amount),
        description: newEntry.description.trim(),
        paymentMethod: newEntry.paymentMethod || null,
        invoiceId: newEntry.invoiceId || null,
        location: newEntry.location || 'vault',
        bankAccountId: newEntry.bankAccountId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add invoice reference if provided
      if (newEntry.invoiceId) {
        const invoice = invoices.find(inv => inv.id === newEntry.invoiceId);
        if (invoice) {
          entryData.invoiceNumber = invoice.invoiceNumber;
          entryData.customerName = getCustomerName(invoice);
        }
      }

      await addDoc(collection(db, 'vaultEntries'), entryData);
      console.log('✅ Vault entry added successfully');
      handleCloseAddDialog();
    } catch (error) {
      console.error('❌ Error adding vault entry:', error);
      alert('Error adding vault entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Deposit functions
  const handleOpenDepositDialog = () => {
    setDepositDialog({ open: true });
    setDepositData({
      amount: '',
      bankAccountId: '',
      description: '',
      depositReference: ''
    });
  };

  const handleCloseDepositDialog = () => {
    setDepositDialog({ open: false });
    setDepositData({
      amount: '',
      bankAccountId: '',
      description: '',
      depositReference: ''
    });
    setSubmitting(false);
  };

  const handleDepositToBank = async () => {
    if (!depositData.amount || !depositData.bankAccountId || !depositData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const depositAmount = Number(depositData.amount);
    if (depositAmount <= 0) {
      alert('Deposit amount must be greater than 0');
      return;
    }

    // Check if there's enough cash in vault
    if (depositAmount > totals.cashInVault) {
      alert(`Insufficient cash in vault. Available: $${totals.cashInVault.toFixed(2)}`);
      return;
    }

    setSubmitting(true);

    try {
      const bankAccount = bankAccounts.find(acc => acc.id === depositData.bankAccountId);
      
      // Create two vault entries: one negative (reducing vault) and one positive (increasing bank)
      const vaultReductionEntry = {
        type: 'deposit',
        amount: -depositAmount, // Negative amount to reduce vault
        description: `Deposit to ${bankAccount?.name || 'Bank Account'}: ${depositData.description}`,
        location: 'vault',
        bankAccountId: null,
        depositReference: depositData.depositReference.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const bankIncreaseEntry = {
        type: 'deposit',
        amount: depositAmount, // Positive amount to increase bank
        description: `Deposit from vault: ${depositData.description}`,
        location: 'bank',
        bankAccountId: depositData.bankAccountId,
        depositReference: depositData.depositReference.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add both entries
      await addDoc(collection(db, 'vaultEntries'), vaultReductionEntry);
      await addDoc(collection(db, 'vaultEntries'), bankIncreaseEntry);
      
      console.log('✅ Deposit to bank completed successfully');
      handleCloseDepositDialog();
    } catch (error) {
      console.error('❌ Error processing deposit:', error);
      alert('Error processing deposit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

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
        <VaultIcon sx={{ mr: 2, color: 'success.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Vault Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track cash received and settled payments
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VaultIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="warning.main">
                  ${totals.cashInVault.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Cash in Vault
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BankIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  ${totals.moneyInBank.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Money in Bank
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6" color="error.main">
                  ${totals.expenses.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" color="info.main">
                  ${totals.total.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Assets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search entries..."
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
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="cash_received">Cash Received</MenuItem>
                <MenuItem value="settlement">Settlements</MenuItem>
                <MenuItem value="manual_entry">Manual Entries</MenuItem>
                <MenuItem value="deposit">Deposits</MenuItem>
                <MenuItem value="expense">Expense Payments</MenuItem>
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
              onClick={handleOpenAddDialog}
              startIcon={<AddIcon />}
              fullWidth
            >
              Add Manual Entry
            </Button>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={handleOpenDepositDialog}
              startIcon={<BankIcon />}
              fullWidth
              disabled={totals.cashInVault <= 0}
            >
              Deposit to Bank
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Vault Entries Table */}
      {filteredEntries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <VaultIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No vault entries found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Vault entries will appear here when cash is received or payments are settled'
            }
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 500 }} size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Invoice</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Customer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow 
                  key={entry.id} 
                  hover
                  sx={{
                    backgroundColor: entry.type === 'expense' ? 'rgba(244, 67, 54, 0.08)' : 'inherit',
                    '&:hover': {
                      backgroundColor: entry.type === 'expense' 
                        ? 'rgba(244, 67, 54, 0.12)' 
                        : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(entry.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.type === 'expense' ? (
                      <Chip
                        icon={getEntryTypeIcon(entry.type)}
                        label={getExpenseCategoryName(entry.categoryId)}
                        sx={{ 
                          backgroundColor: getExpenseCategoryColor(entry.categoryId),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={getEntryTypeIcon(entry.type)}
                        label={getEntryTypeLabel(entry.type)}
                        color={getEntryTypeColor(entry.type)}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getLocationIcon(entry.location || 'vault')}
                      label={entry.location === 'bank' && entry.bankAccountId 
                        ? getBankAccountName(entry.bankAccountId)
                        : getLocationLabel(entry.location || 'vault')
                      }
                      color={getLocationColor(entry.location || 'vault')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                      ${Number(entry.amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.invoiceNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.customerName || 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Entry Dialog */}
      <Dialog 
        open={addEntryDialog.open} 
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">Add Manual Vault Entry</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Entry Type</InputLabel>
                <Select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  label="Entry Type"
                >
                  <MenuItem value="manual_entry">Manual Entry</MenuItem>
                  <MenuItem value="cash_received">Cash Received</MenuItem>
                  <MenuItem value="settlement">Settlement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount *"
                type="number"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Describe this vault entry..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method (Optional)</InputLabel>
                <Select
                  value={newEntry.paymentMethod}
                  onChange={(e) => setNewEntry({ ...newEntry, paymentMethod: e.target.value })}
                  label="Payment Method (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {method.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Location *</InputLabel>
                <Select
                  value={newEntry.location}
                  onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value, bankAccountId: e.target.value === 'vault' ? '' : newEntry.bankAccountId })}
                  label="Location *"
                >
                  <MenuItem value="vault">Vault (Cash)</MenuItem>
                  <MenuItem value="bank">Bank Account</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {newEntry.location === 'bank' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Bank Account *</InputLabel>
                  <Select
                    value={newEntry.bankAccountId}
                    onChange={(e) => setNewEntry({ ...newEntry, bankAccountId: e.target.value })}
                    label="Bank Account *"
                  >
                    <MenuItem value="">Select Bank Account</MenuItem>
                    {bankAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} - {account.bankName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Invoice (Optional)</InputLabel>
                <Select
                  value={newEntry.invoiceId}
                  onChange={(e) => setNewEntry({ ...newEntry, invoiceId: e.target.value })}
                  label="Invoice (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {invoices.map((invoice) => (
                    <MenuItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {getCustomerName(invoice)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseAddDialog}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddEntry}
            variant="contained"
            color="primary"
            disabled={!newEntry.amount || !newEntry.description || (newEntry.location === 'bank' && !newEntry.bankAccountId) || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {submitting ? 'Adding...' : 'Add Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deposit to Bank Dialog */}
      <Dialog 
        open={depositDialog.open} 
        onClose={handleCloseDepositDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BankIcon color="primary" />
            <Typography variant="h6">Deposit to Bank</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount *"
                type="number"
                value={depositData.amount}
                onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText={`Available in vault: $${totals.cashInVault.toFixed(2)}`}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Bank Account *</InputLabel>
                <Select
                  value={depositData.bankAccountId}
                  onChange={(e) => setDepositData({ ...depositData, bankAccountId: e.target.value })}
                  label="Bank Account *"
                >
                  <MenuItem value="">Select Bank Account</MenuItem>
                  {bankAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} - {account.bankName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={depositData.description}
                onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                placeholder="Describe this deposit..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deposit Reference (Optional)"
                value={depositData.depositReference}
                onChange={(e) => setDepositData({ ...depositData, depositReference: e.target.value })}
                placeholder="e.g., Deposit slip number, transaction ID"
                helperText="Reference number for tracking this deposit"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDepositDialog}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDepositToBank}
            variant="contained"
            color="primary"
            disabled={!depositData.amount || !depositData.bankAccountId || !depositData.description || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <BankIcon />}
          >
            {submitting ? 'Processing...' : 'Deposit to Bank'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VaultPage;
