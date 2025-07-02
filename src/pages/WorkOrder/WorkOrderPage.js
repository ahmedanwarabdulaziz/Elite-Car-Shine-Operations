import React, { useState, useEffect } from 'react';
import { Container, Paper, Stepper, Step, StepLabel, Box, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Step1CustomerType from './Step1CustomerType';
import Step2CustomerSelect from './Step2CustomerSelect';
import Step3IndividualCustomer from './Step3IndividualCustomer';
import Step4VehicleSelection from './Step4VehicleSelection';
import Step5ServicesBundles from './Step5ServicesBundles';
import Step6Summary from './Step6Summary';
import Step7Submit from './Step7Submit';
import WorkOrderDashboard from './WorkOrderDashboard';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const steps = [
  'Select Customer Type',
  'Select Customer/Group',
  'Select Individual Customer',
  'Select Vehicle',
  'Select Services & Bundles',
  'Review & Create Work Order',
  'Submit Work Order'
];

const WorkOrderPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [customerType, setCustomerType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [corporateCustomers, setCorporateCustomers] = useState([]);
  const [individualGroups, setIndividualGroups] = useState([]);
  const [selectedCustomerOrGroup, setSelectedCustomerOrGroup] = useState(null);
  const [selectedIndividualCustomer, setSelectedIndividualCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState(null);
  const [workOrderData, setWorkOrderData] = useState(null);

  // Load data for step 2
  useEffect(() => {
    if (activeStep !== 1) return;
    
    console.log('Loading data for customerType:', customerType);
    setLoading(true);
    
    let unsubscribe;
    
    if (customerType === 'corporate') {
      console.log('Loading corporate customers...');
      unsubscribe = onSnapshot(
        query(collection(db, 'corporateCustomers'), where('isActive', '==', true)),
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Corporate customers loaded:', data.length, data);
          setCorporateCustomers(data);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading corporate customers:', error);
          setLoading(false);
        }
      );
    } else if (customerType === 'individual') {
      console.log('Loading individual groups...');
      unsubscribe = onSnapshot(
        query(collection(db, 'individualCustomers'), where('isActive', '==', true)),
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Individual groups loaded:', data.length, data);
          setIndividualGroups(data);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading individual groups:', error);
          setLoading(false);
        }
      );
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeStep, customerType]);

  // Filter data for search
  const filteredCorporateCustomers = corporateCustomers.filter(c =>
    c.corporateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredIndividualGroups = individualGroups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      if (activeStep === 1) {
        setCustomerType('');
        setSearchTerm('');
        setSelectedCustomerOrGroup(null);
      } else if (activeStep === 2) {
        setSelectedCustomerOrGroup(null);
        setCustomerSearchTerm('');
        setSelectedIndividualCustomer(null);
      } else if (activeStep === 3) {
        setSelectedIndividualCustomer(null);
        setSelectedVehicle(null);
      } else if (activeStep === 4) {
        setSelectedVehicle(null);
        setWorkOrderData(null);
      } else if (activeStep === 5) {
        // Going back from summary step, clear work order data
        setWorkOrderData(null);
      }
    }
  };

  const handleCustomerTypeSelect = (type) => {
    console.log('Customer type selected:', type);
    setCustomerType(type);
    setSearchTerm('');
    setSelectedCustomerOrGroup(null);
    setActiveStep(1);
  };

  const handleCustomerSelect = (item) => {
    console.log('Customer/Group selected:', item);
    setSelectedCustomerOrGroup(item);
    
    if (customerType === 'corporate') {
      // For corporate customers, go directly to vehicle selection (step 3)
      setActiveStep(3);
    } else {
      // For individual customers, go to individual customer selection (step 2)
      setActiveStep(2);
    }
  };

  const handleIndividualCustomerSelect = (customer) => {
    console.log('Individual customer selected:', customer);
    setSelectedIndividualCustomer(customer);
    // Go to vehicle selection (step 3)
    setActiveStep(3);
  };

  const handleVehicleSelect = (vehicle, vehicleCategory) => {
    setSelectedVehicle(vehicle);
    setSelectedVehicleCategory(vehicleCategory);
    setActiveStep(4);
  };

  const handleWorkOrderComplete = (data) => {
    console.log('WorkOrderPage: Received data from Step5ServicesBundles:', data);
    console.log('WorkOrderPage: Customer type:', data.customerType);
    console.log('WorkOrderPage: Services count:', data.services?.length || 0);
    console.log('WorkOrderPage: Bundles count:', data.bundles?.length || 0);
    setWorkOrderData(data);
    // Go to final review step (step 5)
    setActiveStep(5);
  };

  const handleWorkOrderSubmitted = (savedWorkOrder) => {
    console.log('Work order submitted:', savedWorkOrder);
    // Show dashboard
    setShowDashboard(true);
  };

  const handleNavigateToDashboard = () => {
    setShowDashboard(true);
  };

  const handleNavigateToCreate = () => {
    setShowDashboard(false);
    setActiveStep(0);
    // Reset all state
    setCustomerType('');
    setSearchTerm('');
    setCustomerSearchTerm('');
    setSelectedCustomerOrGroup(null);
    setSelectedIndividualCustomer(null);
    setSelectedVehicle(null);
    setWorkOrderData(null);
  };

  const handleEditCustomer = (updatedWorkOrderData) => {
    // Update the work order data with edited customer information
    setWorkOrderData(updatedWorkOrderData);
  };

  const handleEditVehicle = (updatedWorkOrderData) => {
    // Update the work order data with edited vehicle information
    setWorkOrderData(updatedWorkOrderData);
  };

  const handleEditServices = (updatedWorkOrderData) => {
    // Update the work order data with edited services information
    setWorkOrderData(updatedWorkOrderData);
  };

  const handleGroupChange = (newGroup) => {
    console.log('Changing work order group to:', newGroup);
    setSelectedCustomerOrGroup(newGroup);
    // The customer selection will be handled by the Step3 component
  };

  // Get the current customer (either corporate or individual)
  const getCurrentCustomer = () => {
    if (customerType === 'corporate') {
      return selectedCustomerOrGroup;
    } else {
      return selectedIndividualCustomer;
    }
  };

  // If showing dashboard, render it
  if (showDashboard) {
    return (
      <WorkOrderDashboard
        onNavigateToCreate={handleNavigateToCreate}
        onViewWorkOrder={(workOrder) => {
          // Handle view work order
          console.log('View work order:', workOrder);
        }}
        onEditWorkOrder={(workOrder) => {
          // Handle edit work order
          console.log('Edit work order:', workOrder);
        }}
        onDeleteWorkOrder={(workOrder) => {
          // Handle delete work order
          console.log('Delete work order:', workOrder);
        }}
      />
    );
  }

  // Step rendering
  let stepContent = null;
  
  if (activeStep === 0) {
    stepContent = (
      <Step1CustomerType
        customerType={customerType}
        onSelect={handleCustomerTypeSelect}
      />
    );
  } else if (activeStep === 1) {
    const currentData = customerType === 'corporate' ? filteredCorporateCustomers : filteredIndividualGroups;
    console.log('Rendering step 2 with data:', currentData.length, currentData);
    
    stepContent = (
      <Step2CustomerSelect
        customerType={customerType}
        data={currentData}
        onSelect={handleCustomerSelect}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
      />
    );
  } else if (activeStep === 2) {
    stepContent = (
      <Step3IndividualCustomer
        selectedGroup={selectedCustomerOrGroup}
        onSelect={handleIndividualCustomerSelect}
        searchTerm={customerSearchTerm}
        setSearchTerm={setCustomerSearchTerm}
        loading={loading}
        setLoading={setLoading}
        onGroupChange={handleGroupChange}
      />
    );
  } else if (activeStep === 3) {
    stepContent = (
      <Step4VehicleSelection
        customerType={customerType}
        selectedCustomer={getCurrentCustomer()}
        selectedGroup={selectedCustomerOrGroup}
        onVehicleSelect={handleVehicleSelect}
        loading={loading}
        setLoading={setLoading}
      />
    );
  } else if (activeStep === 4) {
    stepContent = (
      <Step5ServicesBundles
        customerType={customerType}
        selectedCustomer={getCurrentCustomer()}
        selectedGroup={selectedCustomerOrGroup}
        selectedVehicle={selectedVehicle}
        selectedVehicleCategory={selectedVehicleCategory}
        onComplete={handleWorkOrderComplete}
        loading={loading}
        setLoading={setLoading}
      />
    );
  } else if (activeStep === 5) {
    stepContent = (
      <Step6Summary
        workOrderData={workOrderData}
        onEditCustomer={handleEditCustomer}
        onEditVehicle={handleEditVehicle}
        onEditServices={handleEditServices}
        onComplete={(updatedWorkOrderData) => {
          // Update work order data and move to Step7Submit
          console.log('WorkOrderPage: Received data from Step6Summary:', updatedWorkOrderData);
          console.log('WorkOrderPage: Invoice number:', updatedWorkOrderData.invoiceNumber);
          setWorkOrderData(updatedWorkOrderData);
          setActiveStep(6);
        }}
        loading={loading}
        setLoading={setLoading}
      />
    );
  } else if (activeStep === 6) {
    console.log('WorkOrderPage: Rendering Step7Submit with workOrderData:', workOrderData);
    stepContent = (
      <Step7Submit
        workOrderData={workOrderData}
        onComplete={handleWorkOrderSubmitted}
        onNavigateToDashboard={handleNavigateToDashboard}
        loading={loading}
        setLoading={setLoading}
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      <Paper>
        {activeStep > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
          </Box>
        )}
        {stepContent}
      </Paper>
    </Container>
  );
};

export default WorkOrderPage; 