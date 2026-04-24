'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Home, FileText, Users, TrendingUp, AlertCircle, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { PageLoading } from '@/components/ui'
import { formatDate } from '@/lib/dateFormat'

interface AuditLog {
  id: string
  action: string
  resource: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user: {
    name: string
  }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [resourceFilter, setResourceFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')

  useEffect(() => {
    fetchLogs()
  }, [resourceFilter, actionFilter])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (resourceFilter !== 'ALL') params.set('resource', resourceFilter)
      if (actionFilter !== 'ALL') params.set('action', actionFilter)
      const response = await fetch(`/api/audit?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-green-100 text-green-800'
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-800'
    if (action.includes('UPDATE')) return 'bg-yellow-100 text-yellow-800'
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getActionText = (action: string) => {
    if (action.includes('LOGIN_SUCCESS')) return 'เข้าสู่ระบบสำเร็จ'
    if (action.includes('LOGIN_FAILED')) return 'เข้าสู่ระบบล้มเหลว'
    if (action.includes('CREATE')) return 'สร้าง'
    if (action.includes('UPDATE')) return 'อัปเดต'
    if (action.includes('DELETE')) return 'ลบ'
    return action
  }

  const getResourceText = (resource: string) => {
    switch (resource) {
      case 'COMPLAINT': return 'คำร้อง'
      case 'NEWS': return 'ประชาสัมพันธ์'
      case 'USER': return 'ผู้ใช้'
      case 'AUTH': return 'เข้าสู่ระบบ'
      default: return resource
    }
  }

  const parseDetails = (details: string | undefined) => {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return details
    }
  }

  const filteredLogs = logs.filter(log => 
    log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">บันทึกการใช้งาน</h1>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ค้นหาตามผู้ใช้ หรือ การกระทำ"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={resourceFilter}
                  onChange={e => setResourceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="ALL">ทุกประเภท</option>
                  <option value="COMPLAINT">คำร้อง</option>
                  <option value="NEWS">ประชาสัมพันธ์</option>
                  <option value="USER">ผู้ใช้</option>
                  <option value="AUTH">เข้าสู่ระบบ</option>
                </select>
                <select
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="ALL">ทุกการกระทำ</option>
                  <option value="CREATE">สร้าง</option>
                  <option value="UPDATE">อัปเดต</option>
                  <option value="DELETE">ลบ</option>
                  <option value="LOGIN_SUCCESS">เข้าสู่ระบบสำเร็จ</option>
                  <option value="LOGIN_FAILED">เข้าสู่ระบบล้มเหลว</option>
                </select>
                <div className="text-sm text-gray-500">
                  ทั้งหมด {filteredLogs.length} รายการ
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่/เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ใช้
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การกระทำ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ทรัพยากร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      รายละเอียด
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {getActionText(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getResourceText(log.resource)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => toggleRowExpansion(log.id)}
                            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedRows.has(log.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                ซ่อน
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                ขยาย
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(log.id) && (
                        <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                          <td colSpan={6} className="px-6 py-6">
                            <div className="space-y-4">
                              {(() => {
                                const details = parseDetails(log.details)
                                const isUpdate = log.action.includes('UPDATE')
                                const isCreate = log.action.includes('CREATE')
                                const isDelete = log.action.includes('DELETE')
                                const isLogin = log.action.includes('LOGIN')

                                return (
                                  <>
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-gray-300 pb-3">
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        รายละเอียดการกระทำ
                                      </h3>
                                      <div className="text-sm text-gray-500">
                                        User Agent: {log.userAgent || 'N/A'}
                                      </div>
                                    </div>

                                    {/* Action-specific display */}
                                    {isCreate && (
                                      <div className="bg-white border-2 border-blue-200 rounded-lg p-5 shadow-sm">
                                        <div className="flex items-center mb-3">
                                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                          <span className="text-sm font-semibold text-blue-700">สร้างข้อมูลใหม่</span>
                                        </div>
                                        <pre className="text-sm bg-blue-50 p-4 rounded-lg overflow-x-auto border border-blue-100 font-mono">
                                          {JSON.stringify(details, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {isUpdate && details && typeof details === 'object' && details.before && details.after && (
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Before */}
                                        <div className="bg-white border-2 border-red-200 rounded-lg p-5 shadow-sm">
                                          <div className="flex items-center mb-3">
                                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                            <span className="text-sm font-semibold text-red-700">ก่อนการเปลี่ยนแปลง (Before)</span>
                                          </div>
                                          <pre className="text-sm bg-red-50 p-4 rounded-lg overflow-x-auto border border-red-100 font-mono">
                                            {JSON.stringify(details.before, null, 2)}
                                          </pre>
                                        </div>

                                        {/* After */}
                                        <div className="bg-white border-2 border-green-200 rounded-lg p-5 shadow-sm">
                                          <div className="flex items-center mb-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                            <span className="text-sm font-semibold text-green-700">หลังการเปลี่ยนแปลง (After)</span>
                                          </div>
                                          <pre className="text-sm bg-green-50 p-4 rounded-lg overflow-x-auto border border-green-100 font-mono">
                                            {JSON.stringify(details.after, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}

                                    {isUpdate && details && (!details.before || !details.after) && (
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Before - Empty/No Data */}
                                        <div className="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-sm">
                                          <div className="flex items-center mb-3">
                                            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                                            <span className="text-sm font-semibold text-gray-600">ก่อนการเปลี่ยนแปลง (Before)</span>
                                          </div>
                                          <div className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-400 italic">
                                            ไม่มีข้อมูลก่อนเปลี่ยนแปลง
                                          </div>
                                        </div>

                                        {/* After - Current Data */}
                                        <div className="bg-white border-2 border-green-200 rounded-lg p-5 shadow-sm">
                                          <div className="flex items-center mb-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                            <span className="text-sm font-semibold text-green-700">หลังการเปลี่ยนแปลง (After)</span>
                                          </div>
                                          <pre className="text-sm bg-green-50 p-4 rounded-lg overflow-x-auto border border-green-100 font-mono">
                                            {JSON.stringify(details, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}

                                    {isDelete && (
                                      <div className="bg-white border-2 border-red-200 rounded-lg p-5 shadow-sm">
                                        <div className="flex items-center mb-3">
                                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                          <span className="text-sm font-semibold text-red-700">ข้อมูลที่ถูกลบ</span>
                                        </div>
                                        <pre className="text-sm bg-red-50 p-4 rounded-lg overflow-x-auto border border-red-100 font-mono">
                                          {JSON.stringify(details, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {isLogin && (
                                      <div className="bg-white border-2 border-green-200 rounded-lg p-5 shadow-sm">
                                        <div className="flex items-center mb-3">
                                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                          <span className="text-sm font-semibold text-green-700">ข้อมูลการเข้าสู่ระบบ</span>
                                        </div>
                                        <pre className="text-sm bg-green-50 p-4 rounded-lg overflow-x-auto border border-green-100 font-mono">
                                          {JSON.stringify(details, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {!details && (
                                      <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
                                        <p className="text-sm text-gray-500">ไม่มีข้อมูลรายละเอียด</p>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
    </div>
  )
}
