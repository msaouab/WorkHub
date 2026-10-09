import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return ok status', () => {
    expect(controller.check()).toEqual({
      status: 'ok',
      service: 'workhub-server',
    });
  });
});
