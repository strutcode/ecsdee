import Component from './Component';
/** A simple container for Components to relate them to each other */
export default class Entity {
    id: number;
    components: Map<typeof Component, Component[]>;
    /** For engine use only */
    constructor();
    /** Produces a list of components on this entity from a prototype. May be empty array. */
    getComponents<T extends typeof Component>(type: T): InstanceType<T>[];
    /** Returns the first component of a type on this entity, or undefined */
    getComponent<T extends typeof Component>(type: T): InstanceType<T> | undefined;
    /** Returns the first component of a type on this entity or throws an error */
    requireComponent<T extends typeof Component>(type: T): InstanceType<T>;
    /** Runs the callback with the specified component as an argument if it exists */
    with<T extends typeof Component>(type: T, callback: (component: InstanceType<T>) => void): void;
}
