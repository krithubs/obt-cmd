'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart3, FileText, Users, TrendingUp, Clock, CheckCircle,
  AlertCircle, LogOut, Home, ArrowUpRight, ArrowDownRight,
  Calendar, RefreshCw, ChevronLeft, ChevronRight, MapPin,
  Download, Filter, Eye
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts'
import { LoadingSpinner } from '@/components/ui'
import { formatDate } from '@/lib/dateFormat'

// ─── Types ───────────────────────────────────────────────────────
interface ComplaintRecord {
  id: string
  ticketNo: string
  title: string
  reporter: string
  type: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  date: string
  location: string
  priority: 'low' | 'medium' | 'high'
}

interface MonthlyData {
  month: string
  monthNum: number
  total: number
  resolved: number
  pending: number
  inProgress: number
  avgDays: number
}

// ─── Mock Data Generator ─────────────────────────────────────────
const COMPLAINT_TYPES = [
  'ถนนชำรุด', 'ไฟฟ้าส่องสว่าง', 'น้ำท่วม', 'ขยะ/สิ่งแวดล้อม',
  'เสียงรบกวน', 'ท่อระบายน้ำ', 'สัตว์จรจัด', 'สาธารณูปโภค'
]

const LOCATIONS = [
  'หมู่ 1 บ้านโหล่งขอด', 'หมู่ 2 บ้านป่าสัก', 'หมู่ 3 บ้านแม่ก๊ะ',
  'หมู่ 4 บ้านทุ่งข้าวพวง', 'หมู่ 5 บ้านห้วยน้ำดัง', 'หมู่ 6 บ้านปางกว้าง',
  'หมู่ 7 บ้านแม่แมม', 'หมู่ 8 บ้านสบก๋าย'
]

const REPORTERS = [
  'สมชาย ใจดี', 'สมหญิง รัตน์', 'วิระณุ ดีใจ', 'นภา สีทอง',
  'ประพันธ์ แก้วมูล', 'จันทร์ แสงสว่าง', 'อนุชา ภูมิชาย', 'สุดา วงค์ชัย',
  'กมล ลุงแดง', 'บุญมา ต๊ะวงค์', 'แสงจันทร์ คำปัน', 'ทองดี แก้วเขียว'
]

const STATUSES: ('PENDING' | 'IN_PROGRESS' | 'RESOLVED')[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED']

function generateMonthlyData(year: number): MonthlyData[] {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  return months.map((month, i) => {
    if (year === currentYear && i > currentMonth) {
      return { month, monthNum: i, total: 0, resolved: 0, pending: 0, inProgress: 0, avgDays: 0 }
    }
    const base = 60 + Math.floor(Math.random() * 80)
    const resolved = Math.floor(base * (0.75 + Math.random() * 0.2))
    const inProgress = Math.floor((base - resolved) * 0.6)
    const pending = base - resolved - inProgress
    return {
      month, monthNum: i, total: base, resolved, pending, inProgress,
      avgDays: +(1.5 + Math.random() * 3).toFixed(1)
    }
  })
}

function generateComplaints(year: number, month: number): ComplaintRecord[] {
  const count = 8 + Math.floor(Math.random() * 7)
  return Array.from({ length: count }, (_, i) => {
    const day = 1 + Math.floor(Math.random() * 28)
    const status = STATUSES[Math.floor(Math.random() * 3)]
    const priority: 'low' | 'medium' | 'high' = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
    return {
      id: `${i + 1}`,
      ticketNo: `CT${year}${String(month + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
      title: `แจ้ง${COMPLAINT_TYPES[Math.floor(Math.random() * COMPLAINT_TYPES.length)]}`,
      reporter: REPORTERS[Math.floor(Math.random() * REPORTERS.length)],
      type: COMPLAINT_TYPES[Math.floor(Math.random() * COMPLAINT_TYPES.length)],
      status,
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      priority,
    }
  }).sort((a, b) => b.date.localeCompare(a.date))
}

function generateTypeBreakdown() {
  return COMPLAINT_TYPES.map(type => ({
    name: type,
    value: 10 + Math.floor(Math.random() * 90),
  }))
}

function generateLocationBreakdown() {
  return LOCATIONS.map(loc => ({
    name: loc.replace('หมู่ ', 'ม.').replace(/บ้าน/g, 'บ.'),
    total: 5 + Math.floor(Math.random() * 40),
    resolved: 3 + Math.floor(Math.random() * 30),
  }))
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// ─── Animated Number Component ───────────────────────────────────
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])
  return <>{display.toLocaleString('en-US')}</>
}

// ─── Main Component ──────────────────────────────────────────────
export default function AdminDashboard() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'analytics'>('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([])
  const [typeData, setTypeData] = useState<{ name: string; value: number }[]>([])
  const [locationData, setLocationData] = useState<{ name: string; total: number; resolved: number }[]>([])

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    try {
      // Fetch real complaints from API
      const response = await fetch('/api/complaints')
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      const complaintsData = await response.json()

      // Calculate monthly data from real complaints
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      const monthlyStats = months.map((month, i) => {
        const monthComplaints = complaintsData.filter((c: any) => {
          const date = new Date(c.createdAt)
          // Show all complaints, group by month
          return date.getFullYear() === currentYear && date.getMonth() === i
        })
        const total = monthComplaints.length
        const resolved = monthComplaints.filter((c: any) => c.status === 'RESOLVED').length
        const inProgress = monthComplaints.filter((c: any) => c.status === 'IN_PROGRESS').length
        const pending = monthComplaints.filter((c: any) => c.status === 'PENDING').length
        return {
          month,
          monthNum: i,
          total,
          resolved,
          pending,
          inProgress,
          avgDays: 0
        }
      })

      // Calculate totals from ALL complaints (not just filtered)
      const totalComplaints = complaintsData.length
      const totalResolved = complaintsData.filter((c: any) => c.status === 'RESOLVED').length
      const totalInProgress = complaintsData.filter((c: any) => c.status === 'IN_PROGRESS').length
      const totalPending = complaintsData.filter((c: any) => c.status === 'PENDING').length
      
      // Set totals directly like portal
      setMonthlyData(monthlyStats.map(stat => ({
        ...stat,
        // Override with real totals if this is current month
        ...(stat.monthNum === currentMonth && {
          total: totalComplaints,
          resolved: totalResolved,
          pending: totalPending,
          inProgress: totalInProgress
        })
      })))

      // Calculate type breakdown
      const typeMap = new Map<string, number>()
      complaintsData.forEach((c: any) => {
        typeMap.set(c.type, (typeMap.get(c.type) || 0) + 1)
      })
      const typeBreakdown = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }))
      setTypeData(typeBreakdown)

      // Calculate location breakdown
      const locationMap = new Map<string, { total: number; resolved: number }>()
      complaintsData.forEach((c: any) => {
        const loc = c.location || 'ไม่ระบุ'
        const current = locationMap.get(loc) || { total: 0, resolved: 0 }
        current.total++
        if (c.status === 'RESOLVED') current.resolved++
        locationMap.set(loc, current)
      })
      const locationBreakdown = Array.from(locationMap.entries()).map(([name, data]) => ({
        name: name.substring(0, 20),
        ...data
      }))
      setLocationData(locationBreakdown)

      // Filter complaints by selected month
      const m = selectedMonth !== null ? selectedMonth : currentMonth
      const filteredComplaints = complaintsData
        .filter((c: any) => {
          const date = new Date(c.createdAt)
          // Show all complaints in current year, or filter by selected month
          return date.getFullYear() === currentYear && (selectedMonth === null ? true : date.getMonth() === m)
        })
        .map((c: any) => ({
          id: c.id,
          ticketNo: c.ticketNo,
          title: c.description.substring(0, 50),
          reporter: c.name,
          type: c.type,
          status: c.status,
          date: formatDate(c.createdAt),
          location: c.location || 'ไม่ระบุ',
          priority: 'medium' as const
        }))
        .sort((a: any, b: any) => b.date.localeCompare(a.date))
      setComplaints(filteredComplaints)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }

    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadData() }, [selectedYear, selectedMonth])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false) // Don't show loading for auto-refresh
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedYear, selectedMonth])

  // Computed stats - use current month data directly
  const totals = useMemo(() => {
    // Get current month data from monthlyData
    const currentMonthData = monthlyData.find(d => d.monthNum === currentMonth)
    const total = currentMonthData?.total || 0
    const resolved = currentMonthData?.resolved || 0
    const pending = currentMonthData?.pending || 0
    const inProgress = currentMonthData?.inProgress || 0
    const avgDays = 0
    const rate = total > 0 ? +((resolved / total) * 100).toFixed(1) : 0
    return { total, resolved, pending, inProgress, avgDays, rate }
  }, [monthlyData, currentMonth])

  const statusForPie = useMemo(() => [
    { name: 'สำเร็จ', value: totals.resolved, color: '#10b981' },
    { name: 'กำลังดำเนินการ', value: totals.inProgress, color: '#f59e0b' },
    { name: 'รอดำเนินการ', value: totals.pending, color: '#ef4444' },
  ], [totals])

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="กำลังโหลดแดชบอร์ด..." subText="ระบบจัดการคำร้อง อบต.โหล่งขอด" />
      </div>
    )
  }

  // ─── Status Badge ────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      PENDING: 'bg-red-50 text-red-700 border-red-200',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
    const labels: Record<string, string> = {
      PENDING: 'รอดำเนินการ',
      IN_PROGRESS: 'กำลังดำเนินการ',
      RESOLVED: 'สำเร็จ',
    }
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${map[status] || ''}`}>
        {labels[status] || status}
      </span>
    )
  }

  const PriorityDot = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = { low: 'bg-blue-400', medium: 'bg-amber-400', high: 'bg-red-500' }
    return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || 'bg-gray-400'}`}></span>
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
          <header className="bg-white/70 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
                  <p className="text-sm text-gray-500 mt-0.5">ภาพรวมระบบจัดการคำร้อง อบต.โหล่งขอด</p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Year Selector */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setSelectedYear(y => y - 1)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-3 text-sm font-semibold text-gray-700 min-w-[60px] text-center">
                      {selectedYear + 543}
                    </span>
                    <button
                      onClick={() => setSelectedYear(y => Math.min(y + 1, currentYear))}
                      disabled={selectedYear >= currentYear}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Refresh */}
                  <button
                    onClick={() => loadData(false)}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">รีเฟรช</span>
                  </button>

                  {/* Export */}
                  <button
                    onClick={() => {
                      const data = { year: selectedYear, monthlyData, totals, complaints, typeData, locationData }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `dashboard-${selectedYear}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm text-white transition-colors shadow-sm shadow-blue-600/25"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">ส่งออก</span>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mt-4 bg-gray-100 rounded-xl p-1 w-fit">
                {([
                  { key: 'overview', label: 'ภาพรวม', icon: Eye },
                  { key: 'complaints', label: 'คำร้อง', icon: FileText },
                  { key: 'analytics', label: 'วิเคราะห์', icon: BarChart3 },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 space-y-6">

            {/* ─── OVERVIEW TAB ─── */}
            {activeTab === 'overview' && (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'คำร้องทั้งหมด', value: totals.total, icon: FileText, color: 'blue', change: 12, sub: `ปี ${selectedYear + 543}` },
                    { label: 'ดำเนินการสำเร็จ', value: totals.resolved, icon: CheckCircle, color: 'emerald', change: 8, sub: `อัตราสำเร็จ ${totals.rate}%` },
                    { label: 'กำลังดำเนินการ', value: totals.inProgress, icon: Clock, color: 'amber', change: -5, sub: 'อยู่ระหว่างติดตาม' },
                    { label: 'รอดำเนินการ', value: totals.pending, icon: AlertCircle, color: 'red', change: -15, sub: 'รอเจ้าหน้าที่รับเรื่อง' },
                  ].map((card, i) => (
                    <div key={i} className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl bg-${card.color}-50 group-hover:bg-${card.color}-100 transition-colors`}>
                          <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                        </div>
                        <div className={`flex items-center space-x-1 text-xs font-medium ${card.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{Math.abs(card.change)}%</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-3xl font-bold text-gray-900">
                          <AnimatedNumber value={card.value} />
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-1">{card.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Area Chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">สถิติรายเดือน</h3>
                        <p className="text-sm text-gray-500">จำนวนคำร้องและผลสำเร็จ ปี {selectedYear + 543}</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={monthlyData.filter(d => d.total > 0)}>
                        <defs>
                          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(value: number, name: string) => [value, name === 'total' ? 'ทั้งหมด' : name === 'resolved' ? 'สำเร็จ' : name]}
                        />
                        <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradTotal)" name="total" dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                        <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fill="url(#gradResolved)" name="resolved" dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                        <Legend formatter={(value) => value === 'total' ? 'ทั้งหมด' : 'สำเร็จ'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Donut Chart */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">สัดส่วนสถานะ</h3>
                    <p className="text-sm text-gray-500 mb-4">ทุกคำร้องในปี {selectedYear + 543}</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={statusForPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {statusForPie.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'คำร้อง']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {statusForPie.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span className="text-gray-600">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-900">{item.value.toLocaleString('en-US')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance + Recent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Average Resolution Time by Month */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">เวลาดำเนินการเฉลี่ย</h3>
                    <p className="text-sm text-gray-500 mb-4">จำนวนวันในการแก้ไขปัญหาเฉลี่ย</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyData.filter(d => d.total > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit=" วัน" />
                        <Tooltip formatter={(value: number) => [`${value} วัน`, 'เวลาเฉลี่ย']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="avgDays" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="เวลาเฉลี่ย" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* ─── COMPLAINTS TAB ─── */}
            {activeTab === 'complaints' && (
              <>
                {/* Month Selector Scrollable */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">เลือกเดือน — ปี {selectedYear + 543}</h3>
                    {selectedMonth !== null && (
                      <button onClick={() => setSelectedMonth(null)} className="text-sm text-blue-600 hover:underline">
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                    {monthNames.map((m, i) => {
                      const data = monthlyData[i]
                      const isDisabled = selectedYear === currentYear && i > currentMonth
                      return (
                        <button
                          key={i}
                          onClick={() => !isDisabled && setSelectedMonth(i === selectedMonth ? null : i)}
                          disabled={isDisabled}
                          className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-all min-w-[90px] border ${
                            selectedMonth === i
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
                              : isDisabled
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <p className="text-sm font-semibold">{m}</p>
                          <p className={`text-lg font-bold mt-1 ${selectedMonth === i ? 'text-white' : isDisabled ? 'text-gray-300' : 'text-gray-900'}`}>
                            {data?.total || 0}
                          </p>
                          <p className={`text-xs mt-0.5 ${selectedMonth === i ? 'text-blue-200' : 'text-gray-400'}`}>คำร้อง</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Complaint Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">
                      รายการคำร้อง {selectedMonth !== null ? `— ${monthNames[selectedMonth]} ${selectedYear + 543}` : `— ปี ${selectedYear + 543}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{complaints.length} รายการ</p>
                  </div>
                  <div className="overflow-hidden">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>เลขที่</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '28%'}}>หัวข้อ</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '17%'}}>ผู้แจ้ง</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>พื้นที่</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '13%'}}>วันที่</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '12%'}}>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {complaints.map(c => (
                          <tr key={c.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <PriorityDot priority={c.priority} />
                                <span className="font-mono text-sm font-semibold text-gray-900 truncate">{c.ticketNo}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 truncate" title={c.title}>{c.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate" title={c.reporter}>{c.reporter}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 truncate" title={c.location}>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{c.location}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 truncate">{c.date}</td>
                            <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ─── ANALYTICS TAB ─── */}
            {activeTab === 'analytics' && (
              <>
                {/* Type Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">ประเภทคำร้อง</h3>
                    <p className="text-sm text-gray-500 mb-4">จำแนกตามหมวดหมู่</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {typeData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'คำร้อง']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Location Breakdown */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">คำร้องตามพื้นที่</h3>
                    <p className="text-sm text-gray-500 mb-4">จำแนกตามหมู่บ้าน</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={locationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} stroke="#94a3b8" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="total" fill="#3b82f6" name="ทั้งหมด" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="resolved" fill="#10b981" name="สำเร็จ" radius={[0, 4, 4, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Comparison */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">เปรียบเทียบรายเดือน</h3>
                  <p className="text-sm text-gray-500 mb-4">คำร้องทั้งหมด vs สำเร็จ vs กำลังดำเนินการ</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyData.filter(d => d.total > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Bar dataKey="resolved" name="สำเร็จ" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inProgress" name="กำลังดำเนินการ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="รอดำเนินการ" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'เวลาดำเนินการเฉลี่ย', value: `${totals.avgDays} วัน`, color: 'purple' },
                    { label: 'อัตราสำเร็จ', value: `${totals.rate}%`, color: 'emerald' },
                    { label: 'หมู่บ้านที่แจ้งมากสุด', value: locationData.sort((a, b) => b.total - a.total)[0]?.name || '-', color: 'blue' },
                    { label: 'ประเภทยอดนิยม', value: typeData.sort((a, b) => b.value - a.value)[0]?.name || '-', color: 'amber' },
                  ].map((card, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <p className={`text-xl font-bold text-gray-900 mt-2`}>{card.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
    </>
  )
}
