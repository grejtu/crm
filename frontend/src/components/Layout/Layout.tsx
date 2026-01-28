import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Kanban,
  Users,
  FileUp,
  BarChart3,
  LogOut,
  UserCircle,
  XCircle,
  Gavel,
  List,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navLinks = {
    manager: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/pipeline', label: 'Pipeline', icon: Kanban },
      { path: '/leads', label: 'Leady', icon: List },
      { path: '/resignations', label: 'Rezygnacje', icon: XCircle },
      { path: '/import', label: 'Import', icon: FileUp },
      { path: '/users', label: 'Użytkownicy', icon: Users },
      { path: '/statistics', label: 'Statystyki', icon: BarChart3 },
    ],
    user: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/pipeline', label: 'Pipeline', icon: Kanban },
      { path: '/leads', label: 'Leady', icon: List },
      { path: '/resignations', label: 'Rezygnacje', icon: XCircle },
      { path: '/import', label: 'Import', icon: FileUp },
    ],
    bidder: [
      { path: '/bidder', label: 'Moja Pipeline', icon: Gavel },
      { path: '/leads', label: 'Wszystkie Leady', icon: List },
    ],
  }

  const links = navLinks[user?.role || 'user'] || navLinks.user

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">CRM</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <UserCircle className="w-5 h-5" />
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
                <span>Wyloguj</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {links.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive(path)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
