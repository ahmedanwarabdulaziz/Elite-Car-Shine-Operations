import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme/theme';
import MainLayout from './components/Layout/MainLayout';
import EmployeeLayout from './components/Layout/EmployeeLayout';
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
import PendingPaymentsPage from './pages/PendingPayments/PendingPaymentsPage';
import VaultPage from './pages/Vault/VaultPage';
import PaymentReportsPage from './pages/Reports/PaymentReportsPage';
import BankAccountsPage from './pages/BankAccounts/BankAccountsPage';
import ExpenseCategoriesPage from './pages/ExpenseCategories/ExpenseCategoriesPage';
import ExpensesPage from './pages/Expenses/ExpensesPage';
import EmployeesPage from './pages/Employees/EmployeesPage';
import DepartmentsPage from './pages/Departments/DepartmentsPage';
import CorporateSettlementPage from './pages/CorporateSettlement/CorporateSettlementPage';
import EmployeeLoginPage from './pages/EmployeeLoginPage';
import EmployeeChangePasswordPage from './pages/EmployeeChangePasswordPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import LoginPage from './pages/LoginPage';
import DataManagementPage from './pages/DataManagement/DataManagementPage';
import PricingManagementPage from './pages/PricingManagement/PricingManagementPage';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Component to handle routing based on URL and user state
function AppRouter() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for employee session first
    const employeeSession = sessionStorage.getItem('employeeUser');
    if (employeeSession) {
      const employee = JSON.parse(employeeSession);
      setUser({ ...employee, isEmployee: true });
      setLoading(false);
      return;
    }

    // Check for admin Firebase auth
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({ ...firebaseUser, isEmployee: false });
        } else {
          setUser(null);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firebase Auth Error:', error);
        setUser(null);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.warn('Firebase Auth Setup Error:', error);
      setUser(null);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5',
        fontSize: '18px'
      }}>
        Loading Elite Car Detailing System...
      </div>
    );
  }

  // Check if we're on employee routes
  const isEmployeeRoute = location.pathname.startsWith('/employee');

  // Route to appropriate app based on user type and URL
  // Employee routes are handled within the main Routes component below

  // If no user and not on employee route, show admin login
  if (!user && !isEmployeeRoute) {
    return <LoginPage />;
  }

  // If no user and on employee route, show employee login (standalone)
  if (!user && isEmployeeRoute) {
    return (
      <Routes>
        <Route path="/employee/login" element={<EmployeeLoginPage />} />
        <Route path="/employee/change-password" element={<EmployeeChangePasswordPage />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/*" element={<EmployeeLoginPage />} />
      </Routes>
    );
  }

  // If user is logged in as employee, show employee app with admin page access
  if (user?.isEmployee) {
    return (
      <EmployeeLayout>
        <Routes>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/change-password" element={<EmployeeChangePasswordPage />} />
          {/* Employee can access admin pages based on permissions */}
          <Route path="/" element={<EmployeeDashboard />} />
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
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/analytics" element={<div>Analytics Page (Coming Soon)</div>} />
          <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
          <Route path="/invoice-reports" element={<InvoiceReportsPage />} />
          <Route path="/invoice-reports/lifecycle" element={<InvoiceLifecyclePage />} />
          <Route path="/work-order-statuses" element={<WorkOrderStatusesPage />} />
          <Route path="/issued-invoices" element={<IssuedInvoicesPage />} />
          <Route path="/pending-payments" element={<PendingPaymentsPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/bank-accounts" element={<BankAccountsPage />} />
          <Route path="/expense-categories" element={<ExpenseCategoriesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/payment-reports" element={<PaymentReportsPage />} />
          <Route path="/corporate-settlement" element={<CorporateSettlementPage />} />
          <Route path="/data-management" element={<DataManagementPage />} />
          <Route path="/pricing-management" element={<PricingManagementPage />} />
          <Route path="/employee/*" element={<EmployeeDashboard />} />
        </Routes>
      </EmployeeLayout>
    );
  }

  // User is logged in as admin, show admin app
  return (
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
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/analytics" element={<div>Analytics Page (Coming Soon)</div>} />
        <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
        <Route path="/invoice-reports" element={<InvoiceReportsPage />} />
        <Route path="/invoice-reports/lifecycle" element={<InvoiceLifecyclePage />} />
        <Route path="/work-order-statuses" element={<WorkOrderStatusesPage />} />
        <Route path="/issued-invoices" element={<IssuedInvoicesPage />} />
        <Route path="/pending-payments" element={<PendingPaymentsPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/bank-accounts" element={<BankAccountsPage />} />
        <Route path="/expense-categories" element={<ExpenseCategoriesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/payment-reports" element={<PaymentReportsPage />} />
        <Route path="/corporate-settlement" element={<CorporateSettlementPage />} />
        <Route path="/data-management" element={<DataManagementPage />} />
        <Route path="/pricing-management" element={<PricingManagementPage />} />
      </Routes>
    </MainLayout>
  );
}

// Main App with routing logic
function MainApp() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Router>
          <AppRouter />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default MainApp; 