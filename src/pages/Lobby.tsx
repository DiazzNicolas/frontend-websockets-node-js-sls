// src/pages/Lobby.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useRoomList } from '../hooks/useRoomList';
import { useRoom } from '../hooks/useRoom';
import { Room } from '../services/apiService';

export const Lobby = () => {
  const { user, logout } = useUser();
  const { rooms, loading, refreshRooms } = useRoomList();
  const { createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  // Ya no necesitamos validar aquí porque ProtectedRoute lo hace
  // Pero agregamos un check para TypeScript
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      const room = await createRoom(user.userId);
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      alert('Error al crear sala');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId, user.userId);
      navigate(`/room/${roomId}`);
    } catch (err) {
      alert('Error al unirse a la sala');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Lobby - Salas Disponibles</h1>
              <p className="text-gray-600">Bienvenido, {user.nombre}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshRooms}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                🔄 Actualizar
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {creating ? 'Creando...' : '➕ Crear Sala'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                🚪 Salir
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Salas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading && rooms.length === 0 ? (
            <p className="text-center text-gray-500">Cargando salas...</p>
          ) : rooms.length === 0 ? (
            <p className="text-center text-gray-500">No hay salas disponibles. ¡Crea una!</p>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.roomId}
                  room={room}
                  onJoin={() => handleJoinRoom(room.roomId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente simple de tarjeta de sala
const RoomCard = ({ room, onJoin }: { room: Room; onJoin: () => void }) => {
  const canJoin = room.estado === 'esperando' && room.jugadores.length < room.maxJugadores;

  return (
    <div className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
      <div>
        <h3 className="font-bold">Sala #{room.roomId.slice(-6)}</h3>
        <p className="text-sm text-gray-600">
          👥 {room.jugadores.length}/{room.maxJugadores} jugadores
        </p>
        <p className="text-sm text-gray-600">
          📋 {room.configuracion.numeroPreguntas} preguntas - ⏱️ {room.configuracion.tiempoRespuesta}s
        </p>
        <p className="text-sm text-gray-600">
          🏷️ {room.configuracion.topic}
        </p>
        <p className={`text-sm font-medium ${
          room.estado === 'esperando' ? 'text-green-600' : 
          room.estado === 'jugando' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          Estado: {room.estado}
        </p>
      </div>

      <button
        onClick={onJoin}
        disabled={!canJoin}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {canJoin ? 'Unirse' : 'No disponible'}
      </button>
    </div>
  );
};