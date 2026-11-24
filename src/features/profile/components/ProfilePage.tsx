import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useAuthSession, useUpdatePassword } from '../../auth/api'
import { updatePasswordSchema } from '../../auth/schemas'
import { useUpdateUserProfile, useUserProfile } from '../api'
import { updateProfileSchema } from '../schemas'

export function ProfilePage() {
  const { data: auth } = useAuthSession()
  const { data: profile, isLoading: isProfileLoading } = useUserProfile(
    auth?.user?.uid,
  )
  const updateUserProfile = useUpdateUserProfile()
  const updatePassword = useUpdatePassword()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [profileErrors, setProfileErrors] = useState<{
    name?: string
    username?: string
  }>({})
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})
  const [passwordSaved, setPasswordSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setUsername(profile.username)
    }
  }, [profile])

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileErrors({})
    setProfileSaved(false)

    const result = updateProfileSchema.safeParse({ name, username })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setProfileErrors({
        name: flattened.name?.[0],
        username: flattened.username?.[0],
      })
      return
    }

    updateUserProfile.mutate(result.data, {
      onSuccess: () => {
        setProfileSaved(true)
      },
    })
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordErrors({})
    setPasswordSaved(false)

    const result = updatePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setPasswordErrors({
        currentPassword: flattened.currentPassword?.[0],
        newPassword: flattened.newPassword?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      })
      return
    }

    updatePassword.mutate(result.data, {
      onSuccess: () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordSaved(true)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Update your profile details and account password.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Details Update Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Updates your display name and username in Firestore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} noValidate className="space-y-4">
              <Input
                label="Name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={profileErrors.name}
                disabled={isProfileLoading || updateUserProfile.isPending}
              />

              <Input
                label="Username"
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={profileErrors.username}
                disabled={isProfileLoading || updateUserProfile.isPending}
              />

              {updateUserProfile.isError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {updateUserProfile.error instanceof Error
                    ? updateUserProfile.error.message
                    : 'Failed to update profile.'}
                </p>
              ) : null}

              {profileSaved ? (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  Profile updated successfully.
                </p>
              ) : null}

              <Button
                type="submit"
                isLoading={updateUserProfile.isPending}
                disabled={isProfileLoading}
                className="w-full sm:w-auto"
              >
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>
              Re-authenticates your session before updating your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <Input
                label="Current password"
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={passwordErrors.currentPassword}
                disabled={updatePassword.isPending}
              />

              <Input
                label="New password"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={passwordErrors.newPassword}
                disabled={updatePassword.isPending}
              />

              <Input
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={passwordErrors.confirmPassword}
                disabled={updatePassword.isPending}
              />

              {updatePassword.isError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {updatePassword.error instanceof Error
                    ? updatePassword.error.message
                    : 'Failed to update password.'}
                </p>
              ) : null}

              {passwordSaved ? (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  Password updated successfully.
                </p>
              ) : null}

              <Button
                type="submit"
                isLoading={updatePassword.isPending}
                className="w-full sm:w-auto"
              >
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
