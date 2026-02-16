import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, FileText, Printer, Loader2 } from 'lucide-react';
import { useGetAllEntries } from './partyPaymentsApi';
import { useActor } from '@/hooks/useActor';
import { exportReportToPDF } from './reportExport/pdfExport';
import { exportToCSV } from './reportExport/csvExport';
import { ActorConnectionNotice } from './components/ActorConnectionNotice';
import type { PartyPaymentEntry } from './types';

export function PartyPaymentReportView() {
  const { actor, isFetching: isActorInitializing } = useActor();
  const { data: entries } = useGetAllEntries();
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Get unique party names - must be called before any conditional returns
  const partyNames = useMemo(() => {
    if (!entries) return [];
    const names = new Set(entries.map((entry) => entry.partyName));
    return Array.from(names).sort();
  }, [entries]);

  // Filter entries by selected party - must be called before any conditional returns
  const filteredEntries = useMemo(() => {
    if (!entries || !selectedParty) return [];
    return entries
      .filter((entry) => entry.partyName === selectedParty)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, selectedParty]);

  // Now safe to do conditional returns after all hooks are called
  if (!actor && isActorInitializing) {
    return (
      <div className="max-w-7xl mx-auto">
        <ActorConnectionNotice message="Connecting to report service..." />
      </div>
    );
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!selectedParty || filteredEntries.length === 0) return;

    setIsExportingPDF(true);
    try {
      await exportReportToPDF({
        partyName: selectedParty,
        entries: filteredEntries.map((entry) => ({
          date: entry.date,
          payment: entry.payment,
          nextPaymentDate: entry.nextPaymentDate,
          comments: entry.comments,
        })),
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedParty || filteredEntries.length === 0) return;
    exportToCSV(filteredEntries, `${selectedParty}-report`);
  };

  const hasData = selectedParty && filteredEntries.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Party Payment Report</CardTitle>
              <CardDescription>
                Generate detailed payment reports for individual parties
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={!hasData || isExportingPDF}
                title="Export to PDF"
              >
                {isExportingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!hasData}
                title="Export to CSV"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!hasData}
                title="Print report"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          <div className="mt-4 print:hidden">
            <Label htmlFor="party-select" className="mb-2 block">
              Select Party
            </Label>
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger id="party-select" className="max-w-md">
                <SelectValue placeholder="Choose a party to view report..." />
              </SelectTrigger>
              <SelectContent>
                {partyNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {!selectedParty && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Select a party from the dropdown above to view their payment report.
              </p>
            </div>
          )}

          {selectedParty && filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No payment records found for {selectedParty}.
              </p>
            </div>
          )}

          {hasData && (
            <div id="report-content" className="space-y-6">
              {/* Report Header - visible in print */}
              <div className="hidden print:block mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Payment Report: {selectedParty}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Payments</CardDescription>
                    <CardTitle className="text-2xl">
                      {filteredEntries.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Amount Paid</CardDescription>
                    <CardTitle className="text-2xl">
                      ₹
                      {filteredEntries
                        .reduce((sum, entry) => sum + parseFloat(entry.payment || '0'), 0)
                        .toFixed(2)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Due Amount</CardDescription>
                    <CardTitle className="text-2xl">
                      ₹
                      {filteredEntries
                        .reduce((sum, entry) => sum + parseFloat(entry.dueAmount || '0'), 0)
                        .toFixed(2)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Payment History Table */}
              <div className="rounded-md border overflow-x-auto">
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
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>₹{formatCurrency(entry.payment)}</TableCell>
                        <TableCell>{formatDate(entry.nextPaymentDate)}</TableCell>
                        <TableCell>{entry.comments || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
