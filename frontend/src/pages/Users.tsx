import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import ConfirmModal from '../components/common/ConfirmModal'
import UserForm from '../components/Users/UserForm'
import { ROLE_LABELS, UserRole } from '../types'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Users as UsersIcon, CheckCircle, XCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export default function Users() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeletingUser(null)
      toast.success('Użytkownik usunięty')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas usuwania')
    },
  })

  if (currentUser?.role !== 'manager') {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Zarządzanie użytkownikami</h1>
        <button
          onClick={() => setShowNewUserModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj użytkownika</span>
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rola</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <UsersIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="ml-3 font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={'px-2 py-1 text-xs rounded-full ' + (u.role === 'manager' ? 'bg-purple-100 text-purple-800' : u.role === 'bidder' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800')}>
                    {ROLE_LABELS[u.role as UserRole]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.is_active ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aktywny
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 text-sm">
                      <XCircle className="w-4 h-4 mr-1" />
                      Nieaktywny
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New User Modal */}
      <Modal
        isOpen={showNewUserModal}
        onClose={() => setShowNewUserModal(false)}
        title="Dodaj użytkownika"
      >
        <UserForm
          onSuccess={() => {
            setShowNewUserModal(false)
            queryClient.invalidateQueries({ queryKey: ['users'] })
          }}
          onCancel={() => setShowNewUserModal(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edytuj użytkownika"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            onSuccess={() => {
              setEditingUser(null)
              queryClient.invalidateQueries({ queryKey: ['users'] })
            }}
            onCancel={() => setEditingUser(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deleteMutation.mutate(deletingUser.id)}
        title="Usuń użytkownika"
        message={'Czy na pewno chcesz usunąć użytkownika ' + deletingUser?.name + '?'}
        confirmText="Usuń"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
