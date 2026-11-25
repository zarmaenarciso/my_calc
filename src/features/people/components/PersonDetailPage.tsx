import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
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
import { compressImageToDataUrl } from '../../../lib/image'
import { useAuthSession } from '../../auth/api'
import { useBanks } from '../../banks/api'
import {
  useCreatePersonRecord,
  useDeletePersonRecord,
  usePerson,
  usePersonRecords,
  useUpdatePersonRecord,
} from '../api'
import { recordFormSchema, type RecordItem } from '../schemas'

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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
  const updateRecord = useUpdatePersonRecord(uid, personId)
  const deleteRecord = useDeletePersonRecord(uid, personId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null)
  const [previewRecord, setPreviewRecord] = useState<RecordItem | null>(null)

  const [item, setItem] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState(getTodayDateString)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isCompressingImage, setIsCompressingImage] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    item?: string
    type?: string
    date?: string
    amount?: string
    note?: string
    imageUrl?: string
  }>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Credit' | 'Debit'>('All')
  const [itemFilter, setItemFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const ledger = useMemo(() => {
    // Sort chronologically (oldest first) to compute accurate running balances
    const chronological = [...records].reverse()
    let runningBalance = 0
    let totalCredits = 0
    let totalDebits = 0

    const rows = chronological.map((record) => {
      if (record.type === 'Debit') {
        totalDebits += record.amount
        runningBalance -= record.amount
      } else {
        totalCredits += record.amount
        runningBalance += record.amount
      }

      return {
        ...record,
        runningBalance,
      }
    })

    return {
      rows,
      totalCredits,
      totalDebits,
      netBalance: runningBalance,
    }
  }, [records])

  const uniqueItems = useMemo(() => {
    const items = new Set(records.map((r) => r.item).filter(Boolean))
    return Array.from(items).sort((a, b) => a.localeCompare(b))
  }, [records])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'All' ||
    itemFilter !== 'All' ||
    dateFrom !== '' ||
    dateTo !== ''

  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('All')
    setItemFilter('All')
    setDateFrom('')
    setDateTo('')
  }

  const filteredLedger = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const rows = ledger.rows.filter((record) => {
      if (typeFilter !== 'All' && record.type !== typeFilter) {
        return false
      }
      if (itemFilter !== 'All' && record.item !== itemFilter) {
        return false
      }
      if (dateFrom && record.date < dateFrom) {
        return false
      }
      if (dateTo && record.date > dateTo) {
        return false
      }
      if (
        q &&
        !record.item.toLowerCase().includes(q) &&
        !record.note.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })

    let totalCredits = 0
    let totalDebits = 0
    for (const record of rows) {
      if (record.type === 'Debit') {
        totalDebits += record.amount
      } else {
        totalCredits += record.amount
      }
    }

    return {
      rows,
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
    }
  }, [ledger.rows, searchQuery, typeFilter, itemFilter, dateFrom, dateTo])

  const isSavingRecord = createRecord.isPending || updateRecord.isPending

  const openModal = () => {
    setEditingRecord(null)
    setItem('')
    setType('')
    setDate(getTodayDateString())
    setAmount('')
    setNote('')
    setImageUrl(null)
    setFieldErrors({})
    createRecord.reset()
    updateRecord.reset()
    setIsModalOpen(true)
  }

  const openEditModal = (record: RecordItem) => {
    setEditingRecord(record)
    setItem(record.item)
    setType(record.type)
    setDate(record.date)
    setAmount(String(record.amount))
    setNote(record.note)
    setImageUrl(record.imageUrl)
    setFieldErrors({})
    createRecord.reset()
    updateRecord.reset()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!isSavingRecord && !isCompressingImage) {
      setIsModalOpen(false)
      setEditingRecord(null)
    }
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setFieldErrors((prev) => ({ ...prev, imageUrl: undefined }))
    setIsCompressingImage(true)
    try {
      const compressed = await compressImageToDataUrl(file)
      setImageUrl(compressed)
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl:
          err instanceof Error ? err.message : 'Failed to process image.',
      }))
    } finally {
      setIsCompressingImage(false)
      event.target.value = ''
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
      imageUrl,
    })

    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        item: flattened.item?.[0],
        type: flattened.type?.[0],
        date: flattened.date?.[0],
        amount: flattened.amount?.[0],
        note: flattened.note?.[0],
        imageUrl: flattened.imageUrl?.[0],
      })
      return
    }

    if (editingRecord) {
      updateRecord.mutate(
        { recordId: editingRecord.id, ...result.data },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            setEditingRecord(null)
          },
        },
      )
    } else {
      createRecord.mutate(result.data, {
        onSuccess: () => {
          setIsModalOpen(false)
        },
      })
    }
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

          {/* Accountant Summary Strip */}
          <section
            aria-label="Account summary"
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <Card className="p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Credits (+)
              </p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatAmount(ledger.totalCredits)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Debits (-)
              </p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                {formatAmount(ledger.totalDebits)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Net Balance
              </p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatAmount(ledger.netBalance)}
              </p>
            </Card>
          </section>

          <Card className="overflow-hidden p-0 sm:p-0">
            <CardHeader className="mb-0 space-y-4 border-b border-slate-200 px-4 py-4 sm:px-6 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>
                    General Ledger (
                    {hasActiveFilters
                      ? `${filteredLedger.rows.length} of ${records.length}`
                      : records.length}
                    )
                  </CardTitle>
                  <CardDescription>
                    Chronological debit/credit entries with running balance for{' '}
                    {person.name}.
                  </CardDescription>
                </div>
                {hasActiveFilters ? (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="size-3.5" aria-hidden="true" />
                    <span>Clear filters</span>
                  </Button>
                ) : null}
              </div>

              {records.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      aria-label="Search ledger records"
                      placeholder="Search item or note..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <select
                    aria-label="Filter by type"
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value as 'All' | 'Credit' | 'Debit')
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="All">All types</option>
                    <option value="Credit">Credit only</option>
                    <option value="Debit">Debit only</option>
                  </select>

                  <select
                    aria-label="Filter by item"
                    value={itemFilter}
                    onChange={(e) => setItemFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="All">All items</option>
                    {uniqueItems.map((itemName) => (
                      <option key={itemName} value={itemName}>
                        {itemName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    aria-label="Filter from date"
                    title="From date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />

                  <input
                    type="date"
                    aria-label="Filter to date"
                    title="To date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-0">
              {isRecordsLoading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading records…
                </p>
              ) : isRecordsError ? (
                <div className="p-4 sm:p-6">
                  <p
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                  >
                    {recordsError instanceof Error
                      ? recordsError.message
                      : 'Failed to load records.'}
                  </p>
                </div>
              ) : filteredLedger.rows.length === 0 ? (
                <div className="p-4 sm:p-6">
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
                    <FileText
                      className="mx-auto size-8 text-slate-400"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {ledger.rows.length === 0
                        ? 'No records yet'
                        : 'No matching records'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {ledger.rows.length === 0
                        ? 'Click "Add record" to create the first entry.'
                        : 'Try adjusting or clearing your filters.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Ledger Table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Item / Account</th>
                          <th className="px-4 py-3">Note</th>
                          <th className="px-4 py-3 text-right">Debit (-)</th>
                          <th className="px-4 py-3 text-right">Credit (+)</th>
                          <th className="px-4 py-3 text-right">Balance</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredLedger.rows.map((record) => (
                          <tr
                            key={record.id}
                            className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          >
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                              {record.date}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <span>{record.item}</span>
                                {record.imageUrl ? (
                                  <button
                                    type="button"
                                    aria-label={`View image for ${record.item}`}
                                    onClick={() => setPreviewRecord(record)}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                  >
                                    <ImageIcon className="size-3" aria-hidden="true" />
                                    <span>Image</span>
                                  </button>
                                ) : null}
                              </div>
                            </td>
                            <td className="max-w-xs break-words px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                              {record.note || '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                              {record.type === 'Debit'
                                ? formatAmount(record.amount)
                                : '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                              {record.type === 'Credit'
                                ? formatAmount(record.amount)
                                : '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {formatAmount(record.runningBalance)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Edit ${record.item}`}
                                  onClick={() => openEditModal(record)}
                                >
                                  <Pencil className="size-3.5" aria-hidden="true" />
                                  <span>Edit</span>
                                </Button>
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-50/80 font-semibold dark:border-slate-700 dark:bg-slate-950/50">
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400"
                          >
                            {hasActiveFilters ? 'Filtered Totals' : 'Totals'} (
                            {filteredLedger.rows.length}{' '}
                            {filteredLedger.rows.length === 1
                              ? 'entry'
                              : 'entries'}
                            )
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                            {formatAmount(filteredLedger.totalDebits)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatAmount(filteredLedger.totalCredits)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                            {formatAmount(filteredLedger.netBalance)}
                          </td>
                          <td className="px-4 py-3" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile Stacked Ledger */}
                  <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
                    {filteredLedger.rows.map((record) => (
                      <div key={record.id} className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                {record.item}
                              </p>
                              {record.imageUrl ? (
                                <button
                                  type="button"
                                  aria-label={`View image for ${record.item}`}
                                  onClick={() => setPreviewRecord(record)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  <ImageIcon className="size-3" aria-hidden="true" />
                                  <span>Image</span>
                                </button>
                              ) : null}
                            </div>
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {record.date}
                              {record.note ? ` • ${record.note}` : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit ${record.item}`}
                              onClick={() => openEditModal(record)}
                            >
                              <Pencil className="size-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </Button>
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
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span
                            className={`font-mono tabular-nums ${
                              record.type === 'Credit'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {record.type === 'Credit'
                              ? `Credit: +${formatAmount(record.amount)}`
                              : `Debit: -${formatAmount(record.amount)}`}
                          </span>
                          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            Bal: {formatAmount(record.runningBalance)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="space-y-1.5 bg-slate-50/80 p-4 text-xs dark:bg-slate-950/50">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          {hasActiveFilters
                            ? 'Filtered Debits:'
                            : 'Total Debits:'}
                        </span>
                        <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
                          {formatAmount(filteredLedger.totalDebits)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          {hasActiveFilters
                            ? 'Filtered Credits:'
                            : 'Total Credits:'}
                        </span>
                        <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatAmount(filteredLedger.totalCredits)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-semibold dark:border-slate-800">
                        <span>
                          {hasActiveFilters ? 'Filtered Net:' : 'Net Balance:'}
                        </span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {formatAmount(filteredLedger.netBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Modal
            open={isModalOpen}
            onClose={closeModal}
            title={editingRecord ? 'Edit record' : 'Add new record'}
            description={
              editingRecord
                ? `Update this record for ${person.name}.`
                : `Add a record for ${person.name}.`
            }
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
                    disabled={isSavingRecord}
                    aria-invalid={Boolean(fieldErrors.item)}
                    className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-500 dark:bg-slate-950 dark:text-slate-100 ${
                      fieldErrors.item
                        ? 'border-rose-500 dark:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select a bank...</option>
                    {item && !banks.some((bank) => bank.name === item) ? (
                      <option value={item}>{item}</option>
                    ) : null}
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
                  disabled={isSavingRecord}
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
                  disabled={isSavingRecord}
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
                disabled={isSavingRecord}
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
                disabled={isSavingRecord}
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
                  disabled={isSavingRecord}
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

              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Image (optional)
                </span>
                {imageUrl ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                    <img
                      src={imageUrl}
                      alt="Uploaded record attachment"
                      className="max-h-40 w-full rounded-md object-contain"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageUrl(null)}
                        disabled={isSavingRecord}
                        className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        <span>Remove image</span>
                      </Button>
                    </div>
                  </div>
                ) : null}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
                  <Upload className="size-4" aria-hidden="true" />
                  <span>
                    {isCompressingImage
                      ? 'Processing image…'
                      : imageUrl
                        ? 'Replace image'
                        : 'Upload image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSavingRecord || isCompressingImage}
                    className="sr-only"
                  />
                </label>
                {fieldErrors.imageUrl ? (
                  <p
                    role="alert"
                    className="text-xs text-rose-600 dark:text-rose-400"
                  >
                    {fieldErrors.imageUrl}
                  </p>
                ) : null}
              </div>

              {createRecord.isError || updateRecord.isError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {(editingRecord ? updateRecord.error : createRecord.error) instanceof Error
                    ? ((editingRecord ? updateRecord.error : createRecord.error) as Error)
                        .message
                    : 'Failed to save record.'}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  disabled={isSavingRecord || isCompressingImage}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSavingRecord}
                  disabled={isCompressingImage}
                >
                  {editingRecord ? 'Save changes' : 'Save record'}
                </Button>
              </div>
            </form>
          </Modal>

          <Modal
            open={Boolean(previewRecord)}
            onClose={() => setPreviewRecord(null)}
            title={previewRecord ? previewRecord.item : 'Record image'}
            description={
              previewRecord
                ? `${previewRecord.date} • ${previewRecord.type} ${formatAmount(previewRecord.amount)}`
                : undefined
            }
          >
            {previewRecord?.imageUrl ? (
              <div className="space-y-3">
                <img
                  src={previewRecord.imageUrl}
                  alt={`Attachment for ${previewRecord.item}`}
                  className="max-h-[65dvh] w-full rounded-lg object-contain"
                />
                {previewRecord.note ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {previewRecord.note}
                  </p>
                ) : null}
              </div>
            ) : null}
          </Modal>
        </>
      )}
    </div>
  )
}
