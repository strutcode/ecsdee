import Entity from "./Entity";
let gid = 1;
/** The core class. Responsible for linking together Entities, Components and Systems. */
export default class Engine {
    entities = new Map();
    components = new Map();
    systems = [];
    nextComponentChanges = {
        created: new Map(),
        updated: new Map(),
        deleted: new Map(),
    };
    componentChanges = {
        created: new Map(),
        updated: new Map(),
        deleted: new Map(),
    };
    systemChanges = new Map();
    activeSystem;
    lastTime = performance.now();
    nextTime = this.lastTime;
    get deltaTime() {
        return this.nextTime - this.lastTime;
    }
    /** Enables a system in this engine */
    addSystem(type, options) {
        const opts = {
            existingAsCreated: true,
            ...options
        };
        const system = new type(this);
        if (opts.existingAsCreated) {
            this.systemChanges.set(type, {
                created: new Map(this.components)
            });
        }
        system.start();
        this.systems.push(system);
    }
    /** Disables a system and asks it to clean up after itself */
    removeSystem(type) {
        const index = this.systems.findIndex((sys) => sys.constructor.name === type.name);
        const system = this.systems[index];
        system.stop();
        this.systems.splice(index, 1);
    }
    /** Reloads a system by removing and re-adding it */
    restartSystem(type) {
        this.removeSystem(type);
        this.addSystem(type);
    }
    createEntity(options) {
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
            this.addComponent(entity, TypeConstructor, props);
        });
        return entity;
    }
    destroyEntity(input) {
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
    getEntities() {
        return [...this.entities.values()];
    }
    /** Returns an entity from its ID */
    getEntity(id) {
        if (id) {
            return this.entities.get(id);
        }
        return undefined;
    }
    /** Produces a list of every Component of a type across all entities from the prototype. May be an empty array. */
    getAllComponents(type) {
        return (this.components.get(type) ?? []);
    }
    /** Gets the first component of this prototype in the engine or undefined if none */
    getComponent(type) {
        return (this.components.get(type) ?? [])[0];
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
        if (this.activeSystem) {
            const systemChanges = this.systemChanges.get(this.activeSystem)?.created ?? [];
            const standardChanges = this.componentChanges.created.get(type) ?? [];
            return [...systemChanges, ...standardChanges];
        }
        return (this.componentChanges.created.get(type) ?? []);
    }
    /** Provides an array of updated components of a type this tick */
    getUpdated(type) {
        return (this.componentChanges.updated.get(type) ?? []);
    }
    /** Provides an array of deleted components of a type this tick */
    getDeleted(type) {
        return (this.componentChanges.deleted.get(type) ?? []);
    }
    /** Iterates components of a given type and runs `callback` with each */
    forEachComponent(type, callback) {
        this.iterate(this.components.get(type), callback);
    }
    /** Iterates components of a given type that were created this tick */
    forEachCreated(type, callback) {
        if (this.activeSystem) {
            const changes = this.systemChanges.get(this.activeSystem);
            if (changes) {
                this.iterate(changes.created.get(type), callback);
            }
        }
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
    addComponent(entity, type, props = {}) {
        // Construct the component
        const comp = new type(entity);
        // Set initial data
        Object.assign(comp, props);
        // Set up proxy to watch for updates
        const proxy = new Proxy(comp, {
            // Hook all set events for object properties
            set: (t, p, v, r) => {
                // Record the change
                this.register(this.nextComponentChanges.updated, type, proxy);
                // Transparent pass through
                return Reflect.set(t, p, v, r);
            },
        });
        // Register the component
        this.register(entity.components, type, proxy);
        this.register(this.components, type, proxy);
        // Record the created event
        this.register(this.nextComponentChanges.created, type, proxy);
    }
    addComponents(entity, components) {
        components.forEach(entry => {
            if (Array.isArray(entry)) {
                this.addComponent(entity, entry[0], entry[1]);
            }
            else {
                this.addComponent(entity, entry);
            }
        });
    }
    removeComponents(entity, type) {
        entity.getComponents(type).forEach((comp) => {
            // Record the deleted event
            this.register(this.nextComponentChanges.deleted, type, comp);
            // Unregister the component
            this.unregister(this.components, type, comp);
        });
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
        this.nextTime = performance.now();
        this.systems.forEach((system) => {
            this.activeSystem = system.constructor;
            system.update();
        });
        // Shift changes forward
        this.componentChanges = this.nextComponentChanges;
        // Prep for the next set of changes
        this.nextComponentChanges = {
            created: new Map(),
            updated: new Map(),
            deleted: new Map(),
        };
        this.lastTime = this.nextTime;
    }
    /** A fast and safe way to add a component to a map */
    register(collection, key, value) {
        const arr = collection.get(key) ?? [];
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
//# sourceMappingURL=Engine.js.map