import { Controller, INestApplication } from '@nestjs/common';
import {
	ClientsModule,
	EventPattern,
	MicroserviceOptions,
	Payload,
	Transport
} from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { KafkaBatchClient } from '../../lib';

jest.setTimeout(30000);

@Controller()
class TestController {
	@EventPattern('test-emit-batch')
	testAssert(@Payload() payload: unknown) {
		this.onPayload(payload);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	onPayload(payload: any) {
		// yes
	}
}

describe('Emit Batch', () => {
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
		app.connectMicroservice<MicroserviceOptions>({
			transport: Transport.KAFKA,
			options: {

				client: {
					brokers: ['localhost:52800', 'localhost:52801'],
				},
				consumer: {
					groupId: crypto.randomUUID(),
					heartbeatInterval: 200,
					sessionTimeout: 6000,
					allowAutoTopicCreation: true,
				},
				run: {
					autoCommitInterval: 500,
					autoCommitThreshold: 100,
					partitionsConsumedConcurrently: 4,
				},
			},
		});

		await app.startAllMicroservices();

		client = app.get<KafkaBatchClient>('KAFKA_BATCH_CLIENT');
		controller = app.get(TestController);
	});

	afterAll(async () => {
		await app.close();
	});

	it('should publish events in batch', (done) => {
		const messages = new Array(100).fill(null).map((_, i) => ({ test: `Test ${i}` }));

		let counter = 0
		jest.spyOn(controller, 'onPayload').mockImplementation((payload: { test: string }) => {
			expect(payload).toEqual(messages[counter]);
			counter += 1;
			if (counter === 100) {
				done()
			}
		})

		client.emitBatch('test-emit-batch', { messages }).subscribe();
	});
});
