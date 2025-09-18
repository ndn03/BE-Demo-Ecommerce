import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  AsyncLocalStorageService,
  RequestContext,
} from './async-local-storage.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string | number;
    [key: string]: any;
  };
}

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly alsService: AsyncLocalStorageService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;

    const requestId = req.headers['x-request-id'];
    const userId = authReq.user?.id;

    const context: RequestContext = {
      requestId: typeof requestId === 'string' ? requestId : undefined,
      userId: userId !== undefined ? String(userId) : undefined,
      editorId: undefined,
    };

    this.alsService.run(context, () => next());
  }
}
