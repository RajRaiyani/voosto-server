import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

const requestId = (req: Request, res: Response, next: NextFunction) => {
  (req as any).id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', (req as any).id);
  next();
};

export default requestId;
