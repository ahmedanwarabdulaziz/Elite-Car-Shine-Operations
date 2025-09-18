import React, { useState, useEffect } from 'react';
import { 
  calculateDueDate, 
  calculatePaymentStatus, 
  isImmediateCash,
  formatDate 
} from '../../utils/paymentCalculations';
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
  Collapse,
  Checkbox,
  FormControlLabel
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
  PhotoCamera as PhotoCameraIcon,
  Build as ServiceIcon,
  LocalOffer as BundleIcon
} from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, where, updateDoc, doc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
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
  const [vehicleFields, setVehicleFields] = useState([]);
  const [viewWorkOrderDialog, setViewWorkOrderDialog] = useState({ open: false, workOrder: null });

  const [deleteWorkOrderDialog, setDeleteWorkOrderDialog] = useState({ open: false, workOrder: null });
  const [deleting, setDeleting] = useState(false);


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

  // Get available payment methods for the current work order's customer group
  const getAvailablePaymentMethods = (workOrder) => {
    console.log('=== GETTING AVAILABLE PAYMENT METHODS ===');
    console.log('Work order:', workOrder);
    console.log('Customer group:', workOrder?.customer?.group);
    console.log('Group payment methods:', workOrder?.customer?.group?.paymentMethods);
    console.log('All payment methods:', paymentMethods);
    
    if (!workOrder?.customer?.group?.paymentMethods) {
      console.log('No specific payment methods assigned to group, returning all active payment methods');
      return paymentMethods;
    }
    
    // Filter payment methods based on customer group's assigned payment methods
    const groupPaymentMethodIds = workOrder.customer.group.paymentMethods;
    const availableMethods = paymentMethods.filter(method => groupPaymentMethodIds.includes(method.id));
    
    console.log('Group payment method IDs:', groupPaymentMethodIds);
    console.log('Available payment methods:', availableMethods);
    console.log('=== END PAYMENT METHODS ===');
    
    return availableMethods;
  };

  // Load vehicle fields
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'vehicleFields'), orderBy('order', 'asc')),
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






  // Helper functions
  const getCustomerName = (workOrder) => {
    if (!workOrder?.customer) return 'Unknown Customer';
    if (workOrder.customerType === 'corporate') {
      // For corporate customers, prioritize the 'name' field which contains the company name
      // Avoid 'description' field which might contain generic terms like 'Dealership'
      const c = workOrder.customer;
      
      // Try different field names in order of preference
      const name = c.name || c.corporateName || c.companyName;
      
      return name || 'Unnamed Corporate Customer';
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
    
    // Priority 1: Use vehicle category/group name if available
    if (workOrder.group && workOrder.group.name) {
      return workOrder.group.name;
    }
    
    // Priority 2: Use vehicle type from vehicle data if available
    if (workOrder.vehicle.vehicleType) {
      return workOrder.vehicle.vehicleType;
    }
    
    // Priority 3: Look for meaningful vehicle information in vehicle fields
    const vehicleFieldsData = workOrder.vehicle.vehicleFields || {};
    
    // Look for common vehicle identifiers
    const vehicleIdentifiers = [
      'make', 'brand', 'manufacturer',
      'model', 'type', 'series',
      'year', 'plate', 'vin'
    ];
    
    let foundValues = [];
    
    // Check each vehicle field for meaningful data
    Object.entries(vehicleFieldsData).forEach(([fieldId, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Check if this field name contains vehicle-related keywords
        const isVehicleField = vehicleIdentifiers.some(identifier => 
          fieldId.toLowerCase().includes(identifier)
        );
        
        if (isVehicleField) {
          foundValues.push(value.trim());
        }
      }
    });
    
    // If we found vehicle-related values, combine them
    if (foundValues.length > 0) {
      return foundValues.join(' ');
    }
    
    // Priority 4: Look for make and model specifically
    const makeField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      key.toLowerCase().includes('make') && value && value.trim() !== ''
    );
    const modelField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      key.toLowerCase().includes('model') && value && value.trim() !== ''
    );
    
    if (makeField && modelField) {
      return `${makeField[1]} ${modelField[1]}`;
    } else if (makeField) {
      return makeField[1];
    } else if (modelField) {
      return modelField[1];
    }
    
    // Priority 5: Look for any non-empty field value
    const anyField = Object.entries(vehicleFieldsData).find(([key, value]) => 
      value && typeof value === 'string' && value.trim() !== ''
    );
    
    if (anyField) {
      return anyField[1];
    }
    
    // Fallback
    return 'Vehicle details not available';
  };

  const getVehicleDetails = (workOrder) => {
    if (!workOrder?.vehicle?.vehicleFields) return [];
    
    const vehicleFieldsData = workOrder.vehicle.vehicleFields || {};
    const details = [];
    
    // Map field IDs to their readable names using the vehicle fields data
    Object.entries(vehicleFieldsData).forEach(([fieldId, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Find the field definition in vehicleFields
        const fieldDefinition = vehicleFields.find(field => field.id === fieldId);
        
        if (fieldDefinition && fieldDefinition.name) {
          details.push({
            label: fieldDefinition.name,
            value: value.trim()
          });
        } else {
          // Fallback: use the field ID as label (formatted)
          details.push({
            label: fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: value.trim()
          });
        }
      }
    });
    
    // Sort details by field order (if available)
    details.sort((a, b) => {
      const fieldA = vehicleFields.find(field => field.name === a.label);
      const fieldB = vehicleFields.find(field => field.name === b.label);
      const orderA = fieldA ? fieldA.order || 999 : 999;
      const orderB = fieldB ? fieldB.order || 999 : 999;
      return orderA - orderB;
    });
    
    return details;
  };

  const calculateTotal = (workOrder) => {
    // Use stored total from work order if available (this is the source of truth)
    if (workOrder.total !== undefined && workOrder.total !== null) {
      return Number(workOrder.total) || 0;
    }
    
    // Fallback: calculate from stored values including tax
    const servicesTotal = (workOrder.services || []).reduce((sum, service) => {
      return sum + (Number(service.price) || 0);
    }, 0);
    
    const bundlesTotal = (workOrder.bundles || []).reduce((sum, bundle) => {
      return sum + (Number(bundle.price) || 0);
    }, 0);
    
    const subtotal = servicesTotal + bundlesTotal;
    
    // Add tax amount if available
    const taxAmount = Number(workOrder.taxAmount) || 0;
    
    return subtotal + taxAmount;
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
    console.log('Opening view dialog for work order:', workOrder.id);
    setViewWorkOrderDialog({ open: true, workOrder });
  };



  // Price calculation functions (same as in Step5ServicesBundles)
  const getServicePrice = (service, workOrder) => {
    // First try the simple price field
    const simplePrice = Number(service.price) || 0;
    
    // Check if we have customer group with categoryType for pricing
    const customerGroup = workOrder?.customer?.group;
    if (!customerGroup?.categoryType) {
      return simplePrice;
    }
    
    // Check if service has category-specific pricing
    if (service.prices && customerGroup.categoryType) {
      const categoryId = customerGroup.categoryType;
      const priceKeys = Object.keys(service.prices);
      
      // Look for any price that starts with the category ID
      for (const priceKey of priceKeys) {
        if (priceKey.startsWith(`${categoryId}_`)) {
          const categoryPrice = service.prices[priceKey];
          return Number(categoryPrice) || 0;
        }
      }
    }
    
    return simplePrice;
  };

  const getBundlePrice = (bundle, workOrder) => {
    // First try the simple price field
    const simplePrice = Number(bundle.price) || 0;
    
    // Check if we have customer group with categoryType for pricing
    const customerGroup = workOrder?.customer?.group;
    if (!customerGroup?.categoryType) {
      return simplePrice;
    }
    
    // Check if bundle has category-specific pricing
    if (bundle.prices && customerGroup.categoryType) {
      const categoryId = customerGroup.categoryType;
      const priceKeys = Object.keys(bundle.prices);
      
      // Look for any price that starts with the category ID
      for (const priceKey of priceKeys) {
        if (priceKey.startsWith(`${categoryId}_`)) {
          const categoryPrice = bundle.prices[priceKey];
          return Number(categoryPrice) || 0;
        }
      }
    }
    
    return simplePrice;
  };




  // Handle delete work order
  const handleDeleteWorkOrder = (workOrder) => {
    setDeleteWorkOrderDialog({ open: true, workOrder });
  };

  // Actually delete the work order from Firestore
  const handleConfirmDelete = async () => {
    if (!deleteWorkOrderDialog.workOrder) return;
    
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'workOrders', deleteWorkOrderDialog.workOrder.id));
      
      // Close dialog and reset state
      setDeleteWorkOrderDialog({ open: false, workOrder: null });
      setDeleting(false);
      
      // Show success message (you might want to add a snackbar or notification)
      console.log('Work order deleted successfully');
      
    } catch (error) {
      console.error('Error deleting work order:', error);
      setDeleting(false);
      // You might want to show an error message here
    }
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
      // Debug tax information
      console.log('=== CREATING INVOICE ===');
      console.log('Work order subtotal:', workOrder.subtotal);
      console.log('Work order tax amount:', workOrder.taxAmount);
      console.log('Work order total:', workOrder.total);
      console.log('Services with tax:', workOrder.services?.map(s => ({ name: s.name, price: s.price, taxAmount: s.taxAmount, totalWithTax: s.totalWithTax })));
      console.log('Bundles with tax:', workOrder.bundles?.map(b => ({ name: b.name, price: b.price, taxAmount: b.taxAmount, totalWithTax: b.totalWithTax })));
      
      // Debug Standard bundle specifically
      const standardBundle = workOrder.bundles?.find(b => b.name === 'Standard Car Cleaning Package');
      if (standardBundle) {
        console.log('🔍 STANDARD BUNDLE IN WORK ORDER:');
        console.log('  - Name:', standardBundle.name);
        console.log('  - Price:', standardBundle.price);
        console.log('  - Tax Amount:', standardBundle.taxAmount);
        console.log('  - Total With Tax:', standardBundle.totalWithTax);
        console.log('  - Tax IDs:', standardBundle.taxIds);
      }
      
      // Get the selected payment method details
      const selectedPaymentMethodDetails = paymentMethods.find(method => method.id === selectedPaymentMethod);
      
      // Calculate payment status and due date
      const invoiceDate = new Date();
      const dueDate = calculateDueDate(invoiceDate, selectedPaymentMethodDetails);
      const paymentStatus = calculatePaymentStatus(selectedPaymentMethodDetails, invoiceDate);
      
      console.log('=== PAYMENT CALCULATIONS ===');
      console.log('Selected payment method:', selectedPaymentMethodDetails);
      console.log('Invoice date:', invoiceDate);
      console.log('Due date:', dueDate);
      console.log('Payment status:', paymentStatus);
      console.log('Is immediate cash:', isImmediateCash(selectedPaymentMethodDetails));
      
      // Create invoice data
      const invoiceData = {
        ...workOrder,
        workOrderId: workOrder.id,
        paymentMethod: selectedPaymentMethod,
        paymentMethodDetails: selectedPaymentMethodDetails, // Store full payment method details
        paymentStatus: paymentStatus, // 'paid', 'pending', 'overdue'
        dueDate: dueDate, // Calculated due date
        settlementMethod: null, // Will be set when settled
        settledAt: null, // Will be set when settled
        notes: invoiceNotes,
        status: 'issued',
        issuedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('Invoice created with stored tax data');
      
      // Debug what's being stored in the invoice
      const standardBundleInInvoice = invoiceData.bundles?.find(b => b.name === 'Standard Car Cleaning Package');
      if (standardBundleInInvoice) {
        console.log('🔍 STANDARD BUNDLE IN INVOICE DATA:');
        console.log('  - Name:', standardBundleInInvoice.name);
        console.log('  - Price:', standardBundleInInvoice.price);
        console.log('  - Tax Amount:', standardBundleInInvoice.taxAmount);
        console.log('  - Total With Tax:', standardBundleInInvoice.totalWithTax);
        console.log('  - Tax IDs:', standardBundleInInvoice.taxIds);
      }
      
      console.log('=== END INVOICE CREATION ===');

      // Remove work order specific fields
      delete invoiceData.id;
      delete invoiceData.status;
      delete invoiceData.createdAt;
      delete invoiceData.updatedAt;

      // Add to invoices collection
      const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);

      // If immediate cash payment, add to vault
      if (isImmediateCash(selectedPaymentMethodDetails)) {
        try {
          const vaultEntry = {
            type: 'cash_received',
            amount: calculateTotal(workOrder),
            description: `Cash received for invoice ${invoiceData.invoiceNumber || 'TBD'}`,
            paymentMethod: selectedPaymentMethod,
            paymentMethodDetails: selectedPaymentMethodDetails,
            invoiceId: invoiceRef.id,
            invoiceNumber: invoiceData.invoiceNumber,
            customerName: getCustomerName(workOrder),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await addDoc(collection(db, 'vaultEntries'), vaultEntry);
          console.log('✅ Vault entry added for immediate cash payment');
        } catch (vaultError) {
          console.error('❌ Error adding vault entry:', vaultError);
          // Don't fail the invoice creation if vault entry fails
        }
      }

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
                      
                      {/* Permanent Action Icons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewWorkOrder(workOrder);
                            }}
                            sx={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkOrder(workOrder);
                            }}
                            sx={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip 
                          title={
                            canProgressToNextStatus(workOrder) 
                              ? `Next: ${getNextStatus(workOrder.status)}`
                              : 'Final Status'
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusProgression(workOrder);
                            }}
                            disabled={!canProgressToNextStatus(workOrder) || updatingStatus === workOrder.id}
                            sx={{ 
                              color: canProgressToNextStatus(workOrder) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                              opacity: canProgressToNextStatus(workOrder) ? 1 : 0.6
                            }}
                          >
                            {updatingStatus === workOrder.id ? <CircularProgress size={16} /> : <UpdateIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <VehicleIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {getVehicleInfo(workOrder)}
                          </Typography>
                        </Box>
                        
                        {/* Vehicle Details */}
                        {getVehicleDetails(workOrder).length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {getVehicleDetails(workOrder).slice(0, 3).map((detail, index) => (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {detail.label}:
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                  {detail.value}
                                </Typography>
                              </Box>
                            ))}
                            {getVehicleDetails(workOrder).length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                +{getVehicleDetails(workOrder).length - 3} more
                              </Typography>
                            )}
                          </Box>
                        )}
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
                              {workOrder.services.map((service, index) => (
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
                              {workOrder.bundles.map((bundle, index) => (
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

                  {/* Collapsible Actions - Now Empty since icons moved to header */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <CardActions sx={{ 
                      p: 2, 
                      pt: 0,
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                      {/* Actions moved to permanent header section */}
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
                          <TableCell align="right">Tax</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceReviewDialog.workOrder.services?.map(service => {
                          // Use stored price and tax from work order
                          const servicePrice = Number(service.price) || 0;
                          const serviceTax = Number(service.taxAmount) || 0;
                          const serviceTotal = servicePrice + serviceTax;
                          
                          return (
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
                                  ${servicePrice.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color={serviceTax > 0 ? "primary" : "text.secondary"}>
                                  ${serviceTax.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                  ${serviceTotal.toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {invoiceReviewDialog.workOrder.bundles?.map(bundle => {
                          // Use stored price and tax from work order
                          const bundlePrice = Number(bundle.price) || 0;
                          const bundleTax = Number(bundle.taxAmount) || 0;
                          const bundleTotal = bundlePrice + bundleTax;
                          
                          return (
                            <TableRow key={`bundle-${bundle.id}`}>
                              <TableCell>
                                <Typography variant="subtitle2">{bundle.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {bundle.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label="Bundle" size="small" color="secondary" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {bundle.notes || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color="primary">
                                  ${bundlePrice.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color={bundleTax > 0 ? "primary" : "text.secondary"}>
                                  ${bundleTax.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                  ${bundleTotal.toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Subtotal Row */}
                        <TableRow>
                          <TableCell colSpan={3}>
                            <Typography variant="h6" fontWeight="bold">Subtotal</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              ${(Number(invoiceReviewDialog.workOrder.subtotal) || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        
                        {/* Tax Row */}
                        {Number(invoiceReviewDialog.workOrder.taxAmount) > 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography variant="h6" fontWeight="bold">Tax</Typography>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell align="right">
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                ${(Number(invoiceReviewDialog.workOrder.taxAmount) || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                        
                        {/* Total Row */}
                        <TableRow>
                          <TableCell colSpan={3}>
                            <Typography variant="h6" fontWeight="bold">Total</Typography>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
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
                      {getAvailablePaymentMethods(invoiceReviewDialog.workOrder).length > 0 ? (
                        getAvailablePaymentMethods(invoiceReviewDialog.workOrder).map((method) => (
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
                        ))
                      ) : (
                        <MenuItem disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PaymentIcon color="disabled" />
                            <Box>
                              <Typography variant="body1" color="text.secondary">
                                No payment methods available for this customer group
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Please assign payment methods to the customer group
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      )}
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
            <Typography variant="h6">View Work Order Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewWorkOrderDialog.workOrder && (
            <Box>
              {/* Customer Information */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon color="primary" />
                    Customer Information
                  </Typography>
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {getCustomerName(viewWorkOrderDialog.workOrder)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Type:</strong> {viewWorkOrderDialog.workOrder.customerType === 'corporate' ? 'Corporate' : 'Individual'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Customer Group:</strong> {viewWorkOrderDialog.workOrder.customer?.group?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {viewWorkOrderDialog.workOrder.customerPhone || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Email:</strong> {viewWorkOrderDialog.workOrder.customerEmail || 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <VehicleIcon color="primary" />
                    Vehicle Information
                  </Typography>
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Vehicle Type:</strong> {viewWorkOrderDialog.workOrder.vehicle?.vehicleType || viewWorkOrderDialog.workOrder.group?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Vehicle Info:</strong> {getVehicleInfo(viewWorkOrderDialog.workOrder)}
                    </Typography>
                    
                    {/* Vehicle Details */}
                    {getVehicleDetails(viewWorkOrderDialog.workOrder).length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                          Vehicle Details:
                        </Typography>
                        <Grid container spacing={1}>
                          {getVehicleDetails(viewWorkOrderDialog.workOrder).map((detail, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, minWidth: '80px' }}>
                                  {detail.label}:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {detail.value}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No vehicle details available
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Services & Bundles */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ServiceIcon color="primary" />
                    Services & Bundles
                  </Typography>
                  <Box>
                    {/* Services */}
                    {viewWorkOrderDialog.workOrder.services && viewWorkOrderDialog.workOrder.services.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1"><strong>Services:</strong></Typography>
                        {viewWorkOrderDialog.workOrder.services.map((service, index) => {
                          const servicePrice = getServicePrice(service, viewWorkOrderDialog.workOrder);
                          return (
                            <Box key={index} sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>• {service.name}</Typography>
                              <Chip label={`$${servicePrice.toFixed(2)}`} size="small" color="primary" />
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Bundles */}
                    {viewWorkOrderDialog.workOrder.bundles && viewWorkOrderDialog.workOrder.bundles.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1"><strong>Bundles:</strong></Typography>
                        {viewWorkOrderDialog.workOrder.bundles.map((bundle, index) => {
                          const bundlePrice = getBundlePrice(bundle, viewWorkOrderDialog.workOrder);
                          return (
                            <Box key={index} sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>• {bundle.name}</Typography>
                              <Chip label={`$${bundlePrice.toFixed(2)}`} size="small" color="secondary" />
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Total */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <strong>Total: ${((viewWorkOrderDialog.workOrder.services || []).reduce((sum, service) => {
                        const servicePrice = getServicePrice(service, viewWorkOrderDialog.workOrder);
                        return sum + servicePrice;
                      }, 0) + (viewWorkOrderDialog.workOrder.bundles || []).reduce((sum, bundle) => {
                        const bundlePrice = getBundlePrice(bundle, viewWorkOrderDialog.workOrder);
                        return sum + bundlePrice;
                      }, 0)).toFixed(2)}</strong>
                      <Chip label="Amount" color="success" size="small" />
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ReceiptIcon color="primary" />
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {viewWorkOrderDialog.workOrder.notes || 'No notes available'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Work Order Details */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssignmentIcon color="primary" />
                    Work Order Details
                  </Typography>
                  <Typography><strong>Invoice Number:</strong> #{viewWorkOrderDialog.workOrder.invoiceNumber}</Typography>
                  <Typography><strong>Status:</strong> {viewWorkOrderDialog.workOrder.status}</Typography>
                  <Typography><strong>Created:</strong> {
                    viewWorkOrderDialog.workOrder.createdAt?.toDate 
                      ? new Date(viewWorkOrderDialog.workOrder.createdAt.toDate()).toLocaleString()
                      : new Date(viewWorkOrderDialog.workOrder.createdAt).toLocaleString()
                  }</Typography>
                  {viewWorkOrderDialog.workOrder.lastUpdated && (
                    <Typography><strong>Last Updated:</strong> {
                      viewWorkOrderDialog.workOrder.lastUpdated.toDate 
                        ? new Date(viewWorkOrderDialog.workOrder.lastUpdated.toDate()).toLocaleString()
                        : new Date(viewWorkOrderDialog.workOrder.lastUpdated).toLocaleString()
                    }</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewWorkOrderDialog({ open: false, workOrder: null })}>
            Close
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
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default WorkOrderDashboard; 
