"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const time_1 = require("./time");
const time_2 = require("../models/time");
(0, mocha_1.describe)('Frequency parsing algorithm', () => {
    it('should parse weekly', () => {
        let frequency = (0, time_1.parseFrequency)('weekly @ wednesday');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Weekly') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.weekday).to.equal('wednesday');
        frequency = (0, time_1.parseFrequency)('Weekly @ friday');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Weekly') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.weekday).to.equal('friday');
    });
    it('should parse daily', () => {
        let frequency = (0, time_1.parseFrequency)('daily @ 9:00');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.time.getHours()).to.equal(9);
        (0, chai_1.expect)(frequency.time.getMinutes()).to.equal(0);
        frequency = (0, time_1.parseFrequency)('daily @ 9:00 PM');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.time.getHours()).to.equal(21);
        (0, chai_1.expect)(frequency.time.getMinutes()).to.equal(0);
        frequency = (0, time_1.parseFrequency)('daily @ 9:00 AM');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.time.getHours()).to.equal(9);
        (0, chai_1.expect)(frequency.time.getMinutes()).to.equal(0);
        frequency = (0, time_1.parseFrequency)('daily @ 12');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.time.getHours()).to.equal(12);
        (0, chai_1.expect)(frequency.time.getMinutes()).to.equal(0);
        frequency = (0, time_1.parseFrequency)('daily @ 12:25');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.time.getHours()).to.equal(12);
        (0, chai_1.expect)(frequency.time.getMinutes()).to.equal(25);
    });
    it('should parse once', () => {
        const now = new Date();
        let frequency = (0, time_1.parseFrequency)('once @ Nov 10 9:00 PM');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.date.getMonth()).to.equal(time_2.Months.indexOf('november'));
        (0, chai_1.expect)(frequency.date.getDate()).to.equal(10);
        (0, chai_1.expect)(frequency.date.getHours()).to.equal(21);
        (0, chai_1.expect)(frequency.date.getMinutes()).to.equal(0);
        (0, chai_1.expect)(frequency.date.getFullYear()).to.equal(now.getFullYear());
        frequency = (0, time_1.parseFrequency)('once @ Sept 11');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.date.getMonth()).to.equal(time_2.Months.indexOf('september'));
        (0, chai_1.expect)(frequency.date.getDate()).to.equal(11);
        // time of day irrelevant
        (0, chai_1.expect)(frequency.date.getFullYear()).to.equal(now.getFullYear());
        frequency = (0, time_1.parseFrequency)('OnCe @ 5');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.date.getMonth()).to.equal(now.getMonth());
        (0, chai_1.expect)(frequency.date.getDate()).to.equal(now.getDate());
        (0, chai_1.expect)(frequency.date.getHours()).to.equal(5);
        (0, chai_1.expect)(frequency.date.getMinutes()).to.equal(0);
        (0, chai_1.expect)(frequency.date.getFullYear()).to.equal(now.getFullYear());
        frequency = (0, time_1.parseFrequency)('ONCE @ 5PM');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.date.getMonth()).to.equal(now.getMonth());
        (0, chai_1.expect)(frequency.date.getDate()).to.equal(now.getDate());
        (0, chai_1.expect)(frequency.date.getHours()).to.equal(17);
        (0, chai_1.expect)(frequency.date.getMinutes()).to.equal(0);
        (0, chai_1.expect)(frequency.date.getFullYear()).to.equal(now.getFullYear());
        frequency = (0, time_1.parseFrequency)('once @ 12:25');
        if (frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once') {
            throw new Error('incorrect frequency');
        }
        (0, chai_1.expect)(frequency.date.getMonth()).to.equal(now.getMonth());
        (0, chai_1.expect)(frequency.date.getDate()).to.equal(now.getDate());
        (0, chai_1.expect)(frequency.date.getHours()).to.equal(12);
        (0, chai_1.expect)(frequency.date.getMinutes()).to.equal(25);
        (0, chai_1.expect)(frequency.date.getFullYear()).to.equal(now.getFullYear());
    });
});
//# sourceMappingURL=time.spec.js.map