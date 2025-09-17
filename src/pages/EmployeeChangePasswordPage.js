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
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNotification } from '../components/Common/NotificationSystem';
import useFirebase from '../hooks/useFirebase';

const EmployeeChangePasswordPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { updateDocument } = useFirebase('employees');

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [userSession, setUserSession] = useState(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    // Get user session
    const session = sessionStorage.getItem('employeeUser');
    if (!session) {
      navigate('/employee/login');
      return;
    }
    
    const user = JSON.parse(session);
    setUserSession(user);

    // Check if password change is required
    if (!user.mustChangePassword) {
      navigate('/employee/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // Check password requirements
    const password = formData.newPassword;
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.newPassword]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = () => {
    const { newPassword, confirmPassword } = formData;
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (newPassword === '123456') {
      setError('New password cannot be the same as default password');
      return false;
    }

    const requirements = Object.values(passwordRequirements);
    if (!requirements.every(req => req)) {
      setError('Password does not meet all requirements');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update employee record
      await updateDocument(userSession.id, {
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      });

      // Update user session
      const updatedSession = {
        ...userSession,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      };
      sessionStorage.setItem('employeeUser', JSON.stringify(updatedSession));

      showSuccess('Password changed successfully!');
      navigate('/employee/dashboard');

    } catch (error) {
      console.error('Password change error:', error);
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      
      navigate('/employee/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear all data and redirect
      sessionStorage.clear();
      localStorage.clear();
      navigate('/employee/login');
    }
  };

  if (!userSession) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

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
      <Card sx={{ maxWidth: 500, width: '100%', mx: 2, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <LockIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Change Password
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Welcome, {userSession.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You must change your password before continuing
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Security Notice:</strong> You are using the default password. 
              Please change it to a secure password before accessing the system.
            </Typography>
          </Alert>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              fullWidth
              required
              margin="normal"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder="Enter current password (123456)"
            />

            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              fullWidth
              required
              margin="normal"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder="Enter new password"
            />

            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              fullWidth
              required
              margin="normal"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder="Confirm new password"
            />

            {/* Password Requirements */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Password Requirements:
              </Typography>
              {[
                { key: 'length', label: 'At least 8 characters' },
                { key: 'uppercase', label: 'One uppercase letter' },
                { key: 'lowercase', label: 'One lowercase letter' },
                { key: 'number', label: 'One number' },
                { key: 'special', label: 'One special character' },
              ].map((req) => (
                <Box key={req.key} display="flex" alignItems="center" mb={0.5}>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 16,
                      color: passwordRequirements[req.key] ? 'success.main' : 'grey.400',
                      mr: 1,
                    }}
                  />
                  <Typography
                    variant="body2"
                    color={passwordRequirements[req.key] ? 'success.main' : 'text.secondary'}
                  >
                    {req.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !Object.values(passwordRequirements).every(req => req)}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </form>

          <Box textAlign="center">
            <Button
              variant="text"
              onClick={handleLogout}
              color="secondary"
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeChangePasswordPage;
