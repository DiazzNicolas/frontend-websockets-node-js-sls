// src/hooks/useRoom.ts

import { useState, useCallback, useEffect } from 'react';
import apiService, { Room, RoomConfig, SessionManager } from '../services/apiService';

interface UseRoomReturn {
  room: Room | null;
  loading: boolean;
  error: string | null;
  createRoom: (userId: string, config?: Partial<RoomConfig & { maxJugadores: number }>) => Promise<Room>;
  joinRoom: (roomId: string, userId: string) => Promise<Room>;
  leaveRoom: (roomId: string, userId: string) => Promise<void>;
  updateConfig: (roomId: string, userId: string, config: Partial<RoomConfig>) => Promise<void>;
  refreshRoom: (roomId: string) => Promise<void>;
  clearRoom: () => void;
  isHost: (userId: string) => boolean;
  canStart: () => boolean;
}

export const useRoom = (): UseRoomReturn => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar sala desde localStorage al montar
  useEffect(() => {
    const savedRoom = SessionManager.getRoom();
    if (savedRoom) {
      setRoom(savedRoom);
    }
  }, []);

  // Crear sala
  const createRoom = useCallback(async (
    userId: string,
    config?: Partial<RoomConfig & { maxJugadores: number }>
  ): Promise<Room> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.crearSala({
        userId,
        ...config,
      });
      
      const newRoom = response.sala;
      setRoom(newRoom);
      SessionManager.setRoom(newRoom);
      
      console.log('✅ Sala creada:', newRoom.roomId);
      return newRoom;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear sala';
      setError(errorMsg);
      console.error('❌ Error al crear sala:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unirse a sala
  const joinRoom = useCallback(async (roomId: string, userId: string): Promise<Room> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.unirseSala(roomId, userId);
      
      const joinedRoom = response.sala;
      setRoom(joinedRoom);
      SessionManager.setRoom(joinedRoom);
      
      console.log('✅ Unido a sala:', roomId);
      return joinedRoom;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al unirse a la sala';
      setError(errorMsg);
      console.error('❌ Error al unirse a sala:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Salir de sala
  const leaveRoom = useCallback(async (roomId: string, userId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiService.salirDeSala(roomId, userId);
      
      setRoom(null);
      SessionManager.clearRoom();
      
      console.log('✅ Saliste de la sala:', roomId);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al salir de la sala';
      setError(errorMsg);
      console.error('❌ Error al salir de sala:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar configuración
  const updateConfig = useCallback(async (
    roomId: string,
    userId: string,
    config: Partial<RoomConfig>
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.actualizarConfiguracion(roomId, userId, config);
      
      const updatedRoom = response.sala;
      setRoom(updatedRoom);
      SessionManager.setRoom(updatedRoom);
      
      console.log('✅ Configuración actualizada');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al actualizar configuración';
      setError(errorMsg);
      console.error('❌ Error al actualizar config:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar estado de la sala
  const refreshRoom = useCallback(async (roomId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRoom = await apiService.obtenerSala(roomId);
      setRoom(updatedRoom);
      SessionManager.setRoom(updatedRoom);
      
      console.log('✅ Sala actualizada');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al actualizar sala';
      setError(errorMsg);
      console.error('❌ Error al refrescar sala:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar sala
  const clearRoom = useCallback(() => {
    setRoom(null);
    SessionManager.clearRoom();
  }, []);

  // Verificar si es host
  const isHost = useCallback((userId: string): boolean => {
    return room?.hostId === userId;
  }, [room]);

  // Verificar si se puede iniciar el juego
  const canStart = useCallback((): boolean => {
    if (!room) return false;
    return room.jugadores.length >= 2 && room.estado === 'esperando';
  }, [room]);

  return {
    room,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    updateConfig,
    refreshRoom,
    clearRoom,
    isHost,
    canStart,
  };
};