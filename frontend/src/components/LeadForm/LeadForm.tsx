import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { leadsApi, usersApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { Lead } from '../../types'
import toast from 'react-hot-toast'

const leadSchema = z.object({
  first_name: z.string().min(2, 'Imię musi mieć minimum 2 znaki').max(50),
  last_name: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki').max(50),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Nieprawidłowy format numeru telefonu'),
  email: z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  vehicle: z.string().min(2, 'Model pojazdu musi mieć minimum 2 znaki').max(100),
  budget: z.coerce.number().min(0).max(10000000).optional().nullable(),
  final_budget: z.coerce.number().min(0).max(10000000).optional().nullable(),
  year_model: z.coerce.number().min(1900).max(2027).optional().nullable(),
  mileage: z.coerce.number().min(0).max(1000000).optional().nullable(),
  equipment: z.string().max(1000).optional(),
  client_trigger: z.string().max(500).optional(),
  next_contact_date: z.string().optional(),
  comment: z.string().max(1000).optional(),
  assigned_user_id: z.coerce.number().optional().nullable(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadFormProps {
  lead?: Lead
  onSuccess: () => void
  onCancel: () => void
}

export default function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const { user } = useAuth()
  const isEdit = !!lead

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: user?.role === 'manager',
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      first_name: lead?.first_name || '',
      last_name: lead?.last_name || '',
      phone: lead?.phone || '',
      email: lead?.email || '',
      vehicle: lead?.vehicle || '',
      budget: lead?.budget || undefined,
      final_budget: lead?.final_budget || undefined,
      year_model: lead?.year_model || undefined,
      mileage: lead?.mileage || undefined,
      equipment: lead?.equipment || '',
      client_trigger: lead?.client_trigger || '',
      next_contact_date: lead?.next_contact_date
        ? new Date(lead.next_contact_date).toISOString().slice(0, 16)
        : '',
      comment: lead?.comment || '',
      assigned_user_id: lead?.assigned_user_id || undefined,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: LeadFormData) => leadsApi.create(data as Partial<Lead>),
    onSuccess: () => {
      toast.success('Lead utworzony')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas tworzenia leada')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: LeadFormData) => leadsApi.update(lead!.id, data as Partial<Lead>),
    onSuccess: () => {
      toast.success('Lead zaktualizowany')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Błąd podczas aktualizacji leada')
    },
  })

  const onSubmit = (data: LeadFormData) => {
    // Clean up empty strings
    const cleanData = {
      ...data,
      email: data.email || undefined,
      next_contact_date: data.next_contact_date
        ? new Date(data.next_contact_date).toISOString()
        : undefined,
    }

    if (isEdit) {
      updateMutation.mutate(cleanData)
    } else {
      createMutation.mutate(cleanData)
    }
  }

  const canEditFinalBudget =
    user?.role === 'manager' || user?.role === 'bidder'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Imię *</label>
          <input {...register('first_name')} className={`input ${errors.first_name ? 'input-error' : ''}`} />
          {errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="label">Nazwisko *</label>
          <input {...register('last_name')} className={`input ${errors.last_name ? 'input-error' : ''}`} />
          {errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Telefon *</label>
          <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="+48123456789" />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Pojazd *</label>
        <input {...register('vehicle')} className={`input ${errors.vehicle ? 'input-error' : ''}`} placeholder="np. BMW X5" />
        {errors.vehicle && (
          <p className="text-red-500 text-sm mt-1">{errors.vehicle.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Budżet (PLN)</label>
          <input {...register('budget')} type="number" className="input" />
        </div>
        {canEditFinalBudget && (
          <div>
            <label className="label">Finalny budżet (PLN)</label>
            <input {...register('final_budget')} type="number" className="input" />
          </div>
        )}
        <div>
          <label className="label">Rocznik</label>
          <input {...register('year_model')} type="number" className="input" placeholder="2020" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Przebieg (km)</label>
          <input {...register('mileage')} type="number" className="input" />
        </div>
        <div>
          <label className="label">Następny kontakt</label>
          <input {...register('next_contact_date')} type="datetime-local" className="input" />
        </div>
      </div>

      <div>
        <label className="label">Wyposażenie</label>
        <textarea {...register('equipment')} className="input" rows={2} />
      </div>

      <div>
        <label className="label">Trigger klienta</label>
        <textarea {...register('client_trigger')} className="input" rows={2} />
      </div>

      <div>
        <label className="label">Komentarz</label>
        <textarea {...register('comment')} className="input" rows={2} />
      </div>

      {user?.role === 'manager' && users && (
        <div>
          <label className="label">Przypisz do</label>
          <select {...register('assigned_user_id')} className="input">
            <option value="">Wybierz użytkownika...</option>
            {users
              .filter((u) => u.role === 'user' && u.is_active)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
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
            : isEdit
            ? 'Zapisz zmiany'
            : 'Dodaj lead'}
        </button>
      </div>
    </form>
  )
}
