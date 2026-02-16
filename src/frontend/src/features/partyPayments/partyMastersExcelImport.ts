import type { PartyMaster } from './types';

interface ExcelRow {
  [key: string]: any;
}

const COLUMN_MAPPINGS: Record<string, string[]> = {
  partyName: ['party name', 'partyname', 'name', 'party'],
  phoneNumber: ['phone number', 'phonenumber', 'phone', 'mobile', 'contact'],
  address: ['address', 'location', 'addr'],
  panNumber: ['pan number', 'pannumber', 'pan'],
  dueAmount: ['due amount', 'dueamount', 'due', 'amount'],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findColumnName(headers: string[], possibleNames: string[]): string | null {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const possible of possibleNames) {
    const index = normalizedHeaders.indexOf(normalizeHeader(possible));
    if (index !== -1) return headers[index];
  }
  return null;
}

export interface ImportResult {
  success: boolean;
  data?: PartyMaster[];
  error?: string;
  warnings?: string[];
}

// Load XLSX library dynamically from CDN
let xlsxLoadPromise: Promise<any> | null = null;

function loadXLSX(): Promise<any> {
  if (xlsxLoadPromise) return xlsxLoadPromise;

  xlsxLoadPromise = new Promise((resolve, reject) => {
    // Check if XLSX is already loaded
    if (typeof (window as any).XLSX !== 'undefined') {
      resolve((window as any).XLSX);
      return;
    }

    // Load from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = () => {
      if (typeof (window as any).XLSX !== 'undefined') {
        resolve((window as any).XLSX);
      } else {
        reject(new Error('XLSX library failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load XLSX library from CDN'));
    document.head.appendChild(script);
  });

  return xlsxLoadPromise;
}

export async function parseExcelFile(file: File): Promise<ImportResult> {
  try {
    // Load XLSX library
    const XLSX = await loadXLSX();

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (workbook.SheetNames.length === 0) {
      return { success: false, error: 'No worksheets found in the file' };
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    if (rawData.length === 0) {
      return { success: false, error: 'No data found in the worksheet' };
    }

    const headers = Object.keys(rawData[0]);
    const columnMap: Record<string, string> = {};
    const warnings: string[] = [];

    // Map columns
    for (const [field, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
      const foundColumn = findColumnName(headers, possibleNames);
      if (foundColumn) {
        columnMap[field] = foundColumn;
      } else {
        warnings.push(`Column for "${field}" not found. Expected one of: ${possibleNames.join(', ')}`);
      }
    }

    // Check if we have at least party name
    if (!columnMap.partyName) {
      return { 
        success: false, 
        error: 'Required column "Party Name" not found. Please ensure your Excel file has a column with party names.',
        warnings 
      };
    }

    // Parse rows
    const partyMasters: PartyMaster[] = [];
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const partyName = String(row[columnMap.partyName] || '').trim();
      
      if (!partyName) {
        warnings.push(`Row ${i + 2}: Skipped - no party name`);
        continue;
      }

      const master: PartyMaster = {
        partyName,
        phoneNumber: String(row[columnMap.phoneNumber] || '').trim(),
        address: String(row[columnMap.address] || '').trim(),
        panNumber: String(row[columnMap.panNumber] || '').trim().toUpperCase(),
        dueAmount: String(row[columnMap.dueAmount] || '0').trim(),
      };

      partyMasters.push(master);
    }

    if (partyMasters.length === 0) {
      return { success: false, error: 'No valid party records found in the file', warnings };
    }

    return { success: true, data: partyMasters, warnings: warnings.length > 0 ? warnings : undefined };
  } catch (error) {
    console.error('Excel parsing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse Excel file' 
    };
  }
}
