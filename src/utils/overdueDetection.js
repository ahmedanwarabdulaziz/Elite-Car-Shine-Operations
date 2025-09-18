import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getDaysUntilDue } from './paymentCalculations';

/**
 * Overdue Detection System
 * Automatically identifies and updates overdue invoices
 */

/**
 * Check if an invoice is overdue based on its due date
 * @param {Object} invoice - The invoice object
 * @param {Date} currentDate - Current date for comparison (defaults to now)
 * @returns {boolean} True if invoice is overdue
 */
export const isInvoiceOverdue = (invoice, currentDate = new Date()) => {
  if (!invoice.dueDate) return false;
  if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'settled') return false;
  
  const daysUntilDue = getDaysUntilDue(invoice.dueDate, currentDate);
  return daysUntilDue !== null && daysUntilDue < 0;
};

/**
 * Get overdue status information for an invoice
 * @param {Object} invoice - The invoice object
 * @param {Date} currentDate - Current date for comparison
 * @returns {Object} Overdue status information
 */
export const getOverdueStatus = (invoice, currentDate = new Date()) => {
  if (!invoice.dueDate) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      status: 'no_due_date',
      message: 'No due date set'
    };
  }
  
  if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'settled') {
    return {
      isOverdue: false,
      daysOverdue: 0,
      status: 'paid',
      message: 'Invoice is paid'
    };
  }
  
  const daysUntilDue = getDaysUntilDue(invoice.dueDate, currentDate);
  
  if (daysUntilDue === null) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      status: 'invalid_date',
      message: 'Invalid due date'
    };
  }
  
  if (daysUntilDue < 0) {
    return {
      isOverdue: true,
      daysOverdue: Math.abs(daysUntilDue),
      status: 'overdue',
      message: `${Math.abs(daysUntilDue)} days overdue`
    };
  } else if (daysUntilDue === 0) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      status: 'due_today',
      message: 'Due today'
    };
  } else if (daysUntilDue <= 3) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      status: 'due_soon',
      message: `${daysUntilDue} days remaining`
    };
  } else {
    return {
      isOverdue: false,
      daysOverdue: 0,
      status: 'pending',
      message: `${daysUntilDue} days remaining`
    };
  }
};

/**
 * Update overdue status for a single invoice
 * @param {Object} invoice - The invoice object
 * @param {Date} currentDate - Current date for comparison
 * @returns {Promise<boolean>} True if status was updated
 */
export const updateInvoiceOverdueStatus = async (invoice, currentDate = new Date()) => {
  try {
    const overdueStatus = getOverdueStatus(invoice, currentDate);
    const shouldBeOverdue = overdueStatus.isOverdue;
    const currentStatus = invoice.paymentStatus || 'pending';
    
    // Only update if status needs to change
    if (shouldBeOverdue && currentStatus !== 'overdue') {
      await updateDoc(doc(db, 'invoices', invoice.id), {
        paymentStatus: 'overdue',
        overdueDetectedAt: serverTimestamp(),
        overdueDays: overdueStatus.daysOverdue,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Updated invoice ${invoice.invoiceNumber} to overdue status`);
      return true;
    } else if (!shouldBeOverdue && currentStatus === 'overdue') {
      // Revert from overdue to pending if no longer overdue
      await updateDoc(doc(db, 'invoices', invoice.id), {
        paymentStatus: 'pending',
        overdueDetectedAt: null,
        overdueDays: null,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Reverted invoice ${invoice.invoiceNumber} from overdue to pending`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating overdue status for invoice ${invoice.invoiceNumber}:`, error);
    return false;
  }
};

/**
 * Batch process to update overdue statuses for all pending invoices
 * @param {Date} currentDate - Current date for comparison
 * @returns {Promise<Object>} Summary of updates performed
 */
export const batchUpdateOverdueStatuses = async (currentDate = new Date()) => {
  console.log('🔍 Starting overdue detection batch process...');
  
  try {
    // Get all pending invoices
    const pendingInvoicesQuery = query(
      collection(db, 'invoices'),
      where('paymentStatus', 'in', ['pending', 'overdue'])
    );
    
    const snapshot = await getDocs(pendingInvoicesQuery);
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Found ${invoices.length} pending/overdue invoices to check`);
    
    const results = {
      totalChecked: invoices.length,
      updatedToOverdue: 0,
      revertedFromOverdue: 0,
      noChange: 0,
      errors: 0,
      updatedInvoices: []
    };
    
    // Process each invoice
    for (const invoice of invoices) {
      try {
        const wasUpdated = await updateInvoiceOverdueStatus(invoice, currentDate);
        
        if (wasUpdated) {
          const overdueStatus = getOverdueStatus(invoice, currentDate);
          if (overdueStatus.isOverdue) {
            results.updatedToOverdue++;
            results.updatedInvoices.push({
              invoiceNumber: invoice.invoiceNumber,
              action: 'marked_overdue',
              daysOverdue: overdueStatus.daysOverdue
            });
          } else {
            results.revertedFromOverdue++;
            results.updatedInvoices.push({
              invoiceNumber: invoice.invoiceNumber,
              action: 'reverted_to_pending'
            });
          }
        } else {
          results.noChange++;
        }
      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.invoiceNumber}:`, error);
        results.errors++;
      }
    }
    
    console.log('✅ Overdue detection batch process completed:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Error in overdue detection batch process:', error);
    throw error;
  }
};

/**
 * Get overdue statistics for dashboard
 * @returns {Promise<Object>} Overdue statistics
 */
export const getOverdueStatistics = async () => {
  try {
    const pendingQuery = query(
      collection(db, 'invoices'),
      where('paymentStatus', '==', 'pending')
    );
    
    const overdueQuery = query(
      collection(db, 'invoices'),
      where('paymentStatus', '==', 'overdue')
    );
    
    const [pendingSnapshot, overdueSnapshot] = await Promise.all([
      getDocs(pendingQuery),
      getDocs(overdueQuery)
    ]);
    
    const pendingInvoices = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const overdueInvoices = overdueSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Check pending invoices for potential overdue
    const currentDate = new Date();
    const potentiallyOverdue = pendingInvoices.filter(invoice => 
      isInvoiceOverdue(invoice, currentDate)
    );
    
    return {
      totalPending: pendingInvoices.length,
      totalOverdue: overdueInvoices.length,
      potentiallyOverdue: potentiallyOverdue.length,
      totalRequiringAttention: overdueInvoices.length + potentiallyOverdue.length,
      overdueAmount: overdueInvoices.reduce((sum, invoice) => 
        sum + (Number(invoice.total) || 0), 0
      ),
      potentiallyOverdueAmount: potentiallyOverdue.reduce((sum, invoice) => 
        sum + (Number(invoice.total) || 0), 0
      )
    };
    
  } catch (error) {
    console.error('❌ Error getting overdue statistics:', error);
    return {
      totalPending: 0,
      totalOverdue: 0,
      potentiallyOverdue: 0,
      totalRequiringAttention: 0,
      overdueAmount: 0,
      potentiallyOverdueAmount: 0
    };
  }
};

/**
 * Get overdue invoices with detailed information
 * @param {number} limit - Maximum number of invoices to return
 * @returns {Promise<Array>} Array of overdue invoices with details
 */
export const getOverdueInvoices = async (limit = 50) => {
  try {
    const overdueQuery = query(
      collection(db, 'invoices'),
      where('paymentStatus', '==', 'overdue')
    );
    
    const snapshot = await getDocs(overdueQuery);
    const overdueInvoices = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .slice(0, limit);
    
    // Add overdue details to each invoice
    return overdueInvoices.map(invoice => ({
      ...invoice,
      overdueDetails: getOverdueStatus(invoice)
    }));
    
  } catch (error) {
    console.error('❌ Error getting overdue invoices:', error);
    return [];
  }
};

/**
 * Set up real-time overdue detection listener
 * @param {Function} onOverdueUpdate - Callback function for overdue updates
 * @returns {Function} Unsubscribe function
 */
export const setupOverdueDetectionListener = (onOverdueUpdate) => {
  console.log('🔍 Setting up overdue detection listener...');
  
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'invoices'),
      where('paymentStatus', 'in', ['pending', 'overdue'])
    ),
    async (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const currentDate = new Date();
      
      // Check for overdue invoices
      const overdueInvoices = invoices.filter(invoice => 
        isInvoiceOverdue(invoice, currentDate)
      );
      
      if (overdueInvoices.length > 0) {
        console.log(`⚠️ Found ${overdueInvoices.length} overdue invoices`);
        if (onOverdueUpdate) {
          onOverdueUpdate(overdueInvoices);
        }
      }
    },
    (error) => {
      console.error('❌ Error in overdue detection listener:', error);
    }
  );
  
  return unsubscribe;
};
