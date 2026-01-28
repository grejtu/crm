import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { RESIGNATION_LABELS, ResignationStatus } from '../types'
import toast from 'react-hot-toast'
import { XCircle, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Resignations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: resigned, isLoading } = useQuery({
    queryKey: ['resignedLeads'],
    queryFn: leadsApi.getResigned,
  })

  const restoreMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.restore(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resignedLeads'] })
      toast.success('Lead przywrócony')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas przywracania')
    },
  })

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  const categories = Object.entries(resigned || {}).filter(([_, leads]) => leads.length > 0)

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">Rezygnacje</h1>
        <EmptyState
          icon={XCircle}
          title="Brak rezygnacji"
          description="Żaden lead nie został jeszcze oznaczony jako rezygnacja"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Rezygnacje</h1>

      {categories.map(([status, leads]) => (
        <div key={status} className="card">
          <h2 className="font-semibold text-lg mb-4 flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            {RESIGNATION_LABELS[status as ResignationStatus]}
            <span className="ml-2 text-sm text-gray-500">({leads.length})</span>
          </h2>

          <div className="space-y-2">
            {leads.map((lead: any) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <Link
                    to={'/leads/' + lead.id}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {lead.first_name} {lead.last_name}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {lead.vehicle} | {lead.phone}
                    {lead.assigned_user_name && (
                      <span className="ml-2">({lead.assigned_user_name})</span>
                    )}
                  </div>
                  {lead.resignation_date && (
                    <div className="text-xs text-gray-400">
                      Data rezygnacji: {new Date(lead.resignation_date).toLocaleDateString('pl-PL')}
                    </div>
                  )}
                </div>

                {(user?.role === 'manager' || lead.is_mine) && (
                  <button
                    onClick={() => restoreMutation.mutate(lead.id)}
                    disabled={restoreMutation.isPending}
                    className="btn btn-success btn-sm flex items-center space-x-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Przywróć</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
