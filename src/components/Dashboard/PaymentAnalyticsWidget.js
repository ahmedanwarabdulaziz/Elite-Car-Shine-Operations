import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getOverdueStatistics } from '../../utils/overdueDetection';

const PaymentAnalyticsWidget = () => {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        
        // Get recent invoices (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('issuedAt', '>=', thirtyDaysAgo),
          orderBy('issuedAt', 'desc')
        );
        
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get vault entries
        const vaultQuery = query(collection(db, 'vaultEntries'), orderBy('createdAt', 'desc'));
        const vaultSnapshot = await getDocs(vaultQuery);
        const vaultEntries = vaultSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get overdue statistics
        const overdueStats = await getOverdueStatistics();
        
        // Calculate analytics
        const totalRevenue = invoices.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
        const paidRevenue = invoices
          .filter(invoice => invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'settled')
          .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
        
        const pendingRevenue = invoices
          .filter(invoice => invoice.paymentStatus === 'pending')
          .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
        
        const overdueRevenue = invoices
          .filter(invoice => invoice.paymentStatus === 'overdue')
          .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);

        // Vault analytics
        const cashReceived = vaultEntries
          .filter(entry => entry.type === 'cash_received')
          .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        
        const settlements = vaultEntries
          .filter(entry => entry.type === 'settlement')
          .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        setAnalytics({
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          overdueRevenue,
          cashReceived,
          settlements,
          totalInvoices: invoices.length,
          paidInvoices: invoices.filter(invoice => 
            invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'settled'
          ).length,
          pendingInvoices: invoices.filter(invoice => 
            invoice.paymentStatus === 'pending'
          ).length,
          overdueInvoices: invoices.filter(invoice => 
            invoice.paymentStatus === 'overdue'
          ).length,
          overdueStats
        });
        
      } catch (error) {
        console.error('Error loading payment analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading analytics...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const {
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    overdueRevenue,
    cashReceived,
    settlements,
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    overdueStats
  } = analytics;

  const paymentRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;
  const overdueRate = totalRevenue > 0 ? (overdueRevenue / totalRevenue) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Analytics (Last 30 Days)
        </Typography>
        
        {/* Revenue Summary */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h6" color="success.main">
                ${totalRevenue.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="success.dark">
                Total Revenue
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h6" color="primary.main">
                ${paidRevenue.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="primary.dark">
                Paid Revenue
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Payment Status */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Payment Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<MoneyIcon />}
              label={`${paidInvoices} Paid`} 
              color="success" 
              size="small" 
            />
            <Chip 
              icon={<ScheduleIcon />}
              label={`${pendingInvoices} Pending`} 
              color="warning" 
              size="small" 
            />
            <Chip 
              icon={<WarningIcon />}
              label={`${overdueInvoices} Overdue`} 
              color="error" 
              size="small" 
            />
          </Box>
        </Box>

        {/* Performance Metrics */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Performance Metrics
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main" fontWeight="bold">
                  {paymentRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="info.dark">
                  Payment Rate
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="body2" color="error.main" fontWeight="bold">
                  {overdueRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="error.dark">
                  Overdue Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Vault Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Vault Activity
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  ${cashReceived.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="success.dark">
                  Cash Received
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  ${settlements.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="primary.dark">
                  Settlements
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Overdue Alert */}
        {overdueStats && (overdueStats.totalOverdue > 0 || overdueStats.potentiallyOverdue > 0) && (
          <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="caption" color="warning.dark" display="block">
              <strong>Overdue Alert:</strong> {overdueStats.totalOverdue} overdue invoices 
              (${overdueStats.overdueAmount.toFixed(2)})
            </Typography>
            {overdueStats.potentiallyOverdue > 0 && (
              <Typography variant="caption" color="warning.dark" display="block">
                {overdueStats.potentiallyOverdue} potentially overdue 
                (${overdueStats.potentiallyOverdueAmount.toFixed(2)})
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentAnalyticsWidget;
