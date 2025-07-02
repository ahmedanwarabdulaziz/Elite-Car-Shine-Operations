import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Cache for storing fetched data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
        order: doc.data().order || index,
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
            order: doc.data().order || index,
          }));
          
          setData(result);
          setLoading(false);
        },
        (err) => {
          console.error(`Error listening to ${collectionName}:`, err);
          setError(err.message);
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
      const docRef = await addDoc(collection(db, collectionName), {
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      await updateDoc(doc(db, collectionName, documentId), {
        ...updateData,
        updatedAt: new Date(),
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
      const promises = updates.map(({ id, data }) => 
        updateDoc(doc(db, collectionName, id), {
          ...data,
          updatedAt: new Date(),
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