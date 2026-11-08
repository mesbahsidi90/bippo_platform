import test from 'node:test';
import assert from 'node:assert/strict';
import {firstYearCost} from '../src/comparisonCost.js';
test('comparison includes base, replacements, maintenance and twelve months of incremental digital costs',()=>{
 assert.deepEqual(firstYearCost({devices:'20',unitPrice:'3000',basePrice:'10000',replacements:'2',maintenance:'4000',bippoMonthly:'0',extraInternetMonthly:'500'}),{hardware:80000,digital:6000,difference:74000});
});
test('comparison remains neutral when hardware costs less or totals match',()=>{
 assert.equal(firstYearCost({devices:1,unitPrice:1000,bippoMonthly:100}).difference,-200);
 assert.equal(firstYearCost({devices:1,unitPrice:1200,bippoMonthly:100}).difference,0);
});
test('blank, negative, fractional device counts and non-finite amounts do not produce a savings claim',()=>{
 for(const bad of [{devices:'',unitPrice:100},{devices:1,unitPrice:''},{devices:-1,unitPrice:100},{devices:1.5,unitPrice:100},{devices:1,unitPrice:NaN},{devices:1,unitPrice:Infinity},{devices:1,unitPrice:100,replacements:1.5}])assert.equal(firstYearCost(bad),null);
 assert.equal(firstYearCost({devices:1,unitPrice:0}).difference,0);
});
