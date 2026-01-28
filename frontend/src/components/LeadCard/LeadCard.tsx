import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { leadsApi } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import { STATUS_LABELS, LeadStatus } from '../../types'
import { Lock, Phone, Mail, Car, DollarSign, Calendar } from 'lucide-react'

interface LeadCardProps {
  lead?: any
  leadId?: number
  compact?: boolean
  detailed?: boolean
  onClick?: () => void
  onClose?: () => void
}

export default function LeadCard({ lead: propLead, leadId, compact, detailed, onClick, onClose }: LeadCardProps) {
  const { data: fetchedLead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.getById(leadId!),
    enabled: !!leadId && detailed,
  })

  const lead = propLead || fetchedLead

  if (isLoading) {
    return <div className="p-4 flex justify-center"><LoadingSpinner /></div>
  }

  if (!lead) return null

  // Compact card for Kanban
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={'p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ' + (!lead.can_edit ? 'opacity-75' : '')}
      >
        <div className="flex items-start justify-between">
          <div className="font-medium text-sm text-gray-900">
            {lead.first_name} {lead.last_name?.[0] || ''}.
          </div>
          {!lead.can_edit && <Lock className="w-3 h-3 text-gray-400" />}
        </div>
        <div className="text-xs text-gray-500 mt-1">{lead.vehicle}</div>
        {lead.next_contact_date && (
          <div className="text-xs text-blue-500 mt-2 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(lead.next_contact_date).toLocaleDateString('pl-PL')}
          </div>
        )}
        {!lead.is_mine && lead.assigned_user_name && (
          <div className="text-xs text-gray-400 mt-1">({lead.assigned_user_name})</div>
        )}
      </div>
    )
  }

  // Detailed view
  if (detailed) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{lead.first_name} {lead.last_name}</h3>
              <span className={'px-2 py-1 text-xs rounded-full ' + (lead.is_resigned ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800')}>
                {lead.is_resigned ? 'Rezygnacja' : STATUS_LABELS[lead.status as LeadStatus]}
              </span>
            </div>
            <Link to={'/leads/' + lead.id} className="btn btn-primary btn-sm" onClick={onClose}>
              Otwórz
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{lead.email}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-gray-400" />
            <span>{lead.vehicle}</span>
          </div>
          {lead.budget && (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span>{lead.budget.toLocaleString()} PLN</span>
            </div>
          )}
        </div>

        {(lead.year_model || lead.mileage) && (
          <div className="text-sm text-gray-600">
            {lead.year_model && <span>Rocznik: {lead.year_model} </span>}
            {lead.mileage && <span>| Przebieg: {lead.mileage.toLocaleString()} km</span>}
          </div>
        )}

        {lead.equipment && (
          <div>
            <dt className="text-sm text-gray-500">Wyposażenie</dt>
            <dd className="text-sm">{lead.equipment}</dd>
          </div>
        )}

        {lead.comment && (
          <div>
            <dt className="text-sm text-gray-500">Komentarz</dt>
            <dd className="text-sm">{lead.comment}</dd>
          </div>
        )}

        <div className="text-xs text-gray-400 pt-2 border-t">
          Przypisany do: {lead.assigned_user_name || '-'}
          {lead.is_mine && <span className="text-blue-500 ml-1">(Ja)</span>}
        </div>
      </div>
    )
  }

  return null
}
