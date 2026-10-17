import {registerHooks} from 'node:module';
if(!/^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/p2b_rehearsal_business/.test(process.env.DATABASE_URL||''))throw Error('SYNTHETIC_BUSINESS_DATABASE_REQUIRED');
registerHooks({resolve(specifier,context,next){
 if(specifier.endsWith('/security/public-website-fetch')||specifier.endsWith('/security/public-website-fetch.ts'))return {url:new URL('../tests/helpers/business-crawl-transport.cjs',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}});
