// src/services/ApiService.ts

import { API_CONFIG } from '../config/config';

// ========================================
// TIPOS BASE
// ========================================

export interface User {
  userId: string;
  nombre: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  roomId: string;
  hostId: string;
  jugadores: User[];
  maxJugadores: number;
  estado: 'esperando' | 'jugando' | 'finalizado';
  configuracion: RoomConfig;
  createdAt: string;
  updatedAt: string;
}

export interface RoomConfig {
  numeroPreguntas: 10 | 15 | 20;
  tiempoRespuesta: number; // segundos (30-300)
  tiempoAdivinanza: number; // segundos (30-300)
  puntosAdivinanzaCorrecta: number;
  topic: string;
}

export interface Question {
  questionId: string;
  texto: string;
  opciones: string[];
  topic: string;
  createdAt: string;
}

export interface GameSession {
  sessionId: string;
  roomId: string;
  estado: 'activa' | 'finalizada';
  rondaActual: number;
  fase: 'respuestas' | 'adivinanzas' | 'finalizada';
  preguntaActual?: Question;
  jugadores: GamePlayer[];
  configuracion: RoomConfig;
  createdAt: string;
  updatedAt: string;
}

export interface GamePlayer {
  userId: string;
  nombre: string;
  avatarUrl: string;
  puntuacion: number;
  respuesta?: string;
  adivinanzas?: Record<string, string>;
}

export interface RankingEntry {
  userId: string;
  nombre: string;
  avatarUrl: string;
  puntuacion: number;
  posicion: number;
}

export interface RoundResult {
  userId: string;
  nombre: string;
  aciertos: number;
  puntosGanados: number;
}

// ========================================
// TIPOS DE RESPUESTA
// ========================================

export interface CreateUserResponse {
  message: string;
  usuario: User;
}

export interface CreateRoomResponse {
  message: string;
  sala: Room;
}

export interface JoinRoomResponse {
  message: string;
  sala: Room;
}

export interface LeaveRoomResponse {
  mensaje: string;
  sala?: Room;
}

export interface ListRoomsResponse {
  salas: Room[];
  lastKey?: string;
}

export interface StartGameResponse {
  message: string;
  sessionId: string;
  sesion: GameSession;
}

export interface StartRoundResponse {
  mensaje: string;
  ronda: number;
  pregunta: Question;
}

export interface AnswerResponse {
  mensaje: string;
}

export interface FinishAnswersResponse {
  mensaje: string;
}

export interface GuessResponse {
  mensaje: string;
}

export interface FinishGuessesResponse {
  mensaje: string;
  resultados: RoundResult[];
  ranking: RankingEntry[];
}

export interface FinishGameResponse {
  mensaje: string;
  ganador: RankingEntry;
  rankingFinal: RankingEntry[];
}

export interface GetRankingResponse {
  ranking: RankingEntry[];
}

export interface CreateQuestionResponse {
  message: string;
  pregunta: Question;
}

export interface ListQuestionsResponse {
  preguntas: Question[];
  lastKey?: string;
}

export interface ListTopicsResponse {
  topics: string[];
}

export interface DeleteQuestionResponse {
  mensaje: string;
}

// ========================================
// ERROR PERSONALIZADO
// ========================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ========================================
// API SERVICE
// ========================================

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT || 30000;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS || 3;
    this.retryDelay = API_CONFIG.RETRY_DELAY || 1000;
  }

  /**
   * Realizar petición HTTP con retry y manejo de errores
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = this.retryAttempts
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new ApiError(
            data.message || `Error ${response.status}`,
            response.status,
            data
          );
        }

        return data;
      } catch (error) {
        // Si es el último intento o error de cliente (4xx), lanzar error
        if (attempt === retries || (error instanceof ApiError && error.status < 500)) {
          throw error;
        }

        // Esperar antes de reintentar
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * (attempt + 1))
        );
      }
    }

    throw new Error('Max retries reached');
  }

  // ==========================================
  // USUARIOS
  // ==========================================

  async crearUsuario(nombre: string): Promise<CreateUserResponse> {
    return this.request<CreateUserResponse>('/usuario/crear', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    });
  }

  async obtenerUsuario(userId: string): Promise<User> {
    return this.request<User>(`/usuario/${userId}`);
  }

  async actualizarUsuario(
    userId: string,
    datos: { nombre?: string; avatarUrl?: string }
  ): Promise<{ message: string; usuario: User }> {
    return this.request<{ message: string; usuario: User }>(
      `/usuario/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(datos),
      }
    );
  }

  // ==========================================
  // SALAS
  // ==========================================

  async crearSala(params: {
    userId: string;
    maxJugadores?: number;
    numeroPreguntas?: 10 | 15 | 20;
    tiempoRespuesta?: number;
    tiempoAdivinanza?: number;
    puntosAdivinanzaCorrecta?: number;
    topic?: string;
  }): Promise<CreateRoomResponse> {
    return this.request<CreateRoomResponse>('/sala/crear', {
      method: 'POST',
      body: JSON.stringify({
        userId: params.userId,
        maxJugadores: params.maxJugadores || 4,
        numeroPreguntas: params.numeroPreguntas || 10,
        tiempoRespuesta: params.tiempoRespuesta || 150,
        tiempoAdivinanza: params.tiempoAdivinanza || 150,
        puntosAdivinanzaCorrecta: params.puntosAdivinanzaCorrecta || 10,
        topic: params.topic || 'cultura-general',
      }),
    });
  }

  async unirseSala(roomId: string, userId: string): Promise<JoinRoomResponse> {
    return this.request<JoinRoomResponse>(`/sala/${roomId}/unirse`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async salirDeSala(roomId: string, userId: string): Promise<LeaveRoomResponse> {
    return this.request<LeaveRoomResponse>(`/sala/${roomId}/salir`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async obtenerSala(roomId: string): Promise<Room> {
    return this.request<Room>(`/sala/${roomId}`);
  }

  async listarSalas(limit = 20, lastKey?: string): Promise<ListRoomsResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (lastKey) params.append('lastKey', lastKey);

    return this.request<ListRoomsResponse>(`/salas/disponibles?${params}`);
  }

  async actualizarConfiguracion(
    roomId: string,
    userId: string,
    config: Partial<RoomConfig>
  ): Promise<{ message: string; sala: Room }> {
    return this.request<{ message: string; sala: Room }>(
      `/sala/${roomId}/configuracion`,
      {
        method: 'PUT',
        body: JSON.stringify({ userId, ...config }),
      }
    );
  }

  // ==========================================
  // PREGUNTAS
  // ==========================================

  async crearPregunta(pregunta: {
    texto: string;
    opciones: string[];
    topic: string;
  }): Promise<CreateQuestionResponse> {
    return this.request<CreateQuestionResponse>('/pregunta/crear', {
      method: 'POST',
      body: JSON.stringify(pregunta),
    });
  }

  async listarPreguntas(limit = 50, lastKey?: string): Promise<ListQuestionsResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (lastKey) params.append('lastKey', lastKey);

    return this.request<ListQuestionsResponse>(`/preguntas?${params}`);
  }

  async listarPreguntasPorTopic(
    topic: string,
    limit = 50
  ): Promise<ListQuestionsResponse> {
    return this.request<ListQuestionsResponse>(
      `/preguntas/topic/${topic}?limit=${limit}`
    );
  }

  async listarTopics(): Promise<ListTopicsResponse> {
    return this.request<ListTopicsResponse>('/preguntas/topics');
  }

  async eliminarPregunta(questionId: string): Promise<DeleteQuestionResponse> {
    return this.request<DeleteQuestionResponse>(`/pregunta/${questionId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // JUEGO
  // ==========================================

  async iniciarPartida(roomId: string, userId: string): Promise<StartGameResponse> {
    return this.request<StartGameResponse>(`/juego/${roomId}/iniciar`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async iniciarRonda(sessionId: string): Promise<StartRoundResponse> {
    return this.request<StartRoundResponse>(`/juego/${sessionId}/ronda`, {
      method: 'POST',
    });
  }

  async enviarRespuesta(
    sessionId: string,
    userId: string,
    respuesta: string
  ): Promise<AnswerResponse> {
    return this.request<AnswerResponse>(`/juego/${sessionId}/responder`, {
      method: 'POST',
      body: JSON.stringify({ userId, respuesta }),
    });
  }

  async finalizarFaseRespuestas(sessionId: string): Promise<FinishAnswersResponse> {
    return this.request<FinishAnswersResponse>(
      `/juego/${sessionId}/fase-respuestas/finalizar`,
      {
        method: 'POST',
      }
    );
  }

  async enviarAdivinanzas(
    sessionId: string,
    userId: string,
    adivinanzas: Record<string, string>
  ): Promise<GuessResponse> {
    return this.request<GuessResponse>(`/juego/${sessionId}/adivinar`, {
      method: 'POST',
      body: JSON.stringify({ userId, adivinanzas }),
    });
  }

  async finalizarFaseAdivinanzas(sessionId: string): Promise<FinishGuessesResponse> {
    return this.request<FinishGuessesResponse>(
      `/juego/${sessionId}/fase-adivinanzas/finalizar`,
      {
        method: 'POST',
      }
    );
  }

  async obtenerEstadoPartida(sessionId: string): Promise<GameSession> {
    return this.request<GameSession>(`/juego/${sessionId}/estado`);
  }

  async finalizarPartida(sessionId: string): Promise<FinishGameResponse> {
    return this.request<FinishGameResponse>(`/juego/${sessionId}/finalizar`, {
      method: 'POST',
    });
  }

  async obtenerRankingPartida(sessionId: string): Promise<GetRankingResponse> {
    return this.request<GetRankingResponse>(`/juego/${sessionId}/ranking`);
  }
}

// ==========================================
// WEBSOCKET CLIENT
// ==========================================

export interface WebSocketMessage {
  event: string;
  data: any;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Array<(data: any) => void>>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private isIntentionallyClosed: boolean;

  constructor(
    private roomId: string,
    private userId: string,
    private wsUrl: string = API_CONFIG.WS_URL
  ) {
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isIntentionallyClosed = false;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.wsUrl}?roomId=${this.roomId}&userId=${this.userId}`;

      try {
        this.ws = new WebSocket(url);
        this.isIntentionallyClosed = false;

        this.ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          this.reconnectAttempts = 0;
          this.emit('connected', { roomId: this.roomId, userId: this.userId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 Mensaje recibido:', message.event);
            this.emit(message.event, message.data);
          } catch (err) {
            console.error('❌ Error al parsear mensaje:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          this.emit('disconnected');

          if (!this.isIntentionallyClosed) {
            this.reconnect();
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(
      `🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch (err) {
      console.error('❌ Error al reconectar:', err);
    }
  }

  send(action: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, data }));
    } else {
      console.error('❌ WebSocket no está conectado');
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`❌ Error en listener de ${event}:`, err);
        }
      });
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// ==========================================
// SESSION MANAGER
// ==========================================

export class SessionManager {
  private static USER_KEY = 'usuario';
  private static ROOM_KEY = 'sala';
  private static SESSION_KEY = 'sessionId';

  static setUser(usuario: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  static getUser(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  static clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static setRoom(sala: Room): void {
    localStorage.setItem(this.ROOM_KEY, JSON.stringify(sala));
  }

  static getRoom(): Room | null {
    const data = localStorage.getItem(this.ROOM_KEY);
    return data ? JSON.parse(data) : null;
  }

  static clearRoom(): void {
    localStorage.removeItem(this.ROOM_KEY);
  }

  static setSession(sessionId: string): void {
    localStorage.setItem(this.SESSION_KEY, sessionId);
  }

  static getSession(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static clearAll(): void {
    this.clearUser();
    this.clearRoom();
    this.clearSession();
  }
}

// ==========================================
// EXPORTAR INSTANCIA
// ==========================================

export default new ApiService();