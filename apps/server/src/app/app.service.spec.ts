import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return WorkHub API message', () => {
      expect(service.getData()).toEqual({ message: 'WorkHub API' });
    });
  });
});
