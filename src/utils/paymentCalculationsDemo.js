/**
 * Demo script to show payment calculation functions in action
 * This can be run in the browser console to test the functions
 */

import {
  calculateDueDate,
  calculatePaymentStatus,
  isImmediateCash,
  canBeUsedForSettlement,
  getDaysUntilDue,
  formatDate,
  getPaymentStatusColor,
  getPaymentStatusLabel
} from './paymentCalculations';

// Demo data
const invoiceDate = new Date('2024-01-15');
const currentDate = new Date('2024-01-20');

const paymentMethods = [
  {
    name: 'Cash Payment',
    type: 'immediate_cash',
    isImmediateCash: true
  },
  {
    name: 'Credit Card',
    type: 'immediate_digital',
    isImmediateCash: false
  },
  {
    name: 'Net 30',
    type: 'standard_credit',
    daysAllowed: 30,
    isImmediateCash: false
  },
  {
    name: 'End of Month + 5',
    type: 'end_of_month',
    daysAllowed: 5,
    isImmediateCash: false
  }
];

export const runPaymentCalculationsDemo = () => {
  console.log('=== Payment Calculations Demo ===');
  console.log(`Invoice Date: ${formatDate(invoiceDate)}`);
  console.log(`Current Date: ${formatDate(currentDate)}`);
  console.log('');

  paymentMethods.forEach(method => {
    console.log(`--- ${method.name} ---`);
    
    const dueDate = calculateDueDate(invoiceDate, method);
    const status = calculatePaymentStatus(method, invoiceDate, currentDate);
    const daysUntilDue = getDaysUntilDue(dueDate, currentDate);
    
    console.log(`Type: ${method.type}`);
    console.log(`Is Immediate Cash: ${isImmediateCash(method)}`);
    console.log(`Can Be Used for Settlement: ${canBeUsedForSettlement(method)}`);
    console.log(`Due Date: ${formatDate(dueDate)}`);
    console.log(`Status: ${getPaymentStatusLabel(status)} (${getPaymentStatusColor(status)})`);
    console.log(`Days Until Due: ${daysUntilDue}`);
    console.log('');
  });
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runPaymentCalculationsDemo = runPaymentCalculationsDemo;
}
