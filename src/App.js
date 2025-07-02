import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme/theme';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CategoriesPage from './pages/Categories/CategoriesPage';
import VehicleCategoriesPage from './pages/VehicleCategories/VehicleCategoriesPage';
import ServicesPage from './pages/Services/ServicesPage';
import BundlesPage from './pages/Bundles/BundlesPage';
import PaymentMethodsPage from './pages/PaymentMethods/PaymentMethodsPage';
import TaxesPage from './pages/Taxes/TaxesPage';
import TaxAssignmentPage from './pages/Taxes/TaxAssignmentPage';
import CustomerFieldsPage from './pages/CustomerFields/CustomerFieldsPage';
import VehicleFieldsPage from './pages/VehicleFields/VehicleFieldsPage';
import CorporateCustomersPage from './pages/Customers/CorporateCustomers/CorporateCustomersPage';
import IndividualCustomersPage from './pages/Customers/IndividualCustomers/IndividualCustomersPage';
import CreateCustomerPage from './pages/Customers/CreateCustomer/CreateCustomerPage';
import WorkOrderPage from './pages/WorkOrder/WorkOrderPage';
import WorkOrderDashboardPage from './pages/WorkOrder/WorkOrderDashboardPage';
import { NotificationProvider } from './components/Common/NotificationSystem';
import InvoiceReportsPage from './pages/InvoiceReports/InvoiceReportsPage';
import InvoiceLifecyclePage from './pages/InvoiceReports/Lifecycle/InvoiceLifecyclePage';
import WorkOrderStatusesPage from './pages/WorkOrder/WorkOrderStatusesPage';
import IssuedInvoicesPage from './pages/WorkOrder/IssuedInvoicesPage';
import LoginPage from './pages/LoginPage';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginPage />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/vehicle-categories" element={<VehicleCategoriesPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/bundles" element={<BundlesPage />} />
              <Route path="/payment-methods" element={<PaymentMethodsPage />} />
              <Route path="/taxes" element={<TaxesPage />} />
              <Route path="/tax-assignment" element={<TaxAssignmentPage />} />
              <Route path="/customer-fields" element={<CustomerFieldsPage />} />
              <Route path="/vehicle-fields" element={<VehicleFieldsPage />} />
              <Route path="/corporate-customers" element={<CorporateCustomersPage />} />
              <Route path="/individual-customers" element={<IndividualCustomersPage />} />
              <Route path="/create-customer" element={<CreateCustomerPage />} />
              <Route path="/work-orders" element={<WorkOrderPage />} />
              <Route path="/work-orders-dashboard" element={<WorkOrderDashboardPage />} />
              <Route path="/invoices" element={<div>Invoices Page (Coming Soon)</div>} />
              <Route path="/finance" element={<div>Finance Page (Coming Soon)</div>} />
              <Route path="/employees" element={<div>Employees Page (Coming Soon)</div>} />
              <Route path="/analytics" element={<div>Analytics Page (Coming Soon)</div>} />
              <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
              <Route path="/invoice-reports" element={<InvoiceReportsPage />} />
              <Route path="/invoice-reports/lifecycle" element={<InvoiceLifecyclePage />} />
              <Route path="/work-order-statuses" element={<WorkOrderStatusesPage />} />
              <Route path="/issued-invoices" element={<IssuedInvoicesPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App; 