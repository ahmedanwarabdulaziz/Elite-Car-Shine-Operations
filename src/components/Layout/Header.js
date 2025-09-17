import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Settings,
  Logout,
} from '@mui/icons-material';
import { useNotification } from '../Common/NotificationSystem';

const Header = ({ onMenuToggle, sidebarOpen }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Check if user is an employee (session-based auth)
      const employeeSession = sessionStorage.getItem('employeeUser');
      
      if (employeeSession) {
        // Employee logout - clear session and redirect to employee login
        sessionStorage.removeItem('employeeUser');
        showSuccess('Logged out successfully');
        navigate('/employee/login');
      } else {
        // Admin logout - sign out from Firebase and redirect to admin login
        await signOut(auth);
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        showSuccess('Logged out successfully');
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear all data and redirect to admin login
      sessionStorage.clear();
      localStorage.clear();
      showSuccess('Logged out successfully');
      navigate('/login');
    }
    
    handleProfileMenuClose();
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
        ml: { md: `${sidebarOpen ? 280 : 0}px` },
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        backgroundColor: 'white',
        color: theme.palette.text.primary,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {isMobile ? 'Elite Detailing' : 'Business Management System'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" size="large">
            <Notifications />
          </IconButton>
          
          <IconButton
            color="inherit"
            size="large"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
              }}
            >
              A
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1,
              minWidth: 200,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleProfileMenuClose}>
            <AccountCircle sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleProfileMenuClose}>
            <Settings sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 