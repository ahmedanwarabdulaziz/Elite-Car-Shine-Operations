import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Alert,
  Chip,
  Grid,
  CircularProgress,
  Divider,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DataManagementPage = () => {
  const theme = useTheme();
  const [collections, setCollections] = useState({
    workOrders: { data: [], loading: true, selected: [] },
    invoices: { data: [], loading: true, selected: [] },
    corporateCustomers: { data: [], loading: true, selected: [] },
    customers: { data: [], loading: true, selected: [] },
    individualCustomers: { data: [], loading: true, selected: [] },
    services: { data: [], loading: true, selected: [] },
    bundles: { data: [], loading: true, selected: [] },
    categories: { data: [], loading: true, selected: [] },
    vehicleCategories: { data: [], loading: true, selected: [] },
    vehicleFields: { data: [], loading: true, selected: [] },
    customerFields: { data: [], loading: true, selected: [] },
    paymentMethods: { data: [], loading: true, selected: [] },
    workOrderStatuses: { data: [], loading: true, selected: [] },
    taxes: { data: [], loading: true, selected: [] },
    employees: { data: [], loading: true, selected: [] },
    departments: { data: [], loading: true, selected: [] },
    // New collections for payment management system
    vaultEntries: { data: [], loading: true, selected: [] },
    bankAccounts: { data: [], loading: true, selected: [] },
    expenseCategories: { data: [], loading: true, selected: [] },
    expenses: { data: [], loading: true, selected: [] },
  });

  const [deleteDialog, setDeleteDialog] = useState({ open: false, collection: null, records: [] });
  const [clearDialog, setClearDialog] = useState({ open: false, collection: null });
  const [deleting, setDeleting] = useState(false);
  const [searchTerms, setSearchTerms] = useState({});
  const [expandedCollections, setExpandedCollections] = useState({});

  // Load data for all collections
  useEffect(() => {
    loadAllCollections();
  }, []);

  const loadAllCollections = async () => {
    const collectionNames = Object.keys(collections);
    
    for (const collectionName of collectionNames) {
      try {
        setCollections(prev => ({
          ...prev,
          [collectionName]: { ...prev[collectionName], loading: true }
        }));

        const collectionRef = collection(db, collectionName);
        
        // Use different ordering fields for different collections
        let q;
        if (collectionName === 'invoices') {
          q = query(collectionRef, orderBy('issuedAt', 'desc'));
        } else if (collectionName === 'workOrders') {
          q = query(collectionRef, orderBy('createdAt', 'desc'));
        } else {
          q = query(collectionRef, orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setCollections(prev => ({
          ...prev,
          [collectionName]: { data, loading: false, selected: [] }
        }));
      } catch (error) {
        console.error(`Error loading ${collectionName}:`, error);
        
        // If ordering fails, try without ordering
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setCollections(prev => ({
            ...prev,
            [collectionName]: { data, loading: false, selected: [] }
          }));
        } catch (fallbackError) {
          console.error(`Error loading ${collectionName} without ordering:`, fallbackError);
          setCollections(prev => ({
            ...prev,
            [collectionName]: { data: [], loading: false, selected: [], error: fallbackError.message }
          }));
        }
      }
    }
  };

  const handleSelectRecord = (collectionName, recordId, checked) => {
    setCollections(prev => {
      const collection = prev[collectionName];
      const selected = checked 
        ? [...collection.selected, recordId]
        : collection.selected.filter(id => id !== recordId);
      
      return {
        ...prev,
        [collectionName]: { ...collection, selected }
      };
    });
  };

  const handleSelectAll = (collectionName, checked) => {
    setCollections(prev => {
      const collection = prev[collectionName];
      const selected = checked ? collection.data.map(record => record.id) : [];
      
      return {
        ...prev,
        [collectionName]: { ...collection, selected }
      };
    });
  };

  const handleDeleteSelected = (collectionName) => {
    const collection = collections[collectionName];
    const selectedRecords = collection.data.filter(record => 
      collection.selected.includes(record.id)
    );
    
    setDeleteDialog({
      open: true,
      collection: collectionName,
      records: selectedRecords
    });
  };

  const handleClearCollection = (collectionName) => {
    setClearDialog({
      open: true,
      collection: collectionName
    });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { collection: collectionName, records } = deleteDialog;
      
      for (const record of records) {
        await deleteDoc(doc(db, collectionName, record.id));
      }

      // Reload the collection
      await loadCollection(collectionName);
      
      setDeleteDialog({ open: false, collection: null, records: [] });
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Error deleting records: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmClearCollection = async () => {
    setDeleting(true);
    try {
      const { collection: collectionName } = clearDialog;
      const collectionData = collections[collectionName].data;
      
      for (const record of collectionData) {
        await deleteDoc(doc(db, collectionName, record.id));
      }

      // Reload the collection
      await loadCollection(collectionName);
      
      setClearDialog({ open: false, collection: null });
    } catch (error) {
      console.error('Error clearing collection:', error);
      alert('Error clearing collection: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const loadCollection = async (collectionName) => {
    try {
      setCollections(prev => ({
        ...prev,
        [collectionName]: { ...prev[collectionName], loading: true }
      }));

      const collectionRef = collection(db, collectionName);
      
      // Use different ordering fields for different collections
      let q;
      if (collectionName === 'invoices') {
        q = query(collectionRef, orderBy('issuedAt', 'desc'));
      } else if (collectionName === 'workOrders') {
        q = query(collectionRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(collectionRef, orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCollections(prev => ({
        ...prev,
        [collectionName]: { data, loading: false, selected: [] }
      }));
    } catch (error) {
      console.error(`Error loading ${collectionName}:`, error);
      
      // If ordering fails, try without ordering
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setCollections(prev => ({
          ...prev,
          [collectionName]: { data, loading: false, selected: [] }
        }));
      } catch (fallbackError) {
        console.error(`Error loading ${collectionName} without ordering:`, fallbackError);
        setCollections(prev => ({
          ...prev,
          [collectionName]: { data: [], loading: false, selected: [], error: fallbackError.message }
        }));
      }
    }
  };

  const handleSearchChange = (collectionName, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [collectionName]: value
    }));
  };

  const getFilteredData = (collectionName) => {
    const collection = collections[collectionName];
    const searchTerm = searchTerms[collectionName] || '';
    
    if (!searchTerm) return collection.data;
    
    return collection.data.filter(record => {
      const searchableText = JSON.stringify(record).toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
  };

  const toggleCollectionExpansion = (collectionName) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionName]: !prev[collectionName]
    }));
  };

  const renderRecordPreview = (record) => {
    // Show key fields for quick identification
    const previewFields = [];
    
    if (record.name) previewFields.push(`Name: ${record.name}`);
    if (record.invoiceNumber) previewFields.push(`Invoice: ${record.invoiceNumber}`);
    if (record.status) previewFields.push(`Status: ${record.status}`);
    if (record.customerType) previewFields.push(`Type: ${record.customerType}`);
    if (record.email) previewFields.push(`Email: ${record.email}`);
    if (record.description) previewFields.push(`Desc: ${record.description}`);
    if (record.total) previewFields.push(`Total: $${record.total}`);
    if (record.customer?.name) previewFields.push(`Customer: ${record.customer.name}`);
    if (record.vehicle?.make && record.vehicle?.model) previewFields.push(`Vehicle: ${record.vehicle.make} ${record.vehicle.model}`);
    
    // New fields for payment management collections
    if (record.amount) previewFields.push(`Amount: $${record.amount}`);
    if (record.type) previewFields.push(`Type: ${record.type}`);
    if (record.location) previewFields.push(`Location: ${record.location}`);
    if (record.bankName) previewFields.push(`Bank: ${record.bankName}`);
    if (record.accountNumber) previewFields.push(`Account: ${record.accountNumber}`);
    if (record.categoryName) previewFields.push(`Category: ${record.categoryName}`);
    if (record.vendor) previewFields.push(`Vendor: ${record.vendor}`);
    if (record.paymentMethod) previewFields.push(`Payment: ${record.paymentMethod}`);
    if (record.color) previewFields.push(`Color: ${record.color}`);
    if (record.isActive !== undefined) previewFields.push(`Active: ${record.isActive ? 'Yes' : 'No'}`);
    
    return previewFields.slice(0, 3).join(' | ');
  };

  const renderCollectionTable = (collectionName) => {
    const collection = collections[collectionName];
    const filteredData = getFilteredData(collectionName);
    const allSelected = filteredData.length > 0 && 
      filteredData.every(record => collection.selected.includes(record.id));

    if (collection.loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (collection.error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Error loading {collectionName}: {collection.error}
        </Alert>
      );
    }

    return (
      <Box>
        {/* Search and Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={`Search ${collectionName}...`}
            value={searchTerms[collectionName] || ''}
            onChange={(e) => handleSearchChange(collectionName, e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <Chip 
            label={`${filteredData.length} records`} 
            color="primary" 
            variant="outlined" 
          />
          
          {collection.selected.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteSelected(collectionName)}
              size="small"
            >
              Delete Selected ({collection.selected.length})
            </Button>
          )}
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearAllIcon />}
            onClick={() => handleClearCollection(collectionName)}
            size="small"
            disabled={filteredData.length === 0}
          >
            Clear All
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={collection.selected.length > 0 && !allSelected}
                    onChange={(e) => handleSelectAll(collectionName, e.target.checked)}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Preview</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={collection.selected.includes(record.id)}
                      onChange={(e) => handleSelectRecord(collectionName, record.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {record.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {renderRecordPreview(record)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {record.createdAt?.toDate ? 
                      record.createdAt.toDate().toLocaleDateString() : 
                      record.issuedAt?.toDate ?
                      record.issuedAt.toDate().toLocaleDateString() :
                      'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteSelected(collectionName, [record])}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StorageIcon color="primary" />
        Data Management
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <WarningIcon sx={{ mr: 1 }} />
          Warning: This page allows you to delete data from your database.
        </Typography>
        <Typography variant="body2">
          Use with caution! Deleted data cannot be recovered. Make sure you have backups if needed.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {Object.entries(collections).map(([collectionName, collection]) => (
          <Grid item xs={12} key={collectionName}>
            <Accordion 
              expanded={expandedCollections[collectionName] || false}
              onChange={() => toggleCollectionExpansion(collectionName)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {collectionName.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Chip 
                    label={`${collection.data.length} records`} 
                    color={collection.data.length > 0 ? 'primary' : 'default'}
                    size="small"
                  />
                  {collection.selected.length > 0 && (
                    <Chip 
                      label={`${collection.selected.length} selected`} 
                      color="error"
                      size="small"
                    />
                  )}
                  {collection.loading && <CircularProgress size={20} />}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {renderCollectionTable(collectionName)}
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, collection: null, records: [] })}>
        <DialogTitle>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete {deleteDialog.records.length} record(s) from{' '}
            <strong>{deleteDialog.collection}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. The following records will be deleted:
          </Typography>
          <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
            {deleteDialog.records.slice(0, 10).map((record, index) => (
              <Typography key={record.id} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {index + 1}. {record.id} - {renderRecordPreview(record)}
              </Typography>
            ))}
            {deleteDialog.records.length > 10 && (
              <Typography variant="body2" color="text.secondary">
                ... and {deleteDialog.records.length - 10} more records
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, collection: null, records: [] })}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Collection Confirmation Dialog */}
      <Dialog open={clearDialog.open} onClose={() => setClearDialog({ open: false, collection: null })}>
        <DialogTitle>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          Clear Collection
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to <strong>DELETE ALL</strong> records from{' '}
            <strong>{clearDialog.collection}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This will permanently delete {collections[clearDialog.collection]?.data.length || 0} records.
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            This action cannot be undone! Make sure you have backups if needed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialog({ open: false, collection: null })}>
            Cancel
          </Button>
          <Button 
            onClick={confirmClearCollection} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <ClearAllIcon />}
          >
            {deleting ? 'Clearing...' : 'Clear All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataManagementPage;
