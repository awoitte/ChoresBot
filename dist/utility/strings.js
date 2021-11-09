"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bestMatch = exports.toTitleCase = void 0;
const string_similarity_1 = __importDefault(require("string-similarity"));
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
exports.toTitleCase = toTitleCase;
function bestMatch(original, matches) {
    if (matches.length === 0) {
        return undefined;
    }
    return string_similarity_1.default.findBestMatch(original, matches).bestMatch.target;
}
exports.bestMatch = bestMatch;
//# sourceMappingURL=strings.js.map