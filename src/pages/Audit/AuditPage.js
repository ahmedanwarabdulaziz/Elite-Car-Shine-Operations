import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Tooltip,
  useTheme,
  CircularProgress,
  Alert,
  Pagination,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Work as EmployeeIcon,
  SystemUpdateAlt as SystemIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';

const AuditPage = () => {
  const theme = useTheme();
  const { showError } = useNotification();
  
  // State for all collections data
  const [allAuditData, setAllAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Collections to audit
  const collections = [
    'categories', 'vehicleCategories', 'services', 'bundles', 
    'paymentMethods', 'taxes', 'customerFields', 'vehicleFields',
    'employees', 'departments', 'workOrderStatuses', 'corporateCustomers',
    'individualCustomers', 'bankAccounts', 'expenseCategories', 'expenses',
    'workOrders', 'invoices', 'pricingManagement'
  ];
  
  // Load audit data from all collections
  useEffect(() => {
    const loadAuditData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const auditPromises = collections.map(async (collectionName) => {
          try {
            const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
            const { db } = await import('../../firebase/config');
            
            const q = query(
              collection(db, collectionName),
              orderBy('updatedAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              collection: collectionName,
              ...doc.data()
            }));
          } catch (err) {
            console.warn(`Error loading ${collectionName}:`, err);
            return [];
          }
        });
        
        const results = await Promise.all(auditPromises);
        const allData = results.flat().sort((a, b) => 
          new Date(b.updatedAt?.toDate?.() || b.updatedAt) - 
          new Date(a.updatedAt?.toDate?.() || a.updatedAt)
        );
        
        setAllAuditData(allData);
      } catch (err) {
        console.error('Error loading audit data:', err);
        setError('Failed to load audit data');
        showError('Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };
    
    loadAuditData();
  }, [showError]);
  
  // Filter data based on search and filters
  const filteredData = allAuditData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.updatedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.collection?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCollection = selectedCollection === 'all' || item.collection === selectedCollection;
    const matchesUserType = selectedUserType === 'all' || item.updatedBy?.type === selectedUserType;
    
    return matchesSearch && matchesCollection && matchesUserType;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  // Get user icon based on type
  const getUserIcon = (userType) => {
    switch (userType) {
      case 'admin': return <AdminIcon />;
      case 'employee': return <EmployeeIcon />;
      case 'system': return <SystemIcon />;
      default: return <PersonIcon />;
    }
  };
  
  // Get user color based on type
  const getUserColor = (userType) => {
    switch (userType) {
      case 'admin': return theme.palette.primary.main;
      case 'employee': return theme.palette.secondary.main;
      case 'system': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString();
  };
  
  // Get collection display name
  const getCollectionDisplayName = (collection) => {
    const names = {
      categories: 'Categories',
      vehicleCategories: 'Vehicle Categories',
      services: 'Services',
      bundles: 'Bundles',
      paymentMethods: 'Payment Methods',
      taxes: 'Taxes',
      customerFields: 'Customer Fields',
      vehicleFields: 'Vehicle Fields',
      employees: 'Employees',
      departments: 'Departments',
      workOrderStatuses: 'Work Order Statuses',
      corporateCustomers: 'Corporate Customers',
      individualCustomers: 'Individual Customers',
      bankAccounts: 'Bank Accounts',
      expenseCategories: 'Expense Categories',
      expenses: 'Expenses',
      workOrders: 'Work Orders',
      invoices: 'Invoices',
      pricingManagement: 'Pricing Management'
    };
    return names[collection] || collection;
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
          Audit Trail
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search items, users, or collections..."
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
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Collection</InputLabel>
                <Select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  label="Collection"
                >
                  <MenuItem value="all">All Collections</MenuItem>
                  {collections.map(collection => (
                    <MenuItem key={collection} value={collection}>
                      {getCollectionDisplayName(collection)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  value={selectedUserType}
                  onChange={(e) => setSelectedUserType(e.target.value)}
                  label="User Type"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {filteredData.length} items found
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Audit Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Collection</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Updated By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={`${item.collection}-${item.id}-${index}`} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {item.name || item.title || item.id}
                        </Typography>
                        {item.isActive === false && (
                          <Chip label="Inactive" size="small" color="error" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getCollectionDisplayName(item.collection)} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    
                    <TableCell>
                      {item.createdBy ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: getUserColor(item.createdBy.type),
                              fontSize: '0.75rem'
                            }}
                          >
                            {getUserIcon(item.createdBy.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.createdBy.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.createdBy.type}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unknown
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {item.updatedBy ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: getUserColor(item.updatedBy.type),
                              fontSize: '0.75rem'
                            }}
                          >
                            {getUserIcon(item.updatedBy.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.updatedBy.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.updatedBy.type}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unknown
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatDate(item.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatDate(item.updatedAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Summary */}
      <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} audit entries
        </Typography>
      </Box>
    </Box>
  );
};

export default AuditPage;

