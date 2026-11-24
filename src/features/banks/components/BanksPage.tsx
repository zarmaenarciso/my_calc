import { Landmark, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useAuthSession } from '../../auth/api'
import { useBanks, useCreateBank, useDeleteBank } from '../api'
import { bankFormSchema } from '../schemas'

export function BanksPage() {
  const { data: auth } = useAuthSession()
  const uid = auth?.user?.uid

  const { data: banks = [], isLoading, isError, error } = useBanks(uid)
  const createBank = useCreateBank(uid)
  const deleteBank = useDeleteBank(uid)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNameError(undefined)

    const result = bankFormSchema.safeParse({ name })
    if (!result.success) {
      setNameError(result.error.flatten().fieldErrors.name?.[0])
      return
    }

    createBank.mutate(result.data, {
      onSuccess: () => {
        setName('')
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Banks
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add bank items here to select them as options when adding a person
          record.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Bank</CardTitle>
          <CardDescription>
            Create a new bank item for your record dropdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Bank name"
              type="text"
              name="bankName"
              placeholder="Enter bank name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              disabled={createBank.isPending}
            />

            {createBank.isError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
              >
                {createBank.error instanceof Error
                  ? createBank.error.message
                  : 'Failed to add bank.'}
              </p>
            ) : null}

            <Button type="submit" isLoading={createBank.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              <span>Add bank</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Banks ({banks.length})</CardTitle>
          <CardDescription>
            Available in the Item dropdown when adding a record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading banks…
            </p>
          ) : isError ? (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
            >
              {error instanceof Error ? error.message : 'Failed to load banks.'}
            </p>
          ) : banks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
              <Landmark
                className="mx-auto size-8 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                No banks added yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add a bank above to populate the record item dropdown.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {banks.map((bank) => (
                <li
                  key={bank.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Landmark
                      className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {bank.name}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${bank.name}`}
                    isLoading={
                      deleteBank.isPending && deleteBank.variables === bank.id
                    }
                    onClick={() => deleteBank.mutate(bank.id)}
                    className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
