"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.System = exports.Component = exports.Entity = exports.Engine = void 0;
var Engine_1 = require("./Engine");
Object.defineProperty(exports, "Engine", { enumerable: true, get: function () { return __importDefault(Engine_1).default; } });
var Entity_1 = require("./Entity");
Object.defineProperty(exports, "Entity", { enumerable: true, get: function () { return __importDefault(Entity_1).default; } });
var Component_1 = require("./Component");
Object.defineProperty(exports, "Component", { enumerable: true, get: function () { return __importDefault(Component_1).default; } });
var System_1 = require("./System");
Object.defineProperty(exports, "System", { enumerable: true, get: function () { return __importDefault(System_1).default; } });
//# sourceMappingURL=index.js.map