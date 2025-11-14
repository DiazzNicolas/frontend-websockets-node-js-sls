// src/hooks/useWebSocket.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketClient } from '../services/apiService';

interface UseWebSocketReturn {
  isConnected: boolean;
  error: Error | null;
  send: (action: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  reconnect: () => Promise<void>;
}

export const useWebSocket = (
  roomId: string | null,
  userId: string | null,
  enabled = true
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocketClient | null>(null);

  // Conectar WebSocket
  const connect = useCallback(async () => {
    if (!roomId || !userId || !enabled) return;

    try {
      // Si ya existe una conexión, desconectar primero
      if (wsRef.current) {
        wsRef.current.disconnect();
      }

      // Crear nueva conexión
      const ws = new WebSocketClient(roomId, userId);
      wsRef.current = ws;

      // Listeners internos
      ws.on('connected', () => {
        setIsConnected(true);
        setError(null);
        console.log('✅ WebSocket conectado');
      });

      ws.on('disconnected', () => {
        setIsConnected(false);
        console.log('🔌 WebSocket desconectado');
      });

      ws.on('error', (err) => {
        setError(err);
        console.error('❌ WebSocket error:', err);
      });

      ws.on('reconnectFailed', () => {
        setError(new Error('Falló la reconexión al servidor'));
        console.error('❌ Reconexión fallida');
      });

      // Conectar
      await ws.connect();
    } catch (err: any) {
      setError(err);
      console.error('❌ Error al conectar WebSocket:', err);
    }
  }, [roomId, userId, enabled]);

  // Enviar mensaje
  const send = useCallback((action: string, data: any) => {
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.send(action, data);
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }, []);

  // Suscribirse a evento
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (wsRef.current) {
      wsRef.current.on(event, callback);
    }
  }, []);

  // Desuscribirse de evento
  const off = useCallback((event: string, callback: (data: any) => void) => {
    if (wsRef.current) {
      wsRef.current.off(event, callback);
    }
  }, []);

  // Reconectar manualmente
  const reconnect = useCallback(async () => {
    await connect();
  }, [connect]);

  // Conectar al montar o cuando cambien las dependencias
  useEffect(() => {
    if (enabled && roomId && userId) {
      connect();
    }

    // Desconectar al desmontar
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomId, userId, enabled, connect]);

  return {
    isConnected,
    error,
    send,
    on,
    off,
    reconnect,
  };
};