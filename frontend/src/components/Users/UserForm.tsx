import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '../../services/api'
import toast from 'react-hot-toast'

const userSchema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków').optional().or(z.literal('')),
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  role: z.enum(['user', 'bidder', 'manager']),
  is_active: z.boolean().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  user?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEdit = !!user

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(
      isEdit
        ? userSchema.partial({ password: true })
        : userSchema.extend({ password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków') })
    ),
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || 'user',
      is_active: user?.is_active ?? true,
      password: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data as any),
    onSuccess: () => {
      toast.success('Użytkownik utworzony')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas tworzenia')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      const updateData: any = { ...data }
      if (!updateData.password) delete updateData.password
      return usersApi.update(user.id, updateData)
    },
    onSuccess: () => {
      toast.success('Użytkownik zaktualizowany')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas aktualizacji')
    },
  })

  const onSubmit = (data: UserFormData) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Imię i nazwisko *</label>
        <input {...register('name')} className={'input ' + (errors.name ? 'input-error' : '')} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="label">Email *</label>
        <input {...register('email')} type="email" className={'input ' + (errors.email ? 'input-error' : '')} />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">{isEdit ? 'Nowe hasło (pozostaw puste aby nie zmieniać)' : 'Hasło *'}</label>
        <input {...register('password')} type="password" className={'input ' + (errors.password ? 'input-error' : '')} placeholder="********" />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="label">Rola *</label>
        <select {...register('role')} className="input">
          <option value="user">Handlowiec</option>
          <option value="bidder">Licytator</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      {isEdit && (
        <div className="flex items-center space-x-2">
          <input {...register('is_active')} type="checkbox" id="is_active" className="rounded border-gray-300" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Aktywny</label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Anuluj
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
        >
          {isSubmitting || createMutation.isPending || updateMutation.isPending
            ? 'Zapisywanie...'
            : isEdit ? 'Zapisz zmiany' : 'Dodaj użytkownika'}
        </button>
      </div>
    </form>
  )
}
