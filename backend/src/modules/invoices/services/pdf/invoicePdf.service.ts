import fs from 'fs/promises';
import path from 'path';
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { ApiError } from '../../../../utils/ApiError';
import { InvoiceDetails } from '../../types/invoice.types';
import { showsQuantityFields } from '../../utils/invoiceItemDisplay';

/** A4 page size in PDF points. */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;

const COLORS = {
  red: rgb(0.72, 0.11, 0.11),
  black: rgb(0.07, 0.07, 0.07),
  muted: rgb(0.35, 0.35, 0.35),
  light: rgb(0.94, 0.94, 0.94),
  white: rgb(1, 1, 1),
  line: rgb(0.85, 0.85, 0.85),
};

const formatMoney = (value: number, symbol: string): string => {
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // StandardFonts (WinAnsi) cannot encode ₹ and similar glyphs.
  const safeSymbol = symbol === '₹' || symbol.toUpperCase() === 'INR' ? 'Rs.' : symbol.replace(/[^\x20-\x7E]/g, '');
  return `${safeSymbol}${formatted}`;
};

const formatDate = (value: Date | string | null): string => {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const joinAddress = (parts: Array<string | null | undefined>): string =>
  parts.filter(Boolean).join(', ');

const toWinAnsi = (value: string): string => value.replace(/[^\x20-\x7E]/g, '?');

const truncate = (value: string, max: number): string => {
  const safe = toWinAnsi(value);
  if (safe.length <= max) {
    return safe;
  }
  return `${safe.slice(0, Math.max(0, max - 1))}...`;
};

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
  const words = toWinAnsi(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }

  lines.push(current);
  return lines;
};

const resolveLogoPath = (logo: string | null): string | null => {
  if (!logo) {
    return null;
  }

  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return null;
  }

  const relative = logo.startsWith('/') ? logo.slice(1) : logo;
  return path.resolve(process.cwd(), relative);
};

const tryEmbedLogo = async (
  pdf: PDFDocument,
  logoPath: string | null,
): Promise<PDFImage | null> => {
  if (!logoPath) {
    return null;
  }

  try {
    const bytes = await fs.readFile(logoPath);
    const lower = logoPath.toLowerCase();

    if (lower.endsWith('.png')) {
      return pdf.embedPng(bytes);
    }

    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return pdf.embedJpg(bytes);
    }
  } catch {
    return null;
  }

  return null;
};

interface DrawContext {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  cursorY: number;
  pageNumber: number;
  logo: PDFImage | null;
  invoice: InvoiceDetails;
  generatedAt: Date;
}

const ensureSpace = (ctx: DrawContext, needed: number): void => {
  if (ctx.cursorY - needed >= MARGIN + 50) {
    return;
  }
  finishPageFooter(ctx);
  ctx.page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pageNumber += 1;
  ctx.cursorY = PAGE_HEIGHT - MARGIN;
  drawContinuedHeader(ctx);
};

const finishPageFooter = (ctx: DrawContext): void => {
  const { page, font, invoice, generatedAt, pageNumber } = ctx;
  const symbol = invoice.business.currencySymbol || '₹';
  const contact = [invoice.business.phone, invoice.business.email].filter(Boolean).join(' · ');

  page.drawLine({
    start: { x: MARGIN, y: MARGIN + 28 },
    end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + 28 },
    thickness: 0.5,
    color: COLORS.line,
  });

  page.drawText(truncate(contact || invoice.business.businessName, 70), {
    x: MARGIN,
    y: MARGIN + 14,
    size: 8,
    font,
    color: COLORS.muted,
  });

  page.drawText('Thank you for your business.', {
    x: MARGIN,
    y: MARGIN + 2,
    size: 8,
    font,
    color: COLORS.muted,
  });

  const generated = `Generated ${formatDate(generatedAt)}`;
  page.drawText(generated, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(generated, 8),
    y: MARGIN + 14,
    size: 8,
    font,
    color: COLORS.muted,
  });

  const pageLabel = `Page ${pageNumber}`;
  page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageLabel, 8),
    y: MARGIN + 2,
    size: 8,
    font,
    color: COLORS.muted,
  });

  // Future placeholders (signature / stamp / QR)
  page.drawText('Authorized Signature ____________', {
    x: MARGIN,
    y: MARGIN + 36,
    size: 7,
    font,
    color: COLORS.line,
  });
  void symbol;
};

const drawContinuedHeader = (ctx: DrawContext): void => {
  const { page, bold, invoice } = ctx;
  page.drawText(`${invoice.invoiceNumber} (continued)`, {
    x: MARGIN,
    y: ctx.cursorY,
    size: 10,
    font: bold,
    color: COLORS.red,
  });
  ctx.cursorY -= 18;
};

const drawHeader = (ctx: DrawContext): void => {
  const { page, font, bold, invoice, logo } = ctx;
  const business = invoice.business;

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 8,
    width: PAGE_WIDTH,
    height: 8,
    color: COLORS.red,
  });

  let textX = MARGIN;

  if (logo) {
    const maxH = 48;
    const maxW = 90;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - h,
      width: w,
      height: h,
    });
    textX = MARGIN + w + 12;
  }

  page.drawText(truncate(business.businessName, 40), {
    x: textX,
    y: PAGE_HEIGHT - MARGIN - 12,
    size: 16,
    font: bold,
    color: COLORS.black,
  });

  const address = joinAddress([
    business.addressLine1,
    business.addressLine2,
    business.city,
    business.state,
    business.postalCode,
    business.country,
  ]);

  let infoY = PAGE_HEIGHT - MARGIN - 28;
  const infoLines = [
    address,
    `Phone: ${business.phone}`,
    `Email: ${business.email}`,
    business.gstEnabled && business.gstNumber ? `GST: ${business.gstNumber}` : null,
  ].filter(Boolean) as string[];

  for (const line of infoLines) {
    page.drawText(truncate(line, 55), {
      x: textX,
      y: infoY,
      size: 8,
      font,
      color: COLORS.muted,
    });
    infoY -= 11;
  }

  const title = 'INVOICE';
  page.drawText(title, {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(title, 20),
    y: PAGE_HEIGHT - MARGIN - 10,
    size: 20,
    font: bold,
    color: COLORS.red,
  });

  const meta = [
    `No: ${invoice.invoiceNumber}`,
    `Date: ${formatDate(invoice.invoiceDate)}`,
    `Due: ${formatDate(invoice.dueDate)}`,
    `Status: ${invoice.status}`,
  ];

  let metaY = PAGE_HEIGHT - MARGIN - 34;
  for (const line of meta) {
    page.drawText(line, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(line, 9),
      y: metaY,
      size: 9,
      font,
      color: COLORS.black,
    });
    metaY -= 12;
  }

  ctx.cursorY = Math.min(infoY, metaY) - 16;
};

const drawCustomer = (ctx: DrawContext): void => {
  const { page, font, bold, invoice } = ctx;
  ensureSpace(ctx, 70);

  page.drawText('Bill To', {
    x: MARGIN,
    y: ctx.cursorY,
    size: 10,
    font: bold,
    color: COLORS.red,
  });
  ctx.cursorY -= 14;

  const customer = invoice.customer;
  if (!customer) {
    page.drawText('Customer information unavailable', {
      x: MARGIN,
      y: ctx.cursorY,
      size: 9,
      font,
      color: COLORS.muted,
    });
    ctx.cursorY -= 20;
    return;
  }

  const lines = [
    `${customer.name} (${customer.customerCode})`,
    joinAddress([
      customer.addressLine1,
      customer.addressLine2,
      customer.city,
      customer.state,
      customer.postalCode,
      customer.country,
    ]),
    customer.phone,
    customer.email,
    customer.gstNumber ? `GST: ${customer.gstNumber}` : null,
  ].filter(Boolean) as string[];

  for (const line of lines) {
    page.drawText(truncate(line, 80), {
      x: MARGIN,
      y: ctx.cursorY,
      size: 9,
      font: line === lines[0] ? bold : font,
      color: COLORS.black,
    });
    ctx.cursorY -= 12;
  }

  ctx.cursorY -= 10;
};

const TABLE_COLS = [
  { key: '#', width: 22 },
  { key: 'Item', width: 120 },
  { key: 'Qty', width: 36 },
  { key: 'Unit', width: 36 },
  { key: 'Price', width: 58 },
  { key: 'Disc', width: 48 },
  { key: 'Tax', width: 48 },
  { key: 'Total', width: 62 },
] as const;

const drawTableHeader = (ctx: DrawContext): void => {
  const { page, bold } = ctx;
  ensureSpace(ctx, 28);

  page.drawRectangle({
    x: MARGIN,
    y: ctx.cursorY - 14,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 18,
    color: COLORS.red,
  });

  let x = MARGIN + 4;
  for (const col of TABLE_COLS) {
    page.drawText(col.key, {
      x,
      y: ctx.cursorY - 9,
      size: 8,
      font: bold,
      color: COLORS.white,
    });
    x += col.width;
  }

  ctx.cursorY -= 22;
};

const drawItems = (ctx: DrawContext): void => {
  const { font, invoice } = ctx;
  const symbol = invoice.business.currencySymbol || '₹';

  drawTableHeader(ctx);

  invoice.items.forEach((item, index) => {
    const nameLines = wrapText(item.itemName, font, 8, TABLE_COLS[1].width - 4);
    const desc = item.itemCode ? `${item.itemCode} · ${item.type}` : item.type;
    const rowHeight = 12 + nameLines.length * 10;
    const previousPage = ctx.pageNumber;

    ensureSpace(ctx, rowHeight + 8);

    if (ctx.pageNumber !== previousPage) {
      drawTableHeader(ctx);
    }

    const activePage = ctx.page;

    if (index % 2 === 1) {
      activePage.drawRectangle({
        x: MARGIN,
        y: ctx.cursorY - rowHeight + 4,
        width: PAGE_WIDTH - MARGIN * 2,
        height: rowHeight,
        color: COLORS.light,
      });
    }

    const values = [
      String(index + 1),
      nameLines[0],
      showsQuantityFields(item.type) ? String(item.quantity) : '',
      showsQuantityFields(item.type) ? truncate(item.unit, 6) : '',
      formatMoney(item.unitPrice, symbol),
      formatMoney(item.discount, symbol),
      formatMoney(item.taxAmount, symbol),
      formatMoney(item.lineTotal, symbol),
    ];

    let x = MARGIN + 4;
    values.forEach((value, colIndex) => {
      if (value) {
        activePage.drawText(truncate(value, colIndex === 1 ? 22 : 12), {
          x,
          y: ctx.cursorY - 8,
          size: 8,
          font,
          color: COLORS.black,
        });
      }
      x += TABLE_COLS[colIndex].width;
    });

    let extraY = ctx.cursorY - 18;
    for (let i = 1; i < nameLines.length; i += 1) {
      activePage.drawText(truncate(nameLines[i], 22), {
        x: MARGIN + 4 + TABLE_COLS[0].width,
        y: extraY,
        size: 8,
        font,
        color: COLORS.black,
      });
      extraY -= 10;
    }

    activePage.drawText(truncate(desc, 28), {
      x: MARGIN + 4 + TABLE_COLS[0].width,
      y: extraY,
      size: 7,
      font,
      color: COLORS.muted,
    });

    ctx.cursorY -= rowHeight + 4;
  });

  ctx.cursorY -= 8;
};

const drawSummary = (ctx: DrawContext): void => {
  const { page, font, bold, invoice } = ctx;
  const symbol = invoice.business.currencySymbol || '₹';
  ensureSpace(ctx, 90);

  const boxWidth = 200;
  const boxX = PAGE_WIDTH - MARGIN - boxWidth;
  const rows: Array<[string, string, boolean]> = [
    ['Subtotal', formatMoney(invoice.subtotal, symbol), false],
    ['Discount', formatMoney(invoice.discountTotal, symbol), false],
    ['Tax', formatMoney(invoice.taxTotal, symbol), false],
    ['Grand Total', formatMoney(invoice.grandTotal, symbol), true],
  ];

  let y = ctx.cursorY;
  for (const [label, value, emphasize] of rows) {
    if (emphasize) {
      page.drawRectangle({
        x: boxX,
        y: y - 14,
        width: boxWidth,
        height: 20,
        color: COLORS.red,
      });
      page.drawText(label, {
        x: boxX + 8,
        y: y - 8,
        size: 10,
        font: bold,
        color: COLORS.white,
      });
      page.drawText(value, {
        x: boxX + boxWidth - 8 - bold.widthOfTextAtSize(value, 10),
        y: y - 8,
        size: 10,
        font: bold,
        color: COLORS.white,
      });
      y -= 24;
    } else {
      page.drawText(label, {
        x: boxX + 8,
        y: y - 8,
        size: 9,
        font,
        color: COLORS.muted,
      });
      page.drawText(value, {
        x: boxX + boxWidth - 8 - font.widthOfTextAtSize(value, 9),
        y: y - 8,
        size: 9,
        font: bold,
        color: COLORS.black,
      });
      y -= 16;
    }
  }

  ctx.cursorY = y - 12;
};

const drawNotes = (ctx: DrawContext): void => {
  const { page, font, bold, invoice } = ctx;
  ensureSpace(ctx, 60);

  if (invoice.notes) {
    page.drawText('Notes', {
      x: MARGIN,
      y: ctx.cursorY,
      size: 10,
      font: bold,
      color: COLORS.red,
    });
    ctx.cursorY -= 12;
    for (const line of wrapText(invoice.notes, font, 8, PAGE_WIDTH - MARGIN * 2)) {
      ensureSpace(ctx, 12);
      page.drawText(truncate(line, 100), {
        x: MARGIN,
        y: ctx.cursorY,
        size: 8,
        font,
        color: COLORS.black,
      });
      ctx.cursorY -= 11;
    }
    ctx.cursorY -= 8;
  }

  if (invoice.terms) {
    ensureSpace(ctx, 40);
    page.drawText('Terms & Conditions', {
      x: MARGIN,
      y: ctx.cursorY,
      size: 10,
      font: bold,
      color: COLORS.red,
    });
    ctx.cursorY -= 12;
    for (const line of wrapText(invoice.terms, font, 8, PAGE_WIDTH - MARGIN * 2)) {
      ensureSpace(ctx, 12);
      page.drawText(truncate(line, 100), {
        x: MARGIN,
        y: ctx.cursorY,
        size: 8,
        font,
        color: COLORS.black,
      });
      ctx.cursorY -= 11;
    }
  }
};

export interface GeneratedInvoicePdf {
  bytes: Uint8Array;
  fileName: string;
  contentType: string;
}

/**
 * Generates a deterministic A4 invoice PDF from a saved invoice snapshot.
 * Never accepts unsaved/client-side invoice payloads.
 */
export const generateInvoicePdf = async (
  invoice: InvoiceDetails,
): Promise<GeneratedInvoicePdf> => {
  try {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const logoPath = resolveLogoPath(invoice.business.businessLogo);
    const logo = await tryEmbedLogo(pdf, logoPath);

    const ctx: DrawContext = {
      pdf,
      page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
      font,
      bold,
      cursorY: PAGE_HEIGHT - MARGIN,
      pageNumber: 1,
      logo,
      invoice,
      generatedAt: new Date(),
    };

    drawHeader(ctx);
    drawCustomer(ctx);
    drawItems(ctx);
    drawSummary(ctx);
    drawNotes(ctx);
    finishPageFooter(ctx);

    // Stamp footers on all pages — finishPageFooter already ran for last page;
    // for multi-page, earlier pages got footers when breaking. Done.

    const bytes = await pdf.save();
    const safeNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');

    return {
      bytes,
      fileName: `${safeNumber}.pdf`,
      contentType: 'application/pdf',
    };
  } catch (error) {
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'PDF generation failed',
    );
  }
};
