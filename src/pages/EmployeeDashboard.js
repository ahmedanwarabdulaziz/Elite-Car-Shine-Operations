import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CarRepair as CarRepairIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNotification } from '../components/Common/NotificationSystem';
import useFirebase from '../hooks/useFirebase';

const EmployeeDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const [employee, setEmployee] = useState(null);
  const [department, setDepartment] = useState(null);
  
  // Mobile responsiveness
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Fetch departments data
  const { 
    data: departments, 
    loading: departmentsLoading,
    subscribeToData: subscribeToDepartments
  } = useFirebase('departments');

  useEffect(() => {
    // Get employee data from session
    const employeeSession = sessionStorage.getItem('employeeUser');
    if (employeeSession) {
      const employeeData = JSON.parse(employeeSession);
      setEmployee(employeeData);
    } else {
      // If no session, redirect to login
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
      setDepartment(employeeDepartment);
      
      // Debug logging
      console.log('Employee Dashboard Debug:', {
        employee: employee.name,
        department: employee.department,
        foundDepartment: employeeDepartment,
        permissions: employeeDepartment?.permissions
      });
    }
  }, [employee, departments]);

  const handleLogout = async () => {
    try {
      // Clear employee session
      sessionStorage.removeItem('employeeUser');
      
      // Also clear any Firebase auth (in case admin was logged in before)
      try {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../firebase/config');
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
  };

  // Map permission names to display information
  const getPermissionInfo = (permissionName) => {
    const permissionMap = {
      'categories': {
        title: 'Categories',
        description: 'Manage service categories',
        icon: <CategoryIcon />,
        color: theme.palette.primary.main,
        route: '/categories'
      },
      'services': {
        title: 'Services',
        description: 'Manage car detailing services',
        icon: <CarRepairIcon />,
        color: theme.palette.success.main,
        route: '/services'
      },
      'bundles': {
        title: 'Service Bundles',
        description: 'Manage service packages',
        icon: <WorkIcon />,
        color: theme.palette.info.main,
        route: '/bundles'
      },
      'customers': {
        title: 'Customers',
        description: 'Manage customer information',
        icon: <PeopleIcon />,
        color: theme.palette.warning.main,
        route: '/customers'
      },
      'workOrders': {
        title: 'Work Orders',
        description: 'Manage work orders and assignments',
        icon: <AssignmentIcon />,
        color: theme.palette.secondary.main,
        route: '/work-orders'
      },
      'workOrderDashboard': {
        title: 'Work Order Dashboard',
        description: 'View and manage work order dashboard',
        icon: <DashboardIcon />,
        color: theme.palette.info.main,
        route: '/work-orders-dashboard'
      },
      'invoices': {
        title: 'Invoices',
        description: 'Manage billing and invoices',
        icon: <ReceiptIcon />,
        color: theme.palette.error.main,
        route: '/invoices'
      },
      'employees': {
        title: 'Employees',
        description: 'Manage employee accounts',
        icon: <PersonIcon />,
        color: theme.palette.primary.main,
        route: '/employees'
      },
      'departments': {
        title: 'Departments',
        description: 'Manage departments and permissions',
        icon: <BusinessIcon />,
        color: theme.palette.secondary.main,
        route: '/departments'
      },
      'analytics': {
        title: 'Analytics',
        description: 'View business analytics and reports',
        icon: <TrendingUpIcon />,
        color: theme.palette.success.main,
        route: '/analytics'
      },
      'finance': {
        title: 'Finance',
        description: 'Financial management and reports',
        icon: <MoneyIcon />,
        color: theme.palette.info.main,
        route: '/finance'
      },
      'reports': {
        title: 'Reports',
        description: 'Generate and view reports',
        icon: <AssessmentIcon />,
        color: theme.palette.warning.main,
        route: '/reports'
      }
    };

    return permissionMap[permissionName] || {
      title: permissionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Access to ${permissionName.replace(/_/g, ' ')}`,
      icon: <SettingsIcon />,
      color: theme.palette.grey[600],
      route: `/${permissionName}`
    };
  };

  // Get available pages based on department permissions
  const getAvailablePages = () => {
    if (!employee || !department) return [];

    const basePages = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Overview and statistics',
        icon: <DashboardIcon />,
        color: theme.palette.primary.main,
        route: '/dashboard',
        alwaysAvailable: true,
      },
    ];

    // Get permissions from department
    const departmentPermissions = department.permissions || {};
    const availablePermissions = [];

    // Check each permission and add to available pages
    Object.entries(departmentPermissions).forEach(([permissionName, hasAccess]) => {
      if (hasAccess === true) {
        const permissionInfo = getPermissionInfo(permissionName);
        availablePermissions.push({
          id: permissionName,
          ...permissionInfo,
        });
      }
    });

    return [...basePages, ...availablePermissions];
  };

  const handlePageClick = (page) => {
    // Navigate to the actual admin page based on permissions
    if (page.route) {
      // Navigate to the admin page - employees can access the same pages as admins
      // but with their own session and permissions
      navigate(page.route);
    }
  };

  if (!employee || departmentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Employee Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  const availablePages = getAvailablePages();

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      maxWidth: 1200, 
      mx: 'auto',
      pb: { xs: 8, sm: 3 } // Extra bottom padding for mobile FAB
    }}>
      {/* Header */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={{ xs: 2, sm: 0 }}
          >
            <Box display="flex" alignItems="center" width={{ xs: '100%', sm: 'auto' }}>
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  mr: 2,
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 }
                }}
              >
                {employee.name?.charAt(0)?.toUpperCase() || <PersonIcon />}
              </Avatar>
              <Box>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  component="h1"
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Welcome back, {employee.name}!
                </Typography>
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {employee.job} • {employee.department}
                </Typography>
              </Box>
            </Box>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1}
              flexDirection={{ xs: 'row', sm: 'row' }}
              width={{ xs: '100%', sm: 'auto' }}
              justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
            >
              <Chip 
                label={`ID: ${employee.username}`} 
                variant="outlined" 
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              />
              {!isMobile && (
                <Button
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  color="secondary"
                  size="small"
                >
                  Logout
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Available Pages */}
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          mb: 2,
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          fontWeight: 'bold'
        }}
      >
        Available Pages & Permissions
      </Typography>
      
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {availablePages.map((page) => (
          <Grid item xs={12} sm={6} md={4} key={page.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: { xs: 2, sm: 1 },
                minHeight: { xs: 120, sm: 'auto' },
                '&:hover': {
                  transform: { xs: 'scale(1.02)', sm: 'translateY(-4px)' },
                  boxShadow: { xs: theme.shadows[4], sm: theme.shadows[8] },
                },
                '&:active': {
                  transform: 'scale(0.98)',
                }
              }}
              onClick={() => handlePageClick(page)}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" alignItems="center" mb={{ xs: 1, sm: 2 }}>
                  <Box
                    sx={{
                      bgcolor: page.color,
                      color: 'white',
                      borderRadius: '50%',
                      p: { xs: 1.5, sm: 1 },
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: { xs: 48, sm: 40 },
                      minHeight: { xs: 48, sm: 40 },
                    }}
                  >
                    {page.icon}
                  </Box>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    component="h3"
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 'bold'
                    }}
                  >
                    {page.title}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  paragraph
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    mb: { xs: 1, sm: 2 }
                  }}
                >
                  {page.description}
                </Typography>
                {page.alwaysAvailable && (
                  <Chip 
                    label="Always Available" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' } }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Department Information */}
      <Card sx={{ mt: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Employee Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="subtitle2" 
                color="textSecondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Department
              </Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {employee.department}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="subtitle2" 
                color="textSecondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Job Title
              </Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {employee.job}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="subtitle2" 
                color="textSecondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Email
              </Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {employee.email}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="subtitle2" 
                color="textSecondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Username
              </Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {employee.username}
              </Typography>
            </Grid>
          </Grid>
          
          {department && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Access Permissions
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Your department has access to the following pages:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(department.permissions || {}).map(([permission, hasAccess]) => (
                  hasAccess && (
                    <Chip
                      key={permission}
                      label={getPermissionInfo(permission).title}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )
                ))}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ mt: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Quick Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List sx={{ p: 0 }}>
            <ListItem 
              button 
              onClick={() => navigate('/employee/change-password')}
              sx={{ 
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                <SettingsIcon fontSize={isMobile ? "small" : "medium"} />
              </ListItemIcon>
              <ListItemText 
                primary="Change Password" 
                secondary="Update your login password"
                primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              />
            </ListItem>
            <ListItem 
              button 
              onClick={() => showSuccess('Profile editing coming soon!')}
              sx={{ 
                borderRadius: 1,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                <PersonIcon fontSize={isMobile ? "small" : "medium"} />
              </ListItemIcon>
              <ListItemText 
                primary="Edit Profile" 
                secondary="Update your personal information"
                primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Mobile Floating Action Button for Logout */}
      {isMobile && (
        <Tooltip title="Logout" placement="top">
          <Fab
            color="secondary"
            aria-label="logout"
            onClick={handleLogout}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <LogoutIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
};

export default EmployeeDashboard;
