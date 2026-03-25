import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Create users
    const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@longkhot.go.th' },
    update: {},
    create: {
      id: 'admin-001',
      email: 'admin@longkhot.go.th',
      name: 'ผู้ดูแลระบบ อบต.โหล่งขอด',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const staff1 = await prisma.user.upsert({
    where: { email: 'somchai@longkhot.go.th' },
    update: {},
    create: {
      id: 'staff-001',
      email: 'somchai@longkhot.go.th',
      name: 'สมชาย ใจดี',
      password: hashedPassword,
      role: 'STAFF',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const staff2 = await prisma.user.upsert({
    where: { email: 'malee@longkhot.go.th' },
    update: {},
    create: {
      id: 'staff-002',
      email: 'malee@longkhot.go.th',
      name: 'มาลี สวยงาม',
      password: hashedPassword,
      role: 'STAFF',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const staff3 = await prisma.user.upsert({
    where: { email: 'prasit@longkhot.go.th' },
    update: {},
    create: {
      id: 'staff-003',
      email: 'prasit@longkhot.go.th',
      name: 'ประสิทธิ์ มีสุข',
      password: hashedPassword,
      role: 'STAFF',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  // Create sample news with images
  const newsItems = [
    {
      id: 'news-001',
      title: 'ประกาศเตือนฝนตกหนักและพายุฤดูร้อน',
      content: 'จากพยากรณ์อากาศของกรมอุตุนิยมวิทยา คาดว่าในช่วง 3-5 วันข้างหน้าจะมีฝนตกหนักถึงหนักมากในพื้นที่ตำบลโหล่งขอด\n\nประชาชนควรระมัดระวังและเตรียมพร้อมรับมือสถานการณ์ดังนี้:\n- เฝ้าระวังน้ำท่วมฉับพลัน\n- ระวังดินถล่มในพื้นที่ภูเขา\n- หลีกเลี่ยงการเดินทางในช่วงฝนตกหนัก\n- เตรียมอุปกรณ์ฉุกเฉินไว้ที่บ้าน\n\nหากพบเหตุฉุกเฉิน โทร 191 หรือ อบต.โหล่งขอด 053-123456',
      category: 'WARNING' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800',
        'https://images.unsplash.com/photo-1605035015032-f0fc66e8046e?w=800'
      ]),
      authorId: admin.id,
    },
    {
      id: 'news-002',
      title: 'กิจกรรมตรวจสุขภาพฟรี ประจำเดือนมีนาคม 2567',
      content: 'องค์การบริหารส่วนตำบลโหล่งขอด ร่วมกับโรงพยาบาลส่งเสริมสุขภาพตำบล จัดกิจกรรมตรวจสุขภาพฟรีสำหรับประชาชน\n\n📅 วันเสาร์ที่ 15 มีนาคม 2567\n⏰ เวลา 08:00-12:00 น.\n📍 ณ ที่ว่าการ อบต.โหล่งขอด\n\nบริการที่ให้:\n✅ ตรวจวัดความดันโลหิต\n✅ ตรวจระดับน้ำตาลในเลือด\n✅ คัดกรองมะเร็งปากมดลูก (สำหรับสตรี)\n✅ ให้คำปรึกษาสุขภาพ\n✅ แจกยาสามัญประจำบ้าน\n\nไม่มีค่าใช้จ่าย ประชาชนทุกท่านสามารถเข้ารับบริการได้',
      category: 'ACTIVITY' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
        'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800',
        'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800'
      ]),
      authorId: staff1.id,
    },
    {
      id: 'news-003',
      title: 'โครงการปรับปรุงถนนสายหลัก หมู่ 1-5',
      content: 'อบต.โหล่งขอด ได้รับงบประมาณจากกรมส่งเสริมการปกครองท้องถิ่น เพื่อดำเนินการปรับปรุงพื้นผิวถนนสายหลักที่เชื่อมระหว่างหมู่บ้าน\n\nรายละเอียดโครงการ:\n- ระยะทาง: 8.5 กิโลเมตร\n- งบประมาณ: 12.5 ล้านบาท\n- ระยะเวลาก่อสร้าง: 120 วัน\n- เริ่มงาน: 1 เมษายน 2567\n\nการก่อสร้างจะดำเนินการในช่วงเวลา 22:00-05:00 น. เพื่อลดผลกระทบต่อการจราจร\n\nขออภัยในความไม่สะดวก',
      category: 'ANNOUNCEMENT' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800'
      ]),
      authorId: admin.id,
    },
    {
      id: 'news-004',
      title: 'เปิดรับสมัครอาสาสมัครท้องถิ่นรักษ์โลก',
      content: 'อบต.โหล่งขอด เปิดรับสมัครอาสาสมัครเข้าร่วมโครงการ "ท้องถิ่นรักษ์โลก" เพื่อร่วมกันดูแลสิ่งแวดล้อมในชุมชน\n\nกิจกรรมที่จะได้ทำ:\n🌱 ปลูกต้นไม้ริมถนน\n♻️ คัดแยกขยะในชุมชน\n🌊 ทำความสะอาดลำห้วย\n🏞️ ดูแลสวนสาธารณะ\n\nสิทธิประโยชน์:\n- ได้รับเสื้ออาสาสมัคร\n- ได้รับประกาศนียบัตร\n- สร้างเครือข่ายเพื่อนใหม่\n- ร่วมสร้างสังคมที่ดี\n\nสมัครได้ที่ อบต.โหล่งขอด หรือ Line: @longkhotlocal',
      category: 'ACTIVITY' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800'
      ]),
      authorId: staff2.id,
    },
    {
      id: 'news-005',
      title: 'ประกาศปิดทำการชั่วคราว วันสงกรานต์ 2567',
      content: 'องค์การบริหารส่วนตำบลโหล่งขอด ขอประกาศปิดทำการในช่วงเทศกาลสงกรานต์\n\n📅 วันที่ 12-16 เมษายน 2567\n\nเปิดทำการตามปกติ วันที่ 17 เมษายน 2567\n\nกรณีฉุกเฉิน สามารถติดต่อ:\n☎️ เจ้าหน้าที่เวร: 089-123-4567\n🚨 ฉุกเฉิน: 191\n\nขออวยพรให้ทุกท่านมีความสุขในเทศกาลสงกรานต์ 🙏',
      category: 'ANNOUNCEMENT' as const,
      images: JSON.stringify([]),
      authorId: admin.id,
    },
  ]

  for (const news of newsItems) {
    await prisma.news.upsert({
      where: { id: news.id },
      update: {},
      create: {
        ...news,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  // Generate 6 months of realistic historical complaint data
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  
  // Realistic Thai names, locations, and complaint types
  const names = [
    'สมชาย ใจดี', 'มานี รักสะอาด', 'ประสิทธิ์ มีสุข', 'วิไล สว่างใจ', 'บุญมี ช่วยเหลือ',
    'สุดา แสงจันทร์', 'จิรายุ พัฒนา', 'อรุณ รุ่งเรือง', 'ปราณี ดีงาม', 'ชัยวัฒน์ เจริญสุข',
    'กาญจนา สุขสันต์', 'ธนพล มั่นคง', 'สุภาพ รอดเพชร', 'ณัฐพงษ์ รุ่งโรจน์', 'อำพร คงทน',
    'วรรณา ใจหลัก', 'สมหมาย ดีเลิศ', 'พรทิพย์ สวยงาม', 'นิรัตน์ มงคล', 'สุเทพ แก้วกล้า',
    'รัตนา ชื่นชม', 'สมบัติ มั่งมี', 'สุดารัตน์ ดำรง', 'วีระศักดิ์ สุขเกษม', 'นงลักษณ์ ผ่องใส',
    'สุรชัย รักษ์ดี', 'มาลัยวัลย์ ผ่องผาย', 'ธีรชัย สมบูรณ์', 'พัชรี งามเลิศ', 'ยศกร กตัญญู'
  ]
  
  const locations = [
    'หมู่ 1 บ้านโหล่งขอด', 'หมู่ 2 บ้านป่าสัก', 'หมู่ 3 บ้านแม่ก๊ะ', 'หมู่ 4 บ้านทุ่งข้าวพวง',
    'หมู่ 5 บ้านห้วยน้ำดัง', 'หมู่ 6 บ้านปางกว้าง', 'หมู่ 7 บ้านแม่แมม', 'หมู่ 8 บ้านสบก๋าย',
    'ถนนสายหลัก หมู่ 1', 'ซอยประชาสุข หมู่ 2', 'ซอยร่มเย็น หมู่ 4', 'ทางเข้าหมู่บ้านพัฒนา หมู่ 7'
  ]
  
  const complaintTypes = [
    { type: 'ถนน', desc: 'ถนนชำรุด มีหลุมเป็นบ่อ น้ำขังเวลาฝนตก อันตรายต่อการสัญจร' },
    { type: 'ถนน', desc: 'ทางเข้าหมู่บ้านมีหินกรวดหลุดลอย รถมอเตอร์ไซค์ลื่นหกล้มบ่อยครั้ง' },
    { type: 'น้ำประปา', desc: 'น้ำประปาไหลออกมาน้อยในช่วงเช้า บางวันไม่มีน้ำเลย' },
    { type: 'น้ำประปา', desc: 'ท่อน้ำประปาแตก น้ำรั่วไหลออกมาเป็นจำนวนมาก' },
    { type: 'น้ำประปา', desc: 'น้ำในคลองสีดำคล้ำ มีกลิ่นเหม็นรบกวนชาวบ้าน' },
    { type: 'ไฟฟ้า', desc: 'ไฟฟ้าดับบ่อยครั้งช่วงเย็น ไม่มีไฟ 2-3 ชั่วโมง' },
    { type: 'ไฟฟ้า', desc: 'เสาไฟฟ้าล้มเอียง อันตรายต่อการสัญจร' },
    { type: 'ไฟฟ้า', desc: 'ไฟฟ้าส่องสว่างริมถนนดับหลายดวง มืดมากตอนกลางคืน' },
    { type: 'ขยะ', desc: 'ถังขยะเต็มเกินไป ไม่มีการเก็บรับขยะมาหลายวัน กลิ่นเหม็น' },
    { type: 'ขยะ', desc: 'มีผู้ทิ้งขยะมูลฝอยกองใหญ่ริมถนน สร้างความไม่สะอาด' },
    { type: 'ขยะ', desc: 'ขยะอิเล็กทรอนิกส์ทิ้งรวมกับขยะทั่วไป ควรมีจุดทิ้งเฉพาะ' },
    { type: 'เสียงรบกวน', desc: 'ร้านคาราโอเกะเปิดเสียงดังมากจนดึก รบกวนการพักผ่อน' },
    { type: 'เสียงรบกวน', desc: 'โรงงานใกล้ชุมชนเปิดเครื่องจักรดังตลอดคืน นอนไม่หลับ' },
    { type: 'ความปลอดภัย', desc: 'สะพานข้ามลำห้วยชำรุด ราวกันตกหลุด อันตรายต่อผู้สัญจร' },
    { type: 'ความปลอดภัย', desc: 'ป้ายเตือนอันตรายหายไป รถไม่ทราบว่าเป็นทางโค้ง' },
    { type: 'ความปลอดภัย', desc: 'มีสุนัขจรจัดเยอะ กลัวจะกัดเด็กเล็ก' },
    { type: 'ระบายน้ำ', desc: 'ท่อระบายน้ำอุดตัน น้ำท่วมขังทุกครั้งที่ฝนตก' },
    { type: 'ระบายน้ำ', desc: 'ฝาท่อระบายน้ำหาย รถล้อตกลงไปเสียหาย' },
    { type: 'น้ำท่วม', desc: 'พื้นที่ต่ำน้ำท่วมทุกปี ควรมีการปรับระดับถนน' },
    { type: 'อื่นๆ', desc: 'ต้องการให้จัดสถานที่ออกกำลังกายสำหรับผู้สูงอายุ' },
    { type: 'อื่นๆ', desc: 'ขอให้ติดตั้งกระจกโค้งมุมถนนเพื่อลดอุบัติเหตุ' }
  ]
  
  const resolutions = [
    'ซ่อมแซมเรียบร้อยแล้ว',
    'ดำเนินการแก้ไขแล้ว',
    'ประสานงานหน่วยงานที่เกี่ยวข้องแล้ว',
    'ได้รับการแก้ไขและตรวจสอบความปลอดภัย',
    'ปรับปรุงเสร็จสิ้น ขอให้ประชาชนใช้งานได้ตามปกติ'
  ]
  
  const complaints = []
  const complaintsPerMonth = 50 // 50 complaints per month
  const monthsToGenerate = 6 // Last 6 months
  
  let ticketCounter = 1
  
  // Generate for each month
  for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const year = targetMonth.getFullYear()
    const month = targetMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let i = 0; i < complaintsPerMonth; i++) {
      // Random day in this month
      const day = Math.floor(Math.random() * daysInMonth) + 1
      const createdAt = new Date(year, month, day)
      
      // Generate ticket number: CTYYYYMMDD-###
      const monthStr = String(month + 1).padStart(2, '0')
      const dayStr = String(day).padStart(2, '0')
      const ticketNo = `CT${year}${monthStr}${dayStr}-${String(ticketCounter).padStart(4, '0')}`
      
      // Completely random status (equal distribution)
      const rand = Math.random()
      let status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
      let notes = ''
      let assignedTo = null
      
      if (rand < 0.33) {
        status = 'PENDING'
      } else if (rand < 0.66) {
        status = 'IN_PROGRESS'
        notes = 'อยู่ระหว่างดำเนินการ'
        assignedTo = Math.random() > 0.5 ? staff1.id : (Math.random() > 0.5 ? staff2.id : staff3.id)
      } else {
        status = 'RESOLVED'
        notes = resolutions[Math.floor(Math.random() * resolutions.length)]
        assignedTo = Math.random() > 0.5 ? staff1.id : (Math.random() > 0.5 ? staff2.id : staff3.id)
      }
      
      // Random complaint type and description
      const complaintType = complaintTypes[Math.floor(Math.random() * complaintTypes.length)]
      
      // Random person
      const name = names[Math.floor(Math.random() * names.length)]
      const location = locations[Math.floor(Math.random() * locations.length)]
      
      complaints.push({
        id: `complaint-${ticketCounter}`,
        ticketNo,
        name,
        phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        type: complaintType.type,
        description: complaintType.desc,
        location,
        status,
        notes,
        images: '[]',
        assignedTo,
        createdAt,
      })
      
      ticketCounter++
    }
  }
  
  // Sort by date descending (newest first)
  complaints.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  for (const complaint of complaints) {
    await prisma.complaint.upsert({
      where: { ticketNo: complaint.ticketNo },
      update: {},
      create: {
        ...complaint,
        images: '[]', // Empty JSON array for images
        updatedAt: complaint.createdAt,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('\n👤 User Accounts:')
  console.log('   Admin: admin@longkhot.go.th / admin123')
  console.log('   Staff 1: somchai@longkhot.go.th / admin123')
  console.log('   Staff 2: malee@longkhot.go.th / admin123')
  console.log('\n📰 News: ' + newsItems.length + ' items')
  console.log('📋 Complaints: ' + complaints.length + ' items')
  
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
