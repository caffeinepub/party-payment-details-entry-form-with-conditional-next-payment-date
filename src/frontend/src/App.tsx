import { useState, useEffect } from 'react';
import { PartyPaymentEntryForm } from './features/partyPayments/PartyPaymentEntryForm';
import { PartyPaymentEntriesView } from './features/partyPayments/PartyPaymentEntriesView';
import { PartyPaymentReportView } from './features/partyPayments/PartyPaymentReportView';
import { AuthGate } from './features/auth/AuthGate';
import { AccountSummaryBar } from './features/auth/AccountSummaryBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, List, BarChart3 } from 'lucide-react';
import { forceLightMode } from './theme/forceLightMode';

function App() {
  const [activeTab, setActiveTab] = useState<string>('entry');

  // Enforce light mode on mount and keep it enforced
  useEffect(() => {
    forceLightMode();
  }, []);

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card print:hidden">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Party Payment Manager
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track party payments and manage due amounts
                </p>
              </div>
              <AccountSummaryBar />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 print:hidden">
              <TabsTrigger value="entry" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                New Entry
              </TabsTrigger>
              <TabsTrigger value="entries" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                All Entries
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="mt-0">
              <PartyPaymentEntryForm onSuccess={() => setActiveTab('entries')} />
            </TabsContent>

            <TabsContent value="entries" className="mt-0">
              <PartyPaymentEntriesView />
            </TabsContent>

            <TabsContent value="report" className="mt-0">
              <PartyPaymentReportView />
            </TabsContent>
          </Tabs>
        </main>

        <footer className="mt-16 border-t border-border bg-card print:hidden">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Built with love using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'party-payment-manager'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </footer>
      </div>
    </AuthGate>
  );
}

export default App;
