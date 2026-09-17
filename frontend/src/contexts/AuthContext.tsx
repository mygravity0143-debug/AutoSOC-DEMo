import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface User {
  email: string
  name: string
  role: "admin" | "analyst" | "viewer"
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "autosoc_user"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (!email.trim() || !password.trim()) {
      return { success: false, message: "Email and password are required" }
    }

    await new Promise(resolve => setTimeout(resolve, 600))

    if (email === "admin@autosoc.local" && password === "demo123") {
      const u: User = { email, name: "Admin User", role: "admin" }
      setUser(u)
      return { success: true, message: "Login successful" }
    }

    if (email === "analyst@autosoc.local" && password === "demo123") {
      const u: User = { email, name: "SOC Analyst", role: "analyst" }
      setUser(u)
      return { success: true, message: "Login successful" }
    }

    if (email === "viewer@autosoc.local" && password === "demo123") {
      const u: User = { email, name: "Read-Only Viewer", role: "viewer" }
      setUser(u)
      return { success: true, message: "Login successful" }
    }

    // Accept any non-empty credentials as demo login
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    const u: User = { email, name: name || "Demo User", role: "analyst" }
    setUser(u)
    return { success: true, message: "Demo Login" }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export default AuthContext
