// lib/api/auth.ts
export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  userType: 'user' | 'professional'
  companyName?: string
}

export interface LoginData {
  email: string
  password: string
}

class ApiService {
  //private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  private baseUrl = '/api'

  async register(userData: RegisterData) {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de l\'inscription')
    }

    return response.json()
  }

  async login(credentials: LoginData) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la connexion')
    }

    return response.json()
  }
}

export const apiService = new ApiService()