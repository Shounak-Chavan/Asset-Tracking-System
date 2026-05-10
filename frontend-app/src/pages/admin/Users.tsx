import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Clock } from "lucide-react"
import { api } from "../../api"
import { useAuth } from "../../auth-context"
import type { UserHistoryResponse } from "../../types"

function Avatar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
      background: isAdmin ? 'rgba(37,99,235,0.2)' : 'rgba(201,169,110,0.1)',
      color: isAdmin ? '#90B8E0' : '#C9A96E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', fontWeight: 600,
    }}>
      {initials}
    </div>
  )
}

function Pill({ label, variant }: { label: string; variant: 'admin' | 'user' | 'active' | 'suspended' }) {
  const styles = {
    admin:     { bg: 'rgba(37,99,235,0.15)',    color: '#90B8E0', border: '1px solid rgba(37,99,235,0.3)' },
    user:      { bg: 'rgba(201,169,110,0.08)',  color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)' },
    active:    { bg: 'rgba(126,200,160,0.12)',  color: '#7EC8A0', border: '1px solid rgba(126,200,160,0.3)' },
    suspended: { bg: 'rgba(224,112,112,0.12)',  color: '#E07070', border: '1px solid rgba(224,112,112,0.3)' },
  }
  const s = styles[variant]
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, padding: '2px 7px',
      borderRadius: '999px', background: s.bg, color: s.color, border: s.border,
    }}>
      {label}
    </span>
  )
}

function TextBtn({ label, onClick, danger, blue }: { label: string; onClick: () => void; danger?: boolean; blue?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
        fontSize: '12px', fontWeight: 500,
        color: danger ? '#E07070' : blue ? (hovered ? '#C9A96E' : '#9E8070') : (hovered ? '#C9A96E' : '#9E8070'),
        textDecoration: danger && hovered ? 'underline' : 'none',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export function AdminUsersPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => api.listUsers(token!),
    enabled: Boolean(token),
  })

  const roleMutation = useMutation({
    mutationFn: async (payload: { id: number; role: "admin" | "user" }) =>
      api.setUserRole(token!, payload.id, payload.role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const activeMutation = useMutation({
    mutationFn: async (payload: { id: number; is_active: boolean }) =>
      api.setUserActive(token!, payload.id, payload.is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const historyQuery = useQuery({
    queryKey: ["userHistory", selectedUserId],
    queryFn: async () => api.getUserHistory(token!, selectedUserId!),
    enabled: Boolean(token) && selectedUserId !== null,
  })

  // Only show regular users — admins and dry_cleaner accounts are managed elsewhere
  const users = (usersQuery.data ?? []).filter(u => u.role === 'user')
  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>User Control</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
          Regulate accounts, enforce roles, and track historical interactions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>

        {/* LEFT — user list */}
        <div style={{
          background: '#2D1020', border: '1px solid rgba(201,169,110,0.15)',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#F5ECD7' }}>Authorized Accounts</span>
            <span style={{ marginLeft: 'auto', background: 'rgba(201,169,110,0.1)', color: '#C9A96E', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(201,169,110,0.2)' }}>
              {users.length} USERS
            </span>
          </div>

          {usersQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                <div style={{ height: '38px', background: '#3A1528', borderRadius: '8px' }} />
              </div>
            ))
          ) : users.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9E8070', margin: 0 }}>No users yet.</p>
            </div>
          ) : users.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)}
              style={{
                padding: '14px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)',
                display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer',
                background: selectedUserId === u.id ? '#3A1528' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (selectedUserId !== u.id) e.currentTarget.style.background = '#3A1528' }}
              onMouseLeave={(e) => { if (selectedUserId !== u.id) e.currentTarget.style.background = 'transparent' }}
            >
              <Avatar name={u.full_name} isAdmin={u.role === 'admin'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#F5ECD7', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.full_name}
                </p>
                <p style={{ fontSize: '12px', color: '#9E8070', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Pill label={u.role.toUpperCase()} variant={u.role as 'admin' | 'user'} />
                  <Pill label={u.is_active ? 'ACTIVE' : 'SUSPENDED'} variant={u.is_active ? 'active' : 'suspended'} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <TextBtn label="History" onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)} />
                  <TextBtn
                    label={u.role === 'admin' ? 'Set as User' : 'Set as Admin'}
                    blue
                    onClick={() => roleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                  />
                  <TextBtn
                    label={u.is_active ? 'Suspend' : 'Activate'}
                    danger={u.is_active}
                    blue={!u.is_active}
                    onClick={() => activeMutation.mutate({ id: u.id, is_active: !u.is_active })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — detail panel */}
        <div style={{
          background: '#2D1020', border: '1px solid rgba(201,169,110,0.15)',
          borderRadius: '16px', padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          {!selectedUser ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', minHeight: '300px',
              color: '#9ca3af', textAlign: 'center',
            }}>
              <Clock size={40} style={{ color: '#6B5548', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#F5ECD7', margin: '0 0 6px' }}>No Selection</p>
              <p style={{ fontSize: '13px', color: '#9E8070', margin: 0, maxWidth: '260px' }}>
                Select a user to view their complete rental activity logs.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  background: selectedUser.role === 'admin' ? 'rgba(37,99,235,0.2)' : 'rgba(201,169,110,0.1)',
                  color: selectedUser.role === 'admin' ? '#90B8E0' : '#C9A96E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700,
                }}>
                  {selectedUser.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#F5ECD7', margin: 0 }}>{selectedUser.full_name}</p>
                  <p style={{ fontSize: '13px', color: '#9E8070', margin: '2px 0 6px' }}>{selectedUser.email}</p>
                  <Pill label={selectedUser.role.toUpperCase()} variant={selectedUser.role as 'admin' | 'user'} />
                </div>
              </div>

              <p style={{ fontSize: '12px', fontWeight: 700, color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
                Rental Activity
              </p>

              {historyQuery.isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ height: '60px', background: '#3A1528', borderRadius: '8px' }} />)}
                </div>
              ) : historyQuery.isError ? (
                <div style={{ padding: '16px', background: 'rgba(224,112,112,0.08)', borderRadius: '8px', border: '1px solid rgba(224,112,112,0.25)' }}>
                  <p style={{ fontSize: '13px', color: '#E07070', margin: 0 }}>
                    Could not load history.{' '}
                    <button onClick={() => historyQuery.refetch()} style={{ background: 'none', border: 'none', color: '#C9A96E', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' }}>
                      Retry
                    </button>
                  </p>
                </div>
              ) : !historyQuery.data?.bookings?.length ? (
                <div style={{ padding: '24px', background: '#3A1528', borderRadius: '8px', textAlign: 'center', border: '1px dashed rgba(201,169,110,0.2)' }}>
                  <p style={{ fontSize: '13px', color: '#9E8070', margin: 0 }}>No booking records found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                  {(historyQuery.data as UserHistoryResponse).bookings.map((b) => (
                    <div key={b.id} style={{ padding: '12px 14px', background: '#3A1528', borderRadius: '8px', border: '1px solid rgba(201,169,110,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9E8070', fontFamily: 'monospace' }}>BK-#{b.id}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px', background: 'rgba(201,169,110,0.08)', color: '#C9A96E', textTransform: 'uppercase' }}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#F5ECD7', margin: '0 0 4px' }}>
                        {b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9E8070' }}>
                        <span>Pickup: {new Date(b.pickup_date).toLocaleDateString()}</span>
                        <span style={{ fontWeight: 600, color: '#C9A96E' }}>₹{b.rent_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '12px', fontWeight: 700, color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '20px 0 12px' }}>
                Account Actions
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => roleMutation.mutate({ id: selectedUser.id, role: selectedUser.role === 'admin' ? 'user' : 'admin' })}
                  style={{ height: '34px', padding: '0 14px', background: 'transparent', color: '#F5ECD7', border: '1px solid rgba(201,169,110,0.3)', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {selectedUser.role === 'admin' ? 'Set as User' : 'Set as Admin'}
                </button>
                <button
                  onClick={() => activeMutation.mutate({ id: selectedUser.id, is_active: !selectedUser.is_active })}
                  style={{ height: '34px', padding: '0 14px', background: selectedUser.is_active ? 'rgba(224,112,112,0.1)' : 'transparent', color: selectedUser.is_active ? '#E07070' : '#7EC8A0', border: selectedUser.is_active ? '1px solid rgba(224,112,112,0.3)' : '1px solid rgba(126,200,160,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  {selectedUser.is_active ? 'Suspend Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
