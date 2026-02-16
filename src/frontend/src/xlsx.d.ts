declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: WorkSheet };
  }

  export interface WorkSheet {
    [key: string]: any;
  }

  export interface ReadOptions {
    type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
  }

  export interface Sheet2JSONOpts {
    header?: number | string[];
    defval?: any;
    blankrows?: boolean;
    raw?: boolean;
    dateNF?: string;
  }

  export function read(data: any, opts?: ReadOptions): WorkBook;
  export function readFile(filename: string, opts?: ReadOptions): WorkBook;

  export const utils: {
    sheet_to_json<T = any>(sheet: WorkSheet, opts?: Sheet2JSONOpts): T[];
    sheet_to_csv(sheet: WorkSheet): string;
    sheet_to_html(sheet: WorkSheet): string;
    aoa_to_sheet(data: any[][]): WorkSheet;
    json_to_sheet(data: any[]): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name?: string): void;
  };

  export function writeFile(workbook: WorkBook, filename: string): void;
  export function write(workbook: WorkBook, opts?: any): any;
}
