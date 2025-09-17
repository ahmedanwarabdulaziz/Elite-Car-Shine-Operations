import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper as TablePaper,
  Divider,
  useTheme,
  useMediaQuery,
  Slide,
  Collapse
} from '@mui/material';
import { 
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  DirectionsCar as VehicleIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Videocam as VideoIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import WorkerAssignment from '../../components/WorkOrder/WorkerAssignment';
import MediaUpload from '../../components/Common/MediaUpload';

const WorkOrderDashboard = ({ onNavigateToCreate, onViewWorkOrder, onEditWorkOrder, onDeleteWorkOrder }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [statuses, setStatuses] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [invoiceReviewDialog, setInvoiceReviewDialog] = useState({ open: false, workOrder: null });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set()); // Track which cards are expanded
  const [viewWorkOrderDialog, setViewWorkOrderDialog] = useState({ open: false, workOrder: null });
  const [editWorkOrderDialog, setEditWorkOrderDialog] = useState({ open: false, workOrder: null });
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteWorkOrderDialog, setDeleteWorkOrderDialog] = useState({ open: false, workOrder: null });


  // Load work order statuses
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workOrderStatuses'), orderBy('order', 'asc')),
      (snapshot) => {
        setStatuses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );
    return () => unsubscribe();
  }, []);

  // Load payment methods
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'paymentMethods'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentMethods(data);
      },
      (error) => {
        console.error('Error loading payment methods:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper functions
  const getCustomerName = (workOrder) => {
    if (!workOrder?.customer) return 'Unknown Customer';
    if (workOrder.customerType === 'corporate') {
      // Try multiple possible field names
      const c = workOrder.customer;
      return (
        c.corporateName ||
        c.name ||
        c.companyName ||
        'Unnamed Corporate Customer'
      );
    } else {
      const customerFieldsData = workOrder.customer.customerFields || {};
      
      // First priority: Look for explicit name fields
      const nameKeys = ['name', 'fullName', 'firstName', 'lastName'];
      for (const key of nameKeys) {
        if (customerFieldsData[key] && typeof customerFieldsData[key] === 'string' && customerFieldsData[key].trim().length > 0) {
          return customerFieldsData[key];
        }
      }
      
      // Second priority: Look for fields that contain actual names (not phone numbers or emails)
      for (const [key, value] of Object.entries(customerFieldsData)) {
        if (
          value &&
          typeof value === 'string' &&
          value.trim().length > 0 &&
          !value.includes('@') && // not an email
          !/^[A-Za-z0-9]{16,}$/.test(value) && // not a likely Firestore ID
          !/^\+?[\d\s\-()]{7,}$/.test(value) && // not a phone number
          !key.toLowerCase().includes('phone') && // not a phone field
          !key.toLowerCase().includes('mobile') && // not a mobile field
          !key.toLowerCase().includes('email') && // not an email field
          !key.toLowerCase().includes('address') && // not an address field
          /^[A-Za-z\s]+$/.test(value.trim()) // contains only letters and spaces (likely a name)
        ) {
          return value;
        }
      }
      
      // Third priority: Look for any text field that's not obviously not a name
      for (const [key, value] of Object.entries(customerFieldsData)) {
        if (
          value &&
          typeof value === 'string' &&
          value.trim().length > 0 &&
          !value.includes('@') && // not an email
          !/^[A-Za-z0-9]{16,}$/.test(value) && // not a likely Firestore ID
          !/^\+?[\d\s\-()]{7,}$/.test(value) && // not a phone number
          !key.toLowerCase().includes('phone') &&
          !key.toLowerCase().includes('mobile') &&
          !key.toLowerCase().includes('email') &&
          !key.toLowerCase().includes('address')
        ) {
          return value;
        }
      }
      
      return 'Unnamed Customer';
    }
  };

  const getVehicleInfo = (workOrder) => {
    if (!workOrder?.vehicle) return 'No vehicle';
    
    const vehicleFieldsData = workOrder.vehicle.vehicleFields || {};
    const makeField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      key.toLowerCase().includes('make') || value?.toLowerCase().includes('make')
    );
    const modelField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      key.toLowerCase().includes('model') || value?.toLowerCase().includes('model')
    );
    
    const make = makeField ? makeField[1] : 'Unknown';
    const model = modelField ? modelField[1] : 'Unknown';
    
    return `${make} ${model}`;
  };

  const calculateTotal = (workOrder) => {
    const servicesTotal = (workOrder.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (workOrder.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    return servicesTotal + bundlesTotal;
  };

  const getStatusColorObj = (statusName) => {
    const found = statuses.find(s => s.name?.toLowerCase() === statusName?.toLowerCase());
    return found ? { bg: found.color, text: '#fff' } : { bg: '#E0E0E0', text: '#333' };
  };

  const getStatusLabel = (status) => {
    const found = statuses.find(s => s.name?.toLowerCase() === status?.toLowerCase());
    return found ? found.name : status;
  };

  // Get the next status in the workflow
  const getNextStatus = (currentStatus) => {
    if (!statuses.length) return null;
    
    // Sort statuses by order
    const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
    
    // Find current status index
    const currentIndex = sortedStatuses.findIndex(s => s.name === currentStatus);
    
    if (currentIndex === -1) {
      // If current status not found, return first status
      return sortedStatuses[0]?.name || null;
    }
    
    // If current status is the last one or is an end status, return null
    const currentStatusObj = sortedStatuses[currentIndex];
    if (currentIndex === sortedStatuses.length - 1 || currentStatusObj.isEndStatus) {
      return null;
    }
    
    // Return next status
    return sortedStatuses[currentIndex + 1]?.name || null;
  };

  // Determine view mode based on screen size
  const getEffectiveViewMode = () => {
    if (isMobile) return 'grid';
    if (isTablet) return 'grid'; // Tablets use grid for better touch interaction
    return viewMode; // Desktop can choose between grid and table
  };


  // Check if work order can progress to next status
  const canProgressToNextStatus = (workOrder) => {
    const nextStatus = getNextStatus(workOrder.status);
    return nextStatus !== null;
  };

  // Toggle card expansion
  const toggleCardExpansion = (workOrderId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workOrderId)) {
        newSet.delete(workOrderId);
      } else {
        newSet.add(workOrderId);
      }
      return newSet;
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCustomerTypeFilter('all');
  };

  // Load work orders
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workOrders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading work orders:', error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(workOrder => {
    // Exclude archived, canceled, and completed work orders
    if (workOrder.isArchived || workOrder.isCanceled || workOrder.status === 'completed') {
      return false;
    }
    
    const matchesSearch = 
      workOrder.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(workOrder).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(workOrder).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workOrder.status === statusFilter;
    const matchesCustomerType = customerTypeFilter === 'all' || workOrder.customerType === customerTypeFilter;
    
    return matchesSearch && matchesStatus && matchesCustomerType;
  });

  // Handle automatic status progression
  // Handle view work order
  const handleViewWorkOrder = (workOrder) => {
    setViewWorkOrderDialog({ open: true, workOrder });
  };

  // Handle edit work order
  const handleEditWorkOrder = (workOrder) => {
    console.log('Opening edit dialog for work order:', workOrder.id);
    
    // Initialize form data with current work order data
    setEditFormData({
      customerName: workOrder.customer?.name || workOrder.customerName || '',
      customerPhone: workOrder.customer?.phone || workOrder.customerPhone || '',
      customerEmail: workOrder.customer?.email || workOrder.customerEmail || '',
      vehicleMake: workOrder.vehicle?.make || workOrder.vehicleMake || '',
      vehicleModel: workOrder.vehicle?.model || workOrder.vehicleModel || '',
      vehicleYear: workOrder.vehicle?.year || workOrder.vehicleYear || '',
      vehicleColor: workOrder.vehicle?.color || workOrder.vehicleColor || '',
      vehicleLicensePlate: workOrder.vehicle?.licensePlate || workOrder.vehicleLicensePlate || '',
      notes: workOrder.notes || ''
    });
    
    setEditWorkOrderDialog({ open: true, workOrder });
  };

  // Handle form input changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editWorkOrderDialog.workOrder) return;
    
    setSavingEdit(true);
    try {
      const workOrderRef = doc(db, 'workOrders', editWorkOrderDialog.workOrder.id);
      
      // Prepare update data
      const updateData = {
        customerName: editFormData.customerName,
        customerPhone: editFormData.customerPhone,
        customerEmail: editFormData.customerEmail,
        vehicleMake: editFormData.vehicleMake,
        vehicleModel: editFormData.vehicleModel,
        vehicleYear: editFormData.vehicleYear,
        vehicleColor: editFormData.vehicleColor,
        vehicleLicensePlate: editFormData.vehicleLicensePlate,
        notes: editFormData.notes,
        lastUpdated: serverTimestamp()
      };

      await updateDoc(workOrderRef, updateData);
      
      console.log('Work order updated successfully');
      setEditWorkOrderDialog({ open: false, workOrder: null });
      setEditFormData({});
      
    } catch (error) {
      console.error('Error updating work order:', error);
      alert('Failed to update work order. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle delete work order
  const handleDeleteWorkOrder = (workOrder) => {
    setDeleteWorkOrderDialog({ open: true, workOrder });
  };

  const handleStatusProgression = async (workOrder) => {
    const nextStatus = getNextStatus(workOrder.status);
    
    if (!nextStatus) {
      return; // Silently return if no next status available
    }
    
    setUpdatingStatus(workOrder.id);
    
    try {
      const selectedStatus = statuses.find(s => s.name === nextStatus);
      
      // Check if the next status is "done" or an end status
      if (selectedStatus?.isEndStatus || nextStatus.toLowerCase() === 'done') {
        // Open invoice review popup instead of updating status
        setInvoiceReviewDialog({ open: true, workOrder });
        setUpdatingStatus(null);
        return;
      }
      
      // Update work order status for non-end statuses
      await updateDoc(doc(db, 'workOrders', workOrder.id), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      
      // No alert messages - status change happens silently
      
    } catch (error) {
      console.error('Error updating work order status:', error);
      // Only show error alert if something goes wrong
      alert('Error updating status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle invoice review popup close
  const handleCloseInvoiceReview = () => {
    setInvoiceReviewDialog({ open: false, workOrder: null });
    setSelectedPaymentMethod('');
    setInvoiceNotes('');
  };

  // Handle invoice submission
  const handleSubmitInvoice = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    const workOrder = invoiceReviewDialog.workOrder;
    if (!workOrder) return;

    setSubmittingInvoice(true);

    try {
      // Create invoice data
      const invoiceData = {
        ...workOrder,
        workOrderId: workOrder.id,
        paymentMethod: selectedPaymentMethod,
        notes: invoiceNotes,
        status: 'issued',
        issuedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Remove work order specific fields
      delete invoiceData.id;
      delete invoiceData.status;
      delete invoiceData.createdAt;
      delete invoiceData.updatedAt;

      // Add to invoices collection
      await addDoc(collection(db, 'invoices'), invoiceData);

      // Update work order to mark as completed
      await updateDoc(doc(db, 'workOrders', workOrder.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Close popup and reset state
      handleCloseInvoiceReview();
      
    } catch (error) {
      console.error('Error submitting invoice:', error);
      alert('Error submitting invoice. Please try again.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Get payment method display info
  const getPaymentMethodDisplay = (paymentMethodId) => {
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    if (!method) return 'Unknown';
    
    const typeInfo = {
      'immediate_cash': 'Immediate Cash Payment',
      'immediate_digital': 'Immediate Digital Payment',
      'advance': 'Advance Payment',
      'standard_credit': `Standard Credit (${method.daysAllowed} days)`,
      'end_of_month': `End of Month + ${method.daysAllowed} days`
    };
    
    return `${method.name} - ${typeInfo[method.type] || method.type}`;
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 4,
      pb: isMobile ? 2 : 4
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
          <AssignmentIcon sx={{ mr: 2, color: 'primary.main', fontSize: isMobile ? 28 : 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
              Work Orders Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {filteredWorkOrders.length} active work orders
            </Typography>
          </Box>
          
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          {/* View Mode Toggle - Desktop Only */}
          {isDesktop && (
            <Box sx={{ display: 'flex', mr: 2 }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                size="small"
              >
                <GridIcon />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('table')}
                color={viewMode === 'table' ? 'primary' : 'default'}
                size="small"
              >
                <ListIcon />
              </IconButton>
            </Box>
          )}
          
          {/* Filter Toggle - Mobile/Tablet */}
          {(isMobile || isTablet) && (
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          )}
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNavigateToCreate}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
        >
          Create New Work Order
        </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Slide direction="down" in={showFilters || isDesktop} mountOnEnter unmountOnExit>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
                size={isMobile ? "small" : "medium"}
            />
          </Grid>
          
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                {statuses.filter(status => status.name !== 'completed').map((status) => (
                  <MenuItem key={status.id} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                label="Customer Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="corporate">Corporate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
            <Grid item xs={12} sm={12} md={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
                size={isMobile ? "small" : "medium"}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>
      </Slide>

      {/* Work Orders Display */}
      {filteredWorkOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AssignmentIcon sx={{ fontSize: isMobile ? 48 : 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant={isMobile ? "h5" : "h6"} color="text.secondary" gutterBottom>
            No work orders found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || customerTypeFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first work order to get started'
            }
          </Typography>
        </Box>
      ) : getEffectiveViewMode() === 'table' ? (
        /* Table View - Desktop Only */
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkOrders.map((workOrder) => {
                  const total = (Number(calculateTotal(workOrder)) || 0).toFixed(2);
                  const { bg: statusBg, text: statusText } = getStatusColorObj(workOrder.status);
                  const statusLabel = getStatusLabel(workOrder.status);
                  
                  return (
                    <TableRow key={workOrder.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          #{workOrder.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{getCustomerName(workOrder)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{getVehicleInfo(workOrder)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={statusLabel} 
                          sx={{ 
                            bgcolor: statusBg, 
                            color: statusText,
                            fontWeight: 'bold'
                          }} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                          ${total}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(workOrder.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewWorkOrder(workOrder)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditWorkOrder(workOrder)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Status">
                            <IconButton
                              size="small"
                              onClick={() => handleStatusProgression(workOrder)}
                              disabled={!canProgressToNextStatus(workOrder) || updatingStatus === workOrder.id}
                              color="secondary"
                            >
                              {updatingStatus === workOrder.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <UpdateIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* Grid View - Mobile, Tablet, and Desktop */
        <Grid container spacing={isMobile ? 2 : 3}>
          {filteredWorkOrders.map((workOrder) => {
            const { bg: statusBg, text: statusText } = getStatusColorObj(workOrder.status);
            const statusLabel = getStatusLabel(workOrder.status);
            const total = (Number(calculateTotal(workOrder)) || 0).toFixed(2);
            const serviceCount = (workOrder.services || []).length;
            const bundleCount = (workOrder.bundles || []).length;
            const createdDate = formatDate(workOrder.createdAt);
            const isExpanded = expandedCards.has(workOrder.id);

            return (
              <Grid item xs={12} sm={isTablet ? 6 : 12} md={isTablet ? 6 : 4} lg={4} key={workOrder.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-2px)',
                    boxShadow: isMobile ? '0 2px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main'
                  }
                }}>
                  {/* Header */}
                  <Box sx={{
                    bgcolor: statusBg,
                    color: statusText,
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }} onClick={() => toggleCardExpansion(workOrder.id)}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                        #{workOrder.invoiceNumber}
                    </Typography>
                      <Typography variant="body2" fontWeight="500" sx={{ 
                        fontSize: '0.9rem', 
                        opacity: 0.9,
                        mb: 0.5
                      }}>
                        {getCustomerName(workOrder)}
                      </Typography>
                      <Chip 
                        label={statusLabel} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'inherit',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          height: 20
                        }} 
                      />
                  </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: 'inherit' }}>
                        ${total}
                      </Typography>
                      <IconButton 
                        size="small" 
                        sx={{ color: 'inherit' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpansion(workOrder.id);
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>


                  {/* Collapsible Content */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Customer & Vehicle */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5 }}>
                        {getCustomerName(workOrder)}
                      </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VehicleIcon sx={{ fontSize: 16 }} />
                          {getVehicleInfo(workOrder)}
                      </Typography>
                    </Box>

                      {/* Services & Bundles Summary */}
                      <Box sx={{ mb: 2 }}>
                        {/* Services */}
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                              Services
                        </Typography>
                            <Typography variant="body2" fontWeight="600" color="primary.main">
                              {serviceCount}
                              </Typography>
                            </Box>
                          {workOrder.services && workOrder.services.length > 0 && (
                            <Box sx={{ pl: 1 }}>
                              {workOrder.services.slice(0, 2).map((service, index) => (
                                <Typography 
                                  key={service.id || index}
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ 
                                    display: 'block', 
                                    fontSize: '0.7rem',
                                    lineHeight: 1.2,
                                    mb: 0.25
                                  }}
                                >
                                  • {service.name}
                                </Typography>
                              ))}
                              {workOrder.services.length > 2 && (
                                <Typography 
                                  variant="caption" 
                                  color="primary.main" 
                                  sx={{ 
                                    display: 'block', 
                                    fontSize: '0.7rem',
                                    fontWeight: 500
                                  }}
                                >
                                  +{workOrder.services.length - 2} more
                                </Typography>
                              )}
                      </Box>
                          )}
                        </Box>

                        {/* Bundles */}
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                              Bundles
                        </Typography>
                            <Typography variant="body2" fontWeight="600" color="secondary.main">
                              {bundleCount}
                        </Typography>
                      </Box>
                          {workOrder.bundles && workOrder.bundles.length > 0 && (
                            <Box sx={{ pl: 1 }}>
                              {workOrder.bundles.slice(0, 2).map((bundle, index) => (
                                <Typography 
                                  key={bundle.id || index}
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ 
                                    display: 'block', 
                                    fontSize: '0.7rem',
                                    lineHeight: 1.2,
                                    mb: 0.25
                                  }}
                                >
                                  • {bundle.name}
                                </Typography>
                              ))}
                              {workOrder.bundles.length > 2 && (
                                <Typography 
                                  variant="caption" 
                                  color="secondary.main" 
                                  sx={{ 
                                    display: 'block', 
                                    fontSize: '0.7rem',
                                    fontWeight: 500
                                  }}
                                >
                                  +{workOrder.bundles.length - 2} more
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          Created: {createdDate}
                        </Typography>
                      </Box>
                    
                      {/* Worker Assignment */}
                      <Box sx={{ mb: 2 }}>
                      <WorkerAssignment 
                        workOrder={workOrder} 
                        onUpdate={() => {
                          const q = query(collection(db, 'workOrders'), orderBy('createdAt', 'desc'));
                          onSnapshot(q, (snapshot) => {
                            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            setWorkOrders(data);
                          });
                        }}
                      />
                    </Box>
                    
                    {/* Media Upload Section */}
                    <Box sx={{ mt: 2 }}>
                      <MediaUpload
                        workOrderId={workOrder.id}
                        existingMedia={workOrder.media ? Object.values(workOrder.media) : []}
                        onMediaUpdate={(newMedia) => {
                          // Update work order with new media
                          const workOrderRef = doc(db, 'workOrders', workOrder.id);
                          const mediaObject = {};
                          newMedia.forEach((item, index) => {
                            mediaObject[item.id || `media_${index}`] = item;
                          });
                          updateDoc(workOrderRef, {
                            media: mediaObject,
                            lastUpdated: serverTimestamp()
                          });
                        }}
                      />
                    </Box>
                    
                    </CardContent>
                  </Collapse>

                  {/* Collapsible Actions */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <CardActions sx={{ 
                      p: 2, 
                      pt: 0,
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                    {isMobile ? (
                      /* Mobile Actions - Stacked */
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewWorkOrder(workOrder)}
                          startIcon={<ViewIcon />}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          View Details
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditWorkOrder(workOrder)}
                            startIcon={<EditIcon />}
                            sx={{ flex: 1 }}
                          >
                            Edit
                          </Button>
                          <Tooltip 
                            title={
                              canProgressToNextStatus(workOrder) 
                                ? `Next: ${getNextStatus(workOrder.status)}`
                                : 'Final Status'
                            }
                          >
                            <Button
                              size="small"
                              variant={canProgressToNextStatus(workOrder) ? "contained" : "outlined"}
                              color={canProgressToNextStatus(workOrder) ? "primary" : "inherit"}
                              onClick={() => handleStatusProgression(workOrder)}
                              disabled={!canProgressToNextStatus(workOrder) || updatingStatus === workOrder.id}
                              startIcon={updatingStatus === workOrder.id ? <CircularProgress size={16} /> : <UpdateIcon />}
                              sx={{ flex: 1 }}
                            >
                              {updatingStatus === workOrder.id ? 'Updating...' : 'Status'}
                            </Button>
                          </Tooltip>
                    </Box>
                      </Box>
                    ) : (
                      /* Desktop/Tablet Actions - Horizontal */
                      <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewWorkOrder(workOrder)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditWorkOrder(workOrder)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteWorkOrder(workOrder)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                          </Tooltip>
                      </Box>
                        <Tooltip 
                          title={
                            canProgressToNextStatus(workOrder) 
                              ? `Next: ${getNextStatus(workOrder.status)}`
                              : 'Final Status'
                          }
                        >
                            <Button
                              size="small"
                              variant={canProgressToNextStatus(workOrder) ? "contained" : "outlined"}
                              color={canProgressToNextStatus(workOrder) ? "primary" : "inherit"}
                              onClick={() => handleStatusProgression(workOrder)}
                              disabled={!canProgressToNextStatus(workOrder) || updatingStatus === workOrder.id}
                              startIcon={updatingStatus === workOrder.id ? <CircularProgress size={16} /> : <UpdateIcon />}
                            >
                            {updatingStatus === workOrder.id ? 'Updating...' : 'Next Status'}
                            </Button>
                        </Tooltip>
                      </Box>
                    )}
                    </CardActions>
                  </Collapse>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Invoice Review Dialog */}
      <Dialog 
        open={invoiceReviewDialog.open} 
        onClose={handleCloseInvoiceReview} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6">Review & Issue Invoice</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {invoiceReviewDialog.workOrder && (
            <Box>
              {/* Work Order Summary */}
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Work Order Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Invoice #:</strong> {invoiceReviewDialog.workOrder.invoiceNumber}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Customer:</strong> {getCustomerName(invoiceReviewDialog.workOrder)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Vehicle:</strong> {getVehicleInfo(invoiceReviewDialog.workOrder)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Services:</strong> {invoiceReviewDialog.workOrder.services?.length || 0} selected
                      </Typography>
                      <Typography variant="body2">
                        <strong>Bundles:</strong> {invoiceReviewDialog.workOrder.bundles?.length || 0} selected
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total:</strong> ${(Number(calculateTotal(invoiceReviewDialog.workOrder)) || 0).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Services & Bundles Details */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Services & Bundles</Typography>
                  <TableContainer component={TablePaper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell align="right">Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceReviewDialog.workOrder.services?.map(service => (
                          <TableRow key={`service-${service.id}`}>
                            <TableCell>
                              <Typography variant="subtitle2">{service.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {service.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label="Service" size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {service.notes || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2" color="primary">
                                ${(Number(service.price) || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {invoiceReviewDialog.workOrder.bundles?.map(bundle => (
                          <TableRow key={`bundle-${bundle.id}`}>
                            <TableCell>
                              <Typography variant="subtitle2">{bundle.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {bundle.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label="Bundle" size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {bundle.notes || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2" color="primary">
                                ${(Number(bundle.price) || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Total Row */}
                        <TableRow>
                          <TableCell colSpan={3}>
                            <Typography variant="h6" fontWeight="bold">Total</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" color="success.main" fontWeight="bold">
                              ${(Number(calculateTotal(invoiceReviewDialog.workOrder)) || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Divider sx={{ mb: 3 }} />

              {/* Payment Method Selection */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Payment Method</Typography>
                  <FormControl fullWidth>
                    <InputLabel>Select Payment Method</InputLabel>
                    <Select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      label="Select Payment Method"
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.id} value={method.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PaymentIcon color="primary" />
                            <Box>
                              <Typography variant="body1">{method.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getPaymentMethodDisplay(method.id)}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Additional Notes</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Add any additional notes or special instructions for the invoice..."
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceReview} disabled={submittingInvoice}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitInvoice} 
            variant="contained"
            color="primary"
            disabled={!selectedPaymentMethod || submittingInvoice}
            startIcon={submittingInvoice ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {submittingInvoice ? 'Issuing Invoice...' : 'Issue Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Work Order Dialog */}
      <Dialog 
        open={viewWorkOrderDialog.open} 
        onClose={() => setViewWorkOrderDialog({ open: false, workOrder: null })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon color="primary" />
            <Typography variant="h6">Work Order Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewWorkOrderDialog.workOrder && (
            <Box>
              {/* Customer Information */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    Customer Information
                  </Typography>
                  <Typography><strong>Name:</strong> {viewWorkOrderDialog.workOrder.customerName}</Typography>
                  <Typography><strong>Type:</strong> {viewWorkOrderDialog.workOrder.customerType === 'corporate' ? 'Corporate' : 'Individual'}</Typography>
                  {viewWorkOrderDialog.workOrder.customerPhone && (
                    <Typography><strong>Phone:</strong> {viewWorkOrderDialog.workOrder.customerPhone}</Typography>
                  )}
                  {viewWorkOrderDialog.workOrder.customerEmail && (
                    <Typography><strong>Email:</strong> {viewWorkOrderDialog.workOrder.customerEmail}</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VehicleIcon color="primary" />
                    Vehicle Information
                  </Typography>
                  <Typography><strong>Make:</strong> {viewWorkOrderDialog.workOrder.vehicleMake}</Typography>
                  <Typography><strong>Model:</strong> {viewWorkOrderDialog.workOrder.vehicleModel}</Typography>
                  <Typography><strong>Year:</strong> {viewWorkOrderDialog.workOrder.vehicleYear}</Typography>
                  <Typography><strong>Color:</strong> {viewWorkOrderDialog.workOrder.vehicleColor}</Typography>
                  <Typography><strong>License Plate:</strong> {viewWorkOrderDialog.workOrder.vehicleLicensePlate}</Typography>
                </CardContent>
              </Card>

              {/* Services & Bundles */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon color="primary" />
                    Services & Bundles
                  </Typography>
                  {viewWorkOrderDialog.workOrder.services && viewWorkOrderDialog.workOrder.services.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1"><strong>Services:</strong></Typography>
                      {viewWorkOrderDialog.workOrder.services.map((service, index) => (
                        <Typography key={index} sx={{ ml: 2 }}>
                          • {service.name} - ${service.price}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {viewWorkOrderDialog.workOrder.bundles && viewWorkOrderDialog.workOrder.bundles.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1"><strong>Bundles:</strong></Typography>
                      {viewWorkOrderDialog.workOrder.bundles.map((bundle, index) => (
                        <Typography key={index} sx={{ ml: 2 }}>
                          • {bundle.name} - ${bundle.price}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    <strong>Total: ${viewWorkOrderDialog.workOrder.totalAmount || 0}</strong>
                  </Typography>
                </CardContent>
              </Card>

              {/* Status & Dates */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UpdateIcon color="primary" />
                    Status & Timeline
                  </Typography>
                  <Typography><strong>Current Status:</strong> 
                    <Chip 
                      label={viewWorkOrderDialog.workOrder.status} 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography><strong>Created:</strong> {new Date(viewWorkOrderDialog.workOrder.createdAt?.toDate()).toLocaleString()}</Typography>
                  {viewWorkOrderDialog.workOrder.lastUpdated && (
                    <Typography><strong>Last Updated:</strong> {new Date(viewWorkOrderDialog.workOrder.lastUpdated.toDate()).toLocaleString()}</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Media Attachments */}
              {viewWorkOrderDialog.workOrder.media && Object.keys(viewWorkOrderDialog.workOrder.media).length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhotoCameraIcon color="primary" />
                      Media Attachments
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.values(viewWorkOrderDialog.workOrder.media).map((mediaItem, index) => (
                        <Box key={index} sx={{ width: 100, height: 100 }}>
                          {mediaItem.type === 'video' ? (
                            <Box
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: 1,
                                bgcolor: 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <VideoIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                            </Box>
                          ) : (
                            <Box
                              component="img"
                              src={mediaItem.thumb || mediaItem.url}
                              alt="Media attachment"
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: 1,
                                objectFit: 'cover',
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewWorkOrderDialog({ open: false, workOrder: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Work Order Dialog */}
      <Dialog 
        open={editWorkOrderDialog.open} 
        onClose={() => setEditWorkOrderDialog({ open: false, workOrder: null })} 
        maxWidth="sm" 
        fullWidth
        sx={{ zIndex: 9999 }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            <Typography variant="h6">Edit Work Order</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
            Edit Work Order Details
          </Typography>
          
          {/* Customer Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={editFormData.customerName || ''}
                  onChange={(e) => handleEditFormChange('customerName', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editFormData.customerPhone || ''}
                  onChange={(e) => handleEditFormChange('customerPhone', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={editFormData.customerEmail || ''}
                  onChange={(e) => handleEditFormChange('customerEmail', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Vehicle Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VehicleIcon color="primary" />
              Vehicle Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Make"
                  value={editFormData.vehicleMake || ''}
                  onChange={(e) => handleEditFormChange('vehicleMake', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={editFormData.vehicleModel || ''}
                  onChange={(e) => handleEditFormChange('vehicleModel', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Year"
                  value={editFormData.vehicleYear || ''}
                  onChange={(e) => handleEditFormChange('vehicleYear', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Color"
                  value={editFormData.vehicleColor || ''}
                  onChange={(e) => handleEditFormChange('vehicleColor', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="License Plate"
                  value={editFormData.vehicleLicensePlate || ''}
                  onChange={(e) => handleEditFormChange('vehicleLicensePlate', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Notes Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Additional Notes
            </Typography>
            <TextField
              fullWidth
              label="Work Order Notes"
              value={editFormData.notes || ''}
              onChange={(e) => handleEditFormChange('notes', e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setEditWorkOrderDialog({ open: false, workOrder: null })}
            disabled={savingEdit}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveEdit}
            disabled={savingEdit}
            startIcon={savingEdit ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Work Order Dialog */}
      <Dialog 
        open={deleteWorkOrderDialog.open} 
        onClose={() => setDeleteWorkOrderDialog({ open: false, workOrder: null })} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Delete Work Order</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Are you sure you want to delete this work order? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Work Order ID: {deleteWorkOrderDialog.workOrder?.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer: {deleteWorkOrderDialog.workOrder?.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vehicle: {deleteWorkOrderDialog.workOrder?.vehicleMake} {deleteWorkOrderDialog.workOrder?.vehicleModel}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteWorkOrderDialog({ open: false, workOrder: null })}>
            Cancel
          </Button>
          <Button variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default WorkOrderDashboard; 