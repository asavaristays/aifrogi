# Requested-part binding correction

The shared claim-relation guard previously added a missing-information message for every rejected relation, including optional promises the visitor never requested. A supported capability answer could therefore acquire an unrelated uncertainty statement.

The guard now removes rejected optional claims without inventing an unanswered request. It retains a missing relation for explicitly requested commitments or per-unit quantities. If all claims are rejected and there is no supported requested part, it fails safely rather than returning an empty complete answer. This remains the existing shared engine; no business content or second answering path was added.

Validation: 847/847 regression tests, TypeScript passed, 13/13 isolated failure scenarios. New behavioural tests verify that an optional promise is omitted without false uncertainty and that an explicitly requested unsupported promise still remains unresolved. The earlier frozen 30-question evidence belongs to candidate dc6eeb7 and is not a result for this correction.

Production remains unchanged. This correction has not been copied to the server, built as a new candidate or deployed. Remaining work includes pricing-policy completeness, NDA/package details, platform completeness and source-statement binding. The complete unchanged candidate gate must run again before any deployment. This correction is the first bounded step beyond the failed candidate, not a claim that all answer-quality defects are resolved.
