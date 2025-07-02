import React from 'react';
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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
  { text: 'Vehicle Categories', icon: <VehicleIcon />, path: '/vehicle-categories' },
  { text: 'Services', icon: <ServiceIcon />, path: '/services' },
  { text: 'Bundles', icon: <BundleIcon />, path: '/bundles' },
  { text: 'Payment Methods', icon: <PaymentIcon />, path: '/payment-methods' },
  { text: 'Tax Management', icon: <TaxIcon />, path: '/taxes' },
  { text: 'Customer Fields', icon: <SettingsIcon />, path: '/customer-fields' },
  { text: 'Vehicle Fields', icon: <VehicleIcon />, path: '/vehicle-fields' },
  { text: 'Corporate Customers', icon: <BusinessIcon />, path: '/corporate-customers' },
  { text: 'Individual Customer Groups', icon: <PersonIcon />, path: '/individual-customers' },
  { text: 'Create Customer', icon: <PersonAddIcon />, path: '/create-customer' },
  { text: 'Work Orders', icon: <WorkOrderIcon />, path: '/work-orders' },
  { text: 'Work Orders Dashboard', icon: <DashboardViewIcon />, path: '/work-orders-dashboard' },
  { text: 'Issued Invoices', icon: <InvoiceIcon />, path: '/issued-invoices' },
  { text: 'Invoices', icon: <InvoiceIcon />, path: '/invoices' },
  { text: 'Invoice Reports', icon: <AnalyticsIcon />, path: '/invoice-reports' },
  { text: 'Finance', icon: <FinanceIcon />, path: '/finance' },
  { text: 'Employees', icon: <EmployeeIcon />, path: '/employees' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Work Order Statuses', icon: <PaletteIcon />, path: '/work-order-statuses' },
];

const Sidebar = ({ open, onToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
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
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                backgroundColor: isActive(item.path) ? theme.palette.primary.light : 'transparent',
                color: isActive(item.path) ? theme.palette.primary.contrastText : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.action.hover,
                },
                '& .MuiListItemIcon-root': {
                  color: isActive(item.path) ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
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