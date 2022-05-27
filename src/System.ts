import Engine from './Engine'

/** A single logical unit of work which processes data contained in Components */
export default class System<T extends Engine = Engine> {
  /** For engine use only */
  public constructor(protected engine: T) {}

  /** Called once when the System initializes */
  public start() {}

  /** Called on every engine tick */
  public update() {}

  /** Called before this system is torn down */
  public stop() {}
}
