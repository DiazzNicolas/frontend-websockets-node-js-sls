// src/hooks/useGame.ts

import { useState, useCallback, useEffect } from 'react';
import apiService, { 
  GameSession, 
  Question, 
  RoundResult, 
  RankingEntry,
  SessionManager 
} from '../services/apiService';

interface UseGameReturn {
  session: GameSession | null;
  loading: boolean;
  error: string | null;
  currentQuestion: Question | null;
  ranking: RankingEntry[];
  roundResults: RoundResult[];
  
  // Acciones del juego
  startGame: (roomId: string, userId: string) => Promise<string>;
  startRound: (sessionId: string) => Promise<void>;
  submitAnswer: (sessionId: string, userId: string, respuesta: string) => Promise<void>;
  finishAnswerPhase: (sessionId: string) => Promise<void>;
  submitGuesses: (sessionId: string, userId: string, adivinanzas: Record<string, string>) => Promise<void>;
  finishGuessPhase: (sessionId: string) => Promise<void>;
  finishGame: (sessionId: string) => Promise<void>;
  refreshGameState: (sessionId: string) => Promise<void>;
  clearGame: () => void;
  
  // Utilidades
  isAnswerPhase: boolean;
  isGuessPhase: boolean;
  isFinished: boolean;
  currentRound: number;
  totalRounds: number;
}

export const useGame = (): UseGameReturn => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // Cargar sesión desde localStorage al montar
  useEffect(() => {
    const sessionId = SessionManager.getSession();
    if (sessionId) {
      refreshGameState(sessionId);
    }
  }, []);

  // Iniciar partida
  const startGame = useCallback(async (roomId: string, userId: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.iniciarPartida(roomId, userId);
      
      setSession(response.sesion);
      SessionManager.setSession(response.sessionId);
      
      console.log('✅ Partida iniciada:', response.sessionId);
      return response.sessionId;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al iniciar partida';
      setError(errorMsg);
      console.error('❌ Error al iniciar partida:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar ronda
  const startRound = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.iniciarRonda(sessionId);
      
      setCurrentQuestion(response.pregunta);
      setRoundResults([]); // Limpiar resultados anteriores
      
      console.log('✅ Ronda iniciada:', response.ronda);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al iniciar ronda';
      setError(errorMsg);
      console.error('❌ Error al iniciar ronda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar respuesta
  const submitAnswer = useCallback(async (
    sessionId: string, 
    userId: string, 
    respuesta: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiService.enviarRespuesta(sessionId, userId, respuesta);
      console.log('✅ Respuesta enviada:', respuesta);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al enviar respuesta';
      setError(errorMsg);
      console.error('❌ Error al enviar respuesta:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Finalizar fase de respuestas
  const finishAnswerPhase = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiService.finalizarFaseRespuestas(sessionId);
      console.log('✅ Fase de respuestas finalizada');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al finalizar fase de respuestas';
      setError(errorMsg);
      console.error('❌ Error al finalizar fase respuestas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar adivinanzas
  const submitGuesses = useCallback(async (
    sessionId: string,
    userId: string,
    adivinanzas: Record<string, string>
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiService.enviarAdivinanzas(sessionId, userId, adivinanzas);
      console.log('✅ Adivinanzas enviadas');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al enviar adivinanzas';
      setError(errorMsg);
      console.error('❌ Error al enviar adivinanzas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Finalizar fase de adivinanzas
  const finishGuessPhase = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.finalizarFaseAdivinanzas(sessionId);
      
      setRoundResults(response.resultados);
      setRanking(response.ranking);
      
      console.log('✅ Fase de adivinanzas finalizada');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al finalizar fase de adivinanzas';
      setError(errorMsg);
      console.error('❌ Error al finalizar fase adivinanzas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Finalizar partida
  const finishGame = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.finalizarPartida(sessionId);
      
      setRanking(response.rankingFinal);
      
      console.log('✅ Partida finalizada. Ganador:', response.ganador.nombre);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al finalizar partida';
      setError(errorMsg);
      console.error('❌ Error al finalizar partida:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar estado del juego
  const refreshGameState = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const updatedSession = await apiService.obtenerEstadoPartida(sessionId);
      setSession(updatedSession);
      
      if (updatedSession.preguntaActual) {
        setCurrentQuestion(updatedSession.preguntaActual);
      }
      
      // Obtener ranking actualizado
      const rankingResponse = await apiService.obtenerRankingPartida(sessionId);
      setRanking(rankingResponse.ranking);
      
      console.log('✅ Estado del juego actualizado');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al actualizar estado';
      setError(errorMsg);
      console.error('❌ Error al refrescar estado:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar juego
  const clearGame = useCallback(() => {
    setSession(null);
    setCurrentQuestion(null);
    setRanking([]);
    setRoundResults([]);
    SessionManager.clearSession();
  }, []);

  // Utilidades computadas
  const isAnswerPhase = session?.fase === 'respuestas';
  const isGuessPhase = session?.fase === 'adivinanzas';
  const isFinished = session?.fase === 'finalizada' || session?.estado === 'finalizada';
  const currentRound = session?.rondaActual || 0;
  const totalRounds = session?.configuracion.numeroPreguntas || 0;

  return {
    session,
    loading,
    error,
    currentQuestion,
    ranking,
    roundResults,
    
    startGame,
    startRound,
    submitAnswer,
    finishAnswerPhase,
    submitGuesses,
    finishGuessPhase,
    finishGame,
    refreshGameState,
    clearGame,
    
    isAnswerPhase,
    isGuessPhase,
    isFinished,
    currentRound,
    totalRounds,
  };
};