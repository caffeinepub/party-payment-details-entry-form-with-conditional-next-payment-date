import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Phone, Bell, Download, Search, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetAllEntries, useDeleteEntry } from './partyPaymentsApi';
import { useActor } from '@/hooks/useActor';
import { isDueToday, formatPhoneForTel } from './dueToday';
import { exportToCSV } from './reportExport/csvExport';
import { ActorConnectionNotice } from './components/ActorConnectionNotice';
import { safeErrorMessage } from './components/safeErrorMessage';
import { PartyPaymentEntryEditDialog } from './components/PartyPaymentEntryEditDialog';
import { PartyPaymentEntryDeleteConfirm } from './components/PartyPaymentEntryDeleteConfirm';
import type { PartyPaymentEntry } from './types';

type SortField = 'date' | 'partyName';
type SortDirection = 'asc' | 'desc';

export function PartyPaymentEntriesView() {
  const { actor, isFetching: isActorInitializing } = useActor();
  const { data: entries, isLoading, isError, error, refetch, isFetching } = useGetAllEntries();
  const deleteEntry = useDeleteEntry();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDueTodayOnly, setShowDueTodayOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingEntry, setEditingEntry] = useState<PartyPaymentEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<PartyPaymentEntry | null>(null);

  // Filter and sort entries - must be called before any conditional returns
  const filteredAndSortedEntries = useMemo(() => {
    if (!entries) return [];

    let filtered = [...entries];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) =>
        entry.partyName.toLowerCase().includes(query)
      );
    }

    // Apply due today filter
    if (showDueTodayOnly) {
      filtered = filtered.filter((entry) => isDueToday(entry.nextPaymentDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        comparison = dateA - dateB;
      } else if (sortField === 'partyName') {
        comparison = a.partyName.localeCompare(b.partyName);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [entries, searchQuery, showDueTodayOnly, sortField, sortDirection]);

  const dueTodayEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter((entry) => isDueToday(entry.nextPaymentDate));
  }, [entries]);

  // Now safe to do conditional returns after all hooks are called
  if (!actor && isActorInitializing) {
    return (
      <div className="max-w-7xl mx-auto">
        <ActorConnectionNotice message="Connecting to payment service..." />
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!filteredAndSortedEntries || filteredAndSortedEntries.length === 0) return;
    exportToCSV(filteredAndSortedEntries, 'all-payment-entries');
  };

  const handleEdit = (entry: PartyPaymentEntry) => {
    setEditingEntry(entry);
  };

  const handleDelete = (entry: PartyPaymentEntry) => {
    setDeletingEntry(entry);
  };

  const confirmDelete = async () => {
    if (!deletingEntry) return;
    
    try {
      await deleteEntry.mutateAsync(deletingEntry.id);
      setDeletingEntry(null);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

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

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getPaymentStatus = (entry: PartyPaymentEntry) => {
    const payment = parseFloat(entry.payment);
    const dueAmount = parseFloat(entry.dueAmount);

    if (payment >= dueAmount) {
      return { label: 'Paid', variant: 'default' as const };
    }
    return { label: 'Pending', variant: 'secondary' as const };
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {dueTodayEntries.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <Bell className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100 font-semibold">
            Payment Reminders - Due Today
          </AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-2">
              {dueTodayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-background rounded-md border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{entry.partyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Due Amount: ₹{formatCurrency(entry.dueAmount)}
                      {entry.phoneNumber && ` • ${entry.phoneNumber}`}
                    </p>
                  </div>
                  {entry.phoneNumber && (
                    <Button size="sm" variant="outline" asChild className="ml-4">
                      <a href={`tel:${formatPhoneForTel(entry.phoneNumber)}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Payment Entries</CardTitle>
              <CardDescription>
                View all party payment records
                {entries && entries.length > 0 && ` (${filteredAndSortedEntries.length} of ${entries.length} shown)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!filteredAndSortedEntries || filteredAndSortedEntries.length === 0}
                title="Export filtered entries to CSV"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by party name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="due-today-filter"
                  checked={showDueTodayOnly}
                  onCheckedChange={setShowDueTodayOnly}
                />
                <Label htmlFor="due-today-filter" className="cursor-pointer">
                  Due Today Only
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="sort-field" className="whitespace-nowrap">
                  Sort by:
                </Label>
                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                  <SelectTrigger id="sort-field" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="partyName">Party Name</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {(searchQuery || showDueTodayOnly) && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {filteredAndSortedEntries.length} result{filteredAndSortedEntries.length !== 1 ? 's' : ''}
                </Badge>
                {searchQuery && (
                  <Badge variant="outline">
                    Search: "{searchQuery}"
                  </Badge>
                )}
                {showDueTodayOnly && (
                  <Badge variant="outline">Due Today</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setShowDueTodayOnly(false);
                  }}
                  className="h-7 text-xs"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to Load Entries</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>{safeErrorMessage(error)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!isLoading && !isError && entries && entries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No payment entries yet. Create your first entry to get started.
              </p>
            </div>
          )}

          {!isLoading && !isError && entries && entries.length > 0 && filteredAndSortedEntries.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                No Matching Entries
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredAndSortedEntries.length > 0 && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>PAN</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    const status = getPaymentStatus(entry);
                    const isOverdue = isDueToday(entry.nextPaymentDate);

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.partyName}</TableCell>
                        <TableCell>
                          {entry.phoneNumber ? (
                            <a
                              href={`tel:${formatPhoneForTel(entry.phoneNumber)}`}
                              className="text-primary hover:underline"
                            >
                              {entry.phoneNumber}
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{truncateText(entry.address, 30)}</TableCell>
                        <TableCell>{entry.panNumber || '-'}</TableCell>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>₹{formatCurrency(entry.payment)}</TableCell>
                        <TableCell>₹{formatCurrency(entry.dueAmount)}</TableCell>
                        <TableCell>
                          <span className={isOverdue ? 'text-destructive font-semibold' : ''}>
                            {formatDate(entry.nextPaymentDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{truncateText(entry.comments)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(entry)}
                              title="Edit entry"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry)}
                              title="Delete entry"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PartyPaymentEntryEditDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      />

      <PartyPaymentEntryDeleteConfirm
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
        onConfirm={confirmDelete}
        partyName={deletingEntry?.partyName || ''}
        isDeleting={deleteEntry.isPending}
      />
    </div>
  );
}
