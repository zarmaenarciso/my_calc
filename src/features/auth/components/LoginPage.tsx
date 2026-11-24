import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useAuthSession, useSignIn, useSignUp } from '../api'
import { authCredentialsSchema } from '../schemas'

export function LoginPage() {
  const { data: auth } = useAuthSession()
  const signIn = useSignIn()
  const signUp = useSignUp()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  if (auth?.user) {
    return <Navigate to="/" replace />
  }

  const activeMutation = mode === 'signin' ? signIn : signUp

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})

    const result = authCredentialsSchema.safeParse({ email, password })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      })
      return
    }

    const mutation = mode === 'signin' ? signIn : signUp
    mutation.mutate(result.data, {
      onSuccess: () => {
        void navigate('/')
      },
    })
  }

  const isConfigured = auth?.isConfigured ?? true

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center py-6 sm:py-12">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            Authenticated via Firebase Auth with Firestore Security Rules.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isConfigured ? (
            <div
              role="status"
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
            >
              Firebase environment variables are not configured yet. Copy{' '}
              <code>.env.example</code> to <code>.env</code> and add your
              Firebase Web App configuration.
            </div>
          ) : null}

          <div
            role="tablist"
            aria-label="Authentication mode"
            className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => setMode('signin')}
              className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => setMode('signup')}
              className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              disabled={!isConfigured || activeMutation.isPending}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              disabled={!isConfigured || activeMutation.isPending}
            />

            {activeMutation.isError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
              >
                {activeMutation.error instanceof Error
                  ? activeMutation.error.message
                  : 'Authentication failed.'}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={!isConfigured}
              isLoading={activeMutation.isPending}
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
