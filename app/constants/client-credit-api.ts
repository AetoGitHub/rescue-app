export function clientCreditPath(clientId: number): string {
  return `/api/credit/client/${clientId}/`;
}

export function clientCreditInvoicesPath(clientId: number): string {
  return `/api/credit/client/${clientId}/invoices/`;
}

export function creditCheckPath(): string {
  return '/api/credit/check/';
}

export function creditUnlockCreatePath(): string {
  return '/api/credit/unlock/create/';
}

export function creditUnlockDetailPath(unlockId: number): string {
  return `/api/credit/unlock/${unlockId}/`;
}

export function creditUnlockCancelPath(unlockId: number): string {
  return `/api/credit/unlock/${unlockId}/cancel/`;
}

export function creditUnlockCompanyListPath(companyId: number): string {
  return `/api/credit/unlock/company/${companyId}/`;
}
