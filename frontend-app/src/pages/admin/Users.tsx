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
      background: isAdmin ? '#dbeafe' : '#f3f4f6',
      color: isAdmin ? '#2563eb' : '#6b7280',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', fontWeight: 600,
    }}>
      {initials}
    </div>
  )
}

function Pill({ label, variant }: { label: string; variant: 'admin' | 'user' | 'active' | 'suspended' }) {
  const styles = {
    admin:     { bg: '#dbeafe', color: '#2563eb' },
    user:      { bg: '#f3f4f6', color: '#6b7280' },
    active:    { bg: '#dcfce7', color: '#16a34a' },
    suspended: { bg: '#fee2e2', color: '#dc2626' },
  }
  const s = styles[variant]
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, padding: '2px 7px',
      borderRadius: '999px', background: s.bg, color: s.color,
    }}>
      {label}
    </span>
  )
}

function TextBtn({
  label, onClick, danger, blue,
}: { label: string; onClick: () => void; danger?: boolean; blue?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
        fontSize: '12px', fontWeight: 500,
        color: danger ? (hovered ? '#dc2626' : '#dc2626') :
               blue ? (hovered ? '#2563eb' : '#374151') :
               (hovered ? '#2563eb' : '#6b7280'),
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

  const users = (usersQuery.data ?? []).filter(u => u.role !== 'admin')
  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
          User Control
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
          Regulate accounts, enforce roles, and track historical interactions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>

        {/* LEFT — user list */}
        <div style={{
          background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
              Authorized Accounts
            </span>
            <span style={{
              marginLeft: 'auto', background: '#f3f4f6', color: '#6b7280',
              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
            }}>
              {users.length} USERS
            </span>
          </div>

          {/* User rows */}
          {usersQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ height: '38px', background: '#f3f4f6', borderRadius: '8px' }} />
              </div>
            ))
          ) : users.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)}
              style={{
                padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer',
                background: selectedUserId === u.id ? '#eff6ff' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (selectedUserId !== u.id) e.currentTarget.style.background = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                if (selectedUserId !== u.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Avatar name={u.full_name} isAdmin={u.role === 'admin'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.full_name}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Pill label={u.role.toUpperCase()} variant={u.role === 'admin' ? 'admin' : 'user'} />
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
          background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: '12px', padding: '24px',
        }}>
          {!selectedUser ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', minHeight: '300px',
              color: '#9ca3af', textAlign: 'center',
            }}>
              <Clock size={40} style={{ color: '#d1d5db', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
                No Selection
              </p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, maxWidth: '260px' }}>
                Select a user to view their complete rental activity logs.
              </p>
            </div>
          ) : (
            <div>
              {/* User header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  background: selectedUser.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                  color: selectedUser.role === 'admin' ? '#2563eb' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700,
                }}>
                  {selectedUser.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    {selectedUser.full_name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 6px' }}>
                    {selectedUser.email}
                  </p>
                  <Pill label={selectedUser.role.toUpperCase()} variant={selectedUser.role === 'admin' ? 'admin' : 'user'} />
                </div>
              </div>

              {/* Rental Activity */}
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
                Rental Activity
              </p>

              {historyQuery.isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '60px', background: '#f3f4f6', borderRadius: '8px' }} />
                  ))}
                </div>
              ) : historyQuery.isError ? (
                <div style={{
                  padding: '16px', background: '#fef2f2', borderRadius: '8px',
                  border: '1px solid #fecaca',
                }}>
                  <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
                    Could not load history.{' '}
                    <button
                      onClick={() => historyQuery.refetch()}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' }}
                    >
                      Retry
                    </button>
                  </p>
                </div>
              ) : !historyQuery.data?.bookings?.length ? (
                <div style={{
                  padding: '24px', background: '#f9fafb', borderRadius: '8px',
                  textAlign: 'center', border: '1px dashed #e5e7eb',
                }}>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No booking records found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                  {(historyQuery.data as UserHistoryResponse).bookings.map((b) => (
                    <div key={b.id} style={{
                      padding: '12px 14px', background: '#f9fafb',
                      borderRadius: '8px', border: '1px solid #f3f4f6',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', fontFamily: 'monospace' }}>
                          BK-#{b.id}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                          borderRadius: '999px', background: '#f3f4f6', color: '#6b7280',
                          textTransform: 'uppercase',
                        }}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
                        {b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                        <span>Pickup: {new Date(b.pickup_date).toLocaleDateString()}</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>₹{b.rent_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Account Actions */}
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '20px 0 12px' }}>
                Account Actions
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: selectedUser.role === 'admin' ? 'Set as User' : 'Set as Admin', onClick: () => roleMutation.mutate({ id: selectedUser.id, role: selectedUser.role === 'admin' ? 'user' : 'admin' }) },
                  { label: selectedUser.is_active ? 'Suspend Account' : 'Activate Account', onClick: () => activeMutation.mutate({ id: selectedUser.id, is_active: !selectedUser.is_active }), danger: selectedUser.is_active },
                ].map(({ label, onClick, danger }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    style={{
                      height: '34px', padding: '0 14px',
                      background: danger ? '#fee2e2' : '#f3f4f6',
                      color: danger ? '#dc2626' : '#374151',
                      border: 'none', borderRadius: '8px',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
