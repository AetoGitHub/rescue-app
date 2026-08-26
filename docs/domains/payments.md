# Pagos, comprobantes y saldo

## Pagar (admin)

- `/admin/pagar` — listados operativo/vendedor y carrito (`PAYMENT_OPERATIVE_LIST_PATH`, `PAYMENT_SELLER_LIST_PATH`, `PAYMENT_CART_PATH`, `PAYMENT_CART_PAY_PATH`). Ability: `accessPayments`.
- `/admin/pagar/checkout` — checkout del carrito.
- Crear deuda: `CreateDebtModal` → `POST /api/payment/debt/create/` (schema `payment-debt-create.ts`). Esa ruta API es `accessPayments`; el listado `GET /api/payment/debt/` es `accessMyBalance`.

Composables: `usePaymentList`, `usePaymentCart`, `usePaymentDebtList`, `usePaymentDebtCreate`, `usePaymentCheckoutRecipient`, `usePaymentBoardFetchers`.

## Comprobantes (staff)

- `/admin/pagar/recibos` y `/admin/pagar/recibo/:receiptId`.
- Ability de ruta: `accessPaymentReceipts` (prefijo `/admin/pagar/recibo` **antes** que `/admin/pagar`).
- API: `/api/payment/receipt/`.
- `usePaymentReceiptList`, `usePaymentReceipt`.

## Mi saldo (staff)

- `/admin/my-balance`.
- API: `/api/payment/balance/operative/`, `/api/payment/balance/seller/`, deudas de lectura.
- `useMyBalance`.

Hay un handler Nitro `server/api/payment/balance/operative.get.ts` además del proxy catch-all; al cambiar el contrato, leer ambos.
