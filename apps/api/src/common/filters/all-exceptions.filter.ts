import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : res.message || message;
      errors = Array.isArray(res.message) ? res.message : [];
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = HttpStatus.BAD_REQUEST;
      switch (exception.code) {
        case 'P2002':
          const field = (exception.meta?.target as string[])?.join(', ');
          message = `A record with this ${field || 'value'} already exists.`;
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Record not found.';
          break;
        case 'P2003':
          message = 'Related record not found. Check referenced IDs.';
          break;
        default:
          message = `Database error: ${exception.code}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
