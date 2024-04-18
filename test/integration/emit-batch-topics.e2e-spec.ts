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
class TestController1 {
	@EventPattern('test-emit-batch-topic1')
	testAssert(@Payload() payload: unknown) {
		this.onPayload(payload);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	onPayload(payload: any) {
		// yes
	}
}

@Controller()
class TestController2 {
	@EventPattern('test-emit-batch-topic2')
	testAssert(@Payload() payload: unknown) {
		this.onPayload(payload);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	onPayload(payload: any) {
		// yes
	}
}

describe('Emit Batch Topic', () => {
	let client: KafkaBatchClient;
	let app: INestApplication;
	let controller1: TestController1;
	let controller2: TestController2;

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
							consumer: {
								groupId: crypto.randomUUID(),
								heartbeatInterval: 200,
								sessionTimeout: 6000,
							},
						},
					},
				]),
			],
			controllers: [TestController1, TestController2],
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
		controller1 = app.get(TestController1);
		controller2 = app.get(TestController2);
	});

	afterAll(async () => {
		await app.close();
	});

	it('should publish events in batch to multiple topics', (done) => {
		const topicMessage1 = {
			pattern: 'test-emit-batch-topic1',
			data: new Array(50).fill(null).map((_, i) => ({ test: `Test 1 ${i}` }))
		}
		const topicMessage2 = {
			pattern: 'test-emit-batch-topic2',
			data: new Array(50).fill(null).map((_, i) => ({ test: `Test 1 ${i}` }))
		}


		let counter1 = 0
		let counter2 = 0
		jest.spyOn(controller1, 'onPayload').mockImplementation((payload: { test: string }) => {
			expect(payload).toEqual(topicMessage1.data[counter1]);
			counter1 += 1;
			if (counter1 + counter2 === 100) {
				done()
			}
		})

		jest.spyOn(controller2, 'onPayload').mockImplementation((payload: { test: string }) => {
			expect(payload).toEqual(topicMessage2.data[counter2]);
			counter2 += 1;
			if (counter1 + counter2 === 100) {
				done()
			}
		})

		client.emitBatchTopics([topicMessage1, topicMessage2]).subscribe()
	});
});
