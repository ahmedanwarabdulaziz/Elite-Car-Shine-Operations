import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, InputAdornment, FormControlLabel, Switch, Chip, Alert, Grid, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Palette as PaletteIcon, CheckCircle as EndStatusIcon, Cancel as CanceledIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { SketchPicker } from 'react-color';

const WorkOrderStatusesPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FFD600');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [order, setOrder] = useState(0);
  const [isEndStatus, setIsEndStatus] = useState(false);
  const [isCanceledStatus, setIsCanceledStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workOrderStatuses'), orderBy('order', 'asc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStatuses(data);
        
        // Create default statuses if none exist
        if (data.length === 0) {
          createDefaultStatuses();
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const createDefaultStatuses = async () => {
    const defaultStatuses = [
      { name: 'Pending', color: '#FFD600', order: 1, isEndStatus: false, isCanceledStatus: false },
      { name: 'In Progress', color: '#2196F3', order: 2, isEndStatus: false, isCanceledStatus: false },
      { name: 'Review', color: '#FF9800', order: 3, isEndStatus: false, isCanceledStatus: false },
      { name: 'Completed', color: '#4CAF50', order: 4, isEndStatus: true, isCanceledStatus: false },
      { name: 'Cancelled', color: '#F44336', order: 5, isEndStatus: false, isCanceledStatus: true }
    ];

    try {
      const batch = writeBatch(db);
      defaultStatuses.forEach(status => {
        const docRef = doc(collection(db, 'workOrderStatuses'));
        batch.set(docRef, status);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error creating default statuses:', error);
    }
  };

  const handleOpenDialog = (status = null) => {
    setEditingStatus(status);
    setName(status ? status.name : '');
    setColor(status ? status.color : '#FFD600');
    setOrder(status ? status.order || 0 : statuses.length);
    setIsEndStatus(status ? status.isEndStatus || false : false);
    setIsCanceledStatus(status ? status.isCanceledStatus || false : false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setEditingStatus(null);
    setName('');
    setColor('#FFD600');
    setOrder(0);
    setIsEndStatus(false);
    setIsCanceledStatus(false);
    setOpenDialog(false);
    setShowColorPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    // Validation: Only one end status allowed
    if (isEndStatus && !editingStatus) {
      const existingEndStatus = statuses.find(s => s.isEndStatus);
      if (existingEndStatus) {
        alert('Only one end status is allowed. Please edit the existing end status or uncheck this option.');
        return;
      }
    }

    // Validation: End status and canceled status are mutually exclusive
    if (isEndStatus && isCanceledStatus) {
      alert('A status cannot be both an end status and a canceled status.');
      return;
    }

    if (editingStatus) {
      await updateDoc(doc(db, 'workOrderStatuses', editingStatus.id), { 
        name, 
        color, 
        order,
        isEndStatus,
        isCanceledStatus
      });
    } else {
      await addDoc(collection(db, 'workOrderStatuses'), { 
        name, 
        color, 
        order,
        isEndStatus,
        isCanceledStatus
      });
    }
    handleCloseDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this status?')) {
      await deleteDoc(doc(db, 'workOrderStatuses', id));
    }
  };

  const handleReorder = async (statusId, direction) => {
    const currentIndex = statuses.findIndex(s => s.id === statusId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= statuses.length) return;

    const batch = writeBatch(db);
    const currentStatus = statuses[currentIndex];
    const targetStatus = statuses[newIndex];

    batch.update(doc(db, 'workOrderStatuses', currentStatus.id), { order: targetStatus.order });
    batch.update(doc(db, 'workOrderStatuses', targetStatus.id), { order: currentStatus.order });

    await batch.commit();
  };

  const getStatusTypeChip = (status) => {
    if (status.isEndStatus) {
      return <Chip icon={<EndStatusIcon />} label="End Status" color="primary" size="small" />;
    }
    if (status.isCanceledStatus) {
      return <Chip icon={<CanceledIcon />} label="Canceled" color="error" size="small" />;
    }
    return <Chip label="Workflow" color="primary" size="small" />;
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Work Order Statuses
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Workflow Management:</strong> Arrange statuses in order. 
          <strong>End Status:</strong> When reached, work order moves to "Issued Invoices" dashboard. 
          <strong>Canceled Status:</strong> When selected, work order is canceled.
        </Typography>
      </Alert>

      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mb: 3 }}>
        Add Status
      </Button>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}>Order</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statuses.map((status, index) => (
              <TableRow key={status.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ minWidth: 20 }}>
                      {status.order || index + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Tooltip title="Move Up">
                        <IconButton 
                          size="small" 
                          onClick={() => handleReorder(status.id, 'up')}
                          disabled={index === 0}
                        >
                          <DragIcon sx={{ transform: 'rotate(-90deg)', fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Move Down">
                        <IconButton 
                          size="small" 
                          onClick={() => handleReorder(status.id, 'down')}
                          disabled={index === statuses.length - 1}
                        >
                          <DragIcon sx={{ transform: 'rotate(90deg)', fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{status.name}</Typography>
                </TableCell>
                <TableCell>
                  {getStatusTypeChip(status)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 28, height: 28, bgcolor: status.color, borderRadius: '50%', border: '1px solid #ccc' }} />
                    <Typography variant="body2">{status.color}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(status)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(status.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStatus ? 'Edit Status' : 'Add Status'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Status Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Order"
                value={order}
                onChange={e => setOrder(parseInt(e.target.value) || 0)}
                helperText="Position in workflow (lower = earlier)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PaletteIcon sx={{ color }} />
                      </InputAdornment>
                    ),
                    readOnly: true
                  }}
                  sx={{ flexGrow: 1 }}
                  onClick={() => setShowColorPicker(v => !v)}
                />
                <Box 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: color, 
                    borderRadius: '50%', 
                    border: '1px solid #ccc', 
                    cursor: 'pointer' 
                  }} 
                  onClick={() => setShowColorPicker(v => !v)} 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isEndStatus}
                      onChange={(e) => {
                        setIsEndStatus(e.target.checked);
                        if (e.target.checked) setIsCanceledStatus(false);
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EndStatusIcon />
                      <Typography>End Status (moves to invoices)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={isCanceledStatus}
                      onChange={(e) => {
                        setIsCanceledStatus(e.target.checked);
                        if (e.target.checked) setIsEndStatus(false);
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CanceledIcon color="error" />
                      <Typography>Canceled Status</Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
            
            {showColorPicker && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <SketchPicker color={color} onChange={c => setColor(c.hex)} />
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkOrderStatusesPage; 