import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Collapse,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  DirectionsCar as VehicleIcon,
  Build as ServiceIcon,
  LocalOffer as BundleIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Assignment as WorkOrderIcon,
  Receipt as InvoiceIcon,
  AttachMoney as FinanceIcon,
  People as EmployeeIcon,
  Assessment as AnalyticsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  AttachMoney as TaxIcon,
  Dashboard as DashboardViewIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  AccountBalance as PendingPaymentsIcon,
  AccountBalanceWallet as VaultIcon,
  AccountBalance as BankAccountsIcon,
  Receipt as ExpensesIcon,
  Category as ExpenseCategoriesIcon,
  Assessment as PaymentReportsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  AccountBalance as FinanceGroupIcon,
  GetApp as InstallIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Work Orders', icon: <WorkOrderIcon />, path: '/work-orders' },
  { text: 'Work Orders Dashboard', icon: <DashboardViewIcon />, path: '/work-orders-dashboard' },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    children: [
      { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
      { text: 'Vehicle Categories', icon: <VehicleIcon />, path: '/vehicle-categories' },
      { text: 'Services', icon: <ServiceIcon />, path: '/services' },
      { text: 'Bundles', icon: <BundleIcon />, path: '/bundles' },
      { text: 'Payment Methods', icon: <PaymentIcon />, path: '/payment-methods' },
      { text: 'Tax Management', icon: <TaxIcon />, path: '/taxes' },
      { text: 'Customer Fields', icon: <SettingsIcon />, path: '/customer-fields' },
      { text: 'Vehicle Fields', icon: <VehicleIcon />, path: '/vehicle-fields' },
      { text: 'Employees', icon: <EmployeeIcon />, path: '/employees' },
      { text: 'Departments', icon: <BusinessIcon />, path: '/departments' },
      { text: 'Work Order Statuses', icon: <PaletteIcon />, path: '/work-order-statuses' },
      { text: 'Data Management', icon: <StorageIcon />, path: '/data-management' },
      { text: 'Bank Accounts', icon: <BankAccountsIcon />, path: '/bank-accounts' },
      { text: 'Expense Categories', icon: <ExpenseCategoriesIcon />, path: '/expense-categories' },
      { text: 'Pricing Management', icon: <FinanceGroupIcon />, path: '/pricing-management' },
    ]
  },
  { 
    text: 'Customers', 
    icon: <GroupIcon />, 
    children: [
      { text: 'Corporate Customers', icon: <BusinessIcon />, path: '/corporate-customers' },
      { text: 'Individual Customer Groups', icon: <PersonIcon />, path: '/individual-customers' },
      { text: 'Create Customer', icon: <PersonAddIcon />, path: '/create-customer' },
    ]
  },
  { 
    text: 'Finance', 
    icon: <FinanceGroupIcon />, 
    children: [
      { text: 'Expenses', icon: <ExpensesIcon />, path: '/expenses' },
      { text: 'Payment Reports', icon: <PaymentReportsIcon />, path: '/payment-reports' },
      { text: 'Vault', icon: <VaultIcon />, path: '/vault' },
      { text: 'Corporate Settlement', icon: <BusinessIcon />, path: '/corporate-settlement' },
      { text: 'Pending Payments', icon: <PendingPaymentsIcon />, path: '/pending-payments' },
      { text: 'Issued Invoices', icon: <InvoiceIcon />, path: '/issued-invoices' },
      { text: 'Invoices', icon: <InvoiceIcon />, path: '/invoices' },
      { text: 'Invoice Reports', icon: <AnalyticsIcon />, path: '/invoice-reports' },
      { text: 'Finance', icon: <FinanceIcon />, path: '/finance' },
    ]
  },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
];

const Sidebar = ({ open, onToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);

  // PWA Install functionality
  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA App installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Check if we can show install button (for development/testing)
    const checkInstallability = () => {
      // For development, show button if not already installed
      if (!isInstalled && !window.matchMedia('(display-mode: standalone)').matches) {
        // Simulate install prompt for testing
        setTimeout(() => {
          if (!deferredPrompt) {
            console.log('PWA Install button should be visible');
            // Create a mock deferred prompt for testing
            setDeferredPrompt({ 
              prompt: () => {
                console.log('Mock install prompt triggered');
                return Promise.resolve();
              }
            });
          }
        }, 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check installability after component mounts
    checkInstallability();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt]);

  const handleInstallClick = async () => {
    console.log('Install button clicked!');
    setButtonClicked(true);
    
    // Always show the development message for now
    console.log('Development mode - showing install info');
    alert('🚀 PWA Install Button Working!\n\nIn production with HTTPS, this would install the Elite Car Shine app on your device.\n\nFor now, you can manually add this page to your home screen.');
    
    // Try to trigger real PWA install if available
    try {
      if (deferredPrompt && deferredPrompt.prompt && typeof deferredPrompt.prompt === 'function') {
        console.log('Attempting real PWA install prompt');
        await deferredPrompt.prompt();
        
        if (deferredPrompt.userChoice) {
          const result = await deferredPrompt.userChoice;
          console.log('Install prompt result:', result);
        }
      }
    } catch (error) {
      console.log('PWA install error (this is normal in development):', error);
    }
    
    // Reset button state after 2 seconds
    setTimeout(() => {
      setButtonClicked(false);
    }, 2000);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleToggleExpand = (itemText) => {
    setExpandedItems(prev => {
      // Accordion behavior: close all other expanded items
      const newState = {};
      // Only keep the current item's state, close all others
      newState[itemText] = !prev[itemText];
      return newState;
    });
  };

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.text];
    const isItemActive = item.path ? isActive(item.path) : false;
    const hasActiveChild = hasChildren && item.children.some(child => isActive(child.path));

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleToggleExpand(item.text);
              } else {
                handleNavigation(item.path);
              }
            }}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              pl: level * 2 + 2,
              backgroundColor: (() => {
                if (isItemActive || hasActiveChild) return theme.palette.primary.light;
                if (isExpanded) return theme.palette.action.hover;
                return 'transparent';
              })(),
              color: (isItemActive || hasActiveChild) ? theme.palette.primary.contrastText : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: (() => {
                  if (isItemActive || hasActiveChild) return theme.palette.primary.main;
                  if (isExpanded) return theme.palette.action.hover;
                  return theme.palette.action.hover;
                })(),
              },
              '& .MuiListItemIcon-root': {
                color: (isItemActive || hasActiveChild) ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: level > 0 ? 32 : 40,
              '& .MuiSvgIcon-root': {
                fontSize: level > 0 ? '1.1rem' : '1.25rem', // Smaller icons for subcategories
              }
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: (isItemActive || hasActiveChild) ? 600 : 400,
                fontSize: level > 0 ? '0.875rem' : '1rem', // Smaller font for subcategories
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List 
              component="div" 
              disablePadding
              sx={{
                backgroundColor: theme.palette.action.selected,
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              E
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Elite Detailing
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Business Management
            </Typography>
          </Box>
        </Box>
        {!isMobile && (
          <IconButton onClick={onToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        {/* Always show install button for testing */}
        <Tooltip title="Install Elite Car Shine App" placement="top">
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<InstallIcon />}
            onClick={handleInstallClick}
            disabled={buttonClicked}
            sx={{
              mb: 1,
              backgroundColor: buttonClicked ? theme.palette.success.main : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: buttonClicked ? theme.palette.success.dark : theme.palette.primary.dark,
              },
              fontSize: '0.75rem',
              py: 0.5,
              transition: 'all 0.3s ease',
            }}
          >
            {buttonClicked ? 'Installing...' : 'Install App'}
          </Button>
        </Tooltip>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center', display: 'block' }}>
          © 2024 Elite Car Detailing
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar; 