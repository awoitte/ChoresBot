"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMigrationIndex = exports.getMigrationIndex = exports.Migrations = void 0;
// each query string in the `Migrations` array will be applied once to existing databases.
// The index in the array is used to track which migrations have been performed, therefore:
//
// **DO NOT REMOVE OR RE-ORDER ENTRIES**
exports.Migrations = [];
exports.getMigrationIndex = `
SELECT MAX(index) as index FROM migrations
`;
exports.addMigrationIndex = `
INSERT INTO migrations(index) VALUES ($1)
`;
//# sourceMappingURL=migrations.js.map