// src/hooks/useRoomList.ts

import { useState, useEffect, useCallback } from 'react';
import apiService, { Room } from '../services/apiService';

interface UseRoomListReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refreshRooms: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useRoomList = (autoRefresh = true, refreshInterval = 5000): UseRoomListReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  // Cargar salas
  const loadRooms = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const keyToUse = reset ? undefined : lastKey;
      const response = await apiService.listarSalas(20, keyToUse);
      
      if (reset) {
        setRooms(response.salas);
      } else {
        setRooms(prev => [...prev, ...response.salas]);
      }
      
      setLastKey(response.lastKey);
      setHasMore(!!response.lastKey);
      
      console.log(`✅ Salas cargadas: ${response.salas.length}`);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar salas';
      setError(errorMsg);
      console.error('❌ Error al cargar salas:', err);
    } finally {
      setLoading(false);
    }
  }, [lastKey]);

  // Refrescar salas (desde el inicio)
  const refreshRooms = useCallback(async () => {
    setLastKey(undefined);
    setHasMore(true);
    await loadRooms(true);
  }, [loadRooms]);

  // Cargar más salas (paginación)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadRooms(false);
  }, [hasMore, loading, loadRooms]);

  // Cargar salas iniciales
  useEffect(() => {
    loadRooms(true);
  }, []);

  // Auto-refresh opcional
  useEffect(() => {
    if (!autoRefresh || error) return; // No auto-refresh si hay error

    const intervalId = setInterval(() => {
      refreshRooms();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshRooms, error]);

  return {
    rooms,
    loading,
    error,
    hasMore,
    refreshRooms,
    loadMore,
  };
};