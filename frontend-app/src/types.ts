export type Role = 'admin' | 'user'

export interface User {
  id: number
  full_name: string
  email: string
  role: Role
  phone: string | null
  is_active: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface Category {
  id: number
  name: string
  created_at: string
}

export interface RentalPlan {
  id: number
  name: string
  duration_days: number
  daily_rate: number
  deposit_amount: number
  daily_fine_rate: number
  damage_fee: number
  is_active: boolean
  created_at: string
}

export interface Asset {
  id: number
  name: string
  asset_code: string
  description: string | null
  image_url: string | null
  category_id: number
  status: string
  created_at: string
  is_active: boolean
  is_in_dry_cleaning: boolean
}

export interface AssetCreatePayload {
  name: string
  description: string
  image_url?: string | null
  category_id: number
  quantity: number
}

export type BookingStatus =
  | 'pending'
  | 'booked'
  | 'allocated'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'returned'
  | 'overdue'
  | 'cancelled'

export interface Booking {
  id: number
  user_id: number
  rental_plan_id: number
  status: BookingStatus
  pickup_date: string
  due_date: string
  deposit_amount: number
  rent_amount: number
  category_id?: number | null
  requested_asset_id?: number | null
  allocated_asset_id?: number | null
  created_at: string
  rental_plan: RentalPlan
}

export interface Payment {
  id: number
  booking_id: number
  type: 'deposit' | 'rent' | 'fine' | 'deposit_refund'
  amount: number
  status: 'pending' | 'paid' | 'failed'
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
}

export interface Allocation {
  id: number
  booking_id: number
  asset_id: number
  allocated_by: number
  allocated_at: string
}

export interface ReturnRecord {
  id: number
  booking_id: number
  returned_at: string
  days_late: number
  fine_amount: number
  damage_amount: number
  damage_notes: string | null
  deposit_refunded: boolean
  processed_by: number
  created_at: string
}

export interface BlockedDateRange {
  booking_id: number
  from_date: string
  to_date: string
}

export interface BlockedDateRanges {
  asset_id: number
  blocked_ranges: BlockedDateRange[]
}

export interface UserUpdatePayload {
  full_name?: string
  phone?: string
}

export interface PaymentBreakdown {
  booking_id: number
  user_id: number
  status: BookingStatus
  breakdown: {
    planned_rent: number
    planned_deposit: number
    actual_payments: {
      deposit_paid: number
      rent_paid: number
      deposit_refunded: number
    }
    charges: {
      late_fine: number
      damage_charges: number
    }
    totals: {
      total_paid: number
      total_due: number
      net_deposit_refund: number
    }
  }
}

export interface UserHistorySummary {
  total_bookings: number
  active_bookings: number
  total_deposit_paid: number
  total_rent_paid: number
  total_fine_paid: number
  total_deposit_refunded: number
}

export interface UserHistoryUser {
  id: number
  full_name: string
  email: string
  role: Role
  phone: string | null
}

export interface UserHistoryResponse {
  user: UserHistoryUser
  aadhaar_number: string | null
  pan_number: string | null
  summary: UserHistorySummary
  bookings: UserBookingHistoryItem[]
  payments: Payment[]
}

export interface UserBookingHistoryItem {
  id: number
  rental_plan_id: number
  rental_plan?: { name: string } | null
  category_id: number | null
  requested_asset_id: number | null
  status: BookingStatus
  pickup_date: string
  due_date: string
  deposit_amount: number
  rent_amount: number
  created_at: string
}
