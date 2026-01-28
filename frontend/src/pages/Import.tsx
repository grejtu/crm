import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { importApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { Upload, FileText, Check, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

const LEAD_FIELDS = [
  { value: '--- Pomiń ---', label: '--- Pomiń ---' },
  { value: 'first_name', label: 'Imię *' },
  { value: 'last_name', label: 'Nazwisko *' },
  { value: 'phone', label: 'Telefon *' },
  { value: 'email', label: 'Email' },
  { value: 'vehicle', label: 'Pojazd *' },
  { value: 'budget', label: 'Budżet' },
  { value: 'year_model', label: 'Rocznik' },
  { value: 'mileage', label: 'Przebieg' },
  { value: 'equipment', label: 'Wyposażenie' },
  { value: 'comment', label: 'Komentarz' },
]

export default function Import() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importResult, setImportResult] = useState<any>(null)

  const previewMutation = useMutation({
    mutationFn: (file: File) => importApi.preview(file),
    onSuccess: (data) => {
      setPreviewData(data)
      const initialMapping: Record<string, string> = {}
      data.columns.forEach((col: string) => {
        initialMapping[col] = data.suggested_mapping[col] || '--- Pomiń ---'
      })
      setMapping(initialMapping)
      setStep('mapping')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas wczytywania pliku')
    },
  })

  const executeMutation = useMutation({
    mutationFn: () => importApi.execute(file!, mapping),
    onSuccess: (data) => {
      setImportResult(data)
      setStep('result')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas importu')
    },
  })

  if (user?.role === 'bidder') {
    return <Navigate to="/" replace />
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      previewMutation.mutate(selectedFile)
    }
  }

  const handleMappingChange = (column: string, value: string) => {
    setMapping({ ...mapping, [column]: value })
  }

  const isMappingValid = () => {
    const required = ['first_name', 'last_name', 'phone', 'vehicle']
    const mapped = Object.values(mapping)
    return required.every((field) => mapped.includes(field))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="page-title">Import leadów z CSV</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {['Plik', 'Mapowanie', 'Wynik'].map((label, idx) => (
          <div key={label} className="flex items-center">
            <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (idx < ['upload', 'mapping', 'result'].indexOf(step) ? 'bg-green-500 text-white' : idx === ['upload', 'mapping', 'result'].indexOf(step) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600')}>
              {idx < ['upload', 'mapping', 'result'].indexOf(step) ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span className="ml-2 text-sm">{label}</span>
            {idx < 2 && <ArrowRight className="w-4 h-4 mx-4 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="card">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Kliknij, aby wybrać plik CSV
            </p>
            <p className="text-sm text-gray-500 mt-2">
              lub przeciągnij i upuść plik tutaj
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {previewMutation.isPending && (
            <div className="flex items-center justify-center mt-4">
              <LoadingSpinner />
              <span className="ml-2">Wczytywanie pliku...</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && previewData && (
        <div className="card space-y-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{file?.name}</span>
            <span>({previewData.preview_rows.length} wierszy podglądu)</span>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Mapowanie kolumn</h3>
            <p className="text-sm text-gray-500 mb-4">
              Przypisz kolumny z pliku CSV do pól w systemie. Pola oznaczone * są wymagane.
            </p>

            <div className="space-y-3">
              {previewData.columns.map((col: string) => (
                <div key={col} className="flex items-center space-x-4">
                  <div className="w-40 text-sm font-medium text-gray-700">{col}</div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <select
                    value={mapping[col] || '--- Pomiń ---'}
                    onChange={(e) => handleMappingChange(col, e.target.value)}
                    className="input flex-1"
                  >
                    {LEAD_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  <div className="w-40 text-xs text-gray-400 truncate">
                    np: {previewData.preview_rows[0]?.[previewData.columns.indexOf(col)] || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isMappingValid() && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Zmapuj wszystkie wymagane pola: Imię, Nazwisko, Telefon, Pojazd</span>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => {
                setStep('upload')
                setFile(null)
                setPreviewData(null)
              }}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wstecz</span>
            </button>
            <button
              onClick={() => executeMutation.mutate()}
              disabled={!isMappingValid() || executeMutation.isPending}
              className="btn btn-primary flex items-center space-x-2"
            >
              {executeMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Importowanie...</span>
                </>
              ) : (
                <>
                  <span>Importuj</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
        <div className="card space-y-6">
          <div className="text-center">
            {importResult.success_count > 0 ? (
              <div className="text-green-600">
                <Check className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Import zakończony</h2>
              </div>
            ) : (
              <div className="text-amber-600">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Import zakończony z błędami</h2>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{importResult.success_count}</div>
              <div className="text-sm text-gray-600">Zaimportowano</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">{importResult.skipped_count}</div>
              <div className="text-sm text-gray-600">Pominięto</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{importResult.errors?.length || 0}</div>
              <div className="text-sm text-gray-600">Błędów</div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Szczegóły błędów:</h3>
              <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
                {importResult.errors.map((err: any, idx: number) => (
                  <div key={idx} className="text-sm text-red-600">
                    Wiersz {err.row}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4 pt-4 border-t">
            <button
              onClick={() => {
                setStep('upload')
                setFile(null)
                setPreviewData(null)
                setImportResult(null)
              }}
              className="btn btn-secondary"
            >
              Importuj kolejny plik
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="btn btn-primary"
            >
              Przejdź do leadów
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
