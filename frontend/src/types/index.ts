export interface User {
  id: number
  email: string
  name: string
  role: 'manager' | 'user' | 'bidder'
  is_active: boolean
  created_at: string
  leads_count?: number
}

export interface LeadPermissions {
  can_edit: boolean
  can_edit_final_budget: boolean
  can_change_status: boolean
  can_delete: boolean
}

export interface Lead {
  id: number
  first_name: string
  last_name: string
  phone: string
  email?: string
  vehicle: string
  budget?: number
  final_budget?: number
  year_model?: number
  mileage?: number
  equipment?: string
  client_trigger?: string
  status: LeadStatus
  resignation_status?: ResignationStatus
  is_resigned: boolean
  first_contact_date: string
  next_contact_date?: string
  comment?: string
  assigned_user_id?: number
  assigned_user_name?: string
  created_at: string
  updated_at: string
  permissions?: LeadPermissions
  can_edit?: boolean
  is_mine?: boolean
}

export type LeadStatus =
  | 'wants_car'
  | 'searching_no_contract'
  | 'contract_sent'
  | 'contract_signed'
  | 'deposit'
  | 'bidding_order'
  | 'won'

export type ResignationStatus =
  | 'bought_in_poland'
  | 'no_import'
  | 'resigns_completely'
  | 'wants_new_car'
  | 'wants_leasing'

export type BiddingStatus = 'pending' | 'carfax_ok' | 'won' | 'lost'

export interface LeadHistory {
  id: number
  timestamp: string
  user_name: string
  user_role: string
  change_type: string
  field_changed?: string
  old_value?: string
  new_value?: string
}

export interface PipelineData {
  wants_car: Lead[]
  searching_no_contract: Lead[]
  contract_sent: Lead[]
  contract_signed: Lead[]
  deposit: Lead[]
  bidding_order: Lead[]
  won: Lead[]
}

export interface BidderLead {
  id: number
  first_name: string
  last_name: string
  vehicle: string
  budget?: number
  final_budget?: number
  bidding_status: string
}

export interface BidderPipelineData {
  bidding_order: BidderLead[]
  carfax_ok: BidderLead[]
  won: BidderLead[]
}

export interface ResignedLeadsData {
  bought_in_poland: Lead[]
  no_import: Lead[]
  resigns_completely: Lead[]
  wants_new_car: Lead[]
  wants_leasing: Lead[]
}

export interface StatusCounts {
  wants_car: number
  searching_no_contract: number
  contract_sent: number
  contract_signed: number
  deposit: number
  bidding_order: number
  won: number
}

export interface UserStats {
  user_id: number
  user_name: string
  total_leads: number
  by_status: StatusCounts
  conversions: {
    wants_car_to_contract_signed: number
    contract_signed_to_won: number
  }
}

export interface TimeStats {
  daily: { date: string; new_leads: number; won: number }[]
  weekly: { week: string; new_leads: number; won: number }[]
  monthly: { month: string; new_leads: number; won: number }[]
}

export interface ManagerDashboard {
  users: UserStats[]
  time_stats: TimeStats
}

export interface ContactLead {
  id: number
  first_name: string
  last_name: string
  vehicle: string
  next_contact_date?: string
}

export interface UserDashboard {
  my_leads_count: number
  by_status: StatusCounts
  today_contacts: ContactLead[]
  overdue_contacts: ContactLead[]
}

export interface CSVPreview {
  columns: string[]
  suggested_mapping: Record<string, string>
  preview_rows: string[][]
}

export interface CSVImportResult {
  success_count: number
  skipped_count: number
  errors: { row: number; error: string }[]
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  wants_car: 'Chce auto',
  searching_no_contract: 'Szukanie bez umowy',
  contract_sent: 'Umowa wysłana',
  contract_signed: 'Umowa podpisana',
  deposit: 'Depozyt',
  bidding_order: 'Zlecenie licytacji',
  won: 'Wygrana',
}

export const RESIGNATION_LABELS: Record<ResignationStatus, string> = {
  bought_in_poland: 'Kupił w Polsce',
  no_import: 'Nie chce importu',
  resigns_completely: 'Rezygnuje całkowicie',
  wants_new_car: 'Chce nowe auto',
  wants_leasing: 'Chce leasing',
}

export const BIDDING_STATUS_LABELS: Record<BiddingStatus, string> = {
  pending: 'Oczekuje',
  carfax_ok: 'Carfax OK',
  won: 'Wygrana',
  lost: 'Przegrana',
}
