import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * Export data to Excel file
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert JSON data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate and download file
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: any[], fileName: string) => {
  try {
    // Create a new workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(ws);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('CSV export error:', error);
    return false;
  }
};

/**
 * Export table data to PDF
 */
export const exportTableToPDF = (
  data: any[],
  columns: string[],
  fileName: string,
  title?: string
) => {
  try {
    const doc = new jsPDF();

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    // Prepare table data
    const headers = columns;
    const body = data.map((row) => columns.map((col) => row[col] || ''));

    // Add table
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: title ? 25 : 15,
      theme: 'grid',
      headStyles: {
        fillColor: [50, 55, 60], // #32373c
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );

    // Save the PDF
    doc.save(`${fileName}.pdf`);

    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    return false;
  }
};

/**
 * Export chart/element to PDF using html2canvas
 */
export const exportChartToPDF = async (
  elementId: string,
  fileName: string,
  title?: string
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return false;
    }

    // Convert element to canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    });

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    // Calculate dimensions
    const imgWidth = doc.internal.pageSize.getWidth() - 28; // Margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image
    doc.addImage(imgData, 'PNG', 14, title ? 25 : 14, imgWidth, imgHeight);

    // Add footer
    doc.setFontSize(8);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      14,
      doc.internal.pageSize.height - 10
    );

    // Save the PDF
    doc.save(`${fileName}.pdf`);

    return true;
  } catch (error) {
    console.error('Chart to PDF export error:', error);
    return false;
  }
};

/**
 * Export comprehensive report to PDF with tables and charts
 */
export const exportFullReportToPDF = async (
  reportTitle: string,
  summary: { [key: string]: string | number },
  tableData: any[],
  tableColumns: string[],
  chartElementIds: string[],
  fileName: string
) => {
  try {
    const doc = new jsPDF();
    let yPosition = 15;

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 14, yPosition);
    yPosition += 10;

    // Add generation info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 10;

    // Add summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Add table
    if (tableData.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Data', 14, yPosition);
      yPosition += 5;

      const headers = tableColumns;
      const body = tableData.map((row) => tableColumns.map((col) => row[col] || ''));

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [50, 55, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add charts on new pages
    for (const chartId of chartElementIds) {
      const element = document.getElementById(chartId);
      if (element) {
        doc.addPage();

        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = doc.internal.pageSize.getWidth() - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 14, 20, imgWidth, imgHeight);
      }
    }

    // Add footer to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }

    // Save the PDF
    doc.save(`${fileName}.pdf`);

    return true;
  } catch (error) {
    console.error('Full report PDF export error:', error);
    return false;
  }
};

/**
 * Format number as currency
 */
export const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-KE');
};
