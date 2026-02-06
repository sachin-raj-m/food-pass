'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserPlus, Shield, User, Edit2, Check, X, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'

interface UserProfile {
    id: string
    email: string
    role: string
    created_at: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newRole, setNewRole] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
            const data = await res.json()
            setUsers(data.users)
        }
        setLoading(false)
    }

    const startEdit = (user: UserProfile) => {
        setEditingId(user.id)
        setNewRole(user.role)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setNewRole('')
    }

    const saveRole = async (userId: string) => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, newRole })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            await fetchUsers()
            cancelEdit()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!deletingUser) return

        setDeleting(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: deletingUser.id })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            await fetchUsers()
            setDeletingUser(null)
        } catch (err: any) {
            alert('Error deleting user: ' + err.message)
        } finally {
            setDeleting(false)
        }
    }

    const getDisplayName = (email: string) => {
        const name = email.split('@')[0]
        return name
            .split(/[._-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(139, 92, 246, 0.3)' }}>ADMIN</span>
            case 'vendor':
                return <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.3)' }}>VENDOR</span>
            case 'volunteer':
                return <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)' }}>VOLUNTEER</span>
            default:
                return <span style={{ color: '#94a3b8' }}>{role}</span>
        }
    }

    return (
        <div>
            <Modal
                isOpen={!!deletingUser}
                title="Delete User"
                description={`Are you sure you want to delete "${deletingUser?.email}"? This will permanently remove the user and their access. This action cannot be undone.`}
                confirmText="Delete User"
                variant="danger"
                onConfirm={handleDeleteUser}
                onCancel={() => setDeletingUser(null)}
                isLoading={deleting}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>User Management</h1>
                <Link href="/dashboard/users/create" className="btn btn-primary">
                    <UserPlus size={20} style={{ marginRight: '0.5rem' }} />
                    Add User
                </Link>
            </div>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {users.map((user) => (
                        <div key={user.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    borderRadius: '50%',
                                    background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    border: '2px solid ' + (user.role === 'admin' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(100, 116, 139, 0.3)')
                                }}>
                                    {user.role === 'admin' ? <Shield size={22} color="#c4b5fd" /> : <User size={22} color="#94a3b8" />}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span>{getDisplayName(user.email)}</span>
                                        {editingId === user.id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <select
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    className="input"
                                                    style={{ padding: '0.3rem 0.5rem', marginBottom: 0, fontSize: '0.875rem', width: 'auto' }}
                                                >
                                                    <option value="vendor">Vendor</option>
                                                    <option value="volunteer">Volunteer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button onClick={() => saveRole(user.id)} disabled={saving} className="btn btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.875rem' }}>
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={cancelEdit} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.875rem' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {getRoleBadge(user.role)}
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                                                    title="Edit Role"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{user.email}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                </div>
                                <button
                                    onClick={() => setDeletingUser(user)}
                                    className="btn btn-outline"
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        color: 'var(--error)',
                                        borderColor: 'rgba(239, 68, 68, 0.3)',
                                        fontSize: '0.875rem'
                                    }}
                                    title="Delete User"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
