/** A single logical unit of work which processes data contained in Components */
export default class System {
    engine;
    /** For engine use only */
    constructor(engine) {
        this.engine = engine;
    }
    /** Called once when the System initializes */
    start() { }
    /** Called on every engine tick */
    update() { }
}
//# sourceMappingURL=System.js.map