import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';

// Audit invoice numbers to find gaps and missing invoices
export const auditInvoiceNumbers = async () => {
  try {
    // Get all work orders
    const workOrdersQuery = query(collection(db, 'workOrders'), orderBy('createdAt', 'asc'));
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    const workOrders = workOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Analyze invoice numbers
    const analysis = {
      corporate: {
        invoices: [],
        missing: [],
        expectedCount: 0,
        actualCount: 0
      },
      individual: {
        invoices: [],
        missing: [],
        expectedCount: 0,
        actualCount: 0
      }
    };

    // Process each work order
    workOrders.forEach(workOrder => {
      const invoiceNumber = workOrder.invoiceNumber;
      if (!invoiceNumber) return;

      const prefix = invoiceNumber.charAt(0);
      const number = parseInt(invoiceNumber.substring(1));

      if (prefix === 'C') {
        analysis.corporate.invoices.push({
          number,
          invoiceNumber,
          workOrderId: workOrder.id,
          status: workOrder.invoiceStatus,
          createdAt: workOrder.createdAt,
          customerType: workOrder.customerType
        });
        analysis.corporate.actualCount++;
      } else if (prefix === 'D') {
        analysis.individual.invoices.push({
          number,
          invoiceNumber,
          workOrderId: workOrder.id,
          status: workOrder.invoiceStatus,
          createdAt: workOrder.createdAt,
          customerType: workOrder.customerType
        });
        analysis.individual.actualCount++;
      }
    });

    // Sort by number
    analysis.corporate.invoices.sort((a, b) => a.number - b.number);
    analysis.individual.invoices.sort((a, b) => a.number - b.number);

    // Find missing numbers and set expected count
    analysis.corporate.missing = findMissingNumbers(analysis.corporate.invoices.map(inv => inv.number));
    analysis.individual.missing = findMissingNumbers(analysis.individual.invoices.map(inv => inv.number));
    
    // Set expected count to the highest number found
    analysis.corporate.expectedCount = analysis.corporate.invoices.length > 0 ? 
      Math.max(...analysis.corporate.invoices.map(inv => inv.number)) : 0;
    analysis.individual.expectedCount = analysis.individual.invoices.length > 0 ? 
      Math.max(...analysis.individual.invoices.map(inv => inv.number)) : 0;

    return analysis;
  } catch (error) {
    console.error('Error auditing invoice numbers:', error);
    throw error;
  }
};

// Find missing numbers in a sequence
const findMissingNumbers = (numbers) => {
  if (numbers.length === 0) return [];
  
  const missing = [];
  const sorted = [...numbers].sort((a, b) => a - b);
  
  for (let i = 1; i <= Math.max(...sorted); i++) {
    if (!sorted.includes(i)) {
      missing.push(i);
    }
  }
  
  return missing;
};

// Get invoice lifecycle summary
export const getInvoiceLifecycleSummary = async () => {
  try {
    const workOrdersQuery = query(collection(db, 'workOrders'), orderBy('createdAt', 'desc'));
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    const workOrders = workOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const summary = {
      total: workOrders.length,
      byStatus: {
        draft: 0,
        submitted: 0,
        final: 0,
        deleted: 0
      },
      byCustomerType: {
        corporate: 0,
        individual: 0
      },
      byMonth: {},
      recentActivity: []
    };

    workOrders.forEach(workOrder => {
      // Count by status
      const status = workOrder.invoiceStatus || 'draft';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      // Count by customer type
      const customerType = workOrder.customerType || 'individual';
      summary.byCustomerType[customerType] = (summary.byCustomerType[customerType] || 0) + 1;

      // Count by month
      if (workOrder.createdAt) {
        const date = workOrder.createdAt.toDate ? workOrder.createdAt.toDate() : new Date(workOrder.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        summary.byMonth[monthKey] = (summary.byMonth[monthKey] || 0) + 1;
      }

      // Recent activity (last 10)
      if (summary.recentActivity.length < 10) {
        summary.recentActivity.push({
          invoiceNumber: workOrder.invoiceNumber,
          status: workOrder.invoiceStatus,
          customerType: workOrder.customerType,
          createdAt: workOrder.createdAt,
          workOrderId: workOrder.id
        });
      }
    });

    return summary;
  } catch (error) {
    console.error('Error getting invoice lifecycle summary:', error);
    throw error;
  }
};

// Find specific invoice by number
export const findInvoiceByNumber = async (invoiceNumber) => {
  try {
    const workOrdersQuery = query(collection(db, 'workOrders'));
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    
    const workOrder = workOrdersSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.invoiceNumber === invoiceNumber;
    });

    if (workOrder) {
      return { id: workOrder.id, ...workOrder.data() };
    }

    return null;
  } catch (error) {
    console.error('Error finding invoice:', error);
    throw error;
  }
}; 