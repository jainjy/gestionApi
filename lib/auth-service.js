class AuthService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
  }

  // Stockage sécurisé
  storage = {
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.warn('LocalStorage non disponible:', error)
      }
    },
    getItem: (key) => {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('LocalStorage non disponible:', error)
        return null
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('LocalStorage non disponible:', error)
      }
    }
  }

  // Login
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la connexion')
    }

    const data = await response.json()
    this.setAuthData(data.user, data.token)
    return data
  }

  // Inscription
  async register(userData) {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'inscription')
    }

    const data = await response.json()
    this.setAuthData(data.user, data.token)
    return data
  }

  // Stocker les données d'authentification
  setAuthData(user, token) {
    this.storage.setItem('auth-token', token)
    this.storage.setItem('user-data', JSON.stringify(user))
    this.storage.setItem('user-role', user.role)
    
    // Cookies
    document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Strict`
    document.cookie = `user-role=${user.role}; path=/; max-age=86400; SameSite=Strict`
  }

  // Déconnexion
  logout() {
    this.storage.removeItem('auth-token')
    this.storage.removeItem('user-data')
    this.storage.removeItem('user-role')
    
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    window.location.href = '/login'
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    try {
      const userData = this.storage.getItem('user-data')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  // Obtenir le token
  getToken() {
    return this.storage.getItem('auth-token')
  }

  // Vérifier si authentifié
  isAuthenticated() {
    return this.getToken() !== null
  }

  // Headers authentifiés pour les requêtes API
  getAuthHeaders() {
    const token = this.getToken()
    
    if (!token) {
      return {}
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Mot de passe oublié
  async forgotPassword(email) {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la demande de réinitialisation')
    }

    return response.json()
  }

  // Réinitialisation du mot de passe
  async resetPassword(token, newPassword) {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la réinitialisation')
    }

    return response.json()
  }

  // Vérifier le token de réinitialisation
  async verifyResetToken(token) {
    const response = await fetch(`${this.baseUrl}/auth/verify-reset-token?token=${encodeURIComponent(token)}`)

    if (!response.ok) {
      throw new Error('Token invalide ou expiré')
    }

    return response.json()
  }
}

export const authService = new AuthService()