// Unit tests run outside Next.js; this marker has no runtime behaviour.
// Production bundling still resolves Next.js's server-only boundary normally.
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return {url:new URL('../tests/helpers/server-only.cjs',import.meta.url).href,shortCircuit:true};
  return nextResolve(specifier, context);
}});
