/**
 * Funciones de mapeo para transformar respuestas del backend
 * al formato esperado por el frontend
 */

/**
 * Mapea un contest del backend a un challenge del frontend
 */
export const mapContestToChallenge = (contest) => {
  return {
    id: contest.id,
    title: contest.name,
    description: contest.description || '',
    status: 'active',
    rules: contest.rules || '',
    objective: contest.objective || '',
    endDate: contest.end_date,
    createdAt: contest.start_date,
    images: contest.images?.map(mapImage) || []
  };
};

/**
 * Mapea una imagen del backend al formato del frontend
 */
export const mapImage = (image) => {
  return {
    id: image.id,
    url: image.dzi_url,
    dziUrl: image.dzi_url,
    metadata: typeof image.metadata === 'string' 
      ? JSON.parse(image.metadata || '{}') 
      : image.metadata || {}
  };
};

/**
 * Mapea un usuario del backend al formato del frontend
 */
export const mapUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    score: user.score || user.total_score || 0,
    annotations_count: user.annotations_count || 0,
    validated_annotations: user.validated_annotations || 0,
    rank: user.rank || 0
  };
};

/**
 * Mapea una anotación del backend al formato del frontend
 */
export const mapAnnotation = (annotation) => {
  return {
    id: annotation.id,
    userId: annotation.user_id,
    userName: annotation.user_name,
    imageId: annotation.image_id,
    challengeId: annotation.contest_id,
    annotations: typeof annotation.annotations_data === 'string'
      ? JSON.parse(annotation.annotations_data)
      : annotation.annotations_data,
    metadata: typeof annotation.metadata === 'string'
      ? JSON.parse(annotation.metadata || '{}')
      : annotation.metadata || {},
    status: annotation.status,
    createdAt: annotation.created_at,
    dziUrl: annotation.dzi_url
  };
};

/**
 * Transforma datos del frontend al formato esperado por el backend
 * para crear una anotación
 */
export const mapAnnotationForBackend = (frontendAnnotation) => {
  return {
    image_id: frontendAnnotation.imageId,
    annotations: frontendAnnotation.annotations || [],
    metadata: {
      timestamp: new Date().toISOString(),
      ...frontendAnnotation.metadata
    }
  };
};

/**
 * Transforma datos del frontend al formato esperado por el backend
 * para crear un contest
 */
export const mapChallengeForBackend = (frontendChallenge) => {
  return {
    name: frontendChallenge.title,
    description: frontendChallenge.description || '',
    rules: frontendChallenge.rules || '',
    objective: frontendChallenge.objective || '',
    end_date: frontendChallenge.endDate || null,
    images: frontendChallenge.images?.map(img => ({
      dzi_url: img.url || img.dziUrl,
      metadata: JSON.stringify(img.metadata || {})
    })) || []
  };
};

/**
 * Mapea entrada del ranking
 */
export const mapRankingEntry = (entry) => {
  return {
    userId: entry.id,
    name: entry.name,
    score: entry.score || 0,
    role: entry.role,
    annotations_count: entry.annotations_count || 0,
    rank: entry.rank
  };
};

