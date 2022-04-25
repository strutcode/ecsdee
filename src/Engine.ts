import Component from "./Component";
import Entity from "./Entity";
import System from "./System";

type CreateEntityOptions = {
  id?: number;
  components?: CreateEntityComponents;
};

type CreateEntityComponents = (
  | [typeof Component, Record<string, any> | undefined]
  | typeof Component
)[];

let gid = 1;

/** The core class. Responsible for linking together Entities, Components and Systems. */
export default class Engine {
  private entities = new Map<number, Entity>();
  private components = new Map<typeof Component, Component[]>();
  private systems: System[] = [];
  private nextComponentChanges = {
    created: new Map<typeof Component, Component[]>(),
    updated: new Map<typeof Component, Component[]>(),
    deleted: new Map<typeof Component, Component[]>(),
  };
  private componentChanges = {
    created: new Map<typeof Component, Component[]>(),
    updated: new Map<typeof Component, Component[]>(),
    deleted: new Map<typeof Component, Component[]>(),
  };
  private lastTime = performance.now();
  private nextTime = this.lastTime;

  public get deltaTime() {
    return this.nextTime - this.lastTime;
  }

  /** Enables a system in this engine */
  public addSystem(type: typeof System) {
    const system = new type(this);
    system.start();
    this.systems.push(system);
  }

  /** Disables a system and asks it to clean up after itself */
  public removeSystem(type: typeof System) {
    const index = this.systems.findIndex((sys) => sys.constructor === type);
    const system = this.systems[index];

    system.stop();

    this.systems.splice(index, 1);
  }

  /** Reloads a system by removing and re-adding it */
  public restartSystem(type: typeof System) {
    this.removeSystem(type);
    this.addSystem(type);
  }

  /** Creates an entity and performs all necessary bookkeeping */
  public createEntity(options: CreateEntityOptions): Entity;
  public createEntity(components: CreateEntityComponents): Entity;
  public createEntity(options: CreateEntityOptions | CreateEntityComponents) {
    const entity = new Entity();

    // Handle overloads
    const normalizedOptions = Array.isArray(options)
      ? { components: options }
      : options;

    // Set the entity's ID
    entity.id = normalizedOptions.id ?? gid++;

    // Don't allow entities with the same ID
    if (this.entities.has(entity.id)) {
      throw new Error("Entity ID collision");
    }

    // Record the entity in this engine
    this.entities.set(entity.id, entity);

    // Create and register components
    normalizedOptions.components?.forEach((opts) => {
      const TypeConstructor = Array.isArray(opts) ? opts[0] : opts;
      const props = Array.isArray(opts) ? opts[1] : {};

      // Construct the component
      const comp = new TypeConstructor(entity);

      // Set initial data
      Object.assign(comp, props);

      // Set up proxy to watch for updates
      const proxy = new Proxy(comp, {
        // Hook all set events for object properties
        set: (t, p, v, r) => {
          // Record the change
          this.register(
            this.nextComponentChanges.updated,
            TypeConstructor,
            proxy
          );

          // Transparent pass through
          return Reflect.set(t, p, v, r);
        },
      });

      // Register the component
      this.register(entity.components, TypeConstructor, proxy);
      this.register(this.components, TypeConstructor, proxy);

      // Record the created event
      this.register(this.nextComponentChanges.created, TypeConstructor, proxy);
    });

    return entity;
  }

  /** Removes and entity and all Components and resources associated with it */
  public destroyEntity(id: number): void;
  public destroyEntity(entity: Entity): void;
  public destroyEntity(input: number | Entity) {
    // Handle overloads
    const id = input instanceof Entity ? input.id : input;
    const entity = this.getEntity(id);

    if (entity) {
      // Unregister each component from the engine
      for (const [type, instances] of entity.components.entries()) {
        instances.forEach((comp) => {
          // Record the deleted event
          this.register(this.nextComponentChanges.deleted, type, comp);

          // Unregister the component
          this.unregister(this.components, type, comp);
        });
      }
    }

    // Unregister the entity
    this.entities.delete(id);
  }

  /** Returns all entities in this engine */
  public getEntities() {
    return [...this.entities.values()];
  }

  /** Returns an entity from its ID */
  public getEntity(id: number) {
    return this.entities.get(id);
  }

  /** Produces a list of every Component of a type across all entities from the prototype. May be an empty array. */
  public getAllComponents<T extends typeof Component>(
    type: T
  ): InstanceType<T>[] {
    return (this.components.get(type) ?? []) as InstanceType<T>[];
  }

  /** Gets the first component of this prototype in the engine or undefined if none */
  public getComponent<T extends typeof Component>(
    type: T
  ): InstanceType<T> | undefined {
    return (this.components.get(type) ?? [])[0] as InstanceType<T> | undefined;
  }

  /** Runs the callback with the specified component as an argument if it exists */
  public with<T extends typeof Component>(
    type: T,
    callback: (component: InstanceType<T>) => void
  ) {
    const component = this.getComponent(type);

    if (component) {
      callback(component);
    }
  }

  /** Provides an array of created components of a type this tick */
  public getCreated<T extends typeof Component>(type: T): InstanceType<T>[] {
    return (this.componentChanges.created.get(type) ?? []) as InstanceType<T>[];
  }

  /** Provides an array of updated components of a type this tick */
  public getUpdated<T extends typeof Component>(type: T): InstanceType<T>[] {
    return (this.componentChanges.updated.get(type) ?? []) as InstanceType<T>[];
  }

  /** Provides an array of deleted components of a type this tick */
  public getDeleted<T extends typeof Component>(type: T): InstanceType<T>[] {
    return (this.componentChanges.deleted.get(type) ?? []) as InstanceType<T>[];
  }

  /** Iterates components of a given type and runs `callback` with each */
  public forEachComponent<T extends typeof Component>(
    type: T,
    callback: (component: InstanceType<T>) => void
  ) {
    this.iterate(this.components.get(type) as InstanceType<T>[], callback);
  }

  /** Iterates components of a given type that were created this tick */
  public forEachCreated<T extends typeof Component>(
    type: T,
    callback: (component: InstanceType<T>) => void
  ) {
    this.iterate(
      this.componentChanges.created.get(type) as InstanceType<T>[],
      callback
    );
  }

  /** Iterates components of a given type that were updated this tick */
  public forEachUpdated<T extends typeof Component>(
    type: T,
    callback: (component: InstanceType<T>) => void
  ) {
    this.iterate(
      this.componentChanges.updated.get(type) as InstanceType<T>[],
      callback
    );
  }

  /** Iterates components of a given type that were deleted this tick */
  public forEachDeleted<T extends typeof Component>(
    type: T,
    callback: (component: InstanceType<T>) => void
  ) {
    this.iterate(
      this.componentChanges.deleted.get(type) as InstanceType<T>[],
      callback
    );
  }

  /** Starts all systems and runs them continuously */
  public start() {
    // TODO: Need a better method for this
    setInterval(() => {
      this.update();
    }, 1000 / 30);
  }

  /** Runs on every engine tick */
  public update() {
    this.nextTime = performance.now();

    this.systems.forEach((system) => system.update());

    // Shift changes forward
    this.componentChanges = this.nextComponentChanges;

    // Prep for the next set of changes
    this.nextComponentChanges = {
      created: new Map<typeof Component, Component[]>(),
      updated: new Map<typeof Component, Component[]>(),
      deleted: new Map<typeof Component, Component[]>(),
    };

    this.lastTime = this.nextTime;
  }

  /** A fast and safe way to add a component to a map */
  private register(
    collection: Map<typeof Component, Component[]>,
    key: typeof Component,
    value: Component
  ) {
    const arr = collection.get(key) ?? [];
    arr.push(value);
    collection.set(key, arr);
  }

  /** Removes an entry from the component map */
  private unregister(
    collection: Map<typeof Component, Component[]>,
    key: typeof Component,
    value: Component
  ) {
    const comps = collection.get(key);

    if (comps) {
      // TODO: Major speed improvement needed here
      collection.set(
        key,
        comps.filter((c) => c !== value)
      );
    }
  }

  /** A fast and safe way to run a callback on every entry in a component map */
  private iterate<T>(collection: T[] | undefined, callback: (item: T) => void) {
    if (!collection) return;

    for (let i in collection) {
      callback(collection[i]);
    }
  }
}
