import { Test, TestingModule } from '@nestjs/testing';
import { TelegramUpdate } from './telegram.update.';

describe('TelegramService', () => {
  let service: TelegramUpdate;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramUpdate],
    }).compile();

    service = module.get<TelegramUpdate>(TelegramUpdate);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
