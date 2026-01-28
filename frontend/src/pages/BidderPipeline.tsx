import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bidderApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import { BIDDING_STATUS_LABELS, BiddingStatus } from '../types'
import toast from 'react-hot-toast'
import { Navigate, Link } from 'react-router-dom'
import { Gavel, DollarSign, FileText, Check, X, Clock } from 'lucide-react'

const BIDDING_STATUS_COLORS: Record<BiddingStatus, string> = {
  pending: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  carfax_ok: 'bg-blue-100 border-blue-300 text-blue-800',
  won: 'bg-green-100 border-green-300 text-green-800',
  lost: 'bg-red-100 border-red-300 text-red-800',
}

export default function BidderPipeline() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [newStatus, setNewStatus] = useState<BiddingStatus | ''>('')
  const [finalBudget, setFinalBudget] = useState('')
  const [notes, setNotes] = useState('')

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['bidderPipeline'],
    queryFn: bidderApi.getPipeline,
    enabled: user?.role === 'bidder' || user?.role === 'manager',
  })

  const updateMutation = useMutation({
    mutationFn: (data: { leadId: number; status?: BiddingStatus; final_budget?: number; notes?: string }) =>
      bidderApi.updateLead(data.leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidderPipeline'] })
      setSelectedLead(null)
      toast.success('Zaktualizowano')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd')
    },
  })

  if (user?.role !== 'bidder' && user?.role !== 'manager') {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  const categories: BiddingStatus[] = ['pending', 'carfax_ok', 'won', 'lost']

  const handleUpdate = () => {
    const data: any = { leadId: selectedLead.id }
    if (newStatus) data.bidding_status = newStatus
    if (finalBudget) data.final_budget = parseInt(finalBudget)
    if (notes) data.notes = notes
    updateMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center">
          <Gavel className="w-6 h-6 mr-2" />
          Panel Licytatora
        </h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {categories.map((status) => {
          const leads = pipeline?.[status] || []
          return (
            <div key={status} className={'rounded-lg border-2 ' + BIDDING_STATUS_COLORS[status]}>
              <div className="p-3 border-b border-current/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{BIDDING_STATUS_LABELS[status]}</h3>
                  <span className="text-sm font-bold">{leads.length}</span>
                </div>
              </div>

              <div className="p-2 space-y-2 min-h-[300px] max-h-[calc(100vh-300px)] overflow-y-auto">
                {leads.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Brak leadów
                  </div>
                ) : (
                  leads.map((item: any) => (
                    <div
                      key={item.lead.id}
                      onClick={() => {
                        setSelectedLead(item)
                        setNewStatus(item.bidding_status || '')
                        setFinalBudget(item.lead.final_budget?.toString() || '')
                        setNotes(item.notes || '')
                      }}
                      className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium text-sm">
                        {item.lead.first_name} {item.lead.last_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{item.lead.vehicle}</div>
                      {item.lead.budget && (
                        <div className="flex items-center text-xs text-gray-600 mt-2">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {item.lead.budget.toLocaleString()} PLN
                        </div>
                      )}
                      {item.lead.final_budget && (
                        <div className="flex items-center text-xs text-green-600 font-medium">
                          <Check className="w-3 h-3 mr-1" />
                          Final: {item.lead.final_budget.toLocaleString()} PLN
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Szczegóły licytacji"
        maxWidth="max-w-lg"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Link to={'/leads/' + selectedLead.lead.id} className="font-semibold text-blue-600 hover:underline">
                {selectedLead.lead.first_name} {selectedLead.lead.last_name}
              </Link>
              <div className="text-sm text-gray-600 mt-1">{selectedLead.lead.vehicle}</div>
              <div className="text-sm text-gray-500">
                {selectedLead.lead.year_model && <span>Rocznik: {selectedLead.lead.year_model} | </span>}
                {selectedLead.lead.mileage && <span>Przebieg: {selectedLead.lead.mileage.toLocaleString()} km</span>}
              </div>
              {selectedLead.lead.budget && (
                <div className="mt-2 text-sm">
                  Budżet klienta: <span className="font-medium">{selectedLead.lead.budget.toLocaleString()} PLN</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Status licytacji</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BiddingStatus)}
                className="input"
              >
                <option value="">Nie zmieniaj</option>
                {Object.entries(BIDDING_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Finalny budżet (PLN)</label>
              <input
                type="number"
                value={finalBudget}
                onChange={(e) => setFinalBudget(e.target.value)}
                className="input"
                placeholder="np. 150000"
              />
            </div>

            <div>
              <label className="label">Notatki</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={3}
                placeholder="Dodaj notatki dotyczące licytacji..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={() => setSelectedLead(null)} className="btn btn-secondary">
                Anuluj
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="btn btn-primary"
              >
                {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
