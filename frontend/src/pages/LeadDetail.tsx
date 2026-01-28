import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import ConfirmModal from '../components/common/ConfirmModal'
import LeadForm from '../components/LeadForm/LeadForm'
import { STATUS_LABELS, RESIGNATION_LABELS, LeadStatus, ResignationStatus } from '../types'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Edit,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Phone,
  Mail,
  Car,
  DollarSign,
  Calendar,
  FileText,
  History,
} from 'lucide-react'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResignModal, setShowResignModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedResignation, setSelectedResignation] = useState<ResignationStatus | ''>('')
  const [activeTab, setActiveTab] = useState<'data' | 'history'>('data')

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['leadHistory', id],
    queryFn: () => leadsApi.getHistory(Number(id)),
    enabled: !!id && activeTab === 'history',
  })

  const resignMutation = useMutation({
    mutationFn: () => leadsApi.resign(Number(id), selectedResignation as ResignationStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      setShowResignModal(false)
      toast.success('Lead oznaczony jako rezygnacja')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => leadsApi.restore(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      setShowRestoreModal(false)
      toast.success('Lead przywrócony')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd')
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead nie znaleziony</p>
      </div>
    )
  }

  const canEdit = lead.permissions?.can_edit || lead.can_edit
  const canResign = (user?.role === 'user' && lead.is_mine) || user?.role === 'manager'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">
              {lead.first_name} {lead.last_name}
              {!canEdit && <span className="text-sm text-gray-400 ml-2">(tylko odczyt)</span>}
            </h1>
            <p className="text-sm text-gray-500">Lead #{lead.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edytuj</span>
            </button>
          )}
          {canResign && !lead.is_resigned && (
            <button
              onClick={() => setShowResignModal(true)}
              className="btn btn-danger flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Rezygnacja</span>
            </button>
          )}
          {canResign && lead.is_resigned && (
            <button
              onClick={() => setShowRestoreModal(true)}
              className="btn btn-success flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Przywróć</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`card ${lead.is_resigned ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <span className="ml-2 font-semibold">
              {STATUS_LABELS[lead.status as LeadStatus]}
            </span>
          </div>
          {lead.is_resigned && lead.resignation_status && (
            <div className="text-red-600">
              Rezygnacja: {RESIGNATION_LABELS[lead.resignation_status as ResignationStatus]}
            </div>
          )}
          <div>
            <span className="text-sm text-gray-500">Przypisany do:</span>
            <span className="ml-2 font-semibold">
              {lead.assigned_user_name || '-'}
              {lead.is_mine && <span className="text-blue-500 ml-1">(Ja)</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dane
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historia
          </button>
        </nav>
      </div>

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informacje kontaktowe
            </h3>
            <dl className="space-y-3">
              <div className="flex">
                <dt className="w-32 text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Telefon
                </dt>
                <dd className="font-medium">{lead.phone}</dd>
              </div>
              {lead.email && (
                <div className="flex">
                  <dt className="w-32 text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </dt>
                  <dd className="font-medium">{lead.email}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Vehicle Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Pojazd
            </h3>
            <dl className="space-y-3">
              <div className="flex">
                <dt className="w-32 text-gray-500">Model</dt>
                <dd className="font-medium">{lead.vehicle}</dd>
              </div>
              {lead.year_model && (
                <div className="flex">
                  <dt className="w-32 text-gray-500">Rocznik</dt>
                  <dd className="font-medium">{lead.year_model}</dd>
                </div>
              )}
              {lead.mileage && (
                <div className="flex">
                  <dt className="w-32 text-gray-500">Przebieg</dt>
                  <dd className="font-medium">{lead.mileage.toLocaleString()} km</dd>
                </div>
              )}
              {lead.equipment && (
                <div className="flex">
                  <dt className="w-32 text-gray-500">Wyposażenie</dt>
                  <dd className="font-medium">{lead.equipment}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Budget */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Budżet
            </h3>
            <dl className="space-y-3">
              {lead.budget && (
                <div className="flex">
                  <dt className="w-32 text-gray-500">Budżet</dt>
                  <dd className="font-medium">{lead.budget.toLocaleString()} PLN</dd>
                </div>
              )}
              {lead.final_budget && (
                <div className="flex">
                  <dt className="w-32 text-gray-500">Finalny budżet</dt>
                  <dd className="font-medium text-green-600">
                    {lead.final_budget.toLocaleString()} PLN
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dates */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Daty
            </h3>
            <dl className="space-y-3">
              <div className="flex">
                <dt className="w-40 text-gray-500">Pierwszy kontakt</dt>
                <dd className="font-medium">
                  {new Date(lead.first_contact_date).toLocaleDateString('pl-PL')}
                </dd>
              </div>
              {lead.next_contact_date && (
                <div className="flex">
                  <dt className="w-40 text-gray-500">Następny kontakt</dt>
                  <dd className="font-medium">
                    {new Date(lead.next_contact_date).toLocaleString('pl-PL')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Additional Info */}
          {(lead.client_trigger || lead.comment) && (
            <div className="card lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Dodatkowe informacje
              </h3>
              {lead.client_trigger && (
                <div className="mb-4">
                  <dt className="text-gray-500 text-sm">Trigger klienta</dt>
                  <dd className="mt-1">{lead.client_trigger}</dd>
                </div>
              )}
              {lead.comment && (
                <div>
                  <dt className="text-gray-500 text-sm">Komentarz</dt>
                  <dd className="mt-1">{lead.comment}</dd>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <History className="w-4 h-4 mr-2" />
            Historia zmian
          </h3>
          {historyLoading ? (
            <LoadingSpinner />
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{entry.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString('pl-PL')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {entry.change_type === 'lead_created' && 'Lead utworzony'}
                      {entry.change_type === 'field_update' && (
                        <>
                          Zmieniono <span className="font-medium">{entry.field_changed}</span>
                          {entry.old_value && entry.new_value && (
                            <>
                              : {entry.old_value} → {entry.new_value}
                            </>
                          )}
                        </>
                      )}
                      {entry.change_type === 'status_change' && (
                        <>
                          Zmieniono status: {entry.old_value} → {entry.new_value}
                        </>
                      )}
                      {entry.change_type === 'resigned' && (
                        <>Oznaczono jako rezygnacja: {entry.new_value}</>
                      )}
                      {entry.change_type === 'restored' && 'Przywrócono z rezygnacji'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Brak historii zmian</p>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edytuj lead"
        maxWidth="max-w-2xl"
      >
        <LeadForm
          lead={lead}
          onSuccess={() => {
            setShowEditModal(false)
            queryClient.invalidateQueries({ queryKey: ['lead', id] })
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Resign Modal */}
      <Modal
        isOpen={showResignModal}
        onClose={() => setShowResignModal(false)}
        title="Oznacz jako rezygnacja"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Wybierz powód rezygnacji:</p>
          <select
            value={selectedResignation}
            onChange={(e) => setSelectedResignation(e.target.value as ResignationStatus)}
            className="input"
          >
            <option value="">Wybierz powód...</option>
            {Object.entries(RESIGNATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowResignModal(false)}
              className="btn btn-secondary"
            >
              Anuluj
            </button>
            <button
              onClick={() => resignMutation.mutate()}
              className="btn btn-danger"
              disabled={!selectedResignation || resignMutation.isPending}
            >
              {resignMutation.isPending ? 'Zapisywanie...' : 'Potwierdź rezygnację'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={() => restoreMutation.mutate()}
        title="Przywróć lead"
        message="Czy na pewno chcesz przywrócić ten lead z rezygnacji?"
        confirmText="Przywróć"
        confirmVariant="primary"
        isLoading={restoreMutation.isPending}
      />
    </div>
  )
}
