'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Eye, Edit2, Trash2, UserPlus, Shield, Users, X, Save, Edit } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import CustomDropdown from '@/components/ui/CustomDropdown'
import { formatDate } from '@/lib/dateFormat'
import { FIELD_LIMITS } from '@/lib/fieldLimits'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

interface UserFormData {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'view' | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'STAFF',
    isActive: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { showToast, showConfirm } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'STAFF': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ผู้ดูแลระบบ'
      case 'STAFF': return 'เจ้าหน้าที่'
      default: return role
    }
  }

  const roleOptions = [
    { value: 'STAFF', label: 'เจ้าหน้าที่' },
    { value: 'ADMIN', label: 'ผู้ดูแลระบบ' }
  ]

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.email.trim()) {
      errors.email = 'กรุณาระบุอีเมล'
    } else if (formData.email.trim().length > FIELD_LIMITS.USER_EMAIL) {
      errors.email = `อีเมลต้องไม่เกิน ${FIELD_LIMITS.USER_EMAIL} ตัวอักษร`
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    }

    if (!formData.name.trim()) {
      errors.name = 'กรุณาระบุชื่อ'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
    } else if (formData.name.trim().length > FIELD_LIMITS.USER_NAME) {
      errors.name = `ชื่อต้องไม่เกิน ${FIELD_LIMITS.USER_NAME} ตัวอักษร`
    }

    // Password required only when adding new user
    if (showModal === 'add') {
      if (!formData.password.trim()) {
        errors.password = 'กรุณาระบุรหัสผ่าน'
      } else if (formData.password.length < FIELD_LIMITS.USER_PASSWORD_MIN) {
        errors.password = `รหัสผ่านต้องมีอย่างน้อย ${FIELD_LIMITS.USER_PASSWORD_MIN} ตัวอักษร`
      } else if (formData.password.length > FIELD_LIMITS.USER_PASSWORD_MAX) {
        errors.password = `รหัสผ่านต้องไม่เกิน ${FIELD_LIMITS.USER_PASSWORD_MAX} ตัวอักษร`
      }
    }

    // Password validation for edit (optional but if provided, check length)
    if (showModal === 'edit' && formData.password) {
      if (formData.password.length < FIELD_LIMITS.USER_PASSWORD_MIN) {
        errors.password = `รหัสผ่านต้องมีอย่างน้อย ${FIELD_LIMITS.USER_PASSWORD_MIN} ตัวอักษร`
      } else if (formData.password.length > FIELD_LIMITS.USER_PASSWORD_MAX) {
        errors.password = `รหัสผ่านต้องไม่เกิน ${FIELD_LIMITS.USER_PASSWORD_MAX} ตัวอักษร`
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'STAFF',
      isActive: true,
    })
    setFormErrors({})
    setShowModal('add')
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      isActive: user.isActive,
    })
    setFormErrors({})
    setShowModal('edit')
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowModal('view')
  }

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบผู้ใช้นี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      confirmText: 'ลบผู้ใช้',
      type: 'danger'
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        showToast('success', 'ลบผู้ใช้สำเร็จ')
      } else {
        const errorData = await response.json()
        showToast('error', 'ไม่สามารถลบผู้ใช้', errorData.error)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถลบผู้ใช้ได้')
    }
  }

  const handleSaveUser = async () => {
    if (!validateForm()) return

    try {
      let response
      if (showModal === 'add') {
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
      } else if (showModal === 'edit' && selectedUser) {
        response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
      }

      if (response && response.ok) {
        if (showModal === 'add') {
          const newUser = await response.json()
          setUsers([...users, newUser])
          showToast('success', 'เพิ่มผู้ใช้สำเร็จ', `สร้างผู้ใช้ ${newUser.name} เรียบร้อยแล้ว`)
        } else if (showModal === 'edit' && selectedUser) {
          const updatedUser = await response.json()
          setUsers(users.map(user => 
            user.id === selectedUser.id ? updatedUser : user
          ))
          showToast('success', 'อัปเดตผู้ใช้สำเร็จ', `อัปเดตข้อมูล ${updatedUser.name} เรียบร้อยแล้ว`)
        }
        setShowModal(null)
      } else {
        const errorData = response ? await response.json() : { error: 'Unknown error' }
        showToast('error', 'ไม่สามารถบันทึกข้อมูล', errorData.error)
      }
    } catch (error) {
      console.error('Error saving user:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้')
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      const next = { ...formErrors }
      delete next[field]
      setFormErrors(next)
    }
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <>
      <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
              <button 
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มผู้ใช้
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>
                      ชื่อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '25%'}}>
                      อีเมล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '12%'}}>
                      บทบาท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '23%'}}>
                      วันที่สร้าง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate" title={user.name}>
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 truncate" title={user.email}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 truncate">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-800"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showModal === 'add' ? 'เพิ่มผู้ใช้ใหม่' : showModal === 'edit' ? 'แก้ไขผู้ใช้' : 'รายละเอียดผู้ใช้'}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showModal === 'view' && selectedUser ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">บทบาท</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                    {getRoleText(selectedUser.role)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันที่สร้าง</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
                {selectedUser.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่อัปเดต</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.updatedAt!)}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    maxLength={FIELD_LIMITS.USER_NAME}
                    className={`mt-1 block w-full px-3 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="กรอกชื่อผู้ใช้"
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">อีเมล *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    maxLength={FIELD_LIMITS.USER_EMAIL}
                    className={`mt-1 block w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="กรอกอีเมล"
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>

                {showModal === 'add' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">รหัสผ่าน *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      maxLength={FIELD_LIMITS.USER_PASSWORD_MAX}
                      className={`mt-1 block w-full px-3 py-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    />
                    {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                  </div>
                )}

                {showModal === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      maxLength={FIELD_LIMITS.USER_PASSWORD_MAX}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="กรอกรหัสผ่านใหม่"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">บทบาท *</label>
                  <CustomDropdown
                    value={formData.role}
                    onChange={(value) => handleInputChange('role', value as 'ADMIN' | 'STAFF')}
                    options={roleOptions}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    ใช้งาน
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
