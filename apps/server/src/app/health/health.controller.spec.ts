import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import { PrismaService } from '@work-hub/database';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const prisma = {};
  const check = vi.fn(async (indicators: Array<() => unknown>) => {
    for (const indicator of indicators) {
      await indicator();
    }
    return { status: 'ok', info: {}, error: {}, details: {} };
  });
  const checkHeap = vi.fn(async () => ({ memory_heap: { status: 'up' } }));
  const pingCheck = vi.fn(async () => ({ database: { status: 'up' } }));

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        { provide: MemoryHealthIndicator, useValue: { checkHeap } },
        { provide: PrismaHealthIndicator, useValue: { pingCheck } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns liveness without dependency checks', async () => {
    await expect(controller.checkLive()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(check).toHaveBeenCalledWith([]);
    expect(pingCheck).not.toHaveBeenCalled();
  });

  it('runs memory and database checks for readiness', async () => {
    await expect(controller.checkReady()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(checkHeap).toHaveBeenCalledOnce();
    expect(pingCheck).toHaveBeenCalledWith('database', prisma);
  });

  it('fails readiness when the database ping fails', async () => {
    pingCheck.mockRejectedValueOnce(new Error('database down'));
    await expect(controller.checkReady()).rejects.toThrow('database down');
  });
});
