import { Controller, INestApplication } from '@nestjs/common';
import { ClientsModule, Ctx, Payload } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { BatchProcessor, KafkaBatchClient, KafkaBatchContext, KafkaBatchServer } from '../../lib';
import { KafkaMessage } from 'kafkajs';

jest.setTimeout(30000);

@Controller()
export class TestController {

	@BatchProcessor('test-batch-processor')
	async test(
		@Payload() data: KafkaMessage[],
		@Ctx() context: KafkaBatchContext,
	) {
		const heartbeat = context.getHeartbeat();
		const resolveOffset = context.getResolveOffset();
		const commitOffsetsIfNecessary = context.getCommitOffsetsIfNecessary();

		await heartbeat();

		for (const message of data) {
			this.onPayload(message);
		}

		resolveOffset(context.getMessages().at(-1).offset);

		await heartbeat();
		await commitOffsetsIfNecessary();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	onPayload(payload: any) {
		// yes
	}
}


describe('Process Batch', () => {
	let client: KafkaBatchClient;
	let app: INestApplication;
	let controller: TestController;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				ClientsModule.register([
					{
						name: 'KAFKA_BATCH_CLIENT',
						customClass: KafkaBatchClient,
						options: {
							client: {
								brokers: ['localhost:52800', 'localhost:52801'],
							},
							producerOnlyMode: true,
							producer: {
								allowAutoTopicCreation: true
							}
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
					groupId: crypto.randomUUID(),
					heartbeatInterval: 200,
					sessionTimeout: 6000,
					allowAutoTopicCreation: true
				},
				run: {
					autoCommitInterval: 500,
					autoCommitThreshold: 100,
					partitionsConsumedConcurrently: 4,
				},
			}),
		});

		await app.startAllMicroservices();

		client = app.get<KafkaBatchClient>('KAFKA_BATCH_CLIENT');
		controller = app.get(TestController);

	});

	afterAll(async () => {
		await app.close();
	});

	it('should publish event', (done) => {
		const messages = new Array(100).fill(null).map((_, i) => ({ test: `Test ${i}` }));

		for (const message of messages) {
			client.emit('test-batch-processor', message).subscribe()
		}

		let counter = 0
		jest.spyOn(controller, 'onPayload').mockImplementation((payload: unknown) => {
			expect(payload).toEqual(messages[counter]);
			counter += 1;
			if (counter === 100) {
				done()
			}
		})
	});

	it('should throw error when publish message', (done) => {
		client.send('test-batch-processor', { test: 'Test' }).subscribe({
			error: (err) => {
				expect(err.message).toBe(
					'Do not use message pattern with batch processing',
				);
				done();
			},
		});
	});
});
