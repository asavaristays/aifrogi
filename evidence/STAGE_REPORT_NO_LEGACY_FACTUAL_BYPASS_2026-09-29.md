# Stage report: no legacy factual bypass

Date: 2026-09-29  
Scope: canonical website factual selection  
Production state: unchanged

## Implemented

- Canonical website mode does not query the legacy published-claim pointer when no active crawl exists.
- Canonical website mode cannot use cached website snapshots or structured organization fields as an unversioned factual substitute.
- Model failure and output-validation failure cannot fall back to legacy published claim text in canonical mode.
- WhatsApp is explicitly outside the current project scope and was not changed by this stage.
- Greetings, identity, privacy refusal and handover protocol remain available because they are not factual business answers.

## Verification

- TypeScript: PASS.
- P2-B suite: 12/12 PASS.
- Channel suite: 283/283 PASS.
- Production build/deployment: NOT RUN for this stage.

## Artifact hashes

- `website-knowledge-service.ts`: `e842ef67c0e58b836a96aebabbdafd6604353d07579a32d18c8d8c588473f485`
- `whatsapp-service.ts`: `3d0417bd9a586c38fff3f284d5963c8fea822c23b9761207c412d7aed888876a`
- negative bypass test: `fc06166b414d9c55d3dc884c5821049360ad2de772a9b463b8e3175202d135c1`

## Architecture status

KRL-04 remains WORKING FINE, with its scope expanded from the Webtechnosys reference path to isolated canonical website selection. Totals remain 36 Working Fine, 22 Needs Attention, 9 Not Implemented and 7 Not Run.

## Next P0 stage

Enforce and persist a support decision for every material statement in the final answer before delivery.
