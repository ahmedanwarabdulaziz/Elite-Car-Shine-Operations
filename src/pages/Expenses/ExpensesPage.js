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
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Upload as UploadIcon,
  Repeat as RepeatIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatDate } from '../../utils/paymentCalculations';

const ExpensesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addExpenseDialog, setAddExpenseDialog] = useState({ open: false });
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    description: '',
    amount: '',
    vendor: '',
    paymentMethod: 'cash',
    location: 'vault',
    bankAccountId: '',
    receiptReference: '',
    receiptFile: null,
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringEndDate: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load expenses and related data
  useEffect(() => {
    console.log('🔍 ExpensesPage: Loading expenses data...');
    
    // Load expenses
    const unsubscribeExpenses = onSnapshot(
      query(collection(db, 'expenses'), orderBy('date', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔍 ExpensesPage: Expenses loaded:', data.length);
        console.log('🔍 ExpensesPage: Sample expense:', data[0]);
        setExpenses(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading expenses:', error);
        setLoading(false);
      }
    );

    // Load expense categories
    const unsubscribeCategories = onSnapshot(
      query(collection(db, 'expenseCategories'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔍 ExpensesPage: Expense categories loaded:', data.length);
        setExpenseCategories(data);
      },
      (error) => {
        console.error('Error loading expense categories:', error);
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
      unsubscribeExpenses();
      unsubscribeCategories();
      unsubscribeBankAccounts();
    };
  }, []);

  // Helper functions
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'No Category';
    const category = expenseCategories.find(cat => cat.id === categoryId);
    console.log('🔍 getCategoryName:', { categoryId, category, expenseCategories: expenseCategories.length });
    return category ? category.name : 'Unknown Category';
  };

  const getCategoryColor = (categoryId) => {
    if (!categoryId) return '#1976d2';
    const category = expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.color : '#1976d2';
  };

  const getBankAccountName = (bankAccountId) => {
    const account = bankAccounts.find(acc => acc.id === bankAccountId);
    return account ? account.name : 'Unknown Account';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'paid':
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
      case 'paid':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <MoneyIcon sx={{ color: 'success.main' }} />;
      case 'bank_transfer':
        return <PaymentIcon sx={{ color: 'primary.main' }} />;
      case 'credit_card':
        return <PaymentIcon sx={{ color: 'info.main' }} />;
      default:
        return <MoneyIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const pendingExpenses = expenses
      .filter(expense => expense.status === 'pending')
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const paidExpenses = expenses
      .filter(expense => expense.status === 'paid')
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    
    return { totalExpenses, pendingExpenses, paidExpenses };
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.receiptReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || expense.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  // Add expense functions
  const handleOpenAddDialog = () => {
    setAddExpenseDialog({ open: true });
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      description: '',
      amount: '',
      vendor: '',
      paymentMethod: 'cash',
      location: 'vault',
      bankAccountId: '',
      receiptReference: '',
      receiptFile: null,
      isRecurring: false,
      recurringFrequency: 'monthly',
      recurringEndDate: '',
      notes: ''
    });
  };

  const handleCloseAddDialog = () => {
    setAddExpenseDialog({ open: false });
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      description: '',
      amount: '',
      vendor: '',
      paymentMethod: 'cash',
      location: 'vault',
      bankAccountId: '',
      receiptReference: '',
      receiptFile: null,
      isRecurring: false,
      recurringFrequency: 'monthly',
      recurringEndDate: '',
      notes: ''
    });
    setSubmitting(false);
  };

  const handleAddExpense = async () => {
    if (!newExpense.categoryId || !newExpense.description || !newExpense.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (newExpense.location === 'bank' && !newExpense.bankAccountId) {
      alert('Please select a bank account');
      return;
    }

    setSubmitting(true);

    try {
      const expenseData = {
        date: new Date(newExpense.date),
        categoryId: newExpense.categoryId,
        description: newExpense.description.trim(),
        amount: Number(newExpense.amount),
        vendor: newExpense.vendor.trim() || null,
        paymentMethod: newExpense.paymentMethod,
        location: newExpense.location,
        bankAccountId: newExpense.bankAccountId || null,
        receiptReference: newExpense.receiptReference.trim() || null,
        isRecurring: newExpense.isRecurring,
        recurringFrequency: newExpense.isRecurring ? newExpense.recurringFrequency : null,
        recurringEndDate: newExpense.isRecurring && newExpense.recurringEndDate ? new Date(newExpense.recurringEndDate) : null,
        notes: newExpense.notes.trim() || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      console.log('✅ Expense added successfully');
      handleCloseAddDialog();
    } catch (error) {
      console.error('❌ Error adding expense:', error);
      alert('Error adding expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayExpense = async (expense) => {
    if (window.confirm(`Mark "${expense.description}" as paid? This will deduct ${expense.amount} from your ${expense.location === 'vault' ? 'vault' : 'bank account'}.`)) {
      try {
        // Update expense status
        await updateDoc(doc(db, 'expenses', expense.id), {
          status: 'paid',
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Create vault entry for expense payment
        const vaultEntry = {
          type: 'expense',
          amount: -Number(expense.amount), // Negative amount for expense
          description: `Expense payment: ${expense.description}`,
          location: expense.location,
          bankAccountId: expense.bankAccountId,
          expenseId: expense.id,
          vendor: expense.vendor,
          categoryId: expense.categoryId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'vaultEntries'), vaultEntry);
        console.log('✅ Expense marked as paid and vault entry created');
      } catch (error) {
        console.error('❌ Error paying expense:', error);
        alert('Error paying expense. Please try again.');
      }
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      try {
        await deleteDoc(doc(db, 'expenses', expense.id));
        console.log('✅ Expense deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting expense:', error);
        alert('Error deleting expense. Please try again.');
      }
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
        <ReceiptIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Expenses Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage business expenses
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  ${totals.totalExpenses.toFixed(2)}
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
                <TrendingUpIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="warning.main">
                  ${totals.pendingExpenses.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pending Payment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  ${totals.paidExpenses.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Paid Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RepeatIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" color="info.main">
                  {expenses.filter(e => e.isRecurring).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Recurring Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search expenses..."
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
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {expenseCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={handleOpenAddDialog}
              startIcon={<AddIcon />}
              fullWidth
            >
              Add Expense
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No expenses found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Expenses will appear here when you add them'
            }
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 500 }} size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vendor</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Payment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(expense.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoryName(expense.categoryId)}
                      sx={{ 
                        backgroundColor: getCategoryColor(expense.categoryId),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {expense.description}
                    </Typography>
                    {expense.isRecurring && (
                      <Chip
                        icon={<RepeatIcon />}
                        label="Recurring"
                        size="small"
                        color="info"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {expense.vendor || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="error" fontWeight="bold">
                      ${Number(expense.amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPaymentMethodIcon(expense.paymentMethod)}
                      <Typography variant="body2">
                        {expense.paymentMethod.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>
                    {expense.location === 'bank' && expense.bankAccountId && (
                      <Typography variant="caption" color="text.secondary">
                        {getBankAccountName(expense.bankAccountId)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(expense.status)}
                      color={getStatusColor(expense.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {expense.status === 'pending' && (
                        <Tooltip title="Mark as Paid">
                          <IconButton
                            size="small"
                            onClick={() => handlePayExpense(expense)}
                            color="success"
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Expense">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(expense)}
                          color="error"
                        >
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
      )}

      {/* Add Expense Dialog */}
      <Dialog 
        open={addExpenseDialog.open} 
        onClose={handleCloseAddDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">Add Expense</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={newExpense.categoryId}
                  onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                  label="Category *"
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {expenseCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: category.color
                          }}
                        />
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Describe this expense..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount *"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                placeholder="Who was paid?"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Location</InputLabel>
                <Select
                  value={newExpense.location}
                  onChange={(e) => setNewExpense({ ...newExpense, location: e.target.value, bankAccountId: e.target.value === 'vault' ? '' : newExpense.bankAccountId })}
                  label="Payment Location"
                >
                  <MenuItem value="vault">Vault (Cash)</MenuItem>
                  <MenuItem value="bank">Bank Account</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {newExpense.location === 'bank' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Bank Account</InputLabel>
                  <Select
                    value={newExpense.bankAccountId}
                    onChange={(e) => setNewExpense({ ...newExpense, bankAccountId: e.target.value })}
                    label="Bank Account"
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
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Receipt Reference"
                value={newExpense.receiptReference}
                onChange={(e) => setNewExpense({ ...newExpense, receiptReference: e.target.value })}
                placeholder="Receipt number, invoice #, etc."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ height: '56px' }}
              >
                Upload Receipt
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newExpense.isRecurring}
                    onChange={(e) => setNewExpense({ ...newExpense, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Expense"
              />
            </Grid>
            
            {newExpense.isRecurring && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={newExpense.recurringFrequency}
                      onChange={(e) => setNewExpense({ ...newExpense, recurringFrequency: e.target.value })}
                      label="Frequency"
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date (Optional)"
                    type="date"
                    value={newExpense.recurringEndDate}
                    onChange={(e) => setNewExpense({ ...newExpense, recurringEndDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                placeholder="Additional notes about this expense..."
              />
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
            onClick={handleAddExpense}
            variant="contained"
            color="primary"
            disabled={!newExpense.categoryId || !newExpense.description || !newExpense.amount || (newExpense.location === 'bank' && !newExpense.bankAccountId) || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {submitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage;
