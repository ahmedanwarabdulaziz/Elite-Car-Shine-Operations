/**
 * Payment calculation utilities
 * Handles due date calculations and payment status logic
 */

/**
 * Calculate due date based on payment method type and invoice date
 * @param {Date} invoiceDate - The date when the invoice was created
 * @param {Object} paymentMethod - The payment method object
 * @returns {Date} The calculated due date
 */
export const calculateDueDate = (invoiceDate, paymentMethod) => {
  if (!invoiceDate || !paymentMethod) {
    return invoiceDate;
  }

  const date = new Date(invoiceDate);
  
  switch (paymentMethod.type) {
    case 'immediate_cash':
    case 'immediate_digital':
    case 'advance':
      // Immediate payments are due on the same day
      return date;
      
    case 'standard_credit':
      // Standard credit: invoice date + daysAllowed
      if (paymentMethod.daysAllowed && paymentMethod.daysAllowed > 0) {
        return addDays(date, paymentMethod.daysAllowed);
      }
      return date;
      
    case 'end_of_month':
      // End of month: end of current month + additional days
      if (paymentMethod.daysAllowed !== undefined) {
        const endOfMonth = getEndOfMonth(date);
        return addDays(endOfMonth, paymentMethod.daysAllowed || 0);
      }
      return getEndOfMonth(date);
      
    default:
      // Fallback: same day
      return date;
  }
};

/**
 * Determine payment status based on payment method and current date
 * @param {Object} paymentMethod - The payment method object
 * @param {Date} invoiceDate - The date when the invoice was created
 * @param {Date} currentDate - The current date (defaults to today)
 * @returns {string} Payment status: 'paid', 'pending', 'overdue'
 */
export const calculatePaymentStatus = (paymentMethod, invoiceDate, currentDate = new Date()) => {
  if (!paymentMethod || !invoiceDate) {
    return 'pending';
  }

  // Immediate cash payments are always paid
  if (paymentMethod.isImmediateCash) {
    return 'paid';
  }

  // Calculate due date
  const dueDate = calculateDueDate(invoiceDate, paymentMethod);
  
  // Compare with current date
  if (currentDate > dueDate) {
    return 'overdue';
  }
  
  return 'pending';
};

/**
 * Check if a payment method is immediate cash
 * @param {Object} paymentMethod - The payment method object
 * @returns {boolean} True if immediate cash, false otherwise
 */
export const isImmediateCash = (paymentMethod) => {
  return paymentMethod?.isImmediateCash === true;
};

/**
 * Check if a payment method can be used for settlement
 * @param {Object} paymentMethod - The payment method object
 * @returns {boolean} True if can be used for settlement, false otherwise
 */
export const canBeUsedForSettlement = (paymentMethod) => {
  return isImmediateCash(paymentMethod);
};

/**
 * Get end of month for a given date
 * @param {Date} date - The input date
 * @returns {Date} The last day of the month
 */
const getEndOfMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0); // Last day of current month
};

/**
 * Add days to a date
 * @param {Date} date - The input date
 * @param {number} days - Number of days to add
 * @returns {Date} The new date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Format date for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamps
  const d = date.toDate ? date.toDate() : new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get days until due date
 * @param {Date} dueDate - The due date
 * @param {Date} currentDate - The current date (defaults to today)
 * @returns {number} Days until due (negative if overdue)
 */
export const getDaysUntilDue = (dueDate, currentDate = new Date()) => {
  if (!dueDate) return null;
  
  // Handle Firestore Timestamps
  const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
  const current = currentDate.toDate ? currentDate.toDate() : new Date(currentDate);
  
  // Check if dates are valid
  if (isNaN(due.getTime()) || isNaN(current.getTime())) return null;
  
  // Set time to start of day for accurate day calculation
  due.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - current.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get payment status color for UI display
 * @param {string} status - The payment status
 * @returns {string} Color name for Material-UI
 */
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    case 'settled':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Get payment status label for UI display
 * @param {string} status - The payment status
 * @returns {string} Human-readable status label
 */
export const getPaymentStatusLabel = (status) => {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'pending':
      return 'Pending';
    case 'overdue':
      return 'Overdue';
    case 'settled':
      return 'Settled';
    default:
      return 'Unknown';
  }
};
