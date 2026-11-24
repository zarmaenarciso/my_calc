import {
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
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
import {
  useCreatePerson,
  useDeletePerson,
  usePeople,
  useUpdatePerson,
} from '../api'
import { personFormSchema, type PersonItem } from '../schemas'

export function PeoplePage() {
  const navigate = useNavigate()
  const { data: auth } = useAuthSession()
  const uid = auth?.user?.uid

  const { data: people = [], isLoading, isError, error } = usePeople(uid)
  const createPerson = useCreatePerson(uid)
  const updatePerson = useUpdatePerson(uid)
  const deletePerson = useDeletePerson(uid)

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [formErrors, setFormErrors] = useState<{
    name?: string
    notes?: string
  }>({})

  const [searchQuery, setSearchQuery] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editErrors, setEditErrors] = useState<{
    name?: string
    notes?: string
  }>({})

  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return people
    }
    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(q) ||
        person.notes.toLowerCase().includes(q),
    )
  }, [people, searchQuery])

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormErrors({})

    const result = personFormSchema.safeParse({ name, notes })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFormErrors({
        name: flattened.name?.[0],
        notes: flattened.notes?.[0],
      })
      return
    }

    createPerson.mutate(result.data, {
      onSuccess: () => {
        setName('')
        setNotes('')
      },
    })
  }

  const startEditing = (person: PersonItem) => {
    setEditingId(person.id)
    setEditName(person.name)
    setEditNotes(person.notes)
    setEditErrors({})
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditErrors({})
  }

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault()
    setEditErrors({})

    const result = personFormSchema.safeParse({
      name: editName,
      notes: editNotes,
    })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setEditErrors({
        name: flattened.name?.[0],
        notes: flattened.notes?.[0],
      })
      return
    }

    updatePerson.mutate(
      { id, ...result.data },
      {
        onSuccess: () => {
          setEditingId(null)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          People
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add and organize your collection of people. Each person can hold
          custom records later.
        </p>
      </div>

      {/* Add Person Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Person</CardTitle>
          <CardDescription>
            Create a new person entry in your directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                type="text"
                name="personName"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={formErrors.name}
                disabled={createPerson.isPending}
              />

              <Input
                label="Notes (optional)"
                type="text"
                name="personNotes"
                placeholder="Role, label, or short note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                error={formErrors.notes}
                disabled={createPerson.isPending}
              />
            </div>

            {createPerson.isError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
              >
                {createPerson.error instanceof Error
                  ? createPerson.error.message
                  : 'Failed to add person.'}
              </p>
            ) : null}

            <Button type="submit" isLoading={createPerson.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              <span>Add person</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* People Directory List */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Directory ({people.length})</CardTitle>
            <CardDescription>
              Saved in Firestore under your account.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search people"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading people…
            </p>
          ) : isError ? (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
            >
              {error instanceof Error
                ? error.message
                : 'Failed to load people.'}
            </p>
          ) : filteredPeople.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
              <UserRound
                className="mx-auto size-8 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {people.length === 0
                  ? 'No people added yet'
                  : 'No matching people found'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {people.length === 0
                  ? 'Use the form above to add your first person.'
                  : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPeople.map((person) => {
                const isEditing = editingId === person.id

                return (
                  <li key={person.id} className="py-3 first:pt-0 last:pb-0">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleEditSubmit(e, person.id)}
                        noValidate
                        className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            label="Name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            error={editErrors.name}
                            disabled={updatePerson.isPending}
                          />
                          <Input
                            label="Notes"
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            error={editErrors.notes}
                            disabled={updatePerson.isPending}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            isLoading={updatePerson.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={updatePerson.isPending}
                          >
                            <X className="size-3.5" aria-hidden="true" />
                            <span>Cancel</span>
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={() => void navigate(`/people/${person.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            void navigate(`/people/${person.id}`)
                          }
                        }}
                        className="-mx-2 flex cursor-pointer flex-col gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/50"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {person.name}
                            </p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <span>Open records</span>
                              <ChevronRight className="size-3" aria-hidden="true" />
                            </span>
                          </div>
                          {person.notes ? (
                            <p className="break-words text-xs text-slate-600 dark:text-slate-400">
                              {person.notes}
                            </p>
                          ) : null}
                        </div>

                        <div
                          className="flex shrink-0 items-center gap-2"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit ${person.name}`}
                            onClick={() => startEditing(person)}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${person.name}`}
                            isLoading={
                              deletePerson.isPending &&
                              deletePerson.variables === person.id
                            }
                            onClick={() => deletePerson.mutate(person.id)}
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
