import Component from "./Component";
import Entity from "./Entity";
import System from "./System";
declare type CreateEntityOptions = {
    id?: number;
    components?: CreateEntityComponents;
};
declare type CreateEntityComponents = ([typeof Component, Record<string, any> | undefined] | typeof Component)[];
/** The core class. Responsible for linking together Entities, Components and Systems. */
export default class Engine {
    private entities;
    private components;
    private systems;
    private nextComponentChanges;
    private componentChanges;
    private lastTime;
    private nextTime;
    get deltaTime(): number;
    /** Enables a system in this engine */
    addSystem(type: typeof System): void;
    /** Disables a system and asks it to clean up after itself */
    removeSystem(type: typeof System): void;
    /** Reloads a system by removing and re-adding it */
    restartSystem(type: typeof System): void;
    /** Creates an entity and performs all necessary bookkeeping */
    createEntity(options: CreateEntityOptions): Entity;
    createEntity(components: CreateEntityComponents): Entity;
    /** Removes and entity and all Components and resources associated with it */
    destroyEntity(id: number): void;
    destroyEntity(entity: Entity): void;
    /** Returns all entities in this engine */
    getEntities(): Entity[];
    /** Returns an entity from its ID */
    getEntity(id: number | null | undefined): Entity | undefined;
    /** Produces a list of every Component of a type across all entities from the prototype. May be an empty array. */
    getAllComponents<T extends typeof Component>(type: T): InstanceType<T>[];
    /** Gets the first component of this prototype in the engine or undefined if none */
    getComponent<T extends typeof Component>(type: T): InstanceType<T> | undefined;
    /** Runs the callback with the specified component as an argument if it exists */
    with<T extends typeof Component>(type: T, callback: (component: InstanceType<T>) => void): void;
    /** Provides an array of created components of a type this tick */
    getCreated<T extends typeof Component>(type: T): InstanceType<T>[];
    /** Provides an array of updated components of a type this tick */
    getUpdated<T extends typeof Component>(type: T): InstanceType<T>[];
    /** Provides an array of deleted components of a type this tick */
    getDeleted<T extends typeof Component>(type: T): InstanceType<T>[];
    /** Iterates components of a given type and runs `callback` with each */
    forEachComponent<T extends typeof Component>(type: T, callback: (component: InstanceType<T>) => void): void;
    /** Iterates components of a given type that were created this tick */
    forEachCreated<T extends typeof Component>(type: T, callback: (component: InstanceType<T>) => void): void;
    /** Iterates components of a given type that were updated this tick */
    forEachUpdated<T extends typeof Component>(type: T, callback: (component: InstanceType<T>) => void): void;
    /** Iterates components of a given type that were deleted this tick */
    forEachDeleted<T extends typeof Component>(type: T, callback: (component: InstanceType<T>) => void): void;
    /** Starts all systems and runs them continuously */
    start(): void;
    /** Runs on every engine tick */
    update(): void;
    /** A fast and safe way to add a component to a map */
    private register;
    /** Removes an entry from the component map */
    private unregister;
    /** A fast and safe way to run a callback on every entry in a component map */
    private iterate;
}
export {};
