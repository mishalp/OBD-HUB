import { Request, Response } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { sendResponse } from '../../../utils/response';
import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  updateInvoiceSchema,
} from '../validators/invoice.validator';
import * as invoiceService from '../services/invoice.service';
import { generateInvoicePdf } from '../services/pdf/invoicePdf.service';

const getBusinessId = (req: Request): string => {
  const businessId = req.user?.businessId;

  if (!businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  return businessId;
};

export const listInvoicesHandler = async (req: Request, res: Response): Promise<void> => {
  const query = listInvoicesQuerySchema.parse(req.query);
  const result = await invoiceService.listInvoices(getBusinessId(req), query);

  sendResponse({
    res,
    message: 'Invoices retrieved',
    data: result,
  });
};

export const getInvoiceHandler = async (req: Request, res: Response): Promise<void> => {
  const invoice = await invoiceService.getInvoiceById(
    getBusinessId(req),
    req.params.id as string,
  );

  sendResponse({
    res,
    message: 'Invoice retrieved',
    data: { invoice },
  });
};

export const createInvoiceHandler = async (req: Request, res: Response): Promise<void> => {
  const input = createInvoiceSchema.parse(req.body);
  const invoice = await invoiceService.createInvoice(
    getBusinessId(req),
    req.user!.id,
    input,
  );

  sendResponse({
    res,
    statusCode: 201,
    message: 'Invoice created successfully',
    data: { invoice },
  });
};

export const updateInvoiceHandler = async (req: Request, res: Response): Promise<void> => {
  const input = updateInvoiceSchema.parse(req.body);
  const invoice = await invoiceService.updateInvoice(
    getBusinessId(req),
    req.params.id as string,
    req.user!.id,
    input,
  );

  sendResponse({
    res,
    message: 'Invoice updated successfully',
    data: { invoice },
  });
};

export const deleteInvoiceHandler = async (req: Request, res: Response): Promise<void> => {
  await invoiceService.deleteInvoice(
    getBusinessId(req),
    req.params.id as string,
    req.user!.id,
  );

  sendResponse({
    res,
    message: 'Invoice deleted successfully',
    data: null,
  });
};

export const downloadInvoicePdfHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const invoice = await invoiceService.getInvoiceById(
    getBusinessId(req),
    req.params.id as string,
  );

  const pdf = await generateInvoicePdf(invoice);

  res.setHeader('Content-Type', pdf.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${pdf.fileName}"`);
  res.setHeader('Content-Length', String(pdf.bytes.byteLength));
  res.status(200).send(Buffer.from(pdf.bytes));
};

export const getInvoicePrintHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await invoiceService.getInvoicePrintDocument(
    getBusinessId(req),
    req.params.id as string,
  );

  sendResponse({
    res,
    message: 'Invoice print document retrieved',
    data: result,
  });
};
