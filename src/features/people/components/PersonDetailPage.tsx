import { ArrowLeft, Calendar, FileText, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useAuthSession } from '../../auth/api'
import { useBanks } from '../../banks/api'
import {
  useCreatePersonRecord,
  useDeletePersonRecord,
  usePerson,
  usePersonRecords,
} from '../api'
import { recordFormSchema } from '../schemas'

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PersonDetailPage() {
  const { personId } = useParams<{ personId: string }>()
  const { data: auth } = useAuthSession()
  const uid = auth?.user?.uid

  const { data: person, isLoading: isPersonLoading } = usePerson(uid, personId)
  const { data: banks = [] } = useBanks(uid)
  const {
    data: records = [],
    isLoading: isRecordsLoading,
    isError: isRecordsError,
    error: recordsError,
  } = usePersonRecords(uid, personId)

  const createRecord = useCreatePersonRecord(uid, personId)
  const deleteRecord = useDeletePersonRecord(uid, personId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [item, setItem] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState(getTodayDateString)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    item?: string
    type?: string
    date?: string
    amount?: string
    note?: string
  }>({})

  const totalAmount = useMemo(
    () => records.reduce((sum, record) => sum + record.amount, 0),
    [records],
  )

  const openModal = () => {
    setItem('')
    setType('')
    setDate(getTodayDateString())
    setAmount('')
    setNote('')
    setFieldErrors({})
    createRecord.reset()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!createRecord.isPending) {
      setIsModalOpen(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})

    const result = recordFormSchema.safeParse({
      item,
      type,
      date,
      amount,
      note,
    })

    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        item: flattened.item?.[0],
        type: flattened.type?.[0],
        date: flattened.date?.[0],
        amount: flattened.amount?.[0],
        note: flattened.note?.[0],
      })
      return
    }

    createRecord.mutate(result.data, {
      onSuccess: () => {
        setIsModalOpen(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/people"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to People</span>
        </Link>
      </div>

      {isPersonLoading ? (
        <p className="text-sm text-slate-500">Loading person details…</p>
      ) : !person ? (
        <Card>
          <CardHeader>
            <CardTitle>Person not found</CardTitle>
            <CardDescription>
              This entry may have been deleted or does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {person.name}
              </h1>
              {person.notes ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {person.notes}
                </p>
              ) : null}
            </div>

            <Button onClick={openModal} className="shrink-0">
              <Plus className="size-4" aria-hidden="true" />
              <span>Add record</span>
            </Button>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Records ({records.length})</CardTitle>
                <CardDescription>
                  Items, dates, amounts, and notes for {person.name}.
                </CardDescription>
              </div>
              <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                Total: {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardHeader>

            <CardContent>
              {isRecordsLoading ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Loading records…
                </p>
              ) : isRecordsError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {recordsError instanceof Error
                    ? recordsError.message
                    : 'Failed to load records.'}
                </p>
              ) : records.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
                  <FileText
                    className="mx-auto size-8 text-slate-400"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    No records yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Click &ldquo;Add record&rdquo; to create the first entry.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((record) => (
                    <li
                      key={record.id}
                      className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {record.item}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              record.type === 'Credit'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {record.type}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="size-3" aria-hidden="true" />
                            <span>{record.date}</span>
                          </span>
                        </div>
                        {record.note ? (
                          <p className="break-words text-xs text-slate-600 dark:text-slate-400">
                            {record.note}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {record.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${record.item}`}
                          isLoading={
                            deleteRecord.isPending &&
                            deleteRecord.variables === record.id
                          }
                          onClick={() => deleteRecord.mutate(record.id)}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Modal
            open={isModalOpen}
            onClose={closeModal}
            title="Add new record"
            description={`Add a record for ${person.name}.`}
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {banks.length > 0 ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="record-item-select"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Item
                  </label>
                  <select
                    id="record-item-select"
                    name="item"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    disabled={createRecord.isPending}
                    aria-invalid={Boolean(fieldErrors.item)}
                    className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:bg-slate-950 dark:text-slate-100 ${
                      fieldErrors.item
                        ? 'border-rose-500 dark:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select a bank...</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.item ? (
                    <p
                      role="alert"
                      className="text-xs text-rose-600 dark:text-rose-400"
                    >
                      {fieldErrors.item}
                    </p>
                  ) : null}
                </div>
              ) : (
                <Input
                  label="Item"
                  type="text"
                  name="item"
                  placeholder="Enter item name"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  error={fieldErrors.item}
                  disabled={createRecord.isPending}
                />
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="record-type-select"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Type
                </label>
                <select
                  id="record-type-select"
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={createRecord.isPending}
                  aria-invalid={Boolean(fieldErrors.type)}
                  className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:bg-slate-950 dark:text-slate-100 ${
                    fieldErrors.type
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select a type...</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
                {fieldErrors.type ? (
                  <p
                    role="alert"
                    className="text-xs text-rose-600 dark:text-rose-400"
                  >
                    {fieldErrors.type}
                  </p>
                ) : null}
              </div>

              <Input
                label="Date"
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={fieldErrors.date}
                disabled={createRecord.isPending}
              />

              <Input
                label="Amount"
                type="number"
                name="amount"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={fieldErrors.amount}
                disabled={createRecord.isPending}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="record-note"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Note
                </label>
                <textarea
                  id="record-note"
                  name="note"
                  rows={3}
                  placeholder="Optional note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={createRecord.isPending}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                {fieldErrors.note ? (
                  <p
                    role="alert"
                    className="text-xs text-rose-600 dark:text-rose-400"
                  >
                    {fieldErrors.note}
                  </p>
                ) : null}
              </div>

              {createRecord.isError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {createRecord.error instanceof Error
                    ? createRecord.error.message
                    : 'Failed to save record.'}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  disabled={createRecord.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={createRecord.isPending}>
                  Save record
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  )
}
