import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assessment as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  formatDate, 
  getPaymentStatusColor, 
  getPaymentStatusLabel 
} from '../../utils/paymentCalculations';
import { getOverdueStatistics } from '../../utils/overdueDetection';

const PaymentReportsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [invoices, setInvoices] = useState([]);
  const [vaultEntries, setVaultEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueStats, setOverdueStats] = useState(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load invoices
        const invoicesQuery = query(collection(db, 'invoices'), orderBy('issuedAt', 'desc'));
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoicesData = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvoices(invoicesData);
        
        // Load vault entries
        const vaultQuery = query(collection(db, 'vaultEntries'), orderBy('createdAt', 'desc'));
        const vaultSnapshot = await getDocs(vaultQuery);
        const vaultData = vaultSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVaultEntries(vaultData);
        
        // Load overdue statistics
        const overdueData = await getOverdueStatistics();
        setOverdueStats(overdueData);
        
      } catch (error) {
        console.error('Error loading payment reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate date range
  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
  };

  // Filter data based on date range and filters
  const getFilteredData = () => {
    const { startDate, endDate } = getDateRange();
    
    let filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = invoice.issuedAt?.toDate ? invoice.issuedAt.toDate() : new Date(invoice.issuedAt);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });

    // Apply additional filters
    if (paymentMethodFilter !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.paymentMethod === paymentMethodFilter
      );
    }

    if (statusFilter !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.paymentStatus === statusFilter
      );
    }

    return filteredInvoices;
  };

  // Calculate analytics
  const calculateAnalytics = () => {
    const filteredInvoices = getFilteredData();
    const { startDate, endDate } = getDateRange();
    
    // Filter vault entries by date range
    const filteredVaultEntries = vaultEntries.filter(entry => {
      const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Revenue calculations
    const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    const paidRevenue = filteredInvoices
      .filter(invoice => invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'settled')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    
    const pendingRevenue = filteredInvoices
      .filter(invoice => invoice.paymentStatus === 'pending')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    
    const overdueRevenue = filteredInvoices
      .filter(invoice => invoice.paymentStatus === 'overdue')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);

    // Payment method analysis
    const paymentMethodStats = {};
    filteredInvoices.forEach(invoice => {
      const method = invoice.paymentMethodDetails?.name || 'Unknown';
      if (!paymentMethodStats[method]) {
        paymentMethodStats[method] = { count: 0, revenue: 0 };
      }
      paymentMethodStats[method].count++;
      paymentMethodStats[method].revenue += Number(invoice.total) || 0;
    });

    // Vault analysis
    const cashReceived = filteredVaultEntries
      .filter(entry => entry.type === 'cash_received')
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    
    const settlements = filteredVaultEntries
      .filter(entry => entry.type === 'settlement')
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

    // Customer type analysis
    const corporateRevenue = filteredInvoices
      .filter(invoice => invoice.customerType === 'corporate')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    
    const individualRevenue = filteredInvoices
      .filter(invoice => invoice.customerType === 'individual')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      paymentMethodStats,
      cashReceived,
      settlements,
      corporateRevenue,
      individualRevenue,
      totalInvoices: filteredInvoices.length,
      paidInvoices: filteredInvoices.filter(invoice => 
        invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'settled'
      ).length,
      pendingInvoices: filteredInvoices.filter(invoice => 
        invoice.paymentStatus === 'pending'
      ).length,
      overdueInvoices: filteredInvoices.filter(invoice => 
        invoice.paymentStatus === 'overdue'
      ).length
    };
  };

  const analytics = calculateAnalytics();

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
        <AnalyticsIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Payment Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive payment analysis and revenue insights
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="all">All Methods</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              fullWidth
            >
              Export Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Revenue Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  ${analytics.totalRevenue.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  ${analytics.paidRevenue.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Paid Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="warning.main">
                  ${analytics.pendingRevenue.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pending Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6" color="error.main">
                  ${analytics.overdueRevenue.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Overdue Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analytics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Payment Method Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Method Performance
              </Typography>
              {Object.entries(analytics.paymentMethodStats).map(([method, stats]) => (
                <Box key={method} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{method}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${stats.revenue.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {stats.count} invoices
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {((stats.revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Type Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Type Revenue
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Corporate</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${analytics.corporateRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {((analytics.corporateRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Individual</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${analytics.individualRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {((analytics.individualRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vault Analysis */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cash Received
              </Typography>
              <Typography variant="h4" color="success.main">
                ${analytics.cashReceived.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Immediate cash payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Settlements
              </Typography>
              <Typography variant="h4" color="primary.main">
                ${analytics.settlements.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Settled pending invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Vault
              </Typography>
              <Typography variant="h4" color="warning.main">
                ${(analytics.cashReceived + analytics.settlements).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Combined vault entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice Status Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Status Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                <Typography variant="h4" color="success.main">
                  {analytics.paidInvoices}
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Paid Invoices
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {analytics.pendingInvoices}
                </Typography>
                <Typography variant="body2" color="warning.dark">
                  Pending Invoices
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                <Typography variant="h4" color="error.main">
                  {analytics.overdueInvoices}
                </Typography>
                <Typography variant="body2" color="error.dark">
                  Overdue Invoices
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="h4" color="info.main">
                  {analytics.totalInvoices}
                </Typography>
                <Typography variant="body2" color="info.dark">
                  Total Invoices
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Overdue Statistics */}
      {overdueStats && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overdue Alert
          </Typography>
          <Typography variant="body2">
            <strong>{overdueStats.totalOverdue}</strong> invoices are overdue with a total value of 
            <strong> ${overdueStats.overdueAmount.toFixed(2)}</strong>. 
            Additionally, <strong>{overdueStats.potentiallyOverdue}</strong> invoices may be overdue 
            with a value of <strong>${overdueStats.potentiallyOverdueAmount.toFixed(2)}</strong>.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default PaymentReportsPage;
