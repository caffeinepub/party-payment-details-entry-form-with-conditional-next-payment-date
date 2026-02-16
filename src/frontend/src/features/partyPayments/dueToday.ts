export function getTodayDateKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDueToday(nextPaymentDate: string): boolean {
  if (!nextPaymentDate) return false;
  const today = getTodayDateKey();
  return nextPaymentDate === today;
}

export function formatPhoneForTel(phone: string): string {
  // Remove any non-digit characters for tel: link
  return phone.replace(/\D/g, '');
}
