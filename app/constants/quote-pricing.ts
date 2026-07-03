/** Provisional IVA rate until backend provides tax rules per client. */
export const DEFAULT_IVA_RATE = 0.16;

/** Decimal places for quote amounts in MXN (centavos). */
export const QUOTE_MONEY_DECIMALS = 2;

/** Round each line total up to the next $10 before summing (default on). */
export const DEFAULT_QUOTE_ROUND_TO_TEN = true;

export const QUOTE_SUMMARY_LABELS = {
  technicalCost: 'Costo técnico',
  subtotal: 'Subtotal',
  utility: 'Utilidad',
  sellerCommissionPercent: 'Comisión vendedor',
  sellerCommissionFixed: 'Comisión fija vendedor',
  beforeTax: 'Subtotal antes de IVA',
  totalQuoted: 'Total cotizado',
  roundingPerLine: 'Ajuste por redondeo al diez',
} as const;

/** Copy for the dev-only quote pricing breakdown panel. */
export const QUOTE_DEV_BREAKDOWN_COPY = {
  rulesTitle: 'Reglas de precio (qué paga el cliente vs. referencia interna)',
  rulesIntro:
    'El total cotizado se arma solo con los totales de línea (+ comisión vendedor fija extra, si aplica). Hay dos conceptos de comisión distintos:',
  ruleEmbeddedFixed:
    'Comisión fija de empresa (commission_fixed): se reparte entre partidas estándar y ya está incluida en el subtotal. El cliente la paga dentro de cada línea.',
  ruleMultiplier:
    'Multiplicador de precio: se aplica sobre el costo base de cada partida estándar antes de repartir la comisión fija de empresa.',
  ruleSellerPercent:
    'Comisión vendedor en % (commission_value con tipo PERCENTAGE): se calcula sobre la utilidad (subtotal − costo técnico). Es referencia para pagos internos; no se suma al total del cliente.',
  ruleSellerFixed:
    'Comisión vendedor fija (commission_value con tipo FIXED): se reparte entre partidas estándar (proporcional al subtotal tras multiplicador) y ya está incluida en el total de cada línea.',
  embeddedFixedLabel: 'Comisión fija de empresa (embebida en partidas)',
  sellerCommissionTypeLabel: 'Tipo comisión vendedor (sobre utilidad o extra)',
  sellerCommissionValueLabel: 'Valor comisión vendedor',
  fixedShareLinePrefix: 'Comisión fija de empresa repartida',
  fixedShareLineSuffix: '→ incluida en total línea (sí paga el cliente)',
  sellerFixedShareLinePrefix: 'Comisión vendedor fija repartida',
  sellerFixedShareLineSuffix: '→ incluida en total línea (sí paga el cliente)',
  contractLineNote:
    'Línea convenio: precio directo, sin multiplicador ni comisión fija de empresa',
} as const;

export const QUOTE_DEV_UNLOCK_COPY = {
  shortcutLabel: 'Ctrl+Shift+Q',
  enabled: 'Desglose de cotización activado para esta sesión',
  disabled: 'Desglose de cotización oculto',
  panelTitleDev: 'Desglose de cotización (solo desarrollo)',
  panelTitleAdmin: 'Desglose de cotización (debug administrativo)',
  panelHintAdmin: 'Atajo: Ctrl+Shift+Q para ocultar',
} as const;
