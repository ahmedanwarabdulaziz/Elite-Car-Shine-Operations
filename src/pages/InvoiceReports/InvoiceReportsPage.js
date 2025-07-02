import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import { 
  Assessment as ReportsIcon,
  Timeline as LifecycleIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as StatusIcon,
  Speed as PerformanceIcon,
  FileDownload as ExportIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentCounters } from '../../firebase/invoiceCounter';

const InvoiceReportsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [counters, setCounters] = useState({ C: 0, D: 0 });

  useEffect(() => {
    const loadCounters = async () => {
      try {
        const currentCounters = await getCurrentCounters();
        setCounters(currentCounters);
      } catch (error) {
        console.error('Error loading counters:', error);
      }
    };
    
    loadCounters();
  }, []);

  const reportCards = [
    {
      title: 'Invoice Lifecycle Tracking',
      description: 'Track the complete lifecycle of all invoices from creation to finalization or deletion',
      icon: <LifecycleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      path: '/invoice-reports/lifecycle',
      color: theme.palette.primary.main,
      features: [
        'Complete invoice history',
        'Status tracking',
        'Deletion analysis',
        'Stage monitoring'
      ]
    },
    {
      title: 'Invoice Analytics',
      description: 'Comprehensive analytics and business intelligence for invoice processing',
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      path: '/invoice-reports/analytics',
      color: theme.palette.secondary.main,
      features: [
        'Processing trends',
        'Performance metrics',
        'Business insights',
        'Revenue analysis'
      ],
      comingSoon: true
    },
    {
      title: 'Invoice Status Summary',
      description: 'Quick overview of current invoice statuses and pending actions',
      icon: <StatusIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      path: '/invoice-reports/status',
      color: theme.palette.success.main,
      features: [
        'Status overview',
        'Pending actions',
        'Quick filters',
        'Action items'
      ],
      comingSoon: true
    },
    {
      title: 'Processing Performance',
      description: 'Monitor invoice processing efficiency and team performance',
      icon: <PerformanceIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      path: '/invoice-reports/performance',
      color: theme.palette.warning.main,
      features: [
        'Processing times',
        'Team efficiency',
        'Bottleneck analysis',
        'Performance trends'
      ],
      comingSoon: true
    },
    {
      title: 'Export Tools',
      description: 'Export invoice data in various formats for external analysis',
      icon: <ExportIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      path: '/invoice-reports/export',
      color: theme.palette.info.main,
      features: [
        'PDF export',
        'Excel export',
        'Custom reports',
        'Scheduled exports'
      ],
      comingSoon: true
    }
  ];

  const handleCardClick = (path, comingSoon) => {
    if (!comingSoon) {
      navigate(path);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ReportsIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4">
            Invoice Reports
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Comprehensive reporting and analytics for invoice management
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: theme.palette.primary.light, color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {counters.C}
              </Typography>
              <Typography variant="body2">
                Corporate Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: theme.palette.secondary.light, color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {counters.D}
              </Typography>
              <Typography variant="body2">
                Individual Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: theme.palette.success.light, color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {counters.C + counters.D}
              </Typography>
              <Typography variant="body2">
                Total Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: theme.palette.info.light, color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Active
              </Typography>
              <Typography variant="body2">
                System Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Cards */}
      <Grid container spacing={3}>
        {reportCards.map((card, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: card.comingSoon ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: card.comingSoon ? 'none' : 'translateY(-4px)',
                  boxShadow: card.comingSoon ? 'none' : theme.shadows[8],
                },
                opacity: card.comingSoon ? 0.6 : 1
              }}
              onClick={() => handleCardClick(card.path, card.comingSoon)}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {card.icon}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {card.title}
                    </Typography>
                    {card.comingSoon && (
                      <Chip 
                        label="Coming Soon" 
                        size="small" 
                        color="warning" 
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {card.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Features:
                  </Typography>
                  {card.features.map((feature, featureIndex) => (
                    <Typography 
                      key={featureIndex} 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}
                    >
                      • {feature}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
              
              {!card.comingSoon && (
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    endIcon={<ArrowIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(card.path);
                    }}
                  >
                    Open Report
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default InvoiceReportsPage; 