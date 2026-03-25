export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
  createdAt: Date
  updatedAt: Date
}

export interface Complaint {
  id: string
  ticketNo: string
  name: string
  phone: string
  type: 'ถนน' | 'ไฟฟ้า' | 'น้ำประปา' | 'สิ่งแวดล้อม' | 'ความสะอาด' | 'อื่นๆ'
  description: string
  location?: string
  latitude?: number
  longitude?: number
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
  notes?: string
  images: string[]
  createdAt: Date
  updatedAt: Date
  assignedTo?: string
  assignee?: User
}

export interface News {
  id: string
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  authorId: string
  author: User
}

export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  userId: string
  user: User
}

export interface ComplaintFormData {
  name: string
  phone: string
  type: Complaint['type']
  description: string
  location?: string
  latitude?: number
  longitude?: number
  images: File[]
}

export interface LoginFormData {
  email: string
  password: string
}

export interface NewsFormData {
  title: string
  content: string
  category: News['category']
  imageUrl?: string
  isActive: boolean
}

export interface UserFormData {
  email: string
  name: string
  password?: string
  role: User['role']
}
