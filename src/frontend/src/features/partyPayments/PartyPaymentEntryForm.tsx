import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Upload, FileSpreadsheet, MapPin } from 'lucide-react';
import { useCreateEntry, useImportPartyMasters } from './partyPaymentsApi';
import { PartyNameCombobox } from './PartyNameCombobox';
import { parseExcelFile } from './partyMastersExcelImport';
import { loadPartyMasters, savePartyMasters } from './partyMastersStorage';
import type { PartyPaymentFormData, PartyMaster } from './types';

interface PartyPaymentEntryFormProps {
  onSuccess?: () => void;
}

export function PartyPaymentEntryForm({ onSuccess }: PartyPaymentEntryFormProps) {
  const createEntry = useCreateEntry();
  const importMasters = useImportPartyMasters();
  const [partyMasters, setPartyMasters] = useState<PartyMaster[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string>('');
  
  const [formData, setFormData] = useState<PartyPaymentFormData>({
    partyName: '',
    address: '',
    phoneNumber: '',
    panNumber: '',
    dueAmount: '',
    date: new Date().toISOString().split('T')[0],
    payment: '',
    nextPaymentDate: '',
    comments: '',
    entryLocation: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PartyPaymentFormData, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const isPaymentZero = formData.payment === '0' || formData.payment === '0.00';

  // Load party masters from localStorage on mount
  useEffect(() => {
    const loaded = loadPartyMasters();
    setPartyMasters(loaded);
  }, []);

  // Auto-capture location on mount
  useEffect(() => {
    captureLocation();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (importStatus) {
      const timer = setTimeout(() => setImportStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importStatus]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('loading');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setFormData((prev) => ({ ...prev, entryLocation: locationString }));
        setLocationStatus('success');
      },
      (error) => {
        setLocationStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. You can enter location manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable. You can enter location manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. You can enter location manually.');
            break;
          default:
            setLocationError('Unable to get location. You can enter location manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleChange = (field: keyof PartyPaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePartySelect = (party: PartyMaster | null) => {
    if (party) {
      setFormData((prev) => ({
        ...prev,
        phoneNumber: party.phoneNumber,
        address: party.address,
        panNumber: party.panNumber,
        dueAmount: party.dueAmount,
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);

    const result = await parseExcelFile(file);
    
    if (result.success && result.data) {
      // Save to localStorage
      savePartyMasters(result.data);
      setPartyMasters(result.data);
      
      // Also try to import to backend
      try {
        await importMasters.mutateAsync(result.data);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${result.data.length} party records!`,
        });
      } catch (error) {
        // Even if backend fails, we have localStorage
        setImportStatus({
          type: 'warning',
          message: `Imported ${result.data.length} parties locally. Backend sync may have failed.`,
        });
      }
    } else {
      setImportStatus({
        type: 'error',
        message: result.error || 'Failed to import Excel file',
      });
    }

    // Reset file input
    e.target.value = '';
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PartyPaymentFormData, string>> = {};

    if (!formData.partyName.trim()) {
      newErrors.partyName = 'Party name is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
    }
    if (!formData.dueAmount.trim()) {
      newErrors.dueAmount = 'Due amount is required';
    } else if (isNaN(Number(formData.dueAmount))) {
      newErrors.dueAmount = 'Due amount must be a valid number';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.payment.trim()) {
      newErrors.payment = 'Payment amount is required';
    } else if (isNaN(Number(formData.payment))) {
      newErrors.payment = 'Payment must be a valid number';
    }

    // Conditional validation for next payment date
    if (isPaymentZero && !formData.nextPaymentDate) {
      newErrors.nextPaymentDate = 'Next payment date is required when payment is 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createEntry.mutateAsync(formData);
      setShowSuccess(true);
      // Reset form
      setFormData({
        partyName: '',
        address: '',
        phoneNumber: '',
        panNumber: '',
        dueAmount: '',
        date: new Date().toISOString().split('T')[0],
        payment: '',
        nextPaymentDate: '',
        comments: '',
        entryLocation: '',
      });
      setLocationStatus('idle');
      setLocationError('');
      // Re-capture location for next entry
      setTimeout(() => captureLocation(), 500);
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {showSuccess && (
        <Alert className="mb-6 border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Payment entry created successfully!
          </AlertDescription>
        </Alert>
      )}

      {importStatus && (
        <Alert 
          className={`mb-6 ${
            importStatus.type === 'success' 
              ? 'border-success bg-success/10' 
              : importStatus.type === 'warning'
              ? 'border-yellow-500 bg-yellow-500/10'
              : ''
          }`}
          variant={importStatus.type === 'error' ? 'destructive' : undefined}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className={importStatus.type === 'success' ? 'text-success' : ''}>
            {importStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {createEntry.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to create entry. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Party Masters
          </CardTitle>
          <CardDescription>
            Upload an Excel file (.xlsx) with columns: Party Name, Phone Number, Address, PAN Number, Due Amount
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="flex-1"
              id="excel-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('excel-upload')?.click()}
              disabled={importMasters.isPending}
            >
              {importMasters.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Excel
            </Button>
          </div>
          {partyMasters.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {partyMasters.length} party record{partyMasters.length !== 1 ? 's' : ''} loaded
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New Payment Entry</CardTitle>
          <CardDescription>
            Enter party payment details and track due amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partyName">
                  Party Name <span className="text-destructive">*</span>
                </Label>
                <PartyNameCombobox
                  value={formData.partyName}
                  onChange={(value) => handleChange('partyName', value)}
                  partyMasters={partyMasters}
                  onSelectParty={handlePartySelect}
                  error={!!errors.partyName}
                />
                {errors.partyName && (
                  <p className="text-sm text-destructive">{errors.partyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter address"
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="panNumber">
                  PAN Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="Enter PAN number"
                  className={errors.panNumber ? 'border-destructive' : ''}
                />
                {errors.panNumber && (
                  <p className="text-sm text-destructive">{errors.panNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueAmount">
                  Due Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dueAmount"
                  type="number"
                  step="0.01"
                  value={formData.dueAmount}
                  onChange={(e) => handleChange('dueAmount', e.target.value)}
                  placeholder="0.00"
                  className={errors.dueAmount ? 'border-destructive' : ''}
                />
                {errors.dueAmount && (
                  <p className="text-sm text-destructive">{errors.dueAmount}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">
                  Payment <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payment"
                  type="number"
                  step="0.01"
                  value={formData.payment}
                  onChange={(e) => handleChange('payment', e.target.value)}
                  placeholder="0.00"
                  className={errors.payment ? 'border-destructive' : ''}
                />
                {errors.payment && (
                  <p className="text-sm text-destructive">{errors.payment}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextPaymentDate">
                Next Payment Date
                {isPaymentZero && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id="nextPaymentDate"
                type="date"
                value={formData.nextPaymentDate}
                onChange={(e) => handleChange('nextPaymentDate', e.target.value)}
                className={errors.nextPaymentDate ? 'border-destructive' : ''}
              />
              {isPaymentZero && !errors.nextPaymentDate && (
                <p className="text-sm text-muted-foreground">
                  Required when payment is 0
                </p>
              )}
              {errors.nextPaymentDate && (
                <p className="text-sm text-destructive">{errors.nextPaymentDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryLocation" className="flex items-center gap-2">
                Entry Location
                {locationStatus === 'loading' && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
                {locationStatus === 'success' && (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="entryLocation"
                  value={formData.entryLocation}
                  onChange={(e) => handleChange('entryLocation', e.target.value)}
                  placeholder="Auto-captured or enter manually"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={captureLocation}
                  disabled={locationStatus === 'loading'}
                  title="Capture current location"
                >
                  {locationStatus === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {locationError && (
                <p className="text-sm text-muted-foreground">{locationError}</p>
              )}
              {locationStatus === 'success' && !locationError && (
                <p className="text-sm text-success">Location captured successfully</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                placeholder="Add any additional notes or comments"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createEntry.isPending}
            >
              {createEntry.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Entry...
                </>
              ) : (
                'Create Entry'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
