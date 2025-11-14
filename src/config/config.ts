// src/config/config.ts

export const API_CONFIG = {
  // URLs de la API
  BASE_URL: import.meta.env.VITE_API_URL || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev',
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev',
  
  // Timeouts y reintentos
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // WebSocket
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY: 2000, // 2 segundos
  
  // Otros
  DEFAULT_AVATAR: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
};

export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  DEFAULT_MAX_PLAYERS: 4,
  
  QUESTION_OPTIONS: [10, 15, 20] as const,
  DEFAULT_QUESTIONS: 10,
  
  MIN_TIME: 30,
  MAX_TIME: 300,
  DEFAULT_RESPONSE_TIME: 150,
  DEFAULT_GUESS_TIME: 150,
  
  DEFAULT_POINTS: 10,
  
  AVAILABLE_TOPICS: [
    'cultura-general',
    'ciencia',
    'historia',
    'entretenimiento',
    'deportes',
    'geografia',
    'arte',
    'tecnologia',
  ] as const,
  DEFAULT_TOPIC: 'cultura-general',
};

export type Topic = typeof GAME_CONFIG.AVAILABLE_TOPICS[number];
export type QuestionCount = typeof GAME_CONFIG.QUESTION_OPTIONS[number];