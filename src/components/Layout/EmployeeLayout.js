import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  ArrowBack as BackIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNotification } from '../Common/NotificationSystem';

const EmployeeLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useNotification();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  
  // Mobile responsiveness
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Get current page name from URL
  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path === '/employee/dashboard' || path === '/') return 'Dashboard';
    if (path === '/categories') return 'Categories';
    if (path === '/services') return 'Services';
    if (path === '/bundles') return 'Service Bundles';
    if (path === '/work-orders') return 'Work Orders';
    if (path === '/customers') return 'Customers';
    if (path === '/employees') return 'Employees';
    if (path === '/departments') return 'Departments';
    if (path === '/invoices') return 'Invoices';
    if (path === '/analytics') return 'Analytics';
    if (path === '/employee/change-password') return 'Change Password';
    return 'Employee Access';
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Clear employee session
      sessionStorage.removeItem('employeeUser');
      
      // Also clear any Firebase auth (in case admin was logged in before)
      try {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../../firebase/config');
        await signOut(auth);
      } catch (firebaseError) {
        // Firebase auth might not be available, that's okay
        console.log('Firebase auth not available for logout');
      }
      
      showSuccess('Logged out successfully');
      navigate('/employee/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear all data and redirect
      sessionStorage.clear();
      localStorage.clear();
      showSuccess('Logged out successfully');
      navigate('/employee/login');
    }
    
    handleMenuClose();
  };

  const handleDashboard = () => {
    navigate('/employee/dashboard');
    handleMenuClose();
  };

  const handleBackToDashboard = () => {
    navigate('/employee/dashboard');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Get employee info from session
  const getEmployeeInfo = () => {
    const employeeSession = sessionStorage.getItem('employeeUser');
    if (employeeSession) {
      return JSON.parse(employeeSession);
    }
    return null;
  };

  const employee = getEmployeeInfo();

  // Mobile navigation items
  const mobileNavItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/employee/dashboard' },
    { text: 'Work Orders', icon: <AssignmentIcon />, path: '/work-orders' },
    { text: 'Work Order Dashboard', icon: <WorkIcon />, path: '/work-orders-dashboard' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Services', icon: <WorkIcon />, path: '/services' },
    { text: 'Bundles', icon: <WorkIcon />, path: '/bundles' },
    { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices' },
  ];

  // Mobile drawer content
  const drawerContent = (
    <Box sx={{ width: 280 }}>
      <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
        <Typography variant="h6" gutterBottom>
          Elite Car Shine
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Employee Portal
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {employee?.name}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {employee?.department}
          </Typography>
        </Box>
      </Box>
      
      <List>
        {mobileNavItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleMobileNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.light,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.contrastText,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.primary.contrastText,
                  fontWeight: 'bold',
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        
        <Divider sx={{ my: 1 }} />
        
        <ListItem
          button
          onClick={() => {
            navigate('/employee/change-password');
            setMobileOpen(false);
          }}
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Change Password" />
        </ListItem>
        
        <ListItem
          button
          onClick={handleLogout}
          sx={{ color: theme.palette.error.main }}
        >
          <ListItemIcon sx={{ color: theme.palette.error.main }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: theme.palette.primary.main,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Back to Dashboard Button (if not on dashboard and not mobile) */}
          {!isMobile && location.pathname !== '/employee/dashboard' && location.pathname !== '/' && (
            <IconButton
              color="inherit"
              onClick={handleBackToDashboard}
              sx={{ mr: 2 }}
            >
              <BackIcon />
            </IconButton>
          )}

          {/* Page Title */}
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {getCurrentPageName()}
          </Typography>

          {/* Notifications (Mobile) */}
          {isMobile && (
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}

          {/* Employee Info & Menu */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {employee?.name}
            </Typography>
            <IconButton
              size={isMobile ? "small" : "medium"}
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: { xs: 28, sm: 32 }, 
                  height: { xs: 28, sm: 32 }, 
                  bgcolor: 'secondary.main',
                  fontSize: { xs: '0.75rem', sm: '1rem' }
                }}
              >
                {employee?.name?.charAt(0)?.toUpperCase() || <PersonIcon />}
              </Avatar>
            </IconButton>
          </Box>

          {/* Employee Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { minWidth: 200 }
            }}
          >
            <MenuItem onClick={handleDashboard}>
              <DashboardIcon sx={{ mr: 1 }} />
              Dashboard
            </MenuItem>
            <MenuItem onClick={() => {
              navigate('/employee/change-password');
              handleMenuClose();
            }}>
              <PersonIcon sx={{ mr: 1 }} />
              Change Password
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 7, sm: 8 }, // Account for AppBar height (mobile vs desktop)
          px: { xs: 1, sm: 2 }, // Mobile padding
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 56px)', // Mobile height
          '@media (min-width: 600px)': {
            minHeight: 'calc(100vh - 64px)', // Desktop height
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default EmployeeLayout;
