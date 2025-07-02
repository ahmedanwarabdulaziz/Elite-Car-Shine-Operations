import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  FormControlLabel,
  Chip,
  Tooltip,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Build as ServiceIcon,
  LocalOffer as BundleIcon,
  Business as CorporateIcon,
  Person as IndividualIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNotification } from '../../components/Common/NotificationSystem';
import useFirebase from '../../hooks/useFirebase';
import { useNavigate } from 'react-router-dom';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tax-assignment-tabpanel-${index}`}
    aria-labelledby={`tax-assignment-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const TaxAssignmentPage = () => {
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // Firebase hooks
  const { 
    data: taxes, 
    loading: taxesLoading, 
    subscribeToData: subscribeToTaxes, 
  } = useFirebase('taxes');

  const { 
    data: services, 
    loading: servicesLoading, 
    subscribeToData: subscribeToServices,
    updateDocument: updateService,
  } = useFirebase('services');

  const { 
    data: bundles, 
    loading: bundlesLoading, 
    subscribeToData: subscribeToBundles,
    updateDocument: updateBundle,
  } = useFirebase('bundles');

  const { 
    data: corporateCustomers, 
    loading: corporateCustomersLoading, 
    subscribeToData: subscribeToCorporateCustomers,
    updateDocument: updateCorporateCustomer,
  } = useFirebase('corporateCustomers');

  const { 
    data: individualCustomers, 
    loading: individualCustomersLoading, 
    subscribeToData: subscribeToIndividualCustomers,
    updateDocument: updateIndividualCustomer,
  } = useFirebase('individualCustomers');

  // State
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedTaxes, setSelectedTaxes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Subscribe to real-time data
  useEffect(() => {
    subscribeToTaxes({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToServices({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToBundles({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToCorporateCustomers({ orderBy: 'name', orderDirection: 'asc' });
    subscribeToIndividualCustomers({ orderBy: 'name', orderDirection: 'asc' });
  }, [subscribeToTaxes, subscribeToServices, subscribeToBundles, subscribeToCorporateCustomers, subscribeToIndividualCustomers]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (entity, entityType) => {
    setSelectedEntity({ ...entity, type: entityType });
    setSelectedTaxes(entity.taxIds || []);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntity(null);
    setSelectedTaxes([]);
  };

  const handleTaxToggle = (taxId) => {
    setSelectedTaxes(prev => 
      prev.includes(taxId) 
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    );
  };

  const handleSaveAssignment = async () => {
    if (!selectedEntity) return;

    setLoading(true);
    try {
      const updateData = {
        taxIds: selectedTaxes,
        isTaxable: selectedTaxes.length > 0,
        updatedAt: new Date(),
      };

      switch (selectedEntity.type) {
        case 'service':
          await updateService(selectedEntity.id, updateData);
          break;
        case 'bundle':
          await updateBundle(selectedEntity.id, updateData);
          break;
        case 'corporate':
          await updateCorporateCustomer(selectedEntity.id, updateData);
          break;
        case 'individual':
          await updateIndividualCustomer(selectedEntity.id, updateData);
          break;
        default:
          throw new Error('Invalid entity type');
      }

      showSuccess('Tax assignment updated successfully');
      handleCloseDialog();
    } catch (error) {
      showError('Error updating tax assignment');
    } finally {
      setLoading(false);
    }
  };

  const getActiveTaxes = () => {
    return taxes?.filter(tax => tax.isActive !== false) || [];
  };

  const getTaxNames = (taxIds) => {
    if (!taxIds || !taxes) return [];
    return taxIds
      .map(id => taxes.find(tax => tax.id === id))
      .filter(tax => tax)
      .map(tax => tax.name);
  };

  const getEntityTaxCount = (entity) => {
    return entity.taxIds?.length || 0;
  };

  if (taxesLoading || servicesLoading || bundlesLoading || corporateCustomersLoading || individualCustomersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeTaxes = getActiveTaxes();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/taxes')}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Back to Taxes
          </Button>
          <AssignmentIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Tax Assignment
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ServiceIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {services?.filter(s => s.isTaxable).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taxable Services
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BundleIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {bundles?.filter(b => b.isTaxable).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taxable Bundles
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CorporateIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {corporateCustomers?.filter(c => c.isTaxable).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taxable Corporate Groups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IndividualIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {individualCustomers?.filter(c => c.isTaxable).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taxable Individual Groups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tax assignment tabs">
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ServiceIcon />
                  Services
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BundleIcon />
                  Bundles
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CorporateIcon />
                  Corporate Customers
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IndividualIcon />
                  Individual Groups
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Services Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tax Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied Taxes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services?.map((service) => (
                  <TableRow key={service.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {service.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={service.categoryName || 'N/A'} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                        ${service.price}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={service.isTaxable ? 'Taxable' : 'Non-Taxable'} 
                        color={service.isTaxable ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {getTaxNames(service.taxIds).map((taxName, index) => (
                          <Chip 
                            key={index}
                            label={taxName} 
                            color="primary" 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {getEntityTaxCount(service) === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No taxes
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Assign Taxes">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(service, 'service')}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Bundles Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Bundle Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Services</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tax Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied Taxes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bundles?.map((bundle) => (
                  <TableRow key={bundle.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {bundle.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {bundle.services?.length || 0} services
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                        ${bundle.price}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={bundle.isTaxable ? 'Taxable' : 'Non-Taxable'} 
                        color={bundle.isTaxable ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {getTaxNames(bundle.taxIds).map((taxName, index) => (
                          <Chip 
                            key={index}
                            label={taxName} 
                            color="primary" 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {getEntityTaxCount(bundle) === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No taxes
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Assign Taxes">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(bundle, 'bundle')}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Corporate Customers Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Corporate Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tax Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied Taxes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {corporateCustomers?.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {customer.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.categoryType || 'N/A'} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.isTaxable ? 'Taxable' : 'Non-Taxable'} 
                        color={customer.isTaxable ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {getTaxNames(customer.taxIds).map((taxName, index) => (
                          <Chip 
                            key={index}
                            label={taxName} 
                            color="primary" 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {getEntityTaxCount(customer) === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No taxes
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Assign Taxes">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(customer, 'corporate')}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Individual Groups Tab */}
        <TabPanel value={tabValue} index={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Group Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tax Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied Taxes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {individualCustomers?.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {customer.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.categoryType || 'N/A'} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.isTaxable ? 'Taxable' : 'Non-Taxable'} 
                        color={customer.isTaxable ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {getTaxNames(customer.taxIds).map((taxName, index) => (
                          <Chip 
                            key={index}
                            label={taxName} 
                            color="primary" 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {getEntityTaxCount(customer) === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No taxes
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Assign Taxes">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(customer, 'individual')}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Tax Assignment Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          py: 3,
          px: 4
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Assign Taxes to {selectedEntity?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Available Taxes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select which taxes should apply to this {selectedEntity?.type}:
            </Typography>
            
            {activeTaxes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No active taxes found. Please create taxes first in the Tax Management page.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {activeTaxes.map((tax) => (
                  <Grid item xs={12} md={6} key={tax.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedTaxes.includes(tax.id)}
                          onChange={() => handleTaxToggle(tax.id)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {tax.name} ({tax.rate}%)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tax.description || 'No description'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {selectedTaxes.length > 0 && (
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Selected Taxes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedTaxes.map((taxId) => {
                  const tax = activeTaxes.find(t => t.id === taxId);
                  return tax ? (
                    <Chip 
                      key={tax.id}
                      label={`${tax.name} (${tax.rate}%)`} 
                      color="primary" 
                      variant="filled"
                    />
                  ) : null;
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 2, bgcolor: 'grey.50' }}>
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveAssignment}
            disabled={loading}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Save Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxAssignmentPage; 