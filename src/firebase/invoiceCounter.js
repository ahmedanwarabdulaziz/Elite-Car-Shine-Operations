import { doc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './config';

// Get next invoice number by finding the last work order and incrementing
export const getNextInvoiceNumber = async (customerType) => {
  try {
    const prefix = customerType === 'corporate' ? 'C' : 'D';
    
    // Find the last work order for this customer type
    const workOrdersQuery = query(
      collection(db, 'workOrders'),
      where('customerType', '==', customerType),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    
    let lastNumber = 0;
    
    if (!workOrdersSnapshot.empty) {
      const lastWorkOrder = workOrdersSnapshot.docs[0].data();
      const lastInvoiceNumber = lastWorkOrder.invoiceNumber;
      
      if (lastInvoiceNumber && lastInvoiceNumber.startsWith(prefix)) {
        const numberPart = lastInvoiceNumber.substring(1);
        lastNumber = parseInt(numberPart) || 0;
      }
    }
    
    // Generate next number
    const nextNumber = lastNumber + 1;
    const formattedNumber = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    
    console.log(`Generated invoice number: ${formattedNumber} for ${customerType} customer (last was ${lastNumber})`);
    
    return formattedNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    
    // Fallback: try a simpler approach without ordering
    try {
      console.log('Trying fallback invoice number generation...');
      const prefix = customerType === 'corporate' ? 'C' : 'D';
      
      // Simple query without ordering
      const workOrdersQuery = query(
        collection(db, 'workOrders'),
        where('customerType', '==', customerType)
      );
      
      const workOrdersSnapshot = await getDocs(workOrdersQuery);
      
      let lastNumber = 0;
      
      workOrdersSnapshot.forEach(doc => {
        const workOrder = doc.data();
        if (workOrder.invoiceNumber && workOrder.invoiceNumber.startsWith(prefix)) {
          const numberPart = workOrder.invoiceNumber.substring(1);
          const number = parseInt(numberPart) || 0;
          if (number > lastNumber) {
            lastNumber = number;
          }
        }
      });
      
      const nextNumber = lastNumber + 1;
      const formattedNumber = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
      
      console.log(`Fallback generated invoice number: ${formattedNumber} for ${customerType} customer (last was ${lastNumber})`);
      
      return formattedNumber;
    } catch (fallbackError) {
      console.error('Fallback invoice number generation also failed:', fallbackError);
      throw new Error('Failed to generate invoice number. Please try again.');
    }
  }
};

// Legacy functions for backward compatibility (keeping the counter system as backup)
// Get current counter values (for display purposes)
export const getCurrentCounters = async () => {
  try {
    // Get actual counts from work orders instead of separate counters
    const corporateQuery = query(
      collection(db, 'workOrders'),
      where('customerType', '==', 'corporate')
    );
    const individualQuery = query(
      collection(db, 'workOrders'),
      where('customerType', '==', 'individual')
    );
    
    const [corporateSnapshot, individualSnapshot] = await Promise.all([
      getDocs(corporateQuery),
      getDocs(individualQuery)
    ]);
    
    return {
      C: corporateSnapshot.size,
      D: individualSnapshot.size
    };
  } catch (error) {
    console.error('Error getting current counters:', error);
    return { C: 0, D: 0 };
  }
};

// Reset counter (for admin use only)
export const resetCounter = async (customerType) => {
  try {
    const prefix = customerType === 'corporate' ? 'C' : 'D';
    const counterRef = doc(db, 'invoiceCounters', prefix);
    
    await setDoc(counterRef, { currentCount: 0 });
    
    console.log(`Reset ${prefix} counter to 0`);
    return true;
  } catch (error) {
    console.error('Error resetting counter:', error);
    throw new Error('Failed to reset counter');
  }
};

// Set counter to specific value (for admin use only)
export const setCounter = async (customerType, value) => {
  try {
    const prefix = customerType === 'corporate' ? 'C' : 'D';
    const counterRef = doc(db, 'invoiceCounters', prefix);
    
    await setDoc(counterRef, { currentCount: value });
    
    console.log(`Set ${prefix} counter to ${value}`);
    return true;
  } catch (error) {
    console.error('Error setting counter:', error);
    throw new Error('Failed to set counter');
  }
};

// Fix counter synchronization (for admin use only)
export const fixCounterSync = async (customerType) => {
  try {
    const prefix = customerType === 'corporate' ? 'C' : 'D';
    const counterRef = doc(db, 'invoiceCounters', prefix);
    
    // Get all work orders for this customer type
    const workOrdersQuery = query(collection(db, 'workOrders'), where('customerType', '==', customerType));
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    
    const workOrders = workOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Find the highest invoice number
    let maxNumber = 0;
    workOrders.forEach(workOrder => {
      if (workOrder.invoiceNumber && workOrder.invoiceNumber.startsWith(prefix)) {
        const number = parseInt(workOrder.invoiceNumber.substring(1));
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    // Set counter to the highest number found
    await setDoc(counterRef, { currentCount: maxNumber });
    
    console.log(`Fixed ${prefix} counter to ${maxNumber} (highest found)`);
    return maxNumber;
  } catch (error) {
    console.error('Error fixing counter sync:', error);
    throw new Error('Failed to fix counter synchronization');
  }
}; 