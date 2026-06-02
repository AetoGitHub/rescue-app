export function generateRemittanceNumber(date = new Date()): string {
  const year = date.getFullYear();
  const seq = String(Math.floor(Math.random() * 99_999) + 1).padStart(5, '0');
  return `REM-${year}-${seq}`;
}

export function generateInvoiceNumber(): string {
  const seq = String(Math.floor(Math.random() * 999_999) + 1).padStart(6, '0');
  return `A-${seq}`;
}
