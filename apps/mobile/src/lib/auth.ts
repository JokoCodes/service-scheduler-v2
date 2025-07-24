// Simple auth service for demo purposes
interface User {
  id: string
  email: string
  name: string
  role: 'employee'
  company_id: string
}

class AuthService {
  private user: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  // Demo login - accepts any credentials
  async login(email: string, password: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user: User = {
      id: 'demo-employee-1',
      email,
      name: 'Demo Employee',
      role: 'employee',
      company_id: '550e8400-e29b-41d4-a716-446655440000'
    }
    
    this.user = user
    this.notifyListeners(user)
    return user
  }

  async logout(): Promise<void> {
    this.user = null
    this.notifyListeners(null)
  }

  getCurrentUser(): User | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return this.user !== null
  }

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(user: User | null) {
    this.listeners.forEach(callback => callback(user))
  }
}

export const authService = new AuthService()
