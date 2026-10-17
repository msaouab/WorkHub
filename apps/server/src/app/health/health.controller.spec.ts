import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  HealthIndicatorService,
  MemoryHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import { PrismaService } from '@work-hub/database';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const queryRawUnsafe = vi.fn(async () => [{ '?column?': 1 }]);
  const prisma = { $queryRawUnsafe: queryRawUnsafe };
  const check = vi.fn(async (indicators: Array<() => unknown>) => {
    for (const indicator of indicators) {
      await indicator();
    }
    return { status: 'ok', info: {}, error: {}, details: {} };
  });
  const checkHeap = vi.fn(async () => ({ memory_heap: { status: 'up' } }));
  const indicatorSession = {
    up: vi.fn(() => ({ database: { status: 'up' as const } })),
    down: vi.fn((data?: { message?: string }) => ({
      database: { status: 'down' as const, ...data },
    })),
  };
  const healthIndicator = {
    check: vi.fn(() => indicatorSession),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        { provide: MemoryHealthIndicator, useValue: { checkHeap } },
        { provide: HealthIndicatorService, useValue: healthIndicator },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
    healthIndicator.check.mockReturnValue(indicatorSession);
    indicatorSession.up.mockReturnValue({ database: { status: 'up' } });
    indicatorSession.down.mockImplementation((data?: { message?: string }) => ({
      database: { status: 'down' as const, ...data },
    }));
  });

  it('returns liveness without dependency checks', async () => {
    await expect(controller.checkLive()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(check).toHaveBeenCalledWith([]);
    expect(queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('runs memory and database checks for readiness', async () => {
    await expect(controller.checkReady()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(checkHeap).toHaveBeenCalledOnce();
    expect(queryRawUnsafe).toHaveBeenCalledOnce();
    expect(indicatorSession.up).toHaveBeenCalledOnce();
  });

  it('fails readiness with a generic message when the database is down', async () => {
    queryRawUnsafe.mockRejectedValueOnce(
      new Error('Invalid prisma.$queryRawUnsafe() invocation')
    );

    await controller.checkReady();

    expect(indicatorSession.down).toHaveBeenCalledWith({
      message: 'unreachable',
    });
    expect(indicatorSession.down.mock.results[0]?.value).toMatchObject({
      database: { status: 'down', message: 'unreachable' },
    });
    expect(
      JSON.stringify(indicatorSession.down.mock.results[0]?.value)
    ).not.toContain('prisma');
  });
});

