# Experience AiFrogi - 6 September 2026

## Audio revision: music instead of narration

At the user's request, device voiceover and narration scripts are removed. An original Web Audio ambient chord motif supports playback; short two-note cues accompany chapter changes. Sound remains off until explicitly enabled. Pause fades the background bed, mute silences both layers, leaving the tab mutes the output and pauses playback, and unmount closes the audio context. No third-party music files, licensing dependencies or audio network requests are introduced.

TypeScript and 463/463 core tests passed, including mocked audio lifecycle/envelope tests and absence of speech synthesis. These are implementation checks, not listening tests on every phone/browser. The original delivery notes below describe the superseded voiceover version.

Published `experience-music-20260906` at 2026-09-06T05:30:41.943Z; backup `/var/backups/aifrogi/experience-music-20260906.AgGYjf`. Public health matched and the live page exposed music controls without the former narration control.

## Scope delivered

Public `/experience`: mobile-first interactive presentation using existing black/white/gold branding and mascot. Eight chapters total 60 seconds: introduction, example appointment, bot family, onboarding/improvement, connectors, human control/security, pricing, contact/demo/trial links. Linked from homepage and AI Bot menu; added to sitemap.

Playback starts only on request. Pause/play/replay, chapter buttons, previous/next, horizontal swipe, native sharing or copy-link fallback. Optional device speech synthesis, silent by default; voices depend on the device. Leaving the tab pauses the story. Reduced-motion preference removes animation. Short screens can scroll their chapter rather than clipping its content.

The booking example is explicitly simulated: no API requests, real appointments, payments or customer records. Category demos use existing showcase URLs. No certifications or accuracy claims are added. Published trial/Starter prices are reused, with separate connector/provider fees and usage-limit caveats. Existing operational routes and entitlements are unchanged.

## Verification and limitations

TypeScript and diff checks passed. Core regression 460/460, including story duration/chapter boundaries, eight distinct showcase slugs and source-contract checks for playback safety. Local preview compiled and responded HTTP 200. No browser visual or interaction acceptance is claimed. Narration is a device voice, not a recorded studio voiceover; this is a web presentation, not a downloadable video or bespoke 3D film.

Initial release `experience-20260906` published at 2026-09-06T05:22:33.311Z; backup `/var/backups/aifrogi/experience-20260906.76v6lc`. Follow-up `experience-controls-20260906` at 2026-09-06T05:24:10.849Z ensures changing an example slot requires fresh confirmation and restarting clears the prior demo result. Backup `/var/backups/aifrogi/experience-controls-20260906.KjI5XA`. Focused 3/3 tests and TypeScript rechecked after this correction.

Public experience, homepage and mascot responded 200; all eight showcase destinations responded 200 without sending messages. Final health matches the release; homepage entry verified. These reachability checks do not imply full demo-journey or device narration acceptance.
