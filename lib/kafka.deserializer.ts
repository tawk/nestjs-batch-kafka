import { IncomingEvent, IncomingRequest } from '@nestjs/microservices';
import { IncomingRequestDeserializer } from '@nestjs/microservices/deserializers/incoming-request.deserializer';
import { KafkaMessage } from 'kafkajs';

export class KafkaBatchDeserializer extends IncomingRequestDeserializer {
  mapToSchema(
    data: KafkaMessage[],
    options: Record<string, any>,
  ): IncomingRequest | IncomingEvent {
    if (!options) {
      return {
        pattern: undefined,
        data: undefined,
      };
    }

    return {
      pattern: options.channel,
      data: data?.map((message) => message.value),
    };
  }
}
