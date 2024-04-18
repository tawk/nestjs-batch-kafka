/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientKafka, ReadPacket } from '@nestjs/microservices';
import {
	Observable,
	defer,
	mergeMap,
	connectable,
	Subject,
	throwError
} from 'rxjs';
import { InvalidMessageException } from '@nestjs/microservices/errors/invalid-message.exception';
import { isEmpty, isNil } from '@nestjs/common/utils/shared.utils';
import { ProducerBatch } from '@nestjs/microservices/external/kafka.interface';

export type NestjsKafkaBatchTopicMessage<TInput = any> = {
	pattern: any;
	data: TInput[];
}

export class KafkaBatchClient extends ClientKafka {
	protected publish(): () => void {
		throw new Error('Do not use message pattern with batch processing');
	}

	public emitBatch<TResult = any, TInput = any>(
		pattern: any,
		data: { messages: TInput[] },
	): Observable<TResult> {
		if (isNil(pattern) || isNil(data)) {
			return throwError(() => new InvalidMessageException());
		}
		const source = defer(async () => this.connect()).pipe(
			mergeMap(() => this.dispatchBatchEvent({ pattern, data })),
		);
		const connectableSource = connectable(source, {
			connector: () => new Subject(),
			resetOnDisconnect: false,
		});
		connectableSource.connect();
		return connectableSource;
	}

	protected async dispatchBatchEvent<TInput = any>(
		packets: ReadPacket<{ messages: TInput[] }>,
	): Promise<any> {
		if (packets.data.messages.length === 0) {
			return;
		}
		const pattern = this.normalizePattern(packets.pattern);
		const outgoingEvents = await Promise.all(
			packets.data.messages.map(message => {
				return this.serializer.serialize(message as any, { pattern });
			}),
		);

		const message = Object.assign(
			{
				topic: pattern,
				messages: outgoingEvents,
			},
			this.options.send || {},
		);

		return this.producer.send(message);
	}

	public emitBatchTopics<TResult = any, TInput = any>(
		topicMessages: NestjsKafkaBatchTopicMessage<TInput>[],
	): Observable<TResult> {
		if (isNil(topicMessages) || isEmpty(topicMessages)) {
			return throwError(() => new InvalidMessageException());
		}
		const source = defer(async () => this.connect()).pipe(
			mergeMap(() => this.dispatchBatchTopics(topicMessages)),
		);
		const connectableSource = connectable(source, {
			connector: () => new Subject(),
			resetOnDisconnect: false,
		});
		connectableSource.connect();
		return connectableSource;
	}

	protected async dispatchBatchTopics<TInput = any>(
		topicMessages: NestjsKafkaBatchTopicMessage<TInput>[],
	): Promise<any> {

		const serializedTopicMessages = await Promise.all(topicMessages.map(async topicMessage => {
			return {
				topic: this.normalizePattern(topicMessage.pattern),
				messages: await Promise.all(topicMessage.data.map(async message => {
					return this.serializer.serialize(message as any, { pattern: topicMessage.pattern });
				})),
			}
		}))

		const message: ProducerBatch = Object.assign(
			{
				topicMessages: serializedTopicMessages,
			},
			this.options.send || {},
		);

		return this.producer.sendBatch(message)
	}
}
