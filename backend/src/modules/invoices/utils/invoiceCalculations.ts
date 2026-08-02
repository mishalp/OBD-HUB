export const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export interface LineCalculationInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface LineCalculationResult {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineSubtotal: number;
  taxAmount: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export const calculateLineItem = (input: LineCalculationInput): LineCalculationResult => {
  const quantity = roundMoney(input.quantity);
  const unitPrice = roundMoney(input.unitPrice);
  const discount = roundMoney(input.discount);
  const taxRate = roundMoney(input.taxRate);

  const gross = roundMoney(quantity * unitPrice);
  const lineSubtotal = roundMoney(Math.max(gross - discount, 0));
  const taxAmount = roundMoney(lineSubtotal * (taxRate / 100));
  const lineTotal = roundMoney(lineSubtotal + taxAmount);

  return {
    quantity,
    unitPrice,
    discount,
    taxRate,
    lineSubtotal,
    taxAmount,
    lineTotal,
  };
};

export const calculateInvoiceTotals = (
  lines: Array<Pick<LineCalculationResult, 'lineSubtotal' | 'discount' | 'taxAmount' | 'lineTotal'>>,
): InvoiceTotals => {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineSubtotal, 0));
  const discountTotal = roundMoney(lines.reduce((sum, line) => sum + line.discount, 0));
  const taxTotal = roundMoney(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const grandTotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));

  return {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
  };
};
