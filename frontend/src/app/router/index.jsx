import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { ConsumerLayout } from '../layouts/ConsumerLayout'
import { AdminRoute, ConsumerRoute } from './ProtectedRoute'

// Auth Pages
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage'
import { ConsumerLoginPage } from '@/pages/auth/ConsumerLoginPage'
import { NotFoundPage } from '@/pages/auth/NotFoundPage'

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { ConsumersPage } from '@/pages/admin/ConsumersPage'
import { ConsumerDetailPage } from '@/pages/admin/ConsumerDetailPage'
import { PlansPage } from '@/pages/admin/PlansPage'
import { ApiCatalogPage as AdminApiCatalogPage } from '@/pages/admin/ApiCatalogPage'
import { ApiEndpointsPage } from '@/pages/admin/ApiEndpointsPage'
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage'
import { ViolationsPage as AdminViolationsPage } from '@/pages/admin/ViolationsPage'
import { SettingsPage as AdminSettingsPage } from '@/pages/admin/SettingsPage'

// Consumer Pages
import { ConsumerDashboardPage } from '@/pages/consumer/ConsumerDashboardPage'
import { ConsumerApiCatalogPage } from '@/pages/consumer/ApiCatalogPage'
import { MyApisPage } from '@/pages/consumer/MyApisPage'
import { ConsumerUsageAnalyticsPage } from '@/pages/consumer/UsageAnalyticsPage'
import { ConsumerSettingsPage } from '@/pages/consumer/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login/admin" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login/admin', element: <AdminLoginPage /> },
      { path: '/login/consumer', element: <ConsumerLoginPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'consumers', element: <ConsumersPage /> },
      { path: 'consumers/:id', element: <ConsumerDetailPage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'apis', element: <AdminApiCatalogPage /> },
      { path: 'endpoints', element: <ApiEndpointsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'violations', element: <AdminViolationsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },
  {
    path: '/consumer',
    element: (
      <ConsumerRoute>
        <ConsumerLayout />
      </ConsumerRoute>
    ),
    children: [
      { index: true, element: <ConsumerDashboardPage /> },
      { path: 'apis', element: <ConsumerApiCatalogPage /> },
      { path: 'apis/:id', element: <Navigate to="/consumer/apis" replace /> },
      { path: 'my-apis', element: <MyApisPage /> },
      { path: 'api-keys', element: <Navigate to="/consumer/my-apis" replace /> },
      { path: 'plan', element: <Navigate to="/consumer" replace /> },
      { path: 'usage', element: <ConsumerUsageAnalyticsPage /> },
      { path: 'violations', element: <Navigate to="/consumer/usage" replace /> },
      { path: 'settings', element: <ConsumerSettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
