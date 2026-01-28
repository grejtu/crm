import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { pipelineApi, leadsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { STATUS_LABELS, LeadStatus } from '../types'
import toast from 'react-hot-toast'
import { Lock, GripVertical } from 'lucide-react'

const STATUS_ORDER: LeadStatus[] = [
  'wants_car',
  'searching_no_contract',
  'contract_sent',
  'contract_signed',
  'deposit',
  'bidding_order',
  'won',
]

const STATUS_COLORS: Record<LeadStatus, string> = {
  wants_car: 'bg-blue-50 border-blue-200',
  searching_no_contract: 'bg-blue-50 border-blue-200',
  contract_sent: 'bg-yellow-50 border-yellow-200',
  contract_signed: 'bg-yellow-50 border-yellow-200',
  deposit: 'bg-green-50 border-green-200',
  bidding_order: 'bg-green-50 border-green-200',
  won: 'bg-green-100 border-green-300',
}

export default function Pipeline() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my')

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline', viewMode],
    queryFn: () => pipelineApi.get(),
  })

  const moveMutation = useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: number; newStatus: LeadStatus }) =>
      leadsApi.move(leadId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Lead przeniesiony')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas przenoszenia')
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const leadId = Number(active.id)
      const newStatus = over.id as LeadStatus

      // Find the lead to check permissions
      const allLeads = Object.values(pipeline || {}).flat()
      const lead = allLeads.find((l) => l.id === leadId)

      if (lead && !lead.can_edit) {
        toast.error('Nie możesz przenosić leadów innych użytkowników')
        return
      }

      moveMutation.mutate({ leadId, newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Pipeline</h1>

        {user?.role !== 'bidder' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('my')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'my'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Moje leady
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Wszystkie
            </button>
          </div>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const leads = pipeline?.[status] || []

            return (
              <div
                key={status}
                id={status}
                className={`flex-shrink-0 w-64 rounded-lg border-2 ${STATUS_COLORS[status]} p-3`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 text-sm">
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                    {leads.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {leads.map((lead) => (
                    <Link
                      key={lead.id}
                      to={`/leads/${lead.id}`}
                      draggable={lead.can_edit}
                      id={String(lead.id)}
                      className={`block p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                        lead.can_edit ? 'cursor-grab' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {lead.first_name} {lead.last_name[0]}.
                          </div>
                          <div className="text-xs text-gray-500">{lead.vehicle}</div>
                        </div>
                        {!lead.can_edit && (
                          <Lock className="w-3 h-3 text-gray-400" />
                        )}
                        {lead.can_edit && (
                          <GripVertical className="w-3 h-3 text-gray-300" />
                        )}
                      </div>
                      {!lead.is_mine && lead.assigned_user_name && (
                        <div className="text-xs text-gray-400 mt-1">
                          ({lead.assigned_user_name})
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </DndContext>

      <p className="text-sm text-gray-500">
        Przeciągnij kartę do innej kolumny, aby zmienić status leada
      </p>
    </div>
  )
}
