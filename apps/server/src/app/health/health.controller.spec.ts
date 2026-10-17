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
  const queryRaw = vi.fn(async () => [{ '?column?': 1 }]);
  const prisma = { $queryRaw: queryRaw };
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
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
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
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('runs memory and database checks for readiness', async () => {
    await expect(controller.checkReady()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(checkHeap).toHaveBeenCalledOnce();
    expect(queryRaw).toHaveBeenCalledOnce();
    expect(indicatorSession.up).toHaveBeenCalledOnce();
  });

  it('fails readiness with a generic message when the database is down', async () => {
    const logError = vi
      .spyOn(controller['logger'], 'error')
      .mockImplementation(() => undefined);
    const failure = new Error('Invalid prisma.$queryRaw() invocation');
    queryRaw.mockRejectedValueOnce(failure);

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
    expect(logError).toHaveBeenCalledOnce();
    expect(logError.mock.calls[0]?.[1]).toContain('prisma');
  });

  it('reports unreachable when the database check exceeds 1s', async () => {
    vi.useFakeTimers();
    const logError = vi
      .spyOn(controller['logger'], 'error')
      .mockImplementation(() => undefined);
    queryRaw.mockImplementation(() => new Promise(() => undefined));

    const pending = controller.checkReady();
    await vi.advanceTimersByTimeAsync(1_000);
    await pending;

    expect(indicatorSession.down).toHaveBeenCalledWith({
      message: 'unreachable',
    });
    expect(String(logError.mock.calls[0]?.[1])).toContain('timed out');
    expect(
      JSON.stringify(indicatorSession.down.mock.results[0]?.value)
    ).not.toContain('timed out');
    vi.useRealTimers();
  });
});

