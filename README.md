<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Process and Publish Kafka message by batch in NestJS. Cross compatible with `ServerKafka` and `ClientKafka` from `@nestjs/microservices` package.

## Installation

```bash
$ npm i --save @tawkto/nestjs-batch-kafka
```

## Overview
To use the batch kafka consumer, initialize `BatchKafkaServer` in your `main.ts` file by connecting the microservice to your app.
```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
	// The config is the same as the KafkaOptions from the @nestjs/microservices package
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
	})
})
```
Then you can start consuming the events in batches as follow
```typescript
@BatchProcessor('test')
  async test(
    @Payload() data: any[],
    @Ctx() context: KafkaBatchContext,
  ) {
    const heartbeat = context.getHeartbeat();
    const resolveOffset = context.getResolveOffset();
    const commitOffsetsIfNecessary = context.getCommitOffsetsIfNecessary();

    await heartbeat();

    for (const message of data) {
      console.log(message);
    }

    resolveOffset(context.getMessages().at(-1).offset);
    console.log("Batch resolved");

    await heartbeat();
    await commitOffsetsIfNecessary();
  }
```

### Context

The `KafkaBatchContext` object provides the necessary components from `kafkajs`'s  [`EachBatchPayload`](https://kafka.js.org/docs/consuming#a-name-each-batch-a-eachbatch):

<table>
	<tr>
		<th>Method</td>
		<th>Type</th>
		<th>Description</td>
	</tr>
	<tr>
		<td><code>getMessages</code></td>
		<td><code>KafkaMessage[]</code></td>
		<td>Get the raw messages from Kafka in the batch</td>
	</tr>
	<tr>
		<td><code>getConsumer</code></td>
		<td><code>KafkaConsumer</code></td>
		<td>Get the consumer instance</td>
	</tr>
	<tr>
		<td><code>getResolveOffset</code></td>
		<td><code>function</code></td>
		<td>Get the resolve offset method</td>
	</tr>
	<tr>
		<td><code>getHeartbeat</code></td>
		<td><code>function</code></td>
		<td>Get the heartbeat method</td>
	</tr>
	<tr>
		<td><code>getPause</code></td>
		<td><code>function</code></td>
		<td>Get the pause method</td>
	</tr>
	<tr>
		<td><code>getCommitOffsetsIfNecessary</code></td>
		<td><code>function</code></td>
		<td>Get the commit offsets if necessary method</td>
	</tr>
	<tr>
		<td><code>getUncommittedOffsets</code></td>
		<td><code>OffsetsByTopicPartition</code></td>
		<td>Get the uncommitted offsets</td>
	</tr>
	<tr>
		<td><code>getIsRunning</code></td>
		<td><code>boolean</code></td>
		<td>Indicate if the consumer is still running</td>
	</tr>
	<tr>
		<td><code>getIsStale</code></td>
		<td><code>boolean</code></td>
		<td>Indicate if the consumer is stale</td>
	</tr>
</table>


### Client

The `KafkaBatchClient` is exactly the same as the `KafkaClient` from the `@nestjs/microservices` package, except that `client.send` method is removed from the client as batch messages should not be used for `request-response` communication. On top of that, `KafkaBatchClient` also have the capability to [publish batch messages](https://kafka.js.org/docs/producing#producing-messages) or [publish to multiple topics](https://kafka.js.org/docs/producing#producing-to-multiple-topics) just like in `kafkajs`.

```typescript
@Module({
	imports: [
		ClientsModule.register([{
			name: 'KAFKA_BATCH_CLIENT',
			customClass: KafkaBatchClient,
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
		}]),
	],
})
export class AppModule {}
```

Then you can inject and use the `KafkaBatchClient` in your service as follow
```typescript
@Injectable()
export class AppService {
	constructor(
		@Inject('KAFKA_BATCH_CLIENT')
		private kafkaClient: KafkaBatchClient,
	) {}

	async eventToBatch() {
		this.kafkaClient.emit('test', { example: 'data'});
	}

	async publishBatch() {
		// equivalent to kafkajs producer.send
		this.kafkaClient.emitBatch('test', [{
			example: 'data1'
		}, {
			example: 'data2'
		}])
	}

	async publishBatchTopics() {
		// will publish to two topics, topic1 and topic2
		// equivalent to kafkajs producer.publishBatch
		this.kafkaClient.emitBatchTopics([{
			pattern: 'topic1',
			data: [{ example: 'data11' }, { example: 'data12' }]
		}, {
			pattern: 'topic2',
			data: [{ example: 'data21' }, { example: 'data22' }]
		}])
	}
}
```

Calling `send` with the `KafkaBatchClient` will result in an error.
```typescript
this.kafkaClient.send('send', { data: 'data'}); // Error
```
