import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ErrorCode } from '@work-hub/constants';
import type { ErrorCodeName } from '@work-hub/constants';
import { PROBLEM_TYPE_BASE } from '@work-hub/constants';
import {
  PROBLEM_JSON_CONTENT_TYPE,
  type ProblemDetails,
} from '@work-hub/contracts';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

type ProblemBody = ProblemDetails & Record<string, unknown>;

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem = this.toProblem(exception, request);
    if (problem.status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception
      );
    }

    response
      .status(problem.status)
      .type(PROBLEM_JSON_CONTENT_TYPE)
      .json(problem);
  }

  private toProblem(exception: unknown, request: Request): ProblemBody {
    const instance = request.originalUrl || request.url;

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      const issues = zodError instanceof ZodError ? zodError.issues : [];

      return {
        type: `${PROBLEM_TYPE_BASE}/validation-failed`,
        title: 'Bad Request',
        status: HttpStatus.BAD_REQUEST,
        detail: 'One or more fields failed validation.',
        instance,
        code: ErrorCode.VALIDATION_FAILED,
        errors: issues.map((issue) => ({
          path: issue.path.map(String).join('.') || '(root)',
          message: issue.message,
        })),
      };
    }

    if (exception instanceof ServiceUnavailableException) {
      const payload = exception.getResponse();
      const details =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>)
          : undefined;

      return {
        type: `${PROBLEM_TYPE_BASE}/service-unavailable`,
        title: STATUS_CODES[HttpStatus.SERVICE_UNAVAILABLE] ?? 'Service Unavailable',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        detail: 'One or more readiness checks failed.',
        instance,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        ...(details ? { details } : {}),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message = this.normalizeDetail(this.extractMessage(payload));
      const code = this.extractCode(payload) ?? this.codeForStatus(status);
      const title = STATUS_CODES[status] ?? 'Error';

      return {
        type: `${PROBLEM_TYPE_BASE}/${this.slug(code)}`,
        title,
        status,
        detail: message,
        instance,
        code,
      };
    }

    return {
      type: `${PROBLEM_TYPE_BASE}/internal-error`,
      title: STATUS_CODES[HttpStatus.INTERNAL_SERVER_ERROR] ?? 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
      instance,
      code: ErrorCode.INTERNAL_ERROR,
    };
  }

  private extractMessage(payload: string | object): string | undefined {
    if (typeof payload === 'string') {
      return payload;
    }
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message: unknown }).message;
      if (Array.isArray(message)) {
        return message.map(String).join('; ');
      }
      if (typeof message === 'string') {
        return message;
      }
    }
    return undefined;
  }

  /** Strip Nest exception-class prefixes like `ThrottlerException: `. */
  private normalizeDetail(message?: string): string | undefined {
    if (!message) {
      return undefined;
    }
    return message.replace(/^[A-Za-z][A-Za-z0-9]*Exception:\s*/u, '');
  }

  private extractCode(payload: string | object): ErrorCodeName | undefined {
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      typeof (payload as { code: unknown }).code === 'string'
    ) {
      const code = (payload as { code: string }).code;
      if ((Object.values(ErrorCode) as string[]).includes(code)) {
        return code as ErrorCodeName;
      }
    }
    return undefined;
  }

  private codeForStatus(status: number): ErrorCodeName {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return status >= 500
          ? ErrorCode.INTERNAL_ERROR
          : ErrorCode.BAD_REQUEST;
    }
  }

  private slug(code: string): string {
    return code.toLowerCase().replace(/_/g, '-');
  }
}
