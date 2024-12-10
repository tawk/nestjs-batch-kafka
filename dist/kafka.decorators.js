"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessor = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const BatchProcessor = (event) => {
    return (0, common_1.applyDecorators)((0, microservices_1.EventPattern)(event));
};
exports.BatchProcessor = BatchProcessor;
//# sourceMappingURL=kafka.decorators.js.map