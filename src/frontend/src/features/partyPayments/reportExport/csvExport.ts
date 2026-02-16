interface CSVExportEntry {
  partyName: string;
  phoneNumber: string;
  address: string;
  panNumber: string;
  dueAmount: string;
  payment: string;
  date: string;
  nextPaymentDate: string;
  comments: string;
  entryLocation: string;
}

export function exportToCSV(entries: CSVExportEntry[], filename: string = 'payment-entries') {
  // Define CSV headers
  const headers = [
    'Party Name',
    'Phone Number',
    'Address',
    'PAN',
    'Due Amount',
    'Payment',
    'Date',
    'Next Payment Date',
    'Comments',
    'Entry Location',
  ];

  // Convert entries to CSV rows
  const rows = entries.map((entry) => [
    entry.partyName,
    `="${entry.phoneNumber}"`, // Force text format to preserve leading zeros
    entry.address,
    entry.panNumber,
    entry.dueAmount,
    entry.payment,
    entry.date,
    entry.nextPaymentDate || '',
    entry.comments || '',
    entry.entryLocation || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => escapeCSVCell(cell)).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeCSVCell(cell: string): string {
  if (cell == null) return '""';

  const cellStr = String(cell);

  // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
    return `"${cellStr.replace(/"/g, '""')}"`;
  }

  return cellStr;
}
