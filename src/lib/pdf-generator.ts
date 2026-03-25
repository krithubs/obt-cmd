import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Define Complaint interface locally to avoid import issues
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

interface MonthlyStats {
  month: string;
  count: number;
}

interface TypeStats {
  type: string;
  count: number;
}

interface StatusStats {
  status: string;
  count: number;
}

export async function generateComplaintsPDF(
  complaints: Complaint[],
  dateRange: { from: string; to: string }
): Promise<Uint8Array> {
  try {
    console.log('Starting PDF generation with', complaints.length, 'complaints');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Helper function to check if text contains Thai characters
    const containsThai = (text: string) => /[\u0E00-\u0E7F]/.test(text);
    
    // Helper function to draw text - keep Thai text as is
    const drawText = (
      text: string, 
      size: number, 
      x: number, 
      yPos: number, 
      isBold = false,
      color = rgb(0, 0, 0)
    ) => {
      // Try to draw text as-is, if it fails due to Thai chars, it will be caught by error handling
      try {
        page.drawText(text, {
          x,
          y: yPos,
          size,
          font: isBold ? boldFont : font,
          color,
        });
      } catch (error) {
        // If Thai characters cause error, replace with placeholders
        const safeText = text.replace(/[\u0E00-\u0E7F]/g, '?');
        page.drawText(safeText, {
          x,
          y: yPos,
          size,
          font: isBold ? boldFont : font,
          color,
        });
      }
    };
    
    let y = height - 50;
    const leftMargin = 50;
    const rightMargin = width - 50;
  
  // Helper to draw line
  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
  };
  
  // Title
  drawText('Complaints Report', 20, leftMargin, y, true, rgb(0.2, 0.2, 0.2));
  y -= 30;
  
  // Organization name
  drawText('Local Administrative Organization of Holongkod', 12, leftMargin, y, false, rgb(0.4, 0.4, 0.4));
  y -= 20;
  
  // Date range
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  drawText(`Report Date: ${reportDate}`, 10, leftMargin, y, false, rgb(0.5, 0.5, 0.5));
  y -= 15;
  
  if (dateRange.from && dateRange.to) {
    drawText(`Date Range: ${dateRange.from} to ${dateRange.to}`, 10, leftMargin, y, false, rgb(0.5, 0.5, 0.5));
    y -= 15;
  }
  
  y -= 20;
  drawLine(y);
  y -= 25;
  
  // Calculate statistics
  const totalComplaints = complaints.length;
  
  // Monthly statistics
  const monthlyStats: Record<string, number> = {};
  complaints.forEach(c => {
    const date = new Date(c.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats[key] = (monthlyStats[key] || 0) + 1;
  });
  
  const monthlyData: MonthlyStats[] = Object.entries(monthlyStats)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      count,
    }));
  
  // Type statistics
  const typeStats: Record<string, number> = {};
  complaints.forEach(c => {
    typeStats[c.type] = (typeStats[c.type] || 0) + 1;
  });
  
  const typeData: TypeStats[] = Object.entries(typeStats)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => ({ type, count }));
  
  // Status statistics
  const statusStats: Record<string, number> = {};
  complaints.forEach(c => {
    const statusText = c.status === 'PENDING' ? 'Pending' : 
                      c.status === 'IN_PROGRESS' ? 'In Progress' : 
                      c.status === 'RESOLVED' ? 'Resolved' : c.status;
    statusStats[statusText] = (statusStats[statusText] || 0) + 1;
  });
  
  const statusData: StatusStats[] = Object.entries(statusStats)
    .sort(([,a], [,b]) => b - a)
    .map(([status, count]) => ({ status, count }));
  
  // Summary section
  drawText('Summary', 14, leftMargin, y, true, rgb(0.2, 0.2, 0.2));
  y -= 20;
  
  drawText(`Total Complaints: ${totalComplaints}`, 11, leftMargin + 10, y);
  y -= 15;
  drawText(`Average per Month: ${monthlyData.length > 0 ? Math.round(totalComplaints / monthlyData.length) : 0}`, 11, leftMargin + 10, y);
  y -= 25;
  
  // Monthly breakdown
  drawText('Monthly Breakdown', 14, leftMargin, y, true, rgb(0.2, 0.2, 0.2));
  y -= 20;
  
  monthlyData.forEach((item, index) => {
    if (y < 100) {
      // Add new page if running out of space
      const newPage = pdfDoc.addPage([595, 842]);
      y = height - 50;
    }
    
    drawText(`${index + 1}. ${item.month}`, 10, leftMargin + 10, y);
    drawText(`${item.count} cases`, 10, rightMargin - 60, y);
    y -= 15;
  });
  
  y -= 15;
  drawLine(y);
  y -= 25;
  
  // Status breakdown
  drawText('Status Breakdown', 14, leftMargin, y, true, rgb(0.2, 0.2, 0.2));
  y -= 20;
  
  statusData.forEach((item, index) => {
    const percentage = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;
    drawText(`${index + 1}. ${item.status}`, 10, leftMargin + 10, y);
    drawText(`${item.count} cases (${percentage}%)`, 10, rightMargin - 100, y);
    y -= 15;
  });
  
  y -= 15;
  drawLine(y);
  y -= 25;
  
  // Type breakdown
  drawText('Type Breakdown', 14, leftMargin, y, true, rgb(0.2, 0.2, 0.2));
  y -= 20;
  
  typeData.forEach((item, index) => {
    if (y < 100) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = height - 50;
    }
    
    const percentage = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;
    drawText(`${index + 1}. ${item.type}`, 10, leftMargin + 10, y);
    drawText(`${item.count} รายการ (${percentage}%)`, 10, rightMargin - 100, y);
    y -= 15;
  });
  
  y -= 25;
  drawLine(y);
  y -= 30;
  
  // Footer
  if (y > 50) {
    drawText('รายงานนี้สร้างโดยระบบจัดการคำร้องเรียนออนไลน์', 8, leftMargin, y, false, rgb(0.5, 0.5, 0.5));
  }
  
  console.log('PDF generated successfully');
  return pdfDoc.save();
  
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
