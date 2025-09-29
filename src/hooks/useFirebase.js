import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// Cache for storing fetched data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get current user context for audit trails
const getCurrentUser = () => {
  try {
    // Check for employee session first
    const employeeSession = sessionStorage.getItem('employeeUser');
    if (employeeSession) {
      const employee = JSON.parse(employeeSession);
      return {
        id: employee.id,
        name: employee.name,
        type: 'employee',
        department: employee.department,
        email: employee.email
      };
    }
    
    // Check for admin Firebase auth
    if (auth.currentUser) {
      return {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email,
        type: 'admin',
        email: auth.currentUser.email
      };
    }
    
    // Fallback for system operations
    return {
      id: 'system',
      name: 'System',
      type: 'system',
      email: 'system@elite.com'
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      id: 'unknown',
      name: 'Unknown User',
      type: 'unknown',
      email: 'unknown@elite.com'
    };
  }
};

// Hook for Firebase operations with caching and performance optimization
const useFirebase = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Generate cache key
  const getCacheKey = useCallback((queryParams = {}) => {
    return `${collectionName}_${JSON.stringify(queryParams)}`;
  }, [collectionName]);

  // Check if cache is valid
  // eslint-disable-next-line no-unused-vars
  const isCacheValid = useCallback((cacheKey) => {
    const cached = cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, []);

  // Get cached data
  const getCachedData = useCallback((cacheKey) => {
    const cached = cache.get(cacheKey);
    return cached ? cached.data : null;
  }, []);

  // Set cached data
  const setCachedData = useCallback((cacheKey, data) => {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  // Clear cache for this collection
  const clearCache = useCallback(() => {
    for (const [key] of cache) {
      if (key.startsWith(collectionName)) {
        cache.delete(key);
      }
    }
  }, [collectionName]);

  // Fetch data with caching
  const fetchData = useCallback(async (queryParams = {}) => {
    const cacheKey = getCacheKey(queryParams);
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setData(cachedData);
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      let q = collection(db, collectionName);
      
      // Apply query parameters
      if (queryParams.orderBy) {
        q = query(q, orderBy(queryParams.orderBy, queryParams.orderDirection || 'asc'));
      }
      
      if (queryParams.where) {
        q = query(q, where(queryParams.where.field, queryParams.where.operator, queryParams.where.value));
      }
      
      if (queryParams.limit) {
        q = query(q, limit(queryParams.limit));
      }

      const querySnapshot = await getDocs(q);
      const result = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        order: doc.data().order || 0, // Default to 0 for items without order
      }));

      // Cache the result
      setCachedData(cacheKey, result);
      setData(result);
      return result;
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName, getCacheKey, getCachedData, setCachedData]);

  // Real-time listener with performance optimization
  const subscribeToData = useCallback((queryParams = {}) => {
    // Unsubscribe from previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setLoading(true);
    setError(null);

    try {
      let q = collection(db, collectionName);
      
      // Apply query parameters
      if (queryParams.orderBy) {
        q = query(q, orderBy(queryParams.orderBy, queryParams.orderDirection || 'asc'));
      }
      
      if (queryParams.where) {
        q = query(q, where(queryParams.where.field, queryParams.where.operator, queryParams.where.value));
      }
      
      if (queryParams.limit) {
        q = query(q, limit(queryParams.limit));
      }

      unsubscribeRef.current = onSnapshot(
        q,
        (querySnapshot) => {
          const result = querySnapshot.docs.map((doc, index) => ({
            id: doc.id,
            ...doc.data(),
            order: doc.data().order || 0, // Default to 0 for items without order
          }));
          
          setData(result);
          setLoading(false);
          setError(null); // Clear any previous errors
          console.log(`Successfully loaded ${result.length} ${collectionName} records`);
        },
        (err) => {
          console.error(`Error listening to ${collectionName}:`, err);
          
          // Check if it's a network error
          if (err.code === 'unavailable' || err.message.includes('network') || err.message.includes('disconnected')) {
            setError('Network connection issue. Please check your internet connection and try again.');
            console.warn('Network error detected, will retry automatically');
          } else {
            setError(err.message);
          }
          
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(`Error setting up listener for ${collectionName}:`, err);
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName]);

  // Add document with cache invalidation
  const addDocument = useCallback(async (documentData) => {
    try {
      const currentUser = getCurrentUser();
      const now = new Date();
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...documentData,
        createdBy: currentUser,
        updatedBy: currentUser,
        createdAt: now,
        updatedAt: now,
      });
      
      // Clear cache to force refresh
      clearCache();
      
      return docRef;
    } catch (err) {
      console.error(`Error adding document to ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName, clearCache]);

  // Update document with cache invalidation
  const updateDocument = useCallback(async (documentId, updateData) => {
    try {
      const currentUser = getCurrentUser();
      const now = new Date();
      
      await updateDoc(doc(db, collectionName, documentId), {
        ...updateData,
        updatedBy: currentUser,
        updatedAt: now,
      });
      
      // Clear cache to force refresh
      clearCache();
    } catch (err) {
      console.error(`Error updating document in ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName, clearCache]);

  // Delete document with cache invalidation
  const deleteDocument = useCallback(async (documentId) => {
    try {
      await deleteDoc(doc(db, collectionName, documentId));
      
      // Clear cache to force refresh
      clearCache();
    } catch (err) {
      console.error(`Error deleting document from ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName, clearCache]);

  // Batch operations for better performance
  const batchUpdate = useCallback(async (updates) => {
    try {
      const currentUser = getCurrentUser();
      const now = new Date();
      
      const promises = updates.map(({ id, data }) => 
        updateDoc(doc(db, collectionName, id), {
          ...data,
          updatedBy: currentUser,
          updatedAt: now,
        })
      );
      
      await Promise.all(promises);
      clearCache();
    } catch (err) {
      console.error(`Error batch updating ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName, clearCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    subscribeToData,
    addDocument,
    updateDocument,
    deleteDocument,
    batchUpdate,
    clearCache,
  };
};

export default useFirebase; 