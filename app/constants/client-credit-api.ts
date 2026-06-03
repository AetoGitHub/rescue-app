export function clientCreditPath(clientId: number): string {
  return `/api/credit/client/${clientId}/`;
}

export function clientCreditInvoicesPath(clientId: number): string {
  return `/api/credit/client/${clientId}/invoices/`;
}
