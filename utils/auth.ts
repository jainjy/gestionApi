// Utilitaires pour gérer l'authentification

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

export const redirectToLogin = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  window.location.href = '/login';
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    redirectToLogin();
    throw new Error('Authentication required');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { 
    ...options, 
    headers,
    credentials: 'include' as RequestCredentials
  });
  
  if (response.status === 401) {
    redirectToLogin();
    throw new Error('Session expired');
  }
  
  return response;
};

// Version simplifiée sans Stripe pour éviter les erreurs
export const initializeStripe = async (): Promise<any> => {
  try {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    
    const response = await authFetch(`${API_BASE_URL}/api/stripe/config`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Stripe configuration');
    }
    
    const config = await response.json();
    const publishableKey = config.publishableKey;
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key not found in configuration');
    }

    console.log('Stripe configuration loaded successfully');
    // Retourner la clé pour une utilisation future
    return { publishableKey };
    
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
};