import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export const AdminRoute = ({ children }) => {
  const { isAdminAuthenticated } = useAuth()
  if (!isAdminAuthenticated) {
    return <Navigate to="/login/admin" replace />
  }
  return children
}

export const ConsumerRoute = ({ children }) => {
  const { isConsumerAuthenticated } = useAuth()
  if (!isConsumerAuthenticated) {
    return <Navigate to="/login/consumer" replace />
  }
  return children
}
