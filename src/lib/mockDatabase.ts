// Mock Database - จำลองฐานข้อมูลใน memory
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
  phone?: string
  department?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface Complaint {
  id: string
  ticketNo: string
  name: string
  type: string
  description: string
  location: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  createdAt: string
  updatedAt?: string
}

export interface NewsItem {
  id: string
  title: string
  content: string
  category: 'ANNOUNCEMENT' | 'ACTIVITY' | 'NEWS' | 'WARNING'
  isActive: boolean
  createdAt: string
  updatedAt?: string
  author: {
    name: string
  }
}

export interface AuditLog {
  id: string
  action: string
  resource: string
  details?: string
  ipAddress?: string
  createdAt: string
  user: {
    name: string
  }
  before?: any
  after?: any
}

// Mock Database Class
class MockDatabase {
  private users: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      phone: '081-234-5678',
      department: 'IT',
      isActive: true,
      createdAt: '1 ม.ค. 2567',
      updatedAt: '20 มี.ค. 2567'
    },
    {
      id: '2',
      email: 'staff@example.com',
      name: 'Staff User',
      role: 'STAFF',
      phone: '082-345-6789',
      department: 'สำนักปลัดษณ์',
      isActive: true,
      createdAt: '15 ม.ค. 2567',
      updatedAt: '19 มี.ค. 2567'
    },
    {
      id: '3',
      email: 'manager@example.com',
      name: 'Manager User',
      role: 'STAFF',
      phone: '083-456-7890',
      department: 'การเงิน',
      isActive: true,
      createdAt: '10 ก.พ. 2567',
      updatedAt: '18 มี.ค. 2567'
    },
    {
      id: '4',
      email: 'inactive@example.com',
      name: 'Inactive User',
      role: 'STAFF',
      phone: '084-567-8901',
      department: 'สำนักงาน',
      isActive: false,
      createdAt: '5 ก.พ. 2567',
      updatedAt: '15 มี.ค. 2567'
    }
  ]

  private complaints: Complaint[] = [
    {
      id: '1',
      ticketNo: 'CT202403001',
      name: 'สมชาย ใจดี',
      type: 'ถนนชำรุด',
      description: 'ถนนหน้าบ้านเลขที่ 123 มีหลุมขนาดใหญ่',
      location: 'หมู่ 5 ต.CODEMONDAY',
      status: 'PENDING',
      createdAt: '2024-03-20T08:30:00.000Z',
      updatedAt: '2024-03-20T08:30:00.000Z'
    },
    {
      id: '2',
      ticketNo: 'CT202403002',
      name: 'สมหญิง รัตน',
      type: 'แสงสว่าง',
      description: 'ไฟสถานที่บริเวณหมู่บ้านดับ',
      location: 'หมู่ 3 ต.CODEMONDAY',
      status: 'IN_PROGRESS',
      createdAt: '2024-03-19T14:15:00.000Z',
      updatedAt: '2024-03-20T09:00:00.000Z'
    },
    {
      id: '3',
      ticketNo: 'CT202403003',
      name: 'วิระณุ ดีใจ',
      type: 'น้ำท่วม',
      description: 'น้ำท่วมในพื้นที่ชุมชน',
      location: 'หมู่ 2 ต.CODEMONDAY',
      status: 'RESOLVED',
      createdAt: '2024-03-18T10:45:00.000Z',
      updatedAt: '2024-03-19T16:30:00.000Z'
    }
  ]

  private news: NewsItem[] = [
    {
      id: '1',
      title: 'ประกาศการจัดเก็บขยะ',
      content: 'เรียนประชาชนในเขตตำบลCODEMONDAY ร่วมกันจัดเก็บขยะอย่างถูกวิธีตามวันและเวลาที่กำหนด โดยจะมีเจ้าหน้าที่เข้าไปรับขยะตามเส้นทางที่กำหนด ทุกวันอังคารและวันศุกร์ เวลา 08:00-12:00 น. ขอให้ประชาชนแยกขยะและวางไว้หน้าบ้านในถุงที่เหมาะสม',
      category: 'ANNOUNCEMENT',
      isActive: true,
      createdAt: '2024-03-20T08:30:00.000Z',
      updatedAt: '2024-03-20T08:30:00.000Z',
      author: { name: 'Admin User' }
    },
    {
      id: '2',
      title: 'กิจกรรมวันสิงหา',
      content: 'ทางองค์การบำเพศีจะจัดกิจกรรมวันสิงหาในวันที่ 15 เมษายนนี้ ณ สนามกีฬาอบต.CODEMONDAY โดยจะมีพิธีทำบุญตักบาตรในเวลา 09:00 น. ตามด้วยกิจกรรมมอบของที่ระลึกแก่ผู้สูงอายุในพื้นที่',
      category: 'ACTIVITY',
      isActive: true,
      createdAt: '2024-03-19T14:20:00.000Z',
      updatedAt: '2024-03-19T14:20:00.000Z',
      author: { name: 'Staff User' }
    },
    {
      id: '3',
      title: 'ปิดปรับปรุงถนน',
      content: 'จะมีการปิดปรับปรุงถนนสายหลักในวันที่ 20-25 มี.ค. 2567 บนถนนCODEMONDAY-หมู่ 2 โดยจะปิดเวลา 09:00-16:00 น. ขอให้ผู้ใช้รถใช้เส้นทางอ้อมเพื่อความปลอดภัยและสะดวกในการเดินทาง',
      category: 'WARNING',
      isActive: true,
      createdAt: '2024-03-18T10:15:00.000Z',
      updatedAt: '2024-03-18T10:15:00.000Z',
      author: { name: 'Admin User' }
    },
    {
      id: '4',
      title: 'โครงการสร้างสะพานใหม่',
      content: 'อบต.CODEMONDAYได้รับงบประมาณสนับสนุนการสร้างสะพานคอนกรีตข้ามคลองCODEMONDAY มูลค่า 5 ล้านบาท คาดว่าจะเริ่มก่อสร้างในเดือนพฤษภาคมนี้ และแล้วเสร็จภายใน 3 เดือน',
      category: 'NEWS',
      isActive: true,
      createdAt: '2024-03-17T16:45:00.000Z',
      updatedAt: '2024-03-17T16:45:00.000Z',
      author: { name: 'Admin User' }
    },
    {
      id: '5',
      title: 'อบรมการเกษตรอินทรีย์',
      content: 'จัดอบรมการเกษตรอินทรีย์ให้กับเกษตรกรในพื้นที่ วันที่ 25 มี.ค. 2567 เวลา 09:00-12:00 น. ณ ศาลากลางอบต.CODEMONDAY โดยผู้เชี่ยวชาญจากกรมวิชาการเกษตร',
      category: 'ACTIVITY',
      isActive: true,
      createdAt: '2024-03-16T11:30:00.000Z',
      updatedAt: '2024-03-16T11:30:00.000Z',
      author: { name: 'Staff User' }
    },
    {
      id: '6',
      title: 'เตือนภัยอันตรายจากสัตว์ป่า',
      content: 'พบสัตว์ป่านำเข้ามาในพื้นที่ชุมชนบางส่วน ขอให้ประชาชนระมัดระวัง ไม่ใกล้ชิดหรือให้อาหาร และแจ้งเจ้าหน้าที่ทันทีหากพบเห็น',
      category: 'WARNING',
      isActive: true,
      createdAt: '2024-03-15T13:20:00.000Z',
      updatedAt: '2024-03-15T13:20:00.000Z',
      author: { name: 'Admin User' }
    },
    {
      id: '7',
      title: 'เปิดรับสมัครทุนการศึกษา',
      content: 'อบต.CODEMONDAYเปิดรับสมัครนักเรียนที่มีคุณสมบัติเพื่อรับทุนการศึกษาประจำปี 2567 โดยมีเงินสนับสนุน 5,000 บาทต่อคน สามารถยื่นใบสมัครได้ถึงวันที่ 30 เมษายน 2567',
      category: 'ANNOUNCEMENT',
      isActive: true,
      createdAt: '2024-03-14T09:15:00.000Z',
      updatedAt: '2024-03-14T09:15:00.000Z',
      author: { name: 'Staff User' }
    },
    {
      id: '8',
      title: 'ติดตั้งป้ายไฟสัญญาณใหม่',
      content: 'ติดตั้งป้ายไฟสัญญาณใหม่บริเวณสี่แยกหลักอบต.CODEMONDAY เพื่อความปลอดภัยในการจราจร และลดอุบัติเหตุในพื้นที่ โดยจะเริ่มใช้งานวันที่ 1 เมษายน 2567',
      category: 'NEWS',
      isActive: true,
      createdAt: '2024-03-13T14:50:00.000Z',
      updatedAt: '2024-03-13T14:50:00.000Z',
      author: { name: 'Admin User' }
    },
    {
      id: '9',
      title: 'ประกวดแข่งขันกีฬา',
      content: 'จัดประกวดแข่งขันกีฬาฟุตบอล "ถ้วยผู้ใหญ่อบต.CODEMONDAY" ในวันที่ 10 เมษายน 2567 ณ สนามกีฬาอบต.CODEMONDAY ทีมที่สนใจสามารถสมัครได้ถึงวันที่ 5 เมษายน 2567',
      category: 'ACTIVITY',
      isActive: true,
      createdAt: '2024-03-12T10:30:00.000Z',
      updatedAt: '2024-03-12T10:30:00.000Z',
      author: { name: 'Staff User' }
    },
    {
      id: '10',
      title: 'ปรับปรุงระบบน้ำประปา',
      content: 'จะมีการปรับปรุงระบบน้ำประปาในพื้นที่หมู่ 3 และหมู่ 5 ในวันที่ 22-24 มี.ค. 2567 อาจมีการน้ำหยุดชั่วคราว ขอให้ประชาชนเก็บน้ำสำรองไว้ใช้',
      category: 'WARNING',
      isActive: true,
      createdAt: '2024-03-11T08:45:00.000Z',
      updatedAt: '2024-03-11T08:45:00.000Z',
      author: { name: 'Admin User' }
    }
  ]

  private auditLogs: AuditLog[] = [
    {
      id: '1',
      action: 'LOGIN',
      resource: 'USER',
      details: 'เข้าสู่ระบบสำเร็จ',
      ipAddress: '192.168.1.100',
      createdAt: '20 มี.ค. 2567 14:30',
      user: { name: 'Admin User' },
      before: null,
      after: { loginTime: '2024-03-20T14:30:00', status: 'active' }
    },
    {
      id: '2',
      action: 'CREATE',
      resource: 'COMPLAINT',
      details: 'สร้างคำร้อง CT202403005',
      ipAddress: '192.168.1.100',
      createdAt: '20 มี.ค. 2567 13:15',
      user: { name: 'Staff User' },
      before: null,
      after: { 
        id: 'CT202403005',
        type: 'ถนนชำรุด',
        description: 'ถนนหน้าบ้านเลขที่ 123 ชำรุด',
        location: 'หมู่ 5 ต.CODEMONDAY',
        status: 'PENDING',
        createdAt: '2024-03-20T13:15:00'
      }
    }
  ]

  // User operations
  async getUsers(): Promise<User[]> {
    return [...this.users]
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id)
    if (index === -1) return null
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return this.users[index]
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id)
    if (index === -1) return false
    
    this.users.splice(index, 1)
    return true
  }

  // Complaint operations
  async getComplaints(): Promise<Complaint[]> {
    return [...this.complaints]
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    return this.complaints.find(complaint => complaint.id === id) || null
  }

  async createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<Complaint> {
    const now = new Date()
    const newComplaint: Complaint = {
      id: Date.now().toString(),
      ...complaintData,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    this.complaints.push(newComplaint)
    return newComplaint
  }

  async updateComplaint(id: string, complaintData: Partial<Complaint>): Promise<Complaint | null> {
    const index = this.complaints.findIndex(complaint => complaint.id === id)
    if (index === -1) return null
    
    const now = new Date()
    this.complaints[index] = {
      ...this.complaints[index],
      ...complaintData,
      updatedAt: now.toISOString()
    }
    return this.complaints[index]
  }

  async deleteComplaint(id: string): Promise<boolean> {
    const index = this.complaints.findIndex(complaint => complaint.id === id)
    if (index === -1) return false
    
    this.complaints.splice(index, 1)
    return true
  }

  // News operations
  async getNews(): Promise<NewsItem[]> {
    return [...this.news]
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    return this.news.find(news => news.id === id) || null
  }

  async createNews(newsData: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsItem> {
    const newNews: NewsItem = {
      id: Date.now().toString(),
      ...newsData,
      createdAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    this.news.push(newNews)
    return newNews
  }

  async updateNews(id: string, newsData: Partial<NewsItem>): Promise<NewsItem | null> {
    const index = this.news.findIndex(news => news.id === id)
    if (index === -1) return null
    
    this.news[index] = {
      ...this.news[index],
      ...newsData,
      updatedAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return this.news[index]
  }

  async deleteNews(id: string): Promise<boolean> {
    const index = this.news.findIndex(news => news.id === id)
    if (index === -1) return false
    
    this.news.splice(index, 1)
    return true
  }

  // Audit operations
  async getAuditLogs(): Promise<AuditLog[]> {
    return [...this.auditLogs]
  }

  async createAuditLog(logData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      ...logData,
      createdAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString('th-TH')
    }
    this.auditLogs.unshift(newLog) // Add to beginning for newest first
    return newLog
  }
}

// Export singleton instance
export const mockDB = new MockDatabase()
