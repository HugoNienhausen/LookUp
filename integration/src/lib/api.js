import axios from 'axios';

const API_URL = '/api';

/**
 * Cliente HTTP configurado para el mock backend
 */
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ========== AUTH ==========

/**
 * Login de usuario (mock)
 */
export const login = async (email, password) => {
  const { data: users } = await client.get('/users');
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Credenciales inválidas');
  }
  
  return user;
};

/**
 * Registro de usuario (mock)
 */
export const register = async (name, email, password) => {
  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    password,
    role: 'user',
    score: 0,
    annotations_count: 0,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    reputation: 0
  };
  
  const { data } = await client.post('/users', newUser);
  return data;
};

// ========== CHALLENGES ==========

/**
 * Obtener todos los challenges
 */
export const getChallenges = async () => {
  const { data } = await client.get('/challenges');
  return data;
};

/**
 * Obtener un challenge por ID
 */
export const getChallenge = async (id) => {
  const { data } = await client.get(`/challenges/${id}`);
  return data;
};

/**
 * Crear nuevo challenge (solo agency)
 */
export const createChallenge = async (challengeData) => {
  const newChallenge = {
    id: `challenge_${Date.now()}`,
    ...challengeData,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  const { data } = await client.post('/challenges', newChallenge);
  return data;
};

// ========== ANNOTATIONS ==========

/**
 * Obtener anotaciones de un challenge
 */
export const getAnnotations = async (challengeId) => {
  const { data: allAnnotations } = await client.get('/annotations');
  return allAnnotations.filter(a => a.challengeId === challengeId);
};

/**
 * Crear nueva anotación
 */
export const createAnnotation = async (annotationData) => {
  const newAnnotation = {
    id: `annotation_${Date.now()}`,
    ...annotationData,
    status: 'pending',
    score: 0,
    createdAt: new Date().toISOString()
  };
  
  const { data } = await client.post('/annotations', newAnnotation);
  
  // Actualizar contador de anotaciones del usuario
  const { data: user } = await client.get(`/users/${annotationData.userId}`);
  const updatedCount = (user.annotations_count || 0) + 1;
  
  // Promoción automática a validator si alcanza el threshold
  const updates = { annotations_count: updatedCount };
  if (updatedCount >= 5 && user.role === 'user') {
    updates.role = 'validator';
    updates.score = (user.score || 0) + 500; // Bonus por promoción
  }
  
  await client.patch(`/users/${annotationData.userId}`, updates);
  
  return { annotation: data, userUpdates: updates };
};

/**
 * Validar una anotación (solo validators)
 */
export const validateAnnotation = async (annotationId, validatorId, decision, comment = '') => {
  const validation = {
    id: `validation_${Date.now()}`,
    annotationId,
    validatorId,
    decision, // 'approved' | 'rejected'
    comment,
    createdAt: new Date().toISOString()
  };
  
  await client.post('/validations', validation);
  
  // Actualizar status de la anotación
  const newStatus = decision === 'approved' ? 'validated' : 'rejected';
  const scoreUpdate = decision === 'approved' ? 100 : 0;
  
  await client.patch(`/annotations/${annotationId}`, { 
    status: newStatus,
    score: scoreUpdate 
  });
  
  return validation;
};

/**
 * Obtener cola de validación (anotaciones pendientes)
 */
export const getValidationQueue = async () => {
  const { data: allAnnotations } = await client.get('/annotations');
  return allAnnotations.filter(a => a.status === 'pending');
};

// ========== RANKING ==========

/**
 * Obtener ranking global
 */
export const getRanking = async () => {
  const { data: users } = await client.get('/users');
  return users
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((user, index) => ({
      userId: user.id,
      name: user.name,
      score: user.score || 0,
      rank: index + 1
    }));
};

/**
 * Obtener datos de un usuario específico
 */
export const getUser = async (userId) => {
  const { data } = await client.get(`/users/${userId}`);
  return data;
};

/**
 * Actualizar usuario
 */
export const updateUser = async (userId, updates) => {
  const { data } = await client.patch(`/users/${userId}`, updates);
  return data;
};

