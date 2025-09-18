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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const BankAccountsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', account: null });
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    bankName: '',
    accountType: 'checking',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load bank accounts
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'bankAccounts'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBankAccounts(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading bank accounts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Handle dialog open
  const handleOpenDialog = (mode, account = null) => {
    setDialog({ open: true, mode, account });
    if (mode === 'create') {
      setFormData({
        name: '',
        accountNumber: '',
        bankName: '',
        accountType: 'checking',
        isActive: true
      });
    } else {
      setFormData({
        name: account?.name || '',
        accountNumber: account?.accountNumber || '',
        bankName: account?.bankName || '',
        accountType: account?.accountType || 'checking',
        isActive: account?.isActive ?? true
      });
    }
    setError('');
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialog({ open: false, mode: 'create', account: null });
    setFormData({
      name: '',
      accountNumber: '',
      bankName: '',
      accountType: 'checking',
      isActive: true
    });
    setError('');
    setSubmitting(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.accountNumber.trim() || !formData.bankName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const accountData = {
        name: formData.name.trim(),
        accountNumber: formData.accountNumber.trim(),
        bankName: formData.bankName.trim(),
        accountType: formData.accountType,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };

      if (dialog.mode === 'create') {
        accountData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'bankAccounts'), accountData);
        console.log('✅ Bank account created successfully');
      } else {
        await updateDoc(doc(db, 'bankAccounts', dialog.account.id), accountData);
        console.log('✅ Bank account updated successfully');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving bank account:', error);
      setError('Error saving bank account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (account) => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'bankAccounts', account.id));
        console.log('✅ Bank account deleted successfully');
      } catch (error) {
        console.error('Error deleting bank account:', error);
        alert('Error deleting bank account. Please try again.');
      }
    }
  };

  // Get account type color
  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'checking':
        return 'primary';
      case 'savings':
        return 'success';
      case 'business':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get account type label
  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 'checking':
        return 'Checking';
      case 'savings':
        return 'Savings';
      case 'business':
        return 'Business';
      default:
        return 'Unknown';
    }
  };

  // Mask account number for display
  const maskAccountNumber = (accountNumber) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
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
        <BankIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Bank Accounts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your business bank accounts
          </Typography>
        </Box>
      </Box>

      {/* Add Bank Account Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Bank Account
        </Button>
      </Box>

      {/* Bank Accounts Table */}
      {bankAccounts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BankIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bank accounts found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add your first bank account to start tracking deposits
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 500 }} size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Account Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Bank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Account Number</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bankAccounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {account.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {account.bankName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {maskAccountNumber(account.accountNumber)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getAccountTypeLabel(account.accountType)}
                      color={getAccountTypeColor(account.accountType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={account.isActive ? <CheckCircleIcon /> : <WarningIcon />}
                      label={account.isActive ? 'Active' : 'Inactive'}
                      color={account.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Account">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', account)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Account">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(account)}
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

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialog.open} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BankIcon color="primary" />
            <Typography variant="h6">
              {dialog.mode === 'create' ? 'Add Bank Account' : 'Edit Bank Account'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name *"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="e.g., Main Business Account"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Number *"
                value={formData.accountNumber}
                onChange={handleInputChange('accountNumber')}
                placeholder="e.g., 1234567890"
                helperText="Full account number (will be masked in display)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bank Name *"
                value={formData.bankName}
                onChange={handleInputChange('bankName')}
                placeholder="e.g., TD Bank, RBC, Scotiabank"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={formData.accountType}
                  onChange={handleInputChange('accountType')}
                  label="Account Type"
                >
                  <MenuItem value="checking">Checking Account</MenuItem>
                  <MenuItem value="savings">Savings Account</MenuItem>
                  <MenuItem value="business">Business Account</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('isActive')({ target: { checked: e.target.value === 'active' } })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <BankIcon />}
          >
            {submitting ? 'Saving...' : (dialog.mode === 'create' ? 'Add Account' : 'Update Account')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankAccountsPage;
