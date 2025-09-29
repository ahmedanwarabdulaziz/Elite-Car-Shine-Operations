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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const EmployeeSidebar = ({ open, onToggle, employeePermissions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  // Filter menu items based on employee permissions
  const getFilteredMenuItems = () => {
    const allMenuItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/employee/dashboard', permission: 'dashboard' },
      { text: 'Work Orders', icon: <WorkOrderIcon />, path: '/work-orders', permission: 'workOrders' },
      { text: 'Work Orders Dashboard', icon: <DashboardViewIcon />, path: '/work-orders-dashboard', permission: 'workOrderDashboard' },
      { 
        text: 'Settings', 
        icon: <SettingsIcon />, 
        permission: 'settings',
        children: [
          { text: 'Categories', icon: <CategoryIcon />, path: '/categories', permission: 'categories' },
          { text: 'Vehicle Categories', icon: <VehicleIcon />, path: '/vehicle-categories', permission: 'vehicleCategories' },
          { text: 'Services', icon: <ServiceIcon />, path: '/services', permission: 'services' },
          { text: 'Bundles', icon: <BundleIcon />, path: '/bundles', permission: 'bundles' },
          { text: 'Payment Methods', icon: <PaymentIcon />, path: '/payment-methods', permission: 'paymentMethods' },
          { text: 'Tax Management', icon: <TaxIcon />, path: '/taxes', permission: 'taxManagement' },
          { text: 'Customer Fields', icon: <SettingsIcon />, path: '/customer-fields', permission: 'customerFields' },
          { text: 'Vehicle Fields', icon: <VehicleIcon />, path: '/vehicle-fields', permission: 'vehicleFields' },
          { text: 'Employees', icon: <EmployeeIcon />, path: '/employees', permission: 'employees' },
          { text: 'Departments', icon: <BusinessIcon />, path: '/departments', permission: 'departments' },
          { text: 'Work Order Statuses', icon: <PaletteIcon />, path: '/work-order-statuses', permission: 'workOrderStatuses' },
          { text: 'Data Management', icon: <StorageIcon />, path: '/data-management', permission: 'dataManagement' },
          { text: 'Bank Accounts', icon: <BankAccountsIcon />, path: '/bank-accounts', permission: 'bankAccounts' },
          { text: 'Expense Categories', icon: <ExpenseCategoriesIcon />, path: '/expense-categories', permission: 'expenseCategories' },
          { text: 'Pricing Management', icon: <FinanceGroupIcon />, path: '/pricing-management', permission: 'pricingManagement' },
        ]
      },
      { 
        text: 'Customers', 
        icon: <GroupIcon />, 
        permission: 'customers',
        children: [
          { text: 'Corporate Customers', icon: <BusinessIcon />, path: '/corporate-customers', permission: 'corporateCustomers' },
          { text: 'Individual Customer Groups', icon: <PersonIcon />, path: '/individual-customers', permission: 'individualCustomers' },
          { text: 'Create Customer', icon: <PersonAddIcon />, path: '/create-customer', permission: 'createCustomer' },
        ]
      },
      { 
        text: 'Finance', 
        icon: <FinanceGroupIcon />, 
        permission: 'finance',
        children: [
          { text: 'Expenses', icon: <ExpensesIcon />, path: '/expenses', permission: 'expenses' },
          { text: 'Payment Reports', icon: <PaymentReportsIcon />, path: '/payment-reports', permission: 'paymentReports' },
          { text: 'Vault', icon: <VaultIcon />, path: '/vault', permission: 'vault' },
          { text: 'Corporate Settlement', icon: <BusinessIcon />, path: '/corporate-settlement', permission: 'corporateSettlement' },
          { text: 'Pending Payments', icon: <PendingPaymentsIcon />, path: '/pending-payments', permission: 'pendingPayments' },
          { text: 'Issued Invoices', icon: <InvoiceIcon />, path: '/issued-invoices', permission: 'issuedInvoices' },
          { text: 'Invoices', icon: <InvoiceIcon />, path: '/invoices', permission: 'invoices' },
          { text: 'Invoice Reports', icon: <AnalyticsIcon />, path: '/invoice-reports', permission: 'invoiceReports' },
          { text: 'Finance', icon: <FinanceIcon />, path: '/finance', permission: 'finance' },
        ]
      },
      { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', permission: 'analytics' },
    ];

    // Filter items based on permissions
    const filterItems = (items) => {
      return items.filter(item => {
        // Check if user has permission for this item
        const hasPermission = !item.permission || employeePermissions?.[item.permission] === true;
        
        if (item.children) {
          // Filter children and check if any children are accessible
          const filteredChildren = filterItems(item.children);
          return hasPermission && filteredChildren.length > 0;
        }
        
        return hasPermission;
      }).map(item => {
        if (item.children) {
          return {
            ...item,
            children: filterItems(item.children)
          };
        }
        return item;
      });
    };

    return filterItems(allMenuItems);
  };

  const menuItems = getFilteredMenuItems();

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
              Employee Portal
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

export default EmployeeSidebar;

