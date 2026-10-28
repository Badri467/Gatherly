import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlan,validateEvent,demoReply} from './planner.mjs';
const event={name:'Test celebration',type:'Wedding',date:'2027-02-14',budget:500000,guests:100,currency:'INR',location:'Jaipur',theme:'Garden'};
for(const type of ['Wedding','Birthday','Community'])test(type+' has balanced allocations and relative deadlines',()=>{const p=createPlan({...event,type});assert.equal(p.budget.reduce((s,b)=>s+b.allocated,0),event.budget);assert.equal(p.tasks.at(-1).date,event.date);assert.equal(p.tasks[0].date,'2026-12-16');assert.equal(p.budget.at(-1).allocated,50000);assert.equal(p.tasks.every(t=>!t.done),true);});
test('rejects unsafe or incomplete event input',()=>{for(const change of [{budget:-1},{guests:0},{guests:1.5},{type:'Other'},{name:''},{date:'bad'},{date:'2027-02-31'},{currency:'INVALID'}])assert.throws(()=>validateEvent({...event,...change}));});
test('demo advice uses event amounts and pending tasks',()=>{const p=createPlan(event);assert.match(demoReply('budget',event,p),/5,000/);p.tasks[0].done=true;assert.ok(!demoReply('next',event,p).includes(p.tasks[0].title));});
