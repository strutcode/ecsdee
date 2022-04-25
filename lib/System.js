"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** A single logical unit of work which processes data contained in Components */
class System {
    /** For engine use only */
    constructor(engine) {
        this.engine = engine;
    }
    /** Called once when the System initializes */
    start() { }
    /** Called on every engine tick */
    update() { }
    /** Called before this system is torn down */
    stop() { }
}
exports.default = System;
//# sourceMappingURL=System.js.map