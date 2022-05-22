import Engine from './Engine';
/** A single logical unit of work which processes data contained in Components */
export default class System<T extends Engine> {
    protected engine: T;
    /** For engine use only */
    constructor(engine: T);
    /** Called once when the System initializes */
    start(): void;
    /** Called on every engine tick */
    update(): void;
    /** Called before this system is torn down */
    stop(): void;
}
