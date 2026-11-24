import { Navigate, Outlet } from 'react-router'
import { useAuthSession } from '../../features/auth/api'

export function ProtectedRoute() {
  const { data: auth, isLoading } = useAuthSession()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
          />
          <span>Checking session…</span>
        </div>
      </div>
    )
  }

  if (!auth?.user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
