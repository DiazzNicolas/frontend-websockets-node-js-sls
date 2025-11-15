// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Welcome } from './pages/Welcome';
import { Lobby } from './pages/Lobby';
import { RoomLobby } from './pages/RoomLobby';
import { Game } from './pages/Game';
import { useUser } from './hooks/useUser';

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ CORREGIDO: Solo redireccionar después de cargar
    if (!loading && !isAuthenticated) {
      console.log('❌ ProtectedRoute: Usuario no autenticado, redirigiendo a home');
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // ✅ Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // ✅ Si no está autenticado (después de cargar), no renderizar nada
  // El useEffect se encargará de la navegación
  if (!isAuthenticated) {
    return null;
  }

  // ✅ Usuario autenticado, mostrar contenido
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página de bienvenida (login) */}
        <Route path="/" element={<Welcome />} />

        {/* Rutas protegidas */}
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <RoomLobby />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/game/:sessionId"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;