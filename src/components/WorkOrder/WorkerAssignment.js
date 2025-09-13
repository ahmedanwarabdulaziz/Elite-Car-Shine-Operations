import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Tooltip,
  Badge,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNotification } from '../Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const WorkerAssignment = ({ workOrder, onUpdate }) => {
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

  const { 
    updateDocument: updateWorkOrder
  } = useFirebase('workOrders');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  useEffect(() => {
    subscribeToEmployees();
    subscribeToDepartments();
  }, [subscribeToEmployees, subscribeToDepartments]);

  useEffect(() => {
    if (workOrder) {
      setSelectedWorkers(workOrder.assignedWorkers || []);
    }
  }, [workOrder]);

  // Get available workers (from departments that can perform detailing)
  const getAvailableWorkers = () => {
    if (!employees || !departments) return [];
    
    const detailingDepartments = departments.filter(dept => 
      dept.isActive && dept.canPerformDetailing
    );
    
    const detailingDepartmentNames = detailingDepartments.map(dept => dept.name);
    
    return employees.filter(employee => 
      employee.isActive && 
      detailingDepartmentNames.includes(employee.department)
    );
  };

  const availableWorkers = getAvailableWorkers();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleWorkerToggle = (workerId) => {
    setSelectedWorkers(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const handleSaveAssignment = async () => {
    try {
      const assignmentData = {
        assignedWorkers: selectedWorkers,
        assignedAt: new Date(),
        assignedBy: 'current-user', // TODO: Get from auth context
      };

      await updateWorkOrder(workOrder.id, assignmentData);
      
      if (onUpdate) {
        onUpdate();
      }
      
      showSuccess('Workers assigned successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error assigning workers:', error);
      showError('Failed to assign workers');
    }
  };

  const getWorkerName = (workerId) => {
    const worker = availableWorkers.find(emp => emp.id === workerId);
    return worker ? worker.name : 'Unknown Worker';
  };

  const getWorkerDepartment = (workerId) => {
    const worker = availableWorkers.find(emp => emp.id === workerId);
    return worker ? worker.department : 'Unknown Department';
  };

  const getDepartmentColor = (departmentName) => {
    const department = departments?.find(dept => dept.name === departmentName);
    return department?.color || '#1976d2';
  };


  if (employeesLoading || departmentsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" component="div">
              <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Worker Assignment
            </Typography>
            <Button
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenDialog}
              variant="outlined"
            >
              Assign Workers
            </Button>
          </Box>

          {selectedWorkers.length > 0 ? (
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  {selectedWorkers.length} worker{selectedWorkers.length > 1 ? 's' : ''} assigned
                </Typography>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedWorkers.map(workerId => (
                  <Chip
                    key={workerId}
                    avatar={
                      <Avatar sx={{ 
                        bgcolor: getDepartmentColor(getWorkerDepartment(workerId)),
                        width: 24,
                        height: 24,
                        fontSize: '0.75rem'
                      }}>
                        {getWorkerName(workerId).charAt(0)}
                      </Avatar>
                    }
                    label={getWorkerName(workerId)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 1 }}>
              No workers assigned to this work order
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Assign Workers to Work Order
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Available Workers
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Select workers from detailing-capable departments
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                {availableWorkers.length > 0 ? (
                  availableWorkers.map((worker) => (
                    <Grid item xs={12} sm={6} key={worker.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedWorkers.includes(worker.id) ? 2 : 1,
                          borderColor: selectedWorkers.includes(worker.id) ? 'primary.main' : 'divider',
                          bgcolor: selectedWorkers.includes(worker.id) ? 'primary.50' : 'background.paper',
                        }}
                        onClick={() => handleWorkerToggle(worker.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ 
                              mr: 2, 
                              bgcolor: getDepartmentColor(worker.department),
                              width: 40,
                              height: 40
                            }}>
                              {worker.name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {worker.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {worker.job || 'No job title'}
                              </Typography>
                              <Chip
                                label={worker.department}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  mt: 0.5,
                                  height: 20,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                            {selectedWorkers.includes(worker.id) && (
                              <CheckCircleIcon color="primary" />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      No workers available. Create departments with detailing capabilities and assign employees to them.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveAssignment} variant="contained">
            Assign Workers
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerAssignment;
