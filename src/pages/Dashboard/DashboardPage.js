import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Assignment as WorkOrderIcon,
  Receipt as InvoiceIcon,
  AttachMoney as FinanceIcon,
  People as EmployeeIcon,
} from '@mui/icons-material';

const DashboardPage = () => {
  const theme = useTheme();

  const statsCards = [
    {
      title: 'Active Work Orders',
      value: '12',
      icon: <WorkOrderIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Pending Invoices',
      value: '8',
      icon: <InvoiceIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Monthly Revenue',
      value: '$15,420',
      icon: <FinanceIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Active Employees',
      value: '6',
      icon: <EmployeeIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.main,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Welcome Message */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
            Welcome to Elite Car Detailing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your comprehensive business management system for car detailing operations.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the navigation menu on the left to access different sections of your business management system.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage; 