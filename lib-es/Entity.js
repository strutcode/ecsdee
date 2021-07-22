/** A simple container for Components to relate them to each other */
export default class Entity {
    id = 0;
    components = new Map();
    /** For engine use only */
    constructor() { }
    /** Produces a list of components on this entity from a prototype. May be empty array. */
    getComponents(type) {
        return (this.components.get(type) ?? []);
    }
    /** Returns the first component of a type on this entity, or undefined */
    getComponent(type) {
        return (this.components.get(type) ?? [])[0];
    }
    /** Returns the first component of a type on this entity or throws an error */
    requireComponent(type) {
        const list = this.components.get(type);
        if (!list || !list.length) {
            throw new Error(`Missing required component ${type.name} on entity #${this.id}`);
        }
        return list[0];
    }
    /** Runs the callback with the specified component as an argument if it exists */
    with(type, callback) {
        const component = this.getComponent(type);
        if (component) {
            callback(component);
        }
    }
}
//# sourceMappingURL=Entity.js.map