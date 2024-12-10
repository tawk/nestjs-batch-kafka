import { IncomingEvent, IncomingRequest } from '@nestjs/microservices';
import { IncomingRequestDeserializer } from '@nestjs/microservices/deserializers/incoming-request.deserializer';
import { KafkaMessage } from 'kafkajs';
export declare class KafkaBatchDeserializer extends IncomingRequestDeserializer {
    mapToSchema(data: KafkaMessage[], options: Record<string, any>): IncomingRequest | IncomingEvent;
}
