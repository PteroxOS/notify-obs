import { Test, TestingModule } from '@nestjs/testing';
import { SubathonController } from './subathon.controller';

describe('SubathonController', () => {
  let controller: SubathonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubathonController],
    }).compile();

    controller = module.get<SubathonController>(SubathonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
