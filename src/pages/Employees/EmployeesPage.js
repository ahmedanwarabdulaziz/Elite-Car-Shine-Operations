import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
  CircularProgress,
  Chip,
  Grid,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
} from '@mui/material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const EmployeesPage = () => {
  const theme = useTheme();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { 
    data: employees, 
    loading, 
    error, 
    subscribeToData, 
    addDocument, 
    updateDocument, 
    deleteDocument 
  } = useFirebase('employees');

  const { 
    data: departments, 
    loading: departmentsLoading, 
    subscribeToData: subscribeToDepartments 
  } = useFirebase('departments');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    job: '',
    isActive: true,
    username: '',
    hasAccount: false,
    mustChangePassword: false,
  });

  useEffect(() => {
    subscribeToData();
    subscribeToDepartments();
  }, [subscribeToData, subscribeToDepartments]);

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        job: employee.job || '',
        isActive: employee.isActive !== undefined ? employee.isActive : true,
        username: employee.username || '',
        hasAccount: employee.hasAccount || false,
        mustChangePassword: employee.mustChangePassword || false,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        job: '',
        isActive: true,
        username: '',
        hasAccount: false,
        mustChangePassword: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      job: '',
      isActive: true,
      username: '',
      hasAccount: false,
      mustChangePassword: false,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate username when name changes (for new employees)
      if (field === 'name' && !editingEmployee && value.trim()) {
        const username = value.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '.') // Replace spaces with dots
          .substring(0, 20); // Limit length
        updated.username = username;
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        showError('Employee name is required');
        return;
      }
      if (!formData.email.trim()) {
        showError('Employee email is required');
        return;
      }
      if (!formData.phone.trim()) {
        showError('Employee phone is required');
        return;
      }

      const employeeData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        job: formData.job.trim(),
        createdAt: editingEmployee ? editingEmployee.createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (editingEmployee) {
        await updateDocument(editingEmployee.id, employeeData);
        showSuccess('Employee updated successfully');
      } else {
        await addDocument(employeeData);
        showSuccess('Employee added successfully');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving employee:', error);
      showError('Failed to save employee');
    }
  };

  const handleDelete = async (employee) => {
    const confirmed = await showConfirm(
      'Delete Employee',
      `Are you sure you want to delete ${employee.name}? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await deleteDocument(employee.id);
        showSuccess('Employee deleted successfully');
      } catch (error) {
        console.error('Error deleting employee:', error);
        showError('Failed to delete employee');
      }
    }
  };

  const getDepartmentColor = (departmentName) => {
    if (!departmentName || !departments) return 'default';
    
    const department = departments.find(dept => dept.name === departmentName);
    if (department && department.color) {
      // Convert hex color to Material-UI color name for chip
      const colorMap = {
        '#1976d2': 'primary',
        '#dc004e': 'secondary', 
        '#2e7d32': 'success',
        '#ed6c02': 'warning',
        '#9c27b0': 'secondary',
        '#0288d1': 'info',
        '#d32f2f': 'error',
        '#388e3c': 'success',
        '#f57c00': 'warning',
        '#7b1fa2': 'secondary',
      };
      return colorMap[department.color] || 'default';
    }
    return 'default';
  };

  const getDepartmentColorValue = (departmentName) => {
    if (!departmentName || !departments) return '#1976d2';
    
    const department = departments.find(dept => dept.name === departmentName);
    return department?.color || '#1976d2';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading employees: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
        >
          Add Employee
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees && employees.length > 0 ? (
                  employees
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((employee) => (
                      <TableRow key={employee.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                              {employee.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {employee.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {employee.id.slice(-8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" mb={0.5}>
                              <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{employee.email}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                              <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{employee.phone}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Chip
                              label={employee.department || 'Not assigned'}
                              size="small"
                              color={getDepartmentColor(employee.department)}
                              variant="outlined"
                              icon={
                                employee.department ? (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      backgroundColor: getDepartmentColorValue(employee.department),
                                      borderRadius: '50%',
                                    }}
                                  />
                                ) : undefined
                              }
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <WorkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {employee.job || 'Not assigned'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip
                              label={employee.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={employee.isActive ? 'success' : 'default'}
                              variant={employee.isActive ? 'filled' : 'outlined'}
                              sx={{ mb: 0.5 }}
                            />
                            {employee.hasAccount && (
                              <Chip
                                label="Has Account"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                            {employee.mustChangePassword && (
                              <Chip
                                label="Must Change Password"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit Employee">
                            <IconButton
                              onClick={() => handleOpenDialog(employee)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Employee">
                            <IconButton
                              onClick={() => handleDelete(employee)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box py={4}>
                        <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                          No employees found
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                          Add your first employee to get started
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                        >
                          Add Employee
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                fullWidth
                required
                placeholder="Enter employee's full name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                fullWidth
                required
                placeholder="employee@company.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                fullWidth
                required
                placeholder="+1 (555) 123-4567"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  label="Department"
                >
                  <MenuItem value="">
                    <em>Select a department</em>
                  </MenuItem>
                  {departments && departments
                    .filter(dept => dept.isActive)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((department) => (
                      <MenuItem key={department.id} value={department.name}>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              backgroundColor: department.color,
                              borderRadius: '50%',
                              mr: 1
                            }}
                          />
                          {department.name}
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Job Title"
                value={formData.job}
                onChange={(e) => handleInputChange('job', e.target.value)}
                fullWidth
                placeholder="e.g., Manager, Technician, Sales Rep"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Account Management
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Create a login account for this employee to access the system
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasAccount}
                    onChange={(e) => handleInputChange('hasAccount', e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Employee Login Account"
              />
            </Grid>

            {formData.hasAccount && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    fullWidth
                    required={formData.hasAccount}
                    placeholder="Auto-generated from name"
                    helperText="Used for login identification"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Default Password"
                    value="123456"
                    fullWidth
                    disabled
                    helperText="Employee will be required to change this on first login"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Login Instructions:</strong><br/>
                      • Employee will login using their email address<br/>
                      • Default password: <strong>123456</strong><br/>
                      • Employee must change password on first login<br/>
                      • Access permissions will be based on their department
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    color="primary"
                  />
                }
                label="Active Employee"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEmployee ? 'Update' : 'Add'} Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
