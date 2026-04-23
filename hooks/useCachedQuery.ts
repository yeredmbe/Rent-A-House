import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

/**
 * A custom hook that wraps Convex's useQuery with offline AsyncStorage caching.
 * It returns the cached data immediately if available, while Convex fetches the latest data.
 * Once Convex data is available, it updates the cache and the returned data.
 * 
 * @param query The Convex query function (e.g. api.homes.getAvailableHomes)
 * @param args The arguments for the query, or "skip"
 * @param cacheKey A unique string key for AsyncStorage
 */
export function useCachedQuery(query, args, cacheKey) {
  const [cachedData, setCachedData] = useState(undefined);
  const serverData = useQuery(query, args);

  // Load from cache on mount
  useEffect(() => {
    let isMounted = true;
    const loadCache = async () => {
      try {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored && isMounted) {
          setCachedData(JSON.parse(stored));
        }
      } catch (err) {
        console.error(`Failed to load cache for ${cacheKey}`, err);
      }
    };
    loadCache();
    return () => {
      isMounted = false;
    };
  }, [cacheKey]);

  // Update cache when server data arrives
  useEffect(() => {
    if (serverData !== undefined) {
      setCachedData(serverData);
      AsyncStorage.setItem(cacheKey, JSON.stringify(serverData)).catch(err => 
        console.error(`Failed to save cache for ${cacheKey}`, err)
      );
    }
  }, [serverData, cacheKey]);

  // Return server data if available, otherwise fallback to cached data.
  // If neither is available, it will be undefined (loading state).
  return serverData !== undefined ? serverData : cachedData;
}
