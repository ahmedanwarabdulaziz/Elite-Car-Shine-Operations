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
  Alert,
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
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DirectionsCar as VehicleIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const WorkOrderDashboard = ({ onNavigateToCreate, onViewWorkOrder, onEditWorkOrder, onDeleteWorkOrder }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [vehicleFields, setVehicleFields] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [invoiceReviewDialog, setInvoiceReviewDialog] = useState({ open: false, workOrder: null });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Load vehicle field definitions
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'vehicleFields'), where('isActive', '==', true)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVehicleFields(data);
      },
      (error) => {
        console.error('Error loading vehicle fields:', error);
      }
    );
    return () => unsubscribe();
  }, []);

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
      // Prefer fields that look like a name
      const nameKeys = ['name', 'fullName', 'firstName', 'lastName'];
      for (const key of nameKeys) {
        if (customerFieldsData[key] && typeof customerFieldsData[key] === 'string' && customerFieldsData[key].trim().length > 0) {
          return customerFieldsData[key];
        }
      }
      // Fallback: first non-empty, non-email, non-ID field
      for (const [key, value] of Object.entries(customerFieldsData)) {
        if (
          value &&
          typeof value === 'string' &&
          value.trim().length > 0 &&
          !value.includes('@') &&
          !/^[A-Za-z0-9]{16,}$/.test(value) // not a likely Firestore ID
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

  // Check if work order can progress to next status
  const canProgressToNextStatus = (workOrder) => {
    const nextStatus = getNextStatus(workOrder.status);
    return nextStatus !== null;
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
    // Exclude archived and canceled work orders
    if (workOrder.isArchived || workOrder.isCanceled) {
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
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Work Orders Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {filteredWorkOrders.length} of {workOrders.length} work orders
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNavigateToCreate}
          size="large"
        >
          Create New Work Order
        </Button>
      </Box>

      {/* Search and Filters */}
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
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
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
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Work Orders Grid */}
      {filteredWorkOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No work orders found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || customerTypeFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first work order to get started'
            }
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredWorkOrders.map((workOrder) => {
            // Get vehicle type/category
            const vehicleType = workOrder.group?.name || workOrder.vehicle?.vehicleType || 'Unknown Type';
            // Get key vehicle fields (e.g., Plate No, License)
            const vehicleFieldsData = workOrder.vehicle?.vehicleFields || {};
            const vehicleFieldEntries = Object.entries(vehicleFieldsData).filter(([key, value]) => value && value !== '');
            // Show up to 2 key fields
            const keyVehicleFields = vehicleFieldEntries.slice(0, 2);
            // Get service and bundle names
            const serviceNames = (workOrder.services || []).map(s => s.name).join(', ');
            const bundleNames = (workOrder.bundles || []).map(b => b.name).join(', ');
            // Status color
            const { bg: statusBg, text: statusText } = getStatusColorObj(workOrder.status);
            const statusColor = workOrder.status;
            const statusLabel = getStatusLabel(workOrder.status);
            const isPending = workOrder.status === 'pending';
            // Dates
            const createdDate = formatDate(workOrder.createdAt);
            const updatedDate = formatDate(workOrder.updatedAt);
            // Total
            const total = (Number(calculateTotal(workOrder)) || 0).toFixed(2);

            return (
              <Grid item xs={12} md={6} lg={4} key={workOrder.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'row', boxShadow: 6, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  {/* Vertical Status Bar */}
                  <Box sx={{ width: 16, bgcolor: statusBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                    <Typography sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 'bold', color: statusText, letterSpacing: 2, fontSize: 14 }}>
                      {statusLabel}
                    </Typography>
                  </Box>
                  {/* Card Content */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header with Invoice and Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: statusBg, color: statusText, px: 2, py: 1.5, borderTopRightRadius: 12 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                        #{workOrder.invoiceNumber}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {getCustomerName(workOrder)}
                      </Typography>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      {/* Vehicle Type & Fields Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, mt: 1 }}>
                        <VehicleIcon sx={{ color: 'primary.main', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                          {vehicleType}
                        </Typography>
                        {keyVehicleFields.map(([key, value], idx) => {
                          const fieldDef = vehicleFields.find(f => f.id === key);
                          const label = fieldDef ? fieldDef.name : key.replace(/_/g, ' ');
                          return (
                            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {label}:
                              </Typography>
                              <Typography variant="body2">{value}</Typography>
                              {idx < keyVehicleFields.length - 1 && <span style={{ margin: '0 4px' }}>|</span>}
                            </Box>
                          );
                        })}
                      </Box>
                      {/* Services & Bundles Names */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Services: <span style={{ color: '#1976d2', fontWeight: 500 }}>{serviceNames || 'None'}</span>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bundles: <span style={{ color: '#9c27b0', fontWeight: 500 }}>{bundleNames || 'None'}</span>
                        </Typography>
                      </Box>
                      {/* Dates Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Created: {createdDate}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Updated: {updatedDate}
                        </Typography>
                      </Box>
                    </CardContent>
                    {/* Total - Highlighted */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffde7', borderBottomRightRadius: 12, borderTop: '1px solid #ffe082', py: 1.5, mt: 'auto' }}>
                      <ReceiptIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                      <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ letterSpacing: 2, textShadow: '0 2px 8px #ffe082' }}>
                        ${total}
                      </Typography>
                    </Box>
                    {/* Actions */}
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 1 }}>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => onViewWorkOrder && onViewWorkOrder(workOrder)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onEditWorkOrder && onEditWorkOrder(workOrder)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteWorkOrder && onDeleteWorkOrder(workOrder)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onViewWorkOrder && onViewWorkOrder(workOrder)}
                        >
                          View Details
                        </Button>
                        <Tooltip 
                          title={
                            canProgressToNextStatus(workOrder) 
                              ? `Current: ${workOrder.status} → Next: ${getNextStatus(workOrder.status)}`
                              : `Current: ${workOrder.status} (Final Status)`
                          }
                        >
                          <span>
                            <Button
                              size="small"
                              variant={canProgressToNextStatus(workOrder) ? "contained" : "outlined"}
                              color={canProgressToNextStatus(workOrder) ? "primary" : "inherit"}
                              onClick={() => handleStatusProgression(workOrder)}
                              disabled={!canProgressToNextStatus(workOrder) || updatingStatus === workOrder.id}
                              startIcon={updatingStatus === workOrder.id ? <CircularProgress size={16} /> : <UpdateIcon />}
                            >
                              {updatingStatus === workOrder.id ? 'Updating...' : 'Status'}
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Box>
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
    </Box>
  );
};

export default WorkOrderDashboard; 