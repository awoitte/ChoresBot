"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toTitleCase(str) {
    return str
        .split(' ')
        .map((w) => {
        if (w.length > 1) {
            return w[0].toUpperCase() + w.substr(1).toLowerCase();
        }
        else {
            return w.toUpperCase();
        }
    })
        .join(' ');
}
exports.default = toTitleCase;
//# sourceMappingURL=titleCase.js.map