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
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  getOverdueStatistics, 
  batchUpdateOverdueStatuses,
  getOverdueInvoices 
} from '../../utils/overdueDetection';

const OverdueDashboard = ({ onRefresh }) => {
  const theme = useTheme();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Load overdue statistics
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await getOverdueStatistics();
      setStatistics(stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading overdue statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update overdue statuses
  const handleUpdateOverdueStatuses = async () => {
    try {
      setUpdating(true);
      const results = await batchUpdateOverdueStatuses();
      
      console.log('Overdue update results:', results);
      
      // Reload statistics
      await loadStatistics();
      
      // Notify parent component
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating overdue statuses:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Alert severity="error">
        Failed to load overdue statistics
      </Alert>
    );
  }

  const {
    totalPending,
    totalOverdue,
    potentiallyOverdue,
    totalRequiringAttention,
    overdueAmount,
    potentiallyOverdueAmount
  } = statistics;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 2, color: 'error.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" gutterBottom>
              Overdue Detection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor and manage overdue invoices
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={updating ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleUpdateOverdueStatuses}
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update Overdue Statuses'}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" color="info.main">
                  {totalPending}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pending Invoices
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
                  {totalOverdue}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Overdue Invoices
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
                  {potentiallyOverdue}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Potentially Overdue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  ${(overdueAmount + potentiallyOverdueAmount).toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total at Risk
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label="Pending" 
                color="info" 
                size="small" 
                sx={{ mr: 2 }}
              />
              <Typography variant="body2">
                {totalPending} invoices awaiting payment
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label="Overdue" 
                color="error" 
                size="small" 
                sx={{ mr: 2 }}
              />
              <Typography variant="body2">
                {totalOverdue} invoices past due date
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label="Potentially Overdue" 
                color="warning" 
                size="small" 
                sx={{ mr: 2 }}
              />
              <Typography variant="body2">
                {potentiallyOverdue} invoices may be overdue
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label="Total Requiring Attention" 
                color="primary" 
                size="small" 
                sx={{ mr: 2 }}
              />
              <Typography variant="body2">
                {totalRequiringAttention} invoices need attention
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Amount Summary */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Financial Impact
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                ${overdueAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="error.dark">
                Overdue Amount
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                ${potentiallyOverdueAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Potentially Overdue Amount
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                ${(overdueAmount + potentiallyOverdueAmount).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="primary.dark">
                Total at Risk
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Last Update Info */}
      {lastUpdate && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OverdueDashboard;
