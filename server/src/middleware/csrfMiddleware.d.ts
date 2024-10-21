// server/middleware/csrfMiddleware.d.ts

declare module 'csrfMiddleware' {
  import { Request, Response, NextFunction } from 'express';

  export function csrfProtection(req: Request, res: Response, next: NextFunction): void;
  export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void;
}
