import { ClientKafka, ReadPacket, WritePacket } from '@nestjs/microservices';

export class KafkaBatchClient extends ClientKafka {
  // @ts-expect-error This method should not be called
  protected publish(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    partialPacket: ReadPacket,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (packet: WritePacket) => any,
  ): Promise<void> {
    throw new Error('Do not use message pattern with batch processing');
  }
}
