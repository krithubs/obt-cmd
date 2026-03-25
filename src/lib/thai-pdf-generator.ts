import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Complaint {
  id: string;
  ticketNo: string;
  name: string;
  type: string;
  description: string;
  location: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt?: string;
  internalNote?: string;
  images?: string[];
  phone?: string;
  email?: string;
}

export async function generateComplaintsPDFWithThai(
  complaints: Complaint[],
  dateRange: { from: string; to: string }
): Promise<Uint8Array> {
  try {
    console.log('Starting Thai PDF generation with', complaints.length, 'complaints');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add custom font support for Thai (using built-in font that supports Thai)
    pdf.setFont('helvetica');
    
    let y = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const leftMargin = 20;
    const rightMargin = 190;
    
    // Helper function to add text with line breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      // Split long text
      const lines = pdf.splitTextToSize(text, rightMargin - leftMargin);
      lines.forEach((line: string) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, leftMargin, y);
        y += fontSize * 0.5;
      });
    };
    
    // Title
    addText('รายงานสรุปคำร้อง', 20, true);
    y += 5;
    
    // Organization
    addText('องค์การบริหารส่วนตำบลโหล่งขอด', 12);
    y += 3;
    
    // Date
    const reportDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    addText(`วันที่สร้างรายงาน: ${reportDate}`, 10);
    
    if (dateRange.from && dateRange.to) {
      addText(`ช่วงวันที่: ${dateRange.from} ถึง ${dateRange.to}`, 10);
    }
    
    y += 5;
    // Line separator
    pdf.line(leftMargin, y, rightMargin, y);
    y += 10;
    
    // Calculate statistics
    const totalComplaints = complaints.length;
    
    // Monthly statistics
    const monthlyStats: Record<string, number> = {};
    complaints.forEach(c => {
      const date = new Date(c.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[key] = (monthlyStats[key] || 0) + 1;
    });
    
    const monthlyData = Object.entries(monthlyStats)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }),
        count,
      }));
    
    // Type statistics
    const typeStats: Record<string, number> = {};
    complaints.forEach(c => {
      typeStats[c.type] = (typeStats[c.type] || 0) + 1;
    });
    
    const typeData = Object.entries(typeStats)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({ type, count }));
    
    // Status statistics
    const statusStats: Record<string, number> = {};
    complaints.forEach(c => {
      const statusText = c.status === 'PENDING' ? 'รอดำเนินการ' : 
                        c.status === 'IN_PROGRESS' ? 'กำลังดำเนินการ' : 
                        c.status === 'RESOLVED' ? 'เสร็จสิ้น' : c.status;
      statusStats[statusText] = (statusStats[statusText] || 0) + 1;
    });
    
    const statusData = Object.entries(statusStats)
      .sort(([,a], [,b]) => b - a)
      .map(([status, count]) => ({ status, count }));
    
    // Summary section
    addText('สรุปภาพรวม', 14, true);
    y += 5;
    
    addText(`จำนวนคำร้องทั้งหมด: ${totalComplaints} รายการ`);
    addText(`เฉลี่ยต่อเดือน: ${monthlyData.length > 0 ? Math.round(totalComplaints / monthlyData.length) : 0} รายการ`);
    y += 10;
    
    // Monthly breakdown
    addText('จำนวนคำร้องรายเดือน', 14, true);
    y += 5;
    
    monthlyData.forEach((item, index) => {
      addText(`${index + 1}. ${item.month}: ${item.count} รายการ`);
    });
    
    y += 10;
    pdf.line(leftMargin, y, rightMargin, y);
    y += 10;
    
    // Status breakdown
    addText('สถานะคำร้อง', 14, true);
    y += 5;
    
    statusData.forEach((item, index) => {
      const percentage = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;
      addText(`${index + 1}. ${item.status}: ${item.count} รายการ (${percentage}%)`);
    });
    
    y += 10;
    pdf.line(leftMargin, y, rightMargin, y);
    y += 10;
    
    // Type breakdown
    addText('ประเภทคำร้อง', 14, true);
    y += 5;
    
    typeData.forEach((item, index) => {
      const percentage = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;
      addText(`${index + 1}. ${item.type}: ${item.count} รายการ (${percentage}%)`);
    });
    
    y += 10;
    pdf.line(leftMargin, y, rightMargin, y);
    y += 15;
    
    // Footer
    if (y < pageHeight - 30) {
      addText('รายงานนี้สร้างโดยระบบจัดการคำร้องเรียนออนไลน์', 8);
    }
    
    console.log('Thai PDF generated successfully');
    return new Uint8Array(pdf.output('arraybuffer'));
    
  } catch (error) {
    console.error('Error generating Thai PDF:', error);
    throw error;
  }
}
