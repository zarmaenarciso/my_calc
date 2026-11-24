import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './features/auth/components/LoginPage'
import { DashboardPage } from './features/dashboard/components/DashboardPage'
import { PeoplePage } from './features/people/components/PeoplePage'
import { ProfilePage } from './features/profile/components/ProfilePage'
import { queryClient } from './lib/query-client'

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/people" element={<PeoplePage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
