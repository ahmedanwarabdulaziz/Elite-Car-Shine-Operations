import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ColorLens as ColorIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ExpenseCategoriesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', category: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Predefined colors for categories
  const categoryColors = [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
    '#00796b', '#5d4037', '#455a64', '#e91e63', '#ff9800',
    '#4caf50', '#2196f3', '#ff5722', '#9c27b0', '#607d8b'
  ];

  // Load expense categories
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'expenseCategories'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading expense categories:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Handle dialog open
  const handleOpenDialog = (mode, category = null) => {
    setDialog({ open: true, mode, category });
    if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        color: '#1976d2',
        isActive: true
      });
    } else {
      setFormData({
        name: category?.name || '',
        description: category?.description || '',
        color: category?.color || '#1976d2',
        isActive: category?.isActive ?? true
      });
    }
    setError('');
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialog({ open: false, mode: 'create', category: null });
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      isActive: true
    });
    setError('');
    setSubmitting(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };

      if (dialog.mode === 'create') {
        categoryData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'expenseCategories'), categoryData);
        console.log('✅ Expense category created successfully');
      } else {
        await updateDoc(doc(db, 'expenseCategories', dialog.category.id), categoryData);
        console.log('✅ Expense category updated successfully');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving expense category:', error);
      setError('Error saving expense category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'expenseCategories', category.id));
        console.log('✅ Expense category deleted successfully');
      } catch (error) {
        console.error('Error deleting expense category:', error);
        alert('Error deleting expense category. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CategoryIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Expense Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage expense categories for better organization
          </Typography>
        </Box>
      </Box>

      {/* Add Category Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Expense Category
        </Button>
      </Box>

      {/* Categories Table */}
      {categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No expense categories found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add your first expense category to start organizing expenses
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 500 }} size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Color</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                          border: '1px solid #ccc'
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {category.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {category.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          backgroundColor: category.color,
                          border: '1px solid #ccc'
                        }}
                      />
                      <Typography variant="body2" fontFamily="monospace">
                        {category.color}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={category.isActive ? <CheckCircleIcon /> : <WarningIcon />}
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Category">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', category)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Category">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(category)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialog.open} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">
              {dialog.mode === 'create' ? 'Add Expense Category' : 'Edit Expense Category'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name *"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="e.g., Office Supplies, Vehicle Maintenance"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Optional description for this category..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Category Color
              </Typography>
              <Grid container spacing={1}>
                {categoryColors.map((color) => (
                  <Grid item key={color}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        backgroundColor: color,
                        border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                        cursor: 'pointer',
                        '&:hover': {
                          border: '2px solid #000'
                        }
                      }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  </Grid>
                ))}
              </Grid>
              <TextField
                fullWidth
                label="Custom Color"
                value={formData.color}
                onChange={handleInputChange('color')}
                placeholder="#1976d2"
                sx={{ mt: 1 }}
                InputProps={{
                  startAdornment: <ColorIcon sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('isActive')({ target: { checked: e.target.value === 'active' } })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <CategoryIcon />}
          >
            {submitting ? 'Saving...' : (dialog.mode === 'create' ? 'Add Category' : 'Update Category')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseCategoriesPage;
