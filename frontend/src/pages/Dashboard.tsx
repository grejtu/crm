import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { STATUS_LABELS } from '../types'
import { Calendar, AlertTriangle, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const { data: userDashboard, isLoading: userLoading } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: dashboardApi.getUserDashboard,
    enabled: user?.role === 'user',
  })

  const { data: managerDashboard, isLoading: managerLoading } = useQuery({
    queryKey: ['managerDashboard'],
    queryFn: dashboardApi.getManagerDashboard,
    enabled: user?.role === 'manager',
  })

  if (userLoading || managerLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // User Dashboard
  if (user?.role === 'user' && userDashboard) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">Dashboard - {user.name}</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-500">Wszystkich leadów</div>
            <div className="text-2xl font-bold text-gray-900">
              {userDashboard.my_leads_count}
            </div>
          </div>
          {Object.entries(userDashboard.by_status).slice(0, 3).map(([status, count]) => (
            <div key={status} className="card">
              <div className="text-sm text-gray-500">
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
            </div>
          ))}
        </div>

        {/* Today's Contacts */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Kontakty na dziś ({userDashboard.today_contacts.length})</h2>
          </div>
          {userDashboard.today_contacts.length === 0 ? (
            <p className="text-gray-500">Brak zaplanowanych kontaktów na dziś</p>
          ) : (
            <div className="space-y-2">
              {userDashboard.today_contacts.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/leads/${contact.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                    <span className="text-gray-500 ml-2">({contact.vehicle})</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {contact.next_contact_date && new Date(contact.next_contact_date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Contacts */}
        {userDashboard.overdue_contacts.length > 0 && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-700">
                Zaległe kontakty ({userDashboard.overdue_contacts.length})
              </h2>
            </div>
            <div className="space-y-2">
              {userDashboard.overdue_contacts.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/leads/${contact.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div>
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                    <span className="text-gray-500 ml-2">({contact.vehicle})</span>
                  </div>
                  <span className="text-sm text-red-600">
                    {contact.next_contact_date && new Date(contact.next_contact_date).toLocaleDateString('pl-PL')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Manager Dashboard
  if (user?.role === 'manager' && managerDashboard) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">Dashboard Managera</h1>

        {/* User Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {managerDashboard.users.map((userStats) => (
            <div key={userStats.user_id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">{userStats.user_name}</h3>
                </div>
                <Link
                  to={`/statistics?user=${userStats.user_id}`}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Szczegóły
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Wszystkich</div>
                  <div className="text-xl font-bold">{userStats.total_leads}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Konwersja do umowy</div>
                  <div className="text-xl font-bold text-green-600">
                    {userStats.conversions.wants_car_to_contract_signed}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Konwersja do wygranej</div>
                  <div className="text-xl font-bold text-blue-600">
                    {userStats.conversions.contract_signed_to_won}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(userStats.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center">
                    <span className="text-sm text-gray-500 w-40">
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${userStats.total_leads ? (count / userStats.total_leads) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium ml-2 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Time Stats */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Statystyki czasowe</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Ostatnie 7 dni</h4>
              <div className="space-y-1">
                {managerDashboard.time_stats.daily.map((day) => (
                  <div key={day.date} className="flex justify-between text-sm">
                    <span>{new Date(day.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' })}</span>
                    <span>+{day.new_leads} leadów, {day.won} wygranych</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Ostatnie tygodnie</h4>
              <div className="space-y-1">
                {managerDashboard.time_stats.weekly.map((week) => (
                  <div key={week.week} className="flex justify-between text-sm">
                    <span>{week.week}</span>
                    <span>+{week.new_leads} leadów, {week.won} wygranych</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Ostatnie miesiące</h4>
              <div className="space-y-1">
                {managerDashboard.time_stats.monthly.map((month) => (
                  <div key={month.month} className="flex justify-between text-sm">
                    <span>{month.month}</span>
                    <span>+{month.new_leads} leadów, {month.won} wygranych</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Bidder - redirect to bidder pipeline
  if (user?.role === 'bidder') {
    return (
      <div className="space-y-6">
        <h1 className="page-title">Panel Licytanta - {user.name}</h1>
        <p className="text-gray-600">
          Przejdź do <Link to="/bidder" className="text-blue-500 hover:underline">swojej pipeline</Link> aby zobaczyć przydzielone leady.
        </p>
      </div>
    )
  }

  return null
}
