"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaBatchContext = void 0;
const microservices_1 = require("@nestjs/microservices");
class KafkaBatchContext extends microservices_1.BaseRpcContext {
    constructor(args) {
        super(args);
    }
    getMessages() {
        return this.getArgByIndex(0);
    }
    getConsumer() {
        return this.getArgByIndex(1);
    }
    getResolveOffset() {
        return this.getArgByIndex(2);
    }
    getHeartbeat() {
        return this.getArgByIndex(3);
    }
    getPause() {
        return this.getArgByIndex(4);
    }
    getCommitOffsetsIfNecessary() {
        return this.getArgByIndex(5);
    }
    getUncommittedOffsets() {
        return this.getArgByIndex(6)();
    }
    getIsRunning() {
        return this.getArgByIndex(7)();
    }
    getIsStale() {
        return this.getArgByIndex(8)();
    }
}
exports.KafkaBatchContext = KafkaBatchContext;
//# sourceMappingURL=kafka.context.js.map