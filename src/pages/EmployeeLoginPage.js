import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Link,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNotification } from '../components/Common/NotificationSystem';
import useFirebase from '../hooks/useFirebase';

const EmployeeLoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { 
    data: employees, 
    loading: employeesLoading,
    subscribeToData: subscribeToEmployees
  } = useFirebase('employees');

  const { 
    data: departments, 
    loading: departmentsLoading,
    subscribeToData: subscribeToDepartments
  } = useFirebase('departments');

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('EmployeeLoginPage: Subscribing to employees and departments...');
    try {
      subscribeToEmployees();
      subscribeToDepartments();
    } catch (error) {
      console.warn('Failed to subscribe to Firebase data:', error);
      // Continue without Firebase data - we'll handle this gracefully
    }
  }, [subscribeToEmployees, subscribeToDepartments]);

  // Debug logging
  useEffect(() => {
    console.log('EmployeeLoginPage: Data status:', {
      employeesLoading,
      departmentsLoading,
      employeesCount: employees?.length || 0,
      departmentsCount: departments?.length || 0,
      employees: employees,
      departments: departments
    });
  }, [employeesLoading, departmentsLoading, employees, departments]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login attempt:', {
        emailOrUsername: formData.emailOrUsername,
        employeesAvailable: !!employees,
        employeesCount: employees?.length || 0
      });

      // If no employees data is available, show helpful error
      if (!employees || employees.length === 0) {
        setError('Employee system not set up yet. Admin must create employee accounts first. Please contact your administrator.');
        setLoading(false);
        return;
      }

      // Find employee by email or username
      const employee = employees?.find(emp => {
        const emailMatch = emp.email.toLowerCase() === formData.emailOrUsername.toLowerCase();
        const usernameMatch = emp.username && emp.username.toLowerCase() === formData.emailOrUsername.toLowerCase();
        return (emailMatch || usernameMatch) && emp.hasAccount && emp.isActive;
      });

      if (!employee) {
        setError('Invalid email/username or account not found. Make sure the employee has an active account enabled.');
        setLoading(false);
        return;
      }

      // Check password (default: 123456)
      const defaultPassword = '123456';
      if (formData.password !== defaultPassword) {
        setError('Invalid password. Default password is 123456');
        setLoading(false);
        return;
      }

      // Get department permissions
      const department = departments?.find(dept => dept.name === employee.department);
      
      // Create user session
      const userSession = {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        username: employee.username,
        permissions: department?.permissions || {},
        mustChangePassword: employee.mustChangePassword || false,
        loginTime: new Date(),
        type: 'employee'
      };

      // Store in sessionStorage
      sessionStorage.setItem('employeeUser', JSON.stringify(userSession));
      
      showSuccess(`Welcome back, ${employee.name}!`);
      
      // Navigate based on password change requirement
      if (employee.mustChangePassword) {
        navigate('/employee/change-password');
      } else {
        navigate('/employee/dashboard');
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading for maximum 10 seconds, then show error
  const [showTimeoutError, setShowTimeoutError] = useState(false);
  
  useEffect(() => {
    if (employeesLoading || departmentsLoading) {
      const timeout = setTimeout(() => {
        setShowTimeoutError(true);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutError(false);
    }
  }, [employeesLoading, departmentsLoading]);

  // Handle Firebase permission errors gracefully
  const hasPermissionError = !employeesLoading && !departmentsLoading && (!employees || employees.length === 0);

  // Show loading screen only for first 5 seconds, then show form with warning
  if ((employeesLoading || departmentsLoading) && !showTimeoutError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Employee Data...
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Connecting to database...
          </Typography>
        </Box>
      </Box>
    );
  }

  // If timeout occurred or permission error, show form with warning
  const showDataWarning = showTimeoutError || hasPermissionError;

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <BusinessIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Employee Login
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Access your work dashboard
            </Typography>
          </Box>

          {showDataWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Firebase Permissions Issue:</strong> The application cannot access employee data due to Firebase security rules.
                <br />
                <strong>This is normal for a new setup.</strong>
                <br />
                <strong>Next Steps:</strong>
                <br />• Admin must log in and create employee accounts first
                <br />• Firebase security rules need to be configured
                <br />• Once employees are created, login will work normally
                <br />
                <strong>For now:</strong> Contact your administrator to set up the system.
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email or Username"
              type="text"
              value={formData.emailOrUsername}
              onChange={(e) => handleInputChange('emailOrUsername', e.target.value)}
              fullWidth
              required
              margin="normal"
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              placeholder="Enter your email or username"
            />
            
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              fullWidth
              required
              margin="normal"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Default Password
            </Typography>
          </Divider>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Default Password:</strong> 123456<br/>
              You will be required to change this password on your first login.
            </Typography>
          </Alert>

          <Box textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Need help? Contact your administrator
            </Typography>
            <Link 
              href="#" 
              variant="body2" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/'); // Navigate to admin login
              }}
              sx={{ mt: 1, display: 'block' }}
            >
              Admin Login
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeLoginPage;
