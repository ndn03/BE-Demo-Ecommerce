import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { beforeEach } from 'node:test';
describe('AppController', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getHello()).to.equal('Hello World!');
    });
  });
});
