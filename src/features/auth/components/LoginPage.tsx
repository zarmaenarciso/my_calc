import { ShieldCheck } from 'lucide-react'
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
import { signInSchema, signUpSchema } from '../schemas'

export function LoginPage() {
  const { data: auth, isLoading } = useAuthSession()
  const signIn = useSignIn()
  const signUp = useSignUp()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    username?: string
    password?: string
  }>({})

  if (!isLoading && auth?.user) {
    return <Navigate to="/" replace />
  }

  const activeMutation = mode === 'signin' ? signIn : signUp
  const isConfigured = auth?.isConfigured ?? true

  const handleModeChange = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode)
    setFieldErrors({})
    signIn.reset()
    signUp.reset()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})

    if (mode === 'signin') {
      const result = signInSchema.safeParse({ username, password })
      if (!result.success) {
        const flattened = result.error.flatten().fieldErrors
        setFieldErrors({
          username: flattened.username?.[0],
          password: flattened.password?.[0],
        })
        return
      }

      signIn.mutate(result.data, {
        onSuccess: () => {
          void navigate('/', { replace: true })
        },
      })
      return
    }

    const result = signUpSchema.safeParse({ name, username, password })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        name: flattened.name?.[0],
        username: flattened.username?.[0],
        password: flattened.password?.[0],
      })
      return
    }

    signUp.mutate(result.data, {
      onSuccess: () => {
        void navigate('/', { replace: true })
      },
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Calc App
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in with your username and password to continue.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'signin'
                ? 'Sign in to your account'
                : 'Create a new account'}
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
                <code>.env.example</code> to <code>.env</code> (or set{' '}
                <code>VITE_FIREBASE_*</code> in Cloudflare build variables) to
                enable authentication.
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
                onClick={() => handleModeChange('signin')}
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
                onClick={() => handleModeChange('signup')}
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
              {mode === 'signup' ? (
                <Input
                  label="Name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                  disabled={!isConfigured || activeMutation.isPending}
                />
              ) : null}

              <Input
                label="Username"
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={fieldErrors.username}
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
    </div>
  )
}
