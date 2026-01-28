import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { STATUS_LABELS, LeadStatus } from '../types'
import { Navigate } from 'react-router-dom'
import {
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Calendar,
} from 'lucide-react'

export default function Statistics() {
  const { user } = useAuth()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['managerDashboard'],
    queryFn: statsApi.getManagerDashboard,
    enabled: user?.role === 'manager',
  })

  if (user?.role !== 'manager') {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Statystyki</h1>

      {/* Users Stats */}
      <div className="card">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-500" />
          Statystyki użytkowników
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Łącznie</th>
                {Object.keys(STATUS_LABELS).slice(0, 5).map((status) => (
                  <th key={status} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {STATUS_LABELS[status as LeadStatus].slice(0, 10)}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konwersja</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.users?.map((u: any) => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.user_name}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{u.total_leads}</td>
                  {Object.keys(STATUS_LABELS).slice(0, 5).map((status) => (
                    <td key={status} className="px-4 py-3 text-sm">
                      {u.by_status?.[status] || 0}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className="text-green-600 font-medium">
                      {u.conversions?.wants_car_to_contract_signed || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Stats */}
      {dashboard?.time_stats && (
        <>
          {/* Daily Stats */}
          <div className="card">
            <h2 className="font-semibold text-lg mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              Ostatnie 7 dni
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {dashboard.time_stats.daily?.map((day: any) => (
                <div key={day.date} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('pl-PL', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(day.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="mt-2 text-lg font-bold text-blue-600">+{day.new_leads}</div>
                  <div className="text-xs text-gray-500">nowych</div>
                  <div className="mt-1 text-sm font-medium text-green-600">{day.won}</div>
                  <div className="text-xs text-gray-500">wygranych</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-lg mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Ostatnie 4 tygodnie
              </h2>
              <div className="space-y-3">
                {dashboard.time_stats.weekly?.map((week: any) => (
                  <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{week.week}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-blue-600">+{week.new_leads} nowych</span>
                      <span className="text-green-600">{week.won} wygranych</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="card">
              <h2 className="font-semibold text-lg mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                Ostatnie 3 miesiące
              </h2>
              <div className="space-y-3">
                {dashboard.time_stats.monthly?.map((month: any) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{month.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-blue-600">+{month.new_leads} nowych</span>
                      <span className="text-green-600">{month.won} wygranych</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Summary */}
      <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Podsumowanie</h3>
            <p className="text-blue-100 text-sm">Ogólne statystyki zespołu</p>
          </div>
          <Target className="w-12 h-12 text-blue-200" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">
              {dashboard?.users?.reduce((sum: number, u: any) => sum + u.total_leads, 0) || 0}
            </div>
            <div className="text-sm text-blue-100">Wszystkich leadów</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">
              {dashboard?.users?.reduce((sum: number, u: any) => sum + (u.by_status?.won || 0), 0) || 0}
            </div>
            <div className="text-sm text-blue-100">Wygranych</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{dashboard?.users?.length || 0}</div>
            <div className="text-sm text-blue-100">Handlowców</div>
          </div>
        </div>
      </div>
    </div>
  )
}
