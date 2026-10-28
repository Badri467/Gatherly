import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEvent} from './public/validation.js';
import {validateVendor} from './public/event-tools.js';
const event={name:'Community day',type:'Community',date:'2027-02-15',budget:50000,guests:40,currency:'INR'};
test('shared create/edit validation rejects whitespace, impossible dates, fractions and unsupported values',()=>{for(const patch of [{name:'   '},{date:'2027-02-30'},{guests:1.5},{budget:NaN},{currency:'XYZ'},{theme:4}])assert.throws(()=>validateEvent({...event,...patch}));assert.equal(validateEvent({...event,budget:50000.50}).budget,50000.50);});
test('vendor validation rejects invalid dates and unnamed bookings',()=>{const base={quote:100,deposit:50,paid:0};for(const patch of [{depositDue:'2027-02-30'},{balanceDue:'hello'},{status:'Booked',name:' '},{status:'Unknown'}])assert.throws(()=>validateVendor({...base,...patch}));assert.doesNotThrow(()=>validateVendor({...base,status:'Booked',name:'Garden venue'}));});
