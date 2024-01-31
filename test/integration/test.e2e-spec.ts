import { INestApplication } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { KafkaBatchClient, KafkaBatchServer } from '../../lib';
import { TestController } from './test.controller';

jest.setTimeout(30000);

describe('Integration', () => {
  let client: KafkaBatchClient;
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          {
            name: 'KAFKA_BATCH_CLIENT',
            customClass: KafkaBatchClient as any,
            options: {
              client: {
                brokers: ['localhost:52800', 'localhost:52801'],
              },
              consumer: {
                groupId: 'test',
                heartbeatInterval: 5000,
                sessionTimeout: 30000,
              },
            },
          },
        ]),
      ],
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    app.connectMicroservice({
      strategy: new KafkaBatchServer({
        client: {
          brokers: ['localhost:52800', 'localhost:52801'],
        },
        consumer: {
          groupId: 'test',
          heartbeatInterval: 5000,
          sessionTimeout: 30000,
        },
        run: {
          autoCommitInterval: 5000,
          autoCommitThreshold: 100,
          partitionsConsumedConcurrently: 4,
        },
      }),
    });

    await app.startAllMicroservices();

    client = app.get<KafkaBatchClient>('KAFKA_BATCH_CLIENT');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should publish event', async () => {
    expect(() => {
      for (let i = 0; i < 100; i++) client.emit('test', { test: `Test ${i}` });
    }).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('should throw error when publish message', (done) => {
    client.send('test', { test: 'Test' }).subscribe({
      next: (d) => {
        console.log(d);
      },
      error: (err) => {
        expect(err.message).toBe(
          'Do not use message pattern with batch processing',
        );
        done();
      },
    });
  });
});
