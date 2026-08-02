import { Request, Response } from 'express';
import { sendResponse } from '../../../utils/response';
import * as dashboardService from '../services/dashboard.service';

export const getDashboardHandler = async (req: Request, res: Response): Promise<void> => {
  const data = await dashboardService.getDashboardData(req.user!.id);

  sendResponse({
    res,
    message: 'Dashboard data retrieved',
    data,
  });
};
