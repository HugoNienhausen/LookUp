import axios from 'axios';
import {
  mapContestToChallenge,
  mapUser,
  mapAnnotation,
  mapAnnotationForBackend,
  mapChallengeForBackend,
  mapRankingEntry
} from './mapper';

const API_URL = '/api';

/**
 * Cliente HTTP configurado para el backend real
 */
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar JWT automáticamente a todas las peticiones
client.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores de autenticación
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========

/**
 * Login de usuario
 */
export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password });
  
  // Backend devuelve: { message, token, user }
  return {
    ...data.user,
    token: data.token
  };
};

/**
 * Registro de usuario
 */
export const register = async (name, email, password, role = 'participant') => {
  const { data } = await client.post('/auth/register', { 
    name, 
    email, 
    password, 
    role 
  });
  
  // Después de registrarse, hacer login automáticamente
  return await login(email, password);
};

// ========== USERS ==========

/**
 * Obtener perfil del usuario actual
 */
export const getMe = async () => {
  const { data } = await client.get('/users/me');
  return mapUser(data);
};

/**
 * Obtener datos de un usuario específico
 */
export const getUser = async (userId) => {
  const { data } = await client.get(`/users/${userId}`);
  return mapUser(data);
};

// ========== CHALLENGES (CONTESTS) ==========

/**
 * Obtener todos los challenges (contests)
 */
export const getChallenges = async () => {
  const { data } = await client.get('/contests');
  return data.map(mapContestToChallenge);
};

/**
 * Obtener un challenge por ID
 */
export const getChallenge = async (id) => {
  const { data } = await client.get(`/contests/${id}`);
  return mapContestToChallenge(data);
};

/**
 * Crear nuevo challenge (solo agency)
 */
export const createChallenge = async (challengeData) => {
  const backendData = mapChallengeForBackend(challengeData);
  const { data } = await client.post('/contests', backendData);
  return data;
};

/**
 * Unirse a un challenge
 */
export const joinChallenge = async (challengeId) => {
  const { data } = await client.post(`/contests/${challengeId}/join`);
  return data;
};

/**
 * Obtener imágenes de un challenge
 */
export const getChallengeImages = async (challengeId) => {
  const { data } = await client.get(`/contests/${challengeId}/images`);
  return data;
};

// ========== ANNOTATIONS ==========

/**
 * Obtener anotaciones con filtros
 */
export const getAnnotations = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.challengeId) {
    params.append('contest_id', filters.challengeId);
  }
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.userId) {
    params.append('user_id', filters.userId);
  }
  
  const { data } = await client.get(`/annotations?${params.toString()}`);
  return data.map(mapAnnotation);
};

/**
 * Crear nueva anotación
 * Backend extrae user_id del token JWT automáticamente
 */
export const createAnnotation = async (annotationData) => {
  // annotationData puede contener: imageId, annotations, metadata
  const backendData = mapAnnotationForBackend(annotationData);
  
  const { data } = await client.post('/annotations', backendData);
  
  // Si hubo promoción, actualizar datos del usuario
  const result = {
    annotation: data,
    userUpdates: null
  };
  
  if (data.promoted) {
    result.userUpdates = {
      role: data.new_role,
      score: data.bonus_points
    };
  }
  
  return result;
};

/**
 * Validar una anotación (solo validators y agencies)
 * Backend extrae validator_id del token JWT automáticamente
 */
export const validateAnnotation = async (annotationId, validatorId, decision, comment = '') => {
  // validatorId ya no se envía, el backend lo extrae del token
  const { data } = await client.post(`/annotations/${annotationId}/validate`, {
    decision,
    comment
  });
  
  return data;
};

/**
 * Obtener cola de validación (anotaciones pendientes)
 */
export const getValidationQueue = async () => {
  return await getAnnotations({ status: 'pending' });
};

// ========== RANKING ==========

/**
 * Obtener ranking global
 */
export const getRanking = async (limit = 10) => {
  const { data } = await client.get(`/ranking?limit=${limit}`);
  return data.map(mapRankingEntry);
};

// ========== DEPRECATED (mantener para compatibilidad) ==========

/**
 * Actualizar usuario (deprecated - usar getMe para refrescar)
 */
export const updateUser = async (userId, updates) => {
  console.warn('updateUser is deprecated, user data is managed by backend');
  return updates;
};
