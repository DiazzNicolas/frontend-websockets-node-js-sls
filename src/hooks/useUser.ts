// src/hooks/useUser.ts

import { useState, useEffect, useCallback } from 'react';
import apiService, { User, SessionManager } from '../services/apiService';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  createUser: (nombre: string) => Promise<void>;
  updateUser: (datos: { nombre?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useUser = (): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    const savedUser = SessionManager.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  // Crear usuario
  const createUser = useCallback(async (nombre: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.crearUsuario(nombre);
      console.log('📦 Respuesta completa de la API:', response);
      
      const newUser = response.usuario;
      
      if (!newUser) {
        throw new Error('La API no devolvió un usuario válido');
      }
      
      // Guardar en estado y localStorage
      setUser(newUser);
      SessionManager.setUser(newUser);
      
      console.log('✅ Usuario creado:', newUser);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear usuario';
      setError(errorMsg);
      console.error('❌ Error al crear usuario:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar usuario
  const updateUser = useCallback(async (datos: { nombre?: string; avatarUrl?: string }) => {
    if (!user) {
      setError('No hay usuario autenticado');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.actualizarUsuario(user.userId, datos);
      const updatedUser = response.usuario;
      
      // Actualizar en estado y localStorage
      setUser(updatedUser);
      SessionManager.setUser(updatedUser);
      
      console.log('✅ Usuario actualizado:', updatedUser);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al actualizar usuario';
      setError(errorMsg);
      console.error('❌ Error al actualizar usuario:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Logout
  const logout = useCallback(() => {
    SessionManager.clearAll();
    setUser(null);
    setError(null);
    console.log('✅ Sesión cerrada');
  }, []);

  return {
    user,
    loading,
    error,
    createUser,
    updateUser,
    logout,
    isAuthenticated: !!user,
  };
};