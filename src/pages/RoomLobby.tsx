// src/pages/RoomLobby.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useRoom } from '../hooks/useRoom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGame } from '../hooks/useGame';

export const RoomLobby = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: userLoading } = useUser();
  const { room, loading, refreshRoom, leaveRoom, isHost, canStart } = useRoom();
  const { startGame } = useGame();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  // WebSocket para actualizaciones en tiempo real
  // Solo conectar si tenemos user y roomId
  const { isConnected, on, off } = useWebSocket(
    roomId || null, 
    user?.userId || null,
    !!user && !!roomId // enabled solo cuando ambos existen
  );

  // Cargar sala al montar (solo si hay roomId)
  useEffect(() => {
    if (roomId && user) {
      console.log('🔄 Cargando sala:', roomId);
      refreshRoom(roomId);
    }
  }, [roomId, user?.userId]); // Dependencia de user.userId, no de refreshRoom

  // Escuchar eventos del WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const handlePlayerJoined = (data: any) => {
      console.log('👤 Jugador se unió:', data);
      if (roomId) refreshRoom(roomId);
    };

    const handlePlayerLeft = (data: any) => {
      console.log('👋 Jugador salió:', data);
      if (roomId) refreshRoom(roomId);
    };

    const handleGameStarted = (data: any) => {
      console.log('🎮 Juego iniciado:', data);
      if (data.sessionId) {
        navigate(`/game/${data.sessionId}`);
      }
    };

    on('playerJoined', handlePlayerJoined);
    on('playerLeft', handlePlayerLeft);
    on('gameStarted', handleGameStarted);

    return () => {
      off('playerJoined', handlePlayerJoined);
      off('playerLeft', handlePlayerLeft);
      off('gameStarted', handleGameStarted);
    };
  }, [isConnected, roomId, on, off, navigate]);

  // ✅ CORREGIDO: Solo redireccionar después de que termine de cargar
  useEffect(() => {
    // No hacer nada si todavía está cargando
    if (userLoading) {
      console.log('⏳ Esperando a que cargue el usuario...');
      return;
    }

    // Solo redireccionar si definitivamente no hay usuario o roomId
    if (!user || !roomId) {
      console.log('❌ Redireccionando a home - Usuario o RoomId faltante');
      navigate('/', { replace: true });
    }
  }, [user, roomId, userLoading, navigate]);

  const handleLeave = async () => {
    if (!user || !roomId) return;

    try {
      await leaveRoom(roomId, user.userId);
      navigate('/lobby');
    } catch (err) {
      console.error('Error al salir:', err);
      alert('Error al salir de la sala');
    }
  };

  const handleStart = async () => {
    if (!user || !roomId) return;

    if (!canStart()) {
      alert('Se necesitan al menos 2 jugadores para iniciar');
      return;
    }

    setStarting(true);
    try {
      const sessionId = await startGame(roomId, user.userId);
      navigate(`/game/${sessionId}`);
    } catch (err) {
      console.error('Error al iniciar:', err);
      alert('Error al iniciar el juego');
    } finally {
      setStarting(false);
    }
  };

  // ✅ Mostrar loading mientras carga el usuario
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">⏳ Cargando usuario...</p>
      </div>
    );
  }

  // Early return si no hay datos críticos (después de cargar)
  if (!user || !roomId) {
    return null;
  }

  // Loading de la sala
  if (loading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">⏳ Cargando sala...</p>
      </div>
    );
  }

  // ✅ Validación de configuración con valores por defecto
  const config = room.configuracion || {
    numeroPreguntas: 10,
    tiempoRespuesta: 150,
    tiempoAdivinanza: 150,
    topic: 'cultura-general',
    puntosAdivinanzaCorrecta: 10
  };

  const amIHost = isHost(user.userId);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Sala #{roomId.slice(-6)}</h1>
              <p className="text-gray-600">
                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
              </p>
            </div>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              🚪 Salir de la Sala
            </button>
          </div>
        </div>

        {/* Configuración */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">⚙️ Configuración</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Número de preguntas:</p>
              <p className="font-bold">{config.numeroPreguntas}</p>
            </div>
            <div>
              <p className="text-gray-600">Tiempo de respuesta:</p>
              <p className="font-bold">{config.tiempoRespuesta}s</p>
            </div>
            <div>
              <p className="text-gray-600">Tiempo de adivinanza:</p>
              <p className="font-bold">{config.tiempoAdivinanza}s</p>
            </div>
            <div>
              <p className="text-gray-600">Tema:</p>
              <p className="font-bold">{config.topic}</p>
            </div>
          </div>
        </div>

        {/* Lista de Jugadores */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">
            👥 Jugadores ({room.jugadores?.length || 0}/{room.maxJugadores})
          </h2>
          <div className="space-y-3">
            {room.jugadores?.length > 0 ? (
              room.jugadores.map((jugador) => (
                <div
                  key={jugador.userId}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                    {jugador.nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{jugador.nombre}</p>
                    {jugador.userId === room.hostId && (
                      <span className="text-sm text-yellow-600">👑 Host</span>
                    )}
                    {jugador.userId === user.userId && (
                      <span className="text-sm text-blue-600"> (Tú)</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No hay jugadores</p>
            )}
          </div>
        </div>

        {/* Botón de Inicio */}
        {amIHost && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <button
              onClick={handleStart}
              disabled={!canStart() || starting}
              className="w-full py-4 bg-green-500 text-white text-xl font-bold rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {starting ? 'Iniciando...' : canStart() ? '🎮 Iniciar Juego' : 'Se necesitan al menos 2 jugadores'}
            </button>
          </div>
        )}

        {!amIHost && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600">Esperando a que el host inicie el juego...</p>
          </div>
        )}
      </div>
    </div>
  );
};