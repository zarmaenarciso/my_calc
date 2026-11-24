import { CheckCircle2, Database, Globe, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { useAuthSession } from '../../auth/api'

export function DashboardPage() {
  const { data: auth, isLoading } = useAuthSession()

  const isConfigured = auth?.isConfigured ?? false
  const user = auth?.user ?? null

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Workspace Overview
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            React + TypeScript + Firebase + Cloudflare Workers starter shell.
          </p>
        </div>
        {!isLoading && !user ? (
          <Link to="/login">
            <Button>Sign in</Button>
          </Link>
        ) : null}
      </section>

      {!isLoading && !isConfigured ? (
        <Card className="border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle>Firebase Environment Pending</CardTitle>
            <CardDescription>
              Copy <code>.env.example</code> to <code>.env</code> and set your{' '}
              <code>VITE_FIREBASE_*</code> variables to enable live auth and
              Firestore queries.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Auth Session</span>
            </CardTitle>
            <CardDescription>Firebase Auth state via TanStack Query</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-slate-500">Checking session…</p>
            ) : user ? (
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  <span>Signed in</span>
                </p>
                <p className="truncate text-slate-600 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Not signed in. Use the Sign in page to authenticate.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Firestore & Rules</span>
            </CardTitle>
            <CardDescription>Versioned Security Rules</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Access control is enforced in <code>firestore.rules</code> with a
              default deny-all baseline.
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Edge Runtime</span>
            </CardTitle>
            <CardDescription>Cloudflare Workers Static Assets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              SPA routing configured in <code>wrangler.jsonc</code> with{' '}
              <code>worker/index.ts</code> ready for privileged endpoints.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
