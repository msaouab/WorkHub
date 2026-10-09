import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const check = vi.fn(async (indicators: Array<() => unknown>) => {
    for (const indicator of indicators) {
      await indicator();
    }
    return { status: 'ok', info: {}, error: {}, details: {} };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: vi.fn(async () => ({
              memory_heap: { status: 'up' },
            })),
          },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns liveness without dependency checks', async () => {
    check.mockClear();
    await expect(controller.checkLive()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(check).toHaveBeenCalledWith([]);
  });

  it('runs readiness memory check as a stand-in until DB/Redis exist', async () => {
    check.mockClear();
    await expect(controller.checkReady()).resolves.toMatchObject({
      status: 'ok',
    });
    expect(check).toHaveBeenCalled();
  });
});
