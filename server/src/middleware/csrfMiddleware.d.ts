declare module 'csrfMiddleware' {
    import { Request, Response, NextFunction } from 'express';
  
    export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void;
    export const csrfProtection: any;
  }