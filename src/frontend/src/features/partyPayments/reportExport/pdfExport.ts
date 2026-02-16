interface PDFExportData {
  partyName: string;
  entries: Array<{
    date: string;
    payment: string;
    nextPaymentDate: string;
    comments: string;
  }>;
}

// Load jsPDF library dynamically from CDN
let jsPDFLoadPromise: Promise<any> | null = null;

function loadJsPDF(): Promise<any> {
  if (jsPDFLoadPromise) return jsPDFLoadPromise;

  jsPDFLoadPromise = new Promise((resolve, reject) => {
    // Check if jsPDF is already loaded
    if (typeof (window as any).jspdf !== 'undefined') {
      resolve((window as any).jspdf);
      return;
    }

    // Load jsPDF from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
    script.onload = () => {
      if (typeof (window as any).jspdf !== 'undefined') {
        // Load jspdf-autotable plugin
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => {
          resolve((window as any).jspdf);
        };
        autoTableScript.onerror = () => reject(new Error('Failed to load jspdf-autotable from CDN'));
        document.head.appendChild(autoTableScript);
      } else {
        reject(new Error('jsPDF library failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF library from CDN'));
    document.head.appendChild(script);
  });

  return jsPDFLoadPromise;
}

export async function exportReportToPDF(data: PDFExportData): Promise<void> {
  try {
    // Load jsPDF library
    const jspdf = await loadJsPDF();
    const { jsPDF } = jspdf;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set document properties
    doc.setProperties({
      title: `Payment Report - ${data.partyName}`,
      subject: 'Party Payment Report',
      author: 'Party Payment Manager',
    });

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Party Payment Report', 105, 20, { align: 'center' });

    // Add party name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Party: ${data.partyName}`, 20, 35);

    // Add generation date
    doc.setFontSize(10);
    doc.setTextColor(100);
    const generatedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Generated: ${generatedDate}`, 20, 42);

    // Reset text color
    doc.setTextColor(0);

    // Prepare table data
    const tableData = data.entries.map((entry) => [
      formatDate(entry.date),
      formatCurrency(entry.payment),
      entry.nextPaymentDate ? formatDate(entry.nextPaymentDate) : '-',
      entry.comments || '-',
    ]);

    // Add table using autoTable
    doc.autoTable({
      startY: 50,
      head: [['Date', 'Payment', 'Next Payment Date', 'Comments']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94], // Green color matching the app theme
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 35 },
        3: { cellWidth: 'auto' },
      },
      margin: { left: 20, right: 20 },
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `payment-report-${data.partyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(value: string): string {
  if (!value) return '₹0.00';
  const num = parseFloat(value);
  return isNaN(num) ? '₹0.00' : `₹${num.toFixed(2)}`;
}
