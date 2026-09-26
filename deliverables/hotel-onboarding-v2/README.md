# HotelGPT Complete Onboarding Workbook v2

This workbook is the proposed hotel-owned source of truth for HotelGPT onboarding.

It contains exactly ten sheets, within the updated importer safety limit:

1. `Start Here`
2. `Business Profile`
3. `Approved FAQs`
4. `Pre-Stay SOP`
5. `In-Stay SOP`
6. `Tariff & Payment`
7. `Source Register`
8. `Photo Library`
9. `Verification`
10. `Launch Approval`

The first four columns of `Approved FAQs` remain compatible with the current importer. Extra columns introduce stable question/answer IDs, property codes, intents, English typo variants, Hinglish variants, source references, answer versions and website-comparison results. `Tariff & Payment` adds EP, CP, MAP and AP rates, validity, occupancy, inclusions, exclusions, tax, cancellation, refund, no-show/early-departure and official customer-safe payment instructions.

Only tariff rows marked both `Approved` and `Guest-visible` are staged as bot knowledge. `Staff-only` rows remain excluded. The sheet must never contain passwords, OTPs, UPI PINs, card numbers, CVV, API keys or private credentials.

Every standard FAQ contains a topic-specific sample answer for easier completion. Sample text begins with `SAMPLE ANSWER — DO NOT SUBMIT:` so an unchanged sample is skipped by the importer and cannot be mistaken for hotel-approved information.

The 72 standard questions are a launch baseline, not a claim that every hotel is identical. Twenty blank `Custom Hotel FAQ` rows are provided at the end of `Approved FAQs`. Hotels add property-specific questions there, complete the answer/source/property code, and select `Approved`. Blank, sample, Pending and Needs correction rows are not imported. Hotels should use the provided rows rather than inserting or deleting protected workbook structure.

Hotel-facing edit rules:

- Yellow cells are required hotel inputs.
- Blue cells are optional language/variation inputs.
- Green cells are hotel approval or progress fields.
- Grey cells are locked reference/system fields.
- Technical IDs, intents, comparison results and controlled version columns are hidden.
- Sheet protection prevents accidental edits to questions, IDs, flow rules and verification fields. Protection is an editing safeguard, not a security boundary.

The workbook does not auto-publish content. Completed answers still require hotel approval, AiFrogi review, conflict resolution and regression testing.

`Start Here` also contains a visually separate **Advanced Add-ons — Phase 2** registry for Payment Gateway, PMS, CRS/Booking Engine, Channel Manager, POS, accounting/GST, CRM, access control, transport/experience systems and other integrations. This registry is not part of beginner onboarding and does not grant connector authority. Each integration requires its own scoped security review, verification, testing and approval; credentials are exchanged only through a separate secure setup process.

`Photo Library` provides 20 governed media rows for rooms, amenities, experiences, food, exteriors, events and other hotel visuals. A photo is eligible for later publication only when its URL is public HTTPS, `Guest-visible` is Yes, usage rights are confirmed and Hotel approval is Approved. Images never establish availability, tariff, inclusion or operational status by themselves. Broken-link, format, size, duplication and rights checks remain required before publication.

`Source Register` records the evidence owner, effective/expiry dates, approval, version, verification result and conflict history for websites, PDFs, spreadsheets, policies, SOPs, menus and authorised corrections. `Launch Approval` provides fourteen evidence-backed gates covering identity, knowledge, tariff, sources, Pre-Stay, verified In-Stay, privacy/security, media, languages, staff, add-ons, bottom-to-top regression, rollback and final hotel acceptance. These governance tabs are deliberately separate from beginner hotel-data entry.
