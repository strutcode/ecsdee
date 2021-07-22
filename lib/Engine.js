"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = __importDefault(require("./Entity"));
let gid = 1;
/** The core class. Responsible for linking together Entities, Components and Systems. */
class Engine {
    constructor() {
        this.entities = new Map();
        this.components = new Map();
        this.systems = [];
        this.nextComponentChanges = {
            created: new Map(),
            updated: new Map(),
            deleted: new Map(),
        };
        this.componentChanges = {
            created: new Map(),
            updated: new Map(),
            deleted: new Map(),
        };
    }
    /** Enables a system in this engine */
    addSystem(type) {
        const system = new type(this);
        system.start();
        this.systems.push(system);
    }
    createEntity(options) {
        var _a, _b;
        const entity = new Entity_1.default();
        // Handle overloads
        const normalizedOptions = Array.isArray(options)
            ? { components: options }
            : options;
        // Set the entity's ID
        entity.id = (_a = normalizedOptions.id) !== null && _a !== void 0 ? _a : gid++;
        // Don't allow entities with the same ID
        if (this.entities.has(entity.id)) {
            throw new Error('Entity ID collision');
        }
        // Record the entity in this engine
        this.entities.set(entity.id, entity);
        // Create and register components
        (_b = normalizedOptions.components) === null || _b === void 0 ? void 0 : _b.forEach((opts) => {
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
                    this.register(this.nextComponentChanges.updated, TypeConstructor, proxy);
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
    destroyEntity(input) {
        // Handle overloads
        const id = input instanceof Entity_1.default ? input.id : input;
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
    getEntities() {
        return [...this.entities.values()];
    }
    /** Returns an entity from its ID */
    getEntity(id) {
        return this.entities.get(id);
    }
    /** Produces a list of every Component of a type across all entities from the prototype. May be an empty array. */
    getAllComponents(type) {
        var _a;
        return ((_a = this.components.get(type)) !== null && _a !== void 0 ? _a : []);
    }
    /** Gets the first component of this prototype in the engine or undefined if none */
    getComponent(type) {
        var _a;
        return ((_a = this.components.get(type)) !== null && _a !== void 0 ? _a : [])[0];
    }
    /** Runs the callback with the specified component as an argument if it exists */
    with(type, callback) {
        const component = this.getComponent(type);
        if (component) {
            callback(component);
        }
    }
    /** Provides an array of created components of a type this tick */
    getCreated(type) {
        var _a;
        return ((_a = this.componentChanges.created.get(type)) !== null && _a !== void 0 ? _a : []);
    }
    /** Provides an array of updated components of a type this tick */
    getUpdated(type) {
        var _a;
        return ((_a = this.componentChanges.updated.get(type)) !== null && _a !== void 0 ? _a : []);
    }
    /** Provides an array of deleted components of a type this tick */
    getDeleted(type) {
        var _a;
        return ((_a = this.componentChanges.deleted.get(type)) !== null && _a !== void 0 ? _a : []);
    }
    /** Iterates components of a given type and runs `callback` with each */
    forEachComponent(type, callback) {
        this.iterate(this.components.get(type), callback);
    }
    /** Iterates components of a given type that were created this tick */
    forEachCreated(type, callback) {
        this.iterate(this.componentChanges.created.get(type), callback);
    }
    /** Iterates components of a given type that were updated this tick */
    forEachUpdated(type, callback) {
        this.iterate(this.componentChanges.updated.get(type), callback);
    }
    /** Iterates components of a given type that were deleted this tick */
    forEachDeleted(type, callback) {
        this.iterate(this.componentChanges.deleted.get(type), callback);
    }
    /** Starts all systems and runs them continuously */
    start() {
        // TODO: Need a better method for this
        setInterval(() => {
            this.update();
        }, 1000 / 30);
    }
    /** Runs on every engine tick */
    update() {
        this.systems.forEach((system) => system.update());
        // Shift changes forward
        this.componentChanges = this.nextComponentChanges;
        // Prep for the next set of changes
        this.nextComponentChanges = {
            created: new Map(),
            updated: new Map(),
            deleted: new Map(),
        };
    }
    /** A fast and safe way to add a component to a map */
    register(collection, key, value) {
        var _a;
        const arr = (_a = collection.get(key)) !== null && _a !== void 0 ? _a : [];
        arr.push(value);
        collection.set(key, arr);
    }
    /** Removes an entry from the component map */
    unregister(collection, key, value) {
        const comps = collection.get(key);
        if (comps) {
            // TODO: Major speed improvement needed here
            collection.set(key, comps.filter((c) => c !== value));
        }
    }
    /** A fast and safe way to run a callback on every entry in a component map */
    iterate(collection, callback) {
        if (!collection)
            return;
        for (let i in collection) {
            callback(collection[i]);
        }
    }
}
exports.default = Engine;
//# sourceMappingURL=Engine.js.map