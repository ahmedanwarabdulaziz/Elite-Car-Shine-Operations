import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNotification } from '../Common/NotificationSystem';
import EmployeeSidebar from './EmployeeSidebar';
import useFirebase from '../../hooks/useFirebase';

const EmployeeLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useNotification();
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [employeePermissions, setEmployeePermissions] = useState({});
  
  // Mobile responsiveness
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch departments data for permissions
  const { 
    data: departments, 
    loading: departmentsLoading,
    subscribeToData: subscribeToDepartments
  } = useFirebase('departments');

  // Initialize sidebar state based on screen size
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Load employee data and permissions
  useEffect(() => {
    const employeeSession = sessionStorage.getItem('employeeUser');
    if (employeeSession) {
      const employeeData = JSON.parse(employeeSession);
      setEmployee(employeeData);
    } else {
      navigate('/employee/login');
    }
  }, [navigate]);

  useEffect(() => {
    subscribeToDepartments();
  }, [subscribeToDepartments]);

  useEffect(() => {
    if (employee && departments) {
      // Find the employee's department
      const employeeDepartment = departments.find(dept => dept.name === employee.department);
      if (employeeDepartment) {
        setEmployeePermissions(employeeDepartment.permissions || {});
      }
    }
  }, [employee, departments]);

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

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Employee Sidebar with Permissions */}
      <EmployeeSidebar 
        open={sidebarOpen} 
        onToggle={handleSidebarToggle} 
        employeePermissions={employeePermissions}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Header */}
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
                onClick={handleSidebarToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
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

        {/* Content */}
        <Box
          sx={{
            flexGrow: 1,
            mt: '64px', // Header height
            p: 3,
            backgroundColor: theme.palette.background.default,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default EmployeeLayout;
