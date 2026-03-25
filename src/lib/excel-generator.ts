import * as XLSX from 'xlsx'

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

export async function generateComplaintsExcel(
  complaints: Complaint[],
  dateRange: { from: string; to: string }
): Promise<Uint8Array> {
  try {
    console.log('Starting Excel generation with', complaints.length, 'complaints');
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = complaints.map(c => ({
      'Ticket No': c.ticketNo,
      'Name': c.name,
      'Phone': c.phone || '',
      'Type': c.type,
      'Status': c.status === 'PENDING' ? 'Pending' : 
                c.status === 'IN_PROGRESS' ? 'In Progress' : 
                c.status === 'RESOLVED' ? 'Resolved' : c.status,
      'Description': c.description,
      'Location': c.location || '',
      'Created Date': new Date(c.createdAt).toLocaleDateString('en-US'),
      'Updated Date': c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-US') : '',
      'Internal Note': c.internalNote || ''
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Ticket No
      { wch: 20 }, // Name
      { wch: 15 }, // Phone
      { wch: 15 }, // Type
      { wch: 15 }, // Status
      { wch: 30 }, // Description
      { wch: 25 }, // Location
      { wch: 12 }, // Created Date
      { wch: 12 }, // Updated Date
      { wch: 25 }, // Internal Note
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Complaints');
    
    // Create summary worksheet
    const summaryData = [
      ['Summary Report', ''],
      ['Report Date', new Date().toLocaleDateString('en-US')],
      ['Date Range', `${dateRange.from} to ${dateRange.to}`],
      ['Total Complaints', complaints.length],
      ['Pending', complaints.filter(c => c.status === 'PENDING').length],
      ['In Progress', complaints.filter(c => c.status === 'IN_PROGRESS').length],
      ['Resolved', complaints.filter(c => c.status === 'RESOLVED').length],
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    console.log('Excel generated, byte length:', excelBuffer.length);
    return new Uint8Array(excelBuffer);
    
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
}
