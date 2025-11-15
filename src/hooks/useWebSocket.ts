// src/hooks/useWebSocket.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketClient } from '../services/apiService';

interface UseWebSocketReturn {
  isConnected: boolean;
  error: Error | null;
  send: (eventType: string, data?: any) => void;
  sendGameEvent: (eventType: string, data?: any) => void;
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
    if (!roomId || !userId || !enabled) {
      console.log('⚠️ No se puede conectar:', { roomId, userId, enabled });
      return;
    }

    try {
      // Si ya existe una conexión, desconectar primero
      if (wsRef.current) {
        console.log('🔄 Desconectando conexión anterior...');
        wsRef.current.disconnect();
      }

      // Crear nueva conexión
      console.log('🔌 Creando nueva conexión WebSocket...');
      const ws = new WebSocketClient(roomId, userId);
      wsRef.current = ws;

      // Listeners internos
      ws.on('connected', () => {
        setIsConnected(true);
        setError(null);
        console.log('✅ WebSocket conectado exitosamente');
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
        console.error('❌ Reconexión fallida después de múltiples intentos');
      });

      // Conectar
      await ws.connect();
    } catch (err: any) {
      setError(err);
      console.error('❌ Error al conectar WebSocket:', err);
    }
  }, [roomId, userId, enabled]);

  /**
   * ✅ NUEVO: Enviar mensaje (ahora usa sendGameEvent internamente)
   * Mantiene compatibilidad hacia atrás
   */
  const send = useCallback((eventType: string, data: any = {}) => {
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.sendGameEvent(eventType, data);
    } else {
      console.warn('⚠️ WebSocket no está conectado. No se puede enviar:', eventType);
    }
  }, []);

  /**
   * ✅ NUEVO: Método específico para enviar eventos de juego
   * Usa el formato correcto para el backend
   */
  const sendGameEvent = useCallback((eventType: string, data: any = {}) => {
    if (wsRef.current && wsRef.current.isConnected()) {
      console.log(`📤 Enviando evento: ${eventType}`, data);
      wsRef.current.sendGameEvent(eventType, data);
    } else {
      console.warn('⚠️ WebSocket no está conectado. No se puede enviar:', eventType);
    }
  }, []);

  // Suscribirse a evento
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (wsRef.current) {
      wsRef.current.on(event, callback);
      console.log(`🎧 Escuchando evento: ${event}`);
    }
  }, []);

  // Desuscribirse de evento
  const off = useCallback((event: string, callback: (data: any) => void) => {
    if (wsRef.current) {
      wsRef.current.off(event, callback);
      console.log(`🔇 Dejando de escuchar: ${event}`);
    }
  }, []);

  // Reconectar manualmente
  const reconnect = useCallback(async () => {
    console.log('🔄 Intentando reconectar manualmente...');
    await connect();
  }, [connect]);

  // Conectar al montar o cuando cambien las dependencias
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    if (enabled && roomId && userId) {
      console.log('🚀 Programando conexión WebSocket...', { roomId, userId });
      
      // Pequeño delay para evitar conexiones duplicadas en React Strict Mode
      timeoutId = setTimeout(async () => {
        if (mounted) {
          await connect();
        }
      }, 100);
    }

    // Desconectar al desmontar
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      if (wsRef.current) {
        console.log('🧹 Limpiando conexión WebSocket...');
        // Dar un pequeño delay antes de desconectar
        setTimeout(() => {
          if (wsRef.current) {
            wsRef.current.disconnect();
            wsRef.current = null;
          }
        }, 50);
        setIsConnected(false);
      }
    };
  }, [roomId, userId, enabled, connect]);

  return {
    isConnected,
    error,
    send,
    sendGameEvent, // ← NUEVO método específico
    on,
    off,
    reconnect,
  };
};

// ==========================================
// EJEMPLO DE USO EN COMPONENTES
// ==========================================

/*
import { useWebSocket } from '../hooks/useWebSocket';

function RoomLobby() {
  const { roomId } = useParams();
  const { user } = useUser();
  const { isConnected, sendGameEvent, on, off } = useWebSocket(roomId, user?.userId);

  // Escuchar eventos
  useEffect(() => {
    const handlePlayerJoined = (data: any) => {
      console.log('Nuevo jugador:', data);
      // Actualizar UI
    };

    const handleGameStarted = (data: any) => {
      console.log('Juego iniciado:', data);
      navigate(`/game/${data.sessionId}`);
    };

    on('playerJoined', handlePlayerJoined);
    on('gameStarted', handleGameStarted);

    return () => {
      off('playerJoined', handlePlayerJoined);
      off('gameStarted', handleGameStarted);
    };
  }, [on, off]);

  // Enviar eventos
  const handleSendMessage = () => {
    sendGameEvent('chatMessage', {
      mensaje: '¡Hola a todos! 👋'
    });
  };

  const handlePlayerReady = () => {
    sendGameEvent('playerReady', {
      userId: user.userId,
      ready: true
    });
  };

  return (
    <div>
      <p>Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
      <button onClick={handleSendMessage}>Enviar Mensaje</button>
      <button onClick={handlePlayerReady}>Marcar como Listo</button>
    </div>
  );
}
*/