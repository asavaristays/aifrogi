import test from 'node:test';import assert from 'node:assert/strict';
import {guidedPersonas,personaOptions,validPersonaChoices,personaSummary} from '../../lib/demo-sandbox/guided-personas';
for(const slug of Object.keys(guidedPersonas))test(`${slug} has a complete valid journey`,()=>{const s:string[]=[];for(let i=0;i<3;i++)s.push(personaOptions(slug,i,s).find(o=>!o.disabled)!.id);assert.equal(validPersonaChoices(slug,s),true);assert.equal(validPersonaChoices(slug,[...s.slice(0,2),'invented']),false);});
test('stock and delivery totals derive from selections',()=>{assert.equal(validPersonaChoices('showcase-flowcart',['cake','3','delivery']),false);assert.equal(validPersonaChoices('showcase-flowcart',['coffee','1','pickup']),false);assert.match(personaSummary('showcase-flowcart',['cake','2','delivery']),/1899/);});
test('property locations filter matching inventory',()=>{assert.equal(validPersonaChoices('showcase-propertygpt',['porvorim','villa','morning']),false);});
test('custom confirmation remains a request for approval',()=>assert.match(guidedPersonas['showcase-custombot'].outcome,/awaits supervisor approval/));
