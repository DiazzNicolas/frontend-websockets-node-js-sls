// src/pages/Welcome.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

export const Welcome = () => {
  const [nombre, setNombre] = useState('');
  const { createUser, loading, error } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nombre.trim().length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }

    try {
      await createUser(nombre.trim());
      // Esperar un poquito para que el estado se actualice
      setTimeout(() => {
        navigate('/lobby');
      }, 100);
    } catch (err) {
      console.error('Error al crear usuario:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-3xl font-bold text-center mb-6">
          🎮 Juego de Preguntas
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Ingresa tu nombre:
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              maxLength={20}
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || nombre.trim().length < 2}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : 'Entrar al Lobby'}
          </button>
        </form>
      </div>
    </div>
  );
};