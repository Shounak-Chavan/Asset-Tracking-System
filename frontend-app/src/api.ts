import type {
  Allocation,
  Asset,
  AssetCreatePayload,
  Booking,
  Category,
  LoginPayload,
  LoginResponse,
  Payment,
  PaymentBreakdown,
  RegisterPayload,
  RentalPlan,
  ReturnRecord,
  UserUpdatePayload,
  User,
  UserHistoryResponse,
} from './types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:8000'
const TOKEN_KEY = 'asset_tracking_access_token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | T
    | { detail?: string | Array<{ msg?: string; loc?: Array<string | number> }> }
    | null

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = data.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0]
        if (first?.msg) {
          const location = Array.isArray(first.loc) ? first.loc.join('.') : ''
          message = location ? `${location}: ${first.msg}` : first.msg
        }
      }
    }

    throw new ApiError(message, response.status)
  }

  return data as T
}

export async function request<T>(
  path: string,
  options?: {
    method?: string
    token?: string | null
    body?: unknown
  },
): Promise<T> {
  const storedToken = localStorage.getItem(TOKEN_KEY)
  let activeToken = storedToken ?? options?.token ?? null

  const runFetch = async (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return fetch(`${API_BASE_URL}${path}`, {
      method: options?.method ?? 'GET',
      headers,
      credentials: 'include',
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
  }

  let response = await runFetch(activeToken)

  const canRefresh = !['/auth/login', '/auth/register', '/auth/refresh'].includes(path)

  if (response.status === 401 && canRefresh) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (refreshResponse.ok) {
      const refreshed = (await refreshResponse.json()) as LoginResponse
      activeToken = refreshed.access_token
      localStorage.setItem(TOKEN_KEY, activeToken)
      response = await runFetch(activeToken)
    }
  }

  return parseResponse<T>(response)
}

export const api = {
  baseUrl: API_BASE_URL,
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: payload }),
  register: (payload: RegisterPayload) =>
    request<User>('/auth/register', { method: 'POST', body: payload }),
  logout: (token: string | null) => request<{ detail: string }>('/auth/logout', { method: 'POST', token }),
  refresh: () => request<LoginResponse>('/auth/refresh', { method: 'POST' }),
  me: (token: string) => request<User>('/users/me', { token }),
  updateMe: (token: string, payload: UserUpdatePayload) =>
    request<User>('/users/me', { method: 'PUT', token, body: payload }),
  changePassword: (token: string, payload: { current_password: string; new_password: string }) =>
    request<{ detail: string }>('/auth/change-password', { method: 'POST', token, body: payload }),

  listAssets: (token: string) => request<Asset[]>('/assets/', { token }),
  listAssetsFiltered: (
    token: string,
    params?: { name?: string; category_name?: string; status?: string },
  ) => {
    const query = new URLSearchParams()
    if (params?.name) query.set('name', params.name)
    if (params?.category_name) query.set('category_name', params.category_name)
    if (params?.status) query.set('status', params.status)
    const q = query.toString()
    return request<Asset[]>(`/assets/${q ? `?${q}` : ''}`, { token })
  },
  updateAsset: (
    token: string,
    assetId: number,
    payload: { name?: string; description?: string; category_id?: number; status?: string },
  ) => request<Asset>(`/assets/${assetId}`, { method: 'PATCH', token, body: payload }),
  deleteAsset: (token: string, assetId: number) =>
    request<void>(`/assets/${assetId}`, { method: 'DELETE', token }),

  listCategories: (token: string) => request<Category[]>('/categories/', { token }),
  createCategory: (token: string, payload: { name: string }) =>
    request<Category>('/categories/', { method: 'POST', token, body: payload }),
  updateCategory: (token: string, categoryId: number, payload: { name: string }) =>
    request<Category>(`/categories/${categoryId}`, { method: 'PATCH', token, body: payload }),
  deleteCategory: (token: string, categoryId: number) =>
    request<void>(`/categories/${categoryId}`, { method: 'DELETE', token }),

  listRentalPlans: (token: string) => request<RentalPlan[]>('/rental-plans/', { token }),
  createRentalPlan: (
    token: string,
    payload: {
      name: string
      duration_days: number
      daily_rate: number
      deposit_amount: number
      daily_fine_rate: number
      damage_fee: number
    },
  ) => request<RentalPlan>('/rental-plans/', { method: 'POST', token, body: payload }),
  updateRentalPlan: (
    token: string,
    planId: number,
    payload: Partial<{
      name: string
      duration_days: number
      daily_rate: number
      deposit_amount: number
      daily_fine_rate: number
      damage_fee: number
      is_active: boolean
    }>,
  ) => request<RentalPlan>(`/rental-plans/${planId}`, { method: 'PATCH', token, body: payload }),
  deleteRentalPlan: (token: string, planId: number) =>
    request<void>(`/rental-plans/${planId}`, { method: 'DELETE', token }),

  createBooking: (
    token: string,
    payload: {
      rental_plan_id: number
      pickup_date: string
      category_id?: number | null
      requested_asset_id?: number | null
      aadhaar_number?: string
      pan_number?: string
    }
  ) => request<Booking>('/bookings/', { method: 'POST', token, body: payload }),
  listBookings: (token: string) => request<Booking[]>('/bookings/', { token }),
  listAdminBookings: (token: string) => request<Booking[]>('/bookings/admin/all', { token }),
  cancelBooking: (token: string, bookingId: number) =>
    request<Booking>(`/bookings/${bookingId}`, { method: 'DELETE', token }),
  requestReturn: (token: string, bookingId: number) =>
    request<Booking>(`/bookings/${bookingId}/request-return`, { method: 'PATCH', token }),

  payDeposit: (token: string, bookingId: number) =>
    request<Payment>(`/payments/deposit/${bookingId}`, { method: 'POST', token }),
  payRent: (token: string, bookingId: number) =>
    request<Payment>(`/payments/rent/${bookingId}`, { method: 'POST', token }),

  listUsers: (token: string, params?: { role?: string; is_active?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.role) query.set('role', params.role)
    if (params?.is_active !== undefined) query.set('is_active', String(params.is_active))
    const q = query.toString()
    return request<User[]>(`/users/${q ? `?${q}` : ''}`, { token })
  },
  updateUserById: (token: string, userId: number, payload: UserUpdatePayload) =>
    request<User>(`/users/${userId}`, { method: 'PUT', token, body: payload }),
  setUserRole: (token: string, userId: number, role: 'admin' | 'user') =>
    request<User>(`/users/${userId}/role`, { method: 'PATCH', token, body: { role } }),
  setUserActive: (token: string, userId: number, is_active: boolean) =>
    request<User>(`/users/${userId}/activate`, { method: 'PATCH', token, body: { is_active } }),
  getUserHistory: (token: string, userId: number) =>
    request<UserHistoryResponse>(`/users/${userId}/history`, { token }),

  allocateAsset: (token: string, bookingId: number, asset_id: number) =>
    request<Allocation>(`/admin/allocate/${bookingId}`, {
      method: 'POST',
      token,
      body: { asset_id },
    }),
  rejectBookingByAdmin: (token: string, bookingId: number) =>
    request<Booking>(`/admin/bookings/${bookingId}/reject`, {
      method: 'PATCH',
      token,
    }),
  listAllocations: (token: string) => request<Allocation[]>('/admin/allocations', { token }),
  processReturn: (token: string, bookingId: number, returned_at: string, damage_amount: number = 0, damage_notes: string | null = null) =>
    request<ReturnRecord>(`/admin/returns/${bookingId}`, {
      method: 'POST',
      token,
      body: { returned_at, damage_amount, damage_notes },
    }),
  getPaymentBreakdown: (token: string, bookingId: number) =>
    request<PaymentBreakdown>(`/payments/breakdown/${bookingId}`, { token }),

  createAsset: (token: string, payload: AssetCreatePayload) =>
    request<Asset[]>('/assets/', { method: 'POST', token, body: payload }),
}
