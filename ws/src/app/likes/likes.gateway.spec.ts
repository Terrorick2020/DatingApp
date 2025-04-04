import { Test, TestingModule } from '@nestjs/testing';
import { LikesGateway } from './likes.gateway';

describe('LikesGateway', () => {
  let gateway: LikesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesGateway],
    }).compile();

    gateway = module.get<LikesGateway>(LikesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
