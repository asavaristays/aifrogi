import test from 'node:test';
import assert from 'node:assert/strict';
import {robotsAllows} from '../lib/website-review-robots';
test('crawler-specific robots rules override wildcard rules',()=>{
 const robots='User-agent: *\nDisallow: /\n\nUser-agent: AiFrogi-KB-Crawler\nDisallow: /private\nAllow: /private/help';
 assert.equal(robotsAllows(robots,'https://example.com/services'),true);
 assert.equal(robotsAllows(robots,'https://example.com/private/client'),false);
 assert.equal(robotsAllows(robots,'https://example.com/private/help'),true);
});
test('robots combines equivalent groups, wildcard and terminal patterns',()=>{
 const robots='User-agent: *\nDisallow: /*.pdf$\nDisallow: /secret\n\nUser-agent: *\nAllow: /secret/public\nDisallow: /*?token=*';
 assert.equal(robotsAllows(robots,'https://example.com/file.pdf'),false);
 assert.equal(robotsAllows(robots,'https://example.com/file.pdf/article'),true);
 assert.equal(robotsAllows(robots,'https://example.com/secret/public'),true);
 assert.equal(robotsAllows(robots,'https://example.com/help?token=private'),false);
});
test('equal-specificity allow wins; empty disallow allows public discovery',()=>{
 assert.equal(robotsAllows('User-agent: *\nDisallow: /same\nAllow: /same','https://example.com/same'),true);
 assert.equal(robotsAllows('User-agent: *\nDisallow:','https://example.com/help'),true);
});
