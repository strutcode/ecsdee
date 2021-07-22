"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** A simple container for Components to relate them to each other */
class Entity {
    /** For engine use only */
    constructor() {
        this.id = 0;
        this.components = new Map();
    }
    /** Produces a list of components on this entity from a prototype. May be empty array. */
    getComponents(type) {
        var _a;
        return ((_a = this.components.get(type)) !== null && _a !== void 0 ? _a : []);
    }
    /** Returns the first component of a type on this entity, or undefined */
    getComponent(type) {
        var _a;
        return ((_a = this.components.get(type)) !== null && _a !== void 0 ? _a : [])[0];
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
exports.default = Entity;
//# sourceMappingURL=Entity.js.map