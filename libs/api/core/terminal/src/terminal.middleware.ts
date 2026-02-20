
import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@med-core/api-database';

@Injectable()
export class TerminalContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TerminalContextMiddleware.name);

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Extract IP - Trust Proxy must be enabled in main.ts
    const ip = req.ip; 

    // 2. Allow specific endpoint to bypass terminal check (e.g. initial setup)
    if (this.isRuntimeSetupRoute(req)) {
      return next();
    }

    // 3. Find Terminal
    const terminal = await this.prisma.terminal.findUnique({
      where: { ipAddress: ip },
      include: { 
        unit: true,
        modules: true // Load allowed modules
      }
    });

    if (!terminal) {
      this.logger.warn(`Unauthorized Access Attempt from IP: ${ip}`);
      throw new ForbiddenException({
        code: 'TERMINAL_NOT_REGISTERED',
        message: 'This device is not registered as a valid terminal.',
        ip: ip
      });
    }

    if (!terminal.isActive) {
      throw new ForbiddenException('This terminal has been deactivated.');
    }

    // 4. Attach to Request Object for Guards/Controllers
    (req as any).terminal = terminal;

    next();
  }

  private isRuntimeSetupRoute(req: Request): boolean {
    const path = this.normalizePath(req.originalUrl ?? req.url);
    return path === '/runtime/setup' || path === '/api/runtime/setup';
  }

  private normalizePath(urlPath: string): string {
    const [pathname = '/'] = urlPath.split('?');
    const trimmed = pathname.replace(/\/+$/, '');
    return trimmed.length > 0 ? trimmed : '/';
  }
}
