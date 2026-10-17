import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '@work-hub/database';
import { PROBLEM_DETAILS_REF } from '../../common/swagger/build-openapi-document';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

/**
 * Liveness and readiness probes (outside the API prefix).
 * Readiness pings Postgres via Prisma; Redis check lands with the cache module.
 */
@ApiTags('health')
@SkipThrottle()
@AllowAnonymous()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly healthIndicator: HealthIndicatorService,
    private readonly prisma: PrismaService
  ) {}

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  @ApiResponse({ status: 503, ...PROBLEM_DETAILS_REF })
  checkLive() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Process can accept traffic' })
  @ApiResponse({ status: 503, ...PROBLEM_DETAILS_REF })
  checkReady() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () => this.checkDatabase(),
    ]);
  }

  /** Ping Postgres without leaking driver/Prisma text into the public response. */
  private async checkDatabase() {
    const indicator = this.healthIndicator.check('database');
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return indicator.up();
    } catch (error) {
      this.logger.error(
        'Database readiness check failed',
        error instanceof Error ? error.stack : error
      );
      return indicator.down({ message: 'unreachable' });
    }
  }
}
