import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, RefreshCw, FileText, Download, FileDown, Printer, Loader2 } from 'lucide-react';
import { useGetAllEntries } from './partyPaymentsApi';
import { PartyNameCombobox } from './PartyNameCombobox';
import { loadPartyMasters } from './partyMastersStorage';
import { exportReportToPDF } from './reportExport/pdfExport';
import { exportToCSV } from './reportExport/csvExport';
import type { PartyMaster, PartyPaymentEntry } from './types';

export function PartyPaymentReportView() {
  const { data: entries, isLoading, isError, refetch, isFetching } = useGetAllEntries();
  const [partyMasters, setPartyMasters] = useState<PartyMaster[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Load party masters from localStorage on mount
  useEffect(() => {
    const loaded = loadPartyMasters();
    setPartyMasters(loaded);
  }, []);

  // Filter entries by selected party
  const filteredEntries = useMemo(() => {
    if (!selectedParty || !entries) return [];
    return entries.filter(
      (entry) => entry.partyName.toLowerCase() === selectedParty.toLowerCase()
    );
  }, [entries, selectedParty]);

  const handlePartySelect = (party: PartyMaster | null) => {
    // Party selection is handled by the combobox value change
  };

  const handleExportPDF = async () => {
    if (!selectedParty || filteredEntries.length === 0) return;

    setIsExportingPDF(true);
    try {
      const exportData = {
        partyName: selectedParty,
        entries: filteredEntries.map((entry) => ({
          date: entry.date,
          payment: entry.payment,
          nextPaymentDate: entry.nextPaymentDate,
          comments: entry.comments,
        })),
      };

      await exportReportToPDF(exportData);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedParty || filteredEntries.length === 0) return;

    exportToCSV(filteredEntries, `payment-report-${selectedParty.replace(/\s+/g, '-').toLowerCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
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
  };

  const formatCurrency = (value: string) => {
    if (!value) return '₹0.00';
    const num = parseFloat(value);
    return isNaN(num) ? '₹0.00' : `₹${num.toFixed(2)}`;
  };

  const canExport = selectedParty && filteredEntries.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      {isError && (
        <Alert variant="destructive" className="mb-6 print:hidden">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load entries. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Party Payment Report
          </CardTitle>
          <CardDescription>
            Select a party to view their payment history and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 max-w-md">
              <PartyNameCombobox
                value={selectedParty}
                onChange={setSelectedParty}
                partyMasters={partyMasters}
                onSelectParty={handlePartySelect}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={!canExport || isExportingPDF}
                title={!canExport ? 'Select a party with records to export PDF' : 'Export as PDF'}
              >
                {isExportingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!canExport}
                title={!canExport ? 'Select a party with records to export CSV' : 'Export as CSV'}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!canExport}
                title={!canExport ? 'Select a party with records to print' : 'Print report'}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh entries"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {!canExport && selectedParty && filteredEntries.length === 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No records found for "{selectedParty}". Export options are disabled.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : !selectedParty ? (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Select a Party
              </p>
              <p className="text-sm text-muted-foreground">
                Choose a party name from the dropdown above to view their payment records
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                No Records Found
              </p>
              <p className="text-sm text-muted-foreground">
                No payment entries found for "{selectedParty}"
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card id="report-content" className="print:shadow-none print:border-0">
          <CardHeader className="print:pb-4">
            <CardTitle>Payment Records for {selectedParty}</CardTitle>
            <CardDescription className="print:hidden">
              {filteredEntries.length} record{filteredEntries.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border print:border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Next Payment Date</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <span className={entry.payment === '0' ? 'text-muted-foreground' : 'text-success font-medium'}>
                          {formatCurrency(entry.payment)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {entry.nextPaymentDate ? (
                          <span className="text-foreground">
                            {formatDate(entry.nextPaymentDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.comments ? (
                          <span className="text-sm text-foreground break-words">
                            {entry.comments}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
