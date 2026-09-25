/**
 * PDF Generator for Petty Cash Requests
 * Creates professional PDF documents with company branding
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PettyCashDetailResponse, PettyCashLineItem } from '../services/api/petty-cash';
import dayjs from 'dayjs';

// Import logo
import logoImage from '../assets/ewe-sacco-logo.png';

// Company Details
const COMPANY_INFO = {
  name: 'EMPOWERED WOMAN EXCEL SACCO',
  address: 'Harare, Zimbabwe',
  phone: '+263 XXX XXX XXX',
  email: 'info@ewesacco.org',
  website: 'www.ewesacco.org',
};

/**
 * Generate PDF for a petty cash request
 */
export const generatePettyCashPDF = async (request: PettyCashDetailResponse): Promise<void> => {
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // ============================================================================
  // HEADER SECTION
  // ============================================================================

  // Add logo (left side)
  try {
    const logoWidth = 50;
    const logoHeight = 25;
    doc.addImage(logoImage, 'PNG', margin, yPosition, logoWidth, logoHeight);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  // Company details (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, pageWidth - margin, yPosition + 5, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, pageWidth - margin, yPosition + 10, { align: 'right' });
  doc.text(`Tel: ${COMPANY_INFO.phone}`, pageWidth - margin, yPosition + 14, { align: 'right' });
  doc.text(`Email: ${COMPANY_INFO.email}`, pageWidth - margin, yPosition + 18, { align: 'right' });
  doc.text(COMPANY_INFO.website, pageWidth - margin, yPosition + 22, { align: 'right' });

  yPosition += 35;

  // Horizontal line separator
  doc.setDrawColor(0, 147, 227); // Blue color
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // ============================================================================
  // DOCUMENT TITLE
  // ============================================================================

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 147, 227); // Blue color
  doc.text('PETTY CASH REQUEST', pageWidth / 2, yPosition, { align: 'center' });
  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition += 12;

  // ============================================================================
  // REQUEST INFORMATION BOX
  // ============================================================================

  const boxHeight = 30;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(240, 247, 255); // Light blue background
  doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 'FD');

  yPosition += 7;

  // Request Number and Status
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Request Number:', margin + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.petty_cash_number, margin + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', pageWidth / 2 + 10, yPosition);
  doc.setFont('helvetica', 'normal');

  // Color code status
  const statusColors: Record<string, [number, number, number]> = {
    pending: [255, 165, 0],      // Orange
    verified: [0, 123, 255],     // Blue
    approved: [0, 200, 83],      // Green
    rejected: [255, 0, 0],       // Red
    disbursed: [138, 43, 226],   // Purple
  };
  const statusColor = statusColors[request.status] || [0, 0, 0];
  doc.setTextColor(...statusColor);
  doc.text(request.status_display.toUpperCase(), pageWidth / 2 + 27, yPosition);
  doc.setTextColor(0, 0, 0); // Reset to black

  yPosition += 7;

  // Request Date and Priority
  doc.setFont('helvetica', 'bold');
  doc.text('Request Date:', margin + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dayjs(request.request_date).format('DD/MM/YYYY'), margin + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Priority:', pageWidth / 2 + 10, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.priority_display, pageWidth / 2 + 27, yPosition);

  yPosition += 7;

  // Category and Currency
  doc.setFont('helvetica', 'bold');
  doc.text('Category:', margin + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.category_display, margin + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Currency:', pageWidth / 2 + 10, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.currency, pageWidth / 2 + 27, yPosition);

  yPosition += boxHeight - 14;

  // ============================================================================
  // REQUESTER INFORMATION
  // ============================================================================

  yPosition += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 147, 227);
  doc.text('REQUESTER INFORMATION', margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.employee_name || 'N/A', margin + 40, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Number:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.employee_number || 'N/A', margin + 40, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Department:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.employee_department || 'N/A', margin + 40, yPosition);

  yPosition += 10;

  // ============================================================================
  // FINANCIAL SUMMARY
  // ============================================================================

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 147, 227);
  doc.text('FINANCIAL SUMMARY', margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 7;

  doc.setFontSize(10);

  // Additional financial details
  if (request.account_code) {
    doc.setFont('helvetica', 'bold');
    doc.text('Account/GL Code:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(request.account_code, margin + 40, yPosition);
    yPosition += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Expected:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(request.receipt_expected ? 'Yes' : 'No', margin + 40, yPosition);
  yPosition += 6;

  if (request.required_by_date) {
    doc.setFont('helvetica', 'bold');
    doc.text('Required By:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(dayjs(request.required_by_date).format('DD/MM/YYYY'), margin + 40, yPosition);
    yPosition += 6;
  }

  yPosition += 5;

  // ============================================================================
  // PURPOSE AND JUSTIFICATION
  // ============================================================================

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 147, 227);
  doc.text('PURPOSE', margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const purposeLines = doc.splitTextToSize(request.purpose, pageWidth - 2 * margin - 10);
  doc.text(purposeLines, margin + 5, yPosition);
  yPosition += purposeLines.length * 5 + 5;

  if (request.justification) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 147, 227);
    doc.text('JUSTIFICATION', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const justificationLines = doc.splitTextToSize(request.justification, pageWidth - 2 * margin - 10);
    doc.text(justificationLines, margin + 5, yPosition);
    yPosition += justificationLines.length * 5 + 5;
  }

  // ============================================================================
  // LINE ITEMS TABLE
  // ============================================================================

  if (request.line_items && request.line_items.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 147, 227);
    doc.text('LINE ITEMS', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 5;

    // Prepare table data
    const tableData = request.line_items.map((item: PettyCashLineItem, index: number) => [
      (index + 1).toString(),
      item.description,
      item.currency,
      item.quantity.toLocaleString(),
      `${item.currency} ${parseFloat(item.unit_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${item.currency} ${parseFloat(item.amount.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    // Calculate total
    const total = request.line_items.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Description', 'Currency', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      foot: [['', '', '', '', 'Total:', `${request.currency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]],
      theme: 'striped',
      headStyles: {
        fillColor: [0, 147, 227], // Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      footStyles: {
        fillColor: [230, 255, 230], // Light green
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ============================================================================
  // VERIFICATION INFORMATION (if applicable)
  // ============================================================================

  if (request.verified_by_name) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 147, 227);
    doc.text('VERIFICATION INFORMATION', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 7;

    doc.setFontSize(10);

    doc.setFont('helvetica', 'bold');
    doc.text('Verified By:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(request.verified_by_name, margin + 40, yPosition);
    yPosition += 6;

    if (request.verified_date) {
      doc.setFont('helvetica', 'bold');
      doc.text('Verification Date:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(dayjs(request.verified_date).format('DD/MM/YYYY HH:mm'), margin + 40, yPosition);
      yPosition += 6;
    }

    yPosition += 5;
  }

  // ============================================================================
  // APPROVAL INFORMATION (if applicable)
  // ============================================================================

  if (request.approved_by_name || request.rejection_reason) {
    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 147, 227);
    doc.text('APPROVAL INFORMATION', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 7;

    doc.setFontSize(10);

    if (request.approved_by_name) {
      doc.setFont('helvetica', 'bold');
      doc.text('Approved By:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(request.approved_by_name, margin + 40, yPosition);
      yPosition += 6;
    }

    if (request.approved_date) {
      doc.setFont('helvetica', 'bold');
      doc.text('Approval Date:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(dayjs(request.approved_date).format('DD/MM/YYYY HH:mm'), margin + 40, yPosition);
      yPosition += 6;
    }

    if (request.rejection_reason) {
      doc.setFont('helvetica', 'bold');
      doc.text('Rejection Reason:', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 0, 0); // Red
      const rejectionLines = doc.splitTextToSize(request.rejection_reason, pageWidth - 2 * margin - 10);
      doc.text(rejectionLines, margin + 5, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += rejectionLines.length * 5 + 5;
    }

    yPosition += 5;
  }

  // ============================================================================
  // DISBURSEMENT INFORMATION (if applicable)
  // ============================================================================

  if (request.disbursed_by_name) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 147, 227);
    doc.text('DISBURSEMENT INFORMATION', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 7;

    doc.setFontSize(10);

    doc.setFont('helvetica', 'bold');
    doc.text('Disbursed By:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(request.disbursed_by_name, margin + 40, yPosition);
    yPosition += 6;

    if (request.disbursed_date) {
      doc.setFont('helvetica', 'bold');
      doc.text('Disbursement Date:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(dayjs(request.disbursed_date).format('DD/MM/YYYY HH:mm'), margin + 40, yPosition);
      yPosition += 6;
    }

    if (request.receipt_number) {
      doc.setFont('helvetica', 'bold');
      doc.text('Receipt Number:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(request.receipt_number, margin + 40, yPosition);
      yPosition += 6;
    }
  }

  // ============================================================================
  // FOOTER
  // ============================================================================

  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);

    // Generated timestamp (left)
    const generatedText = `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')}`;
    doc.text(generatedText, margin, pageHeight - 10);

    // Page number (center)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Company name (right)
    doc.text(COMPANY_INFO.name, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // ============================================================================
  // SAVE PDF
  // ============================================================================

  const fileName = `Petty_Cash_${request.petty_cash_number}_${dayjs().format('YYYYMMDD')}.pdf`;
  doc.save(fileName);
};
