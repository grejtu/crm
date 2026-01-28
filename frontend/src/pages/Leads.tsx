import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { leadsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import LeadForm from '../components/LeadForm/LeadForm'
import { STATUS_LABELS, LeadStatus } from '../types'
import { Plus, Search, Lock, List } from 'lucide-react'

export default function Leads() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads', viewMode, statusFilter],
    queryFn: () => leadsApi.getAll(viewMode, statusFilter || undefined),
  })

  const { data: searchResults } = useQuery({
    queryKey: ['leadsSearch', searchPhone, searchEmail],
    queryFn: () => leadsApi.search(searchPhone || undefined, searchEmail || undefined),
    enabled: searchPhone.length > 2 || searchEmail.length > 2,
  })

  const displayLeads = searchPhone || searchEmail ? searchResults : leads

  const handleLeadCreated = () => {
    setShowNewLeadModal(false)
    refetch()
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
        <h1 className="page-title">Leady</h1>

        {(user?.role === 'user' || user?.role === 'manager') && (
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj lead</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          {/* View Mode */}
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
                Moje
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
            className="input w-48"
          >
            <option value="">Wszystkie statusy</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj po telefonie..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="input w-40"
            />
            <input
              type="text"
              placeholder="...lub email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="input w-40"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {!displayLeads || displayLeads.length === 0 ? (
        <EmptyState
          icon={List}
          title="Brak leadów"
          description={searchPhone || searchEmail ? 'Nie znaleziono leadów pasujących do wyszukiwania' : 'Dodaj pierwszego leada, aby rozpocząć'}
          action={
            user?.role !== 'bidder'
              ? { label: 'Dodaj lead', onClick: () => setShowNewLeadModal(true) }
              : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pojazd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Przypisany
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        {lead.email && (
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        )}
                      </div>
                      {!lead.can_edit && <Lock className="w-3 h-3 text-gray-400 ml-2" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.vehicle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {STATUS_LABELS[lead.status as LeadStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.assigned_user_name || '-'}
                    {lead.is_mine && <span className="text-blue-500 ml-1">(Ja)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Otwórz
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Lead Modal */}
      <Modal
        isOpen={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
        title="Dodaj nowego leada"
        maxWidth="max-w-2xl"
      >
        <LeadForm onSuccess={handleLeadCreated} onCancel={() => setShowNewLeadModal(false)} />
      </Modal>
    </div>
  )
}
