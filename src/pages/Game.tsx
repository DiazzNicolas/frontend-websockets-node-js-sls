// src/pages/Game.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useGame } from '../hooks/useGame';
import { useWebSocket } from '../hooks/useWebSocket';

export const Game = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useUser();
  const {
    session,
    currentQuestion,
    ranking,
    roundResults,
    loading,
    submitAnswer,
    submitGuesses,
    refreshGameState,
    isAnswerPhase,
    isGuessPhase,
    isFinished,
    currentRound,
    totalRounds,
  } = useGame();
  const navigate = useNavigate();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // WebSocket para actualizaciones
  const { on, off } = useWebSocket(
    session?.roomId || null,
    user?.userId || null
  );

  // Cargar estado inicial
  useEffect(() => {
    if (sessionId) {
      refreshGameState(sessionId);
    }
  }, [sessionId]);

  // Escuchar eventos WebSocket
  useEffect(() => {
    const handleRoundStarted = () => {
      console.log('Ronda iniciada');
      if (sessionId) refreshGameState(sessionId);
      setSelectedAnswer('');
      setGuesses({});
      setHasSubmitted(false);
    };

    const handleAnswerPhaseEnded = () => {
      console.log('Fase de respuestas terminada');
      if (sessionId) refreshGameState(sessionId);
    };

    const handleGuessPhaseEnded = () => {
      console.log('Fase de adivinanzas terminada');
      if (sessionId) refreshGameState(sessionId);
    };

    const handleGameFinished = () => {
      console.log('Juego terminado');
      if (sessionId) refreshGameState(sessionId);
    };

    on('roundStarted', handleRoundStarted);
    on('answerPhaseEnded', handleAnswerPhaseEnded);
    on('guessPhaseEnded', handleGuessPhaseEnded);
    on('gameFinished', handleGameFinished);

    return () => {
      off('roundStarted', handleRoundStarted);
      off('answerPhaseEnded', handleAnswerPhaseEnded);
      off('guessPhaseEnded', handleGuessPhaseEnded);
      off('gameFinished', handleGameFinished);
    };
  }, [sessionId, on, off, refreshGameState]);

  if (!user || !sessionId) {
    navigate('/');
    return null;
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !sessionId) return;

    try {
      await submitAnswer(sessionId, user.userId, selectedAnswer);
      setHasSubmitted(true);
    } catch (err) {
      alert('Error al enviar respuesta');
    }
  };

  const handleSubmitGuesses = async () => {
    if (!sessionId) return;

    try {
      await submitGuesses(sessionId, user.userId, guesses);
      setHasSubmitted(true);
    } catch (err) {
      alert('Error al enviar adivinanzas');
    }
  };

  const handleBackToLobby = () => {
    navigate('/lobby');
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Cargando juego...</p>
      </div>
    );
  }

  // Pantalla de juego finalizado
  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold mb-6">🏆 ¡Juego Terminado!</h1>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Ranking Final</h2>
              <div className="space-y-3">
                {ranking.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`p-4 rounded-lg ${
                      index === 0 ? 'bg-yellow-100' : 
                      index === 1 ? 'bg-gray-100' : 
                      index === 2 ? 'bg-orange-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold">#{entry.posicion}</span>
                        <span className="font-bold">{entry.nombre}</span>
                        {entry.userId === user.userId && (
                          <span className="text-blue-600">(Tú)</span>
                        )}
                      </div>
                      <span className="text-xl font-bold">{entry.puntuacion} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleBackToLobby}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Volver al Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fase de respuestas
  if (isAnswerPhase && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">
                Ronda {currentRound} de {totalRounds}
              </h1>
              <p className="text-gray-600">Fase: Responder</p>
            </div>
          </div>

          {/* Pregunta */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-6">{currentQuestion.texto}</h2>
            <div className="space-y-3">
              {currentQuestion.opciones.map((opcion, index) => (
                <button
                  key={index}
                  onClick={() => !hasSubmitted && setSelectedAnswer(opcion)}
                  disabled={hasSubmitted}
                  className={`w-full p-4 text-left rounded-lg border-2 transition ${
                    selectedAnswer === opcion
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>

          {/* Botón enviar */}
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || hasSubmitted}
            className="w-full py-4 bg-green-500 text-white text-xl font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {hasSubmitted ? '✅ Respuesta Enviada' : 'Enviar Respuesta'}
          </button>

          {hasSubmitted && (
            <p className="text-center mt-4 text-gray-600">
              Esperando a los demás jugadores...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fase de adivinanzas
  if (isGuessPhase && session.jugadores) {
    const otherPlayers = session.jugadores.filter(p => p.userId !== user.userId);

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">
                Ronda {currentRound} de {totalRounds}
              </h1>
              <p className="text-gray-600">Fase: Adivinar</p>
            </div>
          </div>

          {/* Adivinanzas */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-6">
              ¿Qué respondió cada jugador?
            </h2>
            <div className="space-y-4">
              {otherPlayers.map((player) => (
                <div key={player.userId} className="border rounded-lg p-4">
                  <p className="font-bold mb-3">{player.nombre}</p>
                  <select
                    value={guesses[player.userId] || ''}
                    onChange={(e) => setGuesses({ ...guesses, [player.userId]: e.target.value })}
                    disabled={hasSubmitted}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">-- Selecciona una opción --</option>
                    {currentQuestion?.opciones.map((opcion, index) => (
                      <option key={index} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Botón enviar */}
          <button
            onClick={handleSubmitGuesses}
            disabled={Object.keys(guesses).length !== otherPlayers.length || hasSubmitted}
            className="w-full py-4 bg-purple-500 text-white text-xl font-bold rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {hasSubmitted ? '✅ Adivinanzas Enviadas' : 'Enviar Adivinanzas'}
          </button>

          {hasSubmitted && (
            <p className="text-center mt-4 text-gray-600">
              Esperando a los demás jugadores...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Pantalla de resultados entre rondas
  if (roundResults.length > 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-center mb-6">
              📊 Resultados de la Ronda
            </h1>
            
            <div className="space-y-3 mb-8">
              {roundResults.map((result) => (
                <div key={result.userId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{result.nombre}</span>
                    <div className="text-right">
                      <p className="text-green-600">+{result.puntosGanados} pts</p>
                      <p className="text-sm text-gray-600">
                        {result.aciertos} aciertos
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Ranking Actual</h2>
              <div className="space-y-2">
                {ranking.map((entry) => (
                  <div key={entry.userId} className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>
                      #{entry.posicion} {entry.nombre}
                      {entry.userId === user.userId && ' (Tú)'}
                    </span>
                    <span className="font-bold">{entry.puntuacion} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-gray-600">
              Esperando siguiente ronda...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">Preparando siguiente fase...</p>
    </div>
  );
};