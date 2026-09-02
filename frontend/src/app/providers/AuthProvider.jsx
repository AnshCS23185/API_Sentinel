import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/authService'

const AuthContext = createContext({
  adminToken: null,
  adminUser: null,
  consumerKey: null,
  consumerUser: null,
  isAdminAuthenticated: false,
  isConsumerAuthenticated: false,
  adminLogin: async () => {},
  consumerLogin: async () => {},
  logoutAdmin: () => {},
  logoutConsumer: () => {},
})

export const AuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('sentinel_admin_token'))
  const [adminUser, setAdminUser] = useState(null)
  const [consumerKey, setConsumerKey] = useState(() => localStorage.getItem('sentinel_consumer_key') || 'sen_live_demo_key')
  const [consumerUser, setConsumerUser] = useState(() => {
    const saved = localStorage.getItem('sentinel_consumer_user')
    return saved ? JSON.parse(saved) : { email: 'consumer@acmecorp.com', name: 'Acme Corporation' }
  })

  useEffect(() => {
    if (adminToken && !adminUser) {
      authService.getAdminProfile()
        .then(user => setAdminUser(user))
        .catch(() => logoutAdmin())
    }
  }, [adminToken])

  const adminLogin = async (email, password) => {
    const data = await authService.adminLogin(email, password)
    localStorage.setItem('sentinel_admin_token', data.access_token)
    setAdminToken(data.access_token)
    const profile = await authService.getAdminProfile()
    setAdminUser(profile)
    return data
  }

  const consumerLogin = async (email, password) => {
    const user = {
      email,
      name: email.split('@')[0].toUpperCase(),
      loginTime: new Date().toISOString(),
    }
    localStorage.setItem('sentinel_consumer_email', email)
    localStorage.setItem('sentinel_consumer_user', JSON.stringify(user))
    localStorage.setItem('sentinel_consumer_key', 'sen_live_demo_acme_1234')
    setConsumerUser(user)
    setConsumerKey('sen_live_demo_acme_1234')
    return user
  }

  const logoutAdmin = () => {
    localStorage.removeItem('sentinel_admin_token')
    setAdminToken(null)
    setAdminUser(null)
  }

  const logoutConsumer = () => {
    localStorage.removeItem('sentinel_consumer_key')
    localStorage.removeItem('sentinel_consumer_email')
    localStorage.removeItem('sentinel_consumer_user')
    setConsumerKey(null)
    setConsumerUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        adminToken,
        adminUser,
        consumerKey,
        consumerUser,
        isAdminAuthenticated: !!adminToken,
        isConsumerAuthenticated: !!consumerUser || !!consumerKey,
        adminLogin,
        consumerLogin,
        logoutAdmin,
        logoutConsumer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
