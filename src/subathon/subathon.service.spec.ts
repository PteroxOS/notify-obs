import { Test, TestingModule } from '@nestjs/testing';
import { SubathonService } from './subathon.service';

describe('SubathonService', () => {
  let service: SubathonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubathonService],
    }).compile();

    service = module.get<SubathonService>(SubathonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
