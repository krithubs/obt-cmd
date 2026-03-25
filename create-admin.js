const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@longkhot.go.th' },
      update: { password: hashedPassword },
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
    });

    console.log('✅ Admin user created/updated:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('🔗 Admin URL: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
