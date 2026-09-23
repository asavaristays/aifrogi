# HotelGPT production acceptance checklist

Use this document for the fresh-hotel production acceptance journey. Do not mark an item complete without direct evidence. Record defects separately, fix only confirmed in-scope defects, and repeat every affected check after a deployment.

Production baseline at handoff:

- Repository: `/Users/manishpurohit/Documents/ChatGPT/New project/aifrogi-canonical`
- Working branch: `codex/hotelgpt-instay`
- Completed branch commit: `ff4ad53`
- Production release: `hotelgpt-lifecycle-2a818e6`
- Production VPS: `187.77.188.146`
- PMS integration: none; QR scanning alone must never grant access

Status values: `Pending`, `Passed`, `Failed`, or `Blocked`.

## 1. New hotel signup

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Enter genuine hotel and owner details | Pending | |
| Select HotelGPT during registration | Pending | |
| Confirm Hospitality, country, and timezone | Pending | |
| Submit registration successfully | Pending | |
| Confirm activation email arrives | Pending | |
| Activate the account and create a password | Pending | |
| Sign in successfully | Pending | |

## 2. Hotel onboarding

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Hotel-specific onboarding guidance appears | Pending | |
| Correct hotel and property identity is created | Pending | |
| Add or import verified hotel knowledge | Pending | |
| Configure rooms, amenities, policies, and contact information | Pending | |
| Confirm no PMS or live-booking claims are made | Pending | |
| Configure safe human handover | Pending | |
| Test representative guest questions | Pending | |
| Complete knowledge certification | Pending | |
| Submit the bot for Super Admin review | Pending | |

## 3. Super Admin approval and go-live

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| New tenant appears in Super Admin | Pending | |
| Knowledge and test evidence are visible | Pending | |
| Approve the HotelGPT bot | Pending | |
| Confirm onboarding reaches 100% | Pending | |
| Confirm ordinary HotelGPT becomes live | Pending | |
| Verify existing bots remain unaffected | Pending | |

## 4. Governed in-stay module

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Confirm in-stay access is controlled by `stayAccessEnabled` | Pending | |
| Enable the module explicitly | Pending | |
| Confirm the enablement action is audited | Pending | |
| Confirm the property-specific guest URL is generated | Pending | |
| Generate and inspect the printable property QR | Pending | |
| Confirm disabling the module blocks every stay surface | Pending | |

## 5. QR and guest-access security

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Scan or open the property QR | Pending | |
| Confirm QR scanning alone grants no access | Pending | |
| Submit guest name | Pending | |
| Submit room number | Pending | |
| Submit exact check-in time | Pending | |
| Submit exact checkout time | Pending | |
| Confirm the request remains Pending until staff action | Pending | |
| Confirm another property cannot read or approve the request | Pending | |

## 6. Front-desk workflow

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Request appears in the correct hotel's Team Inbox | Pending | |
| Owner or Admin can approve a valid request | Pending | |
| Approved guest receives a signed stay token | Pending | |
| Token is bound to the correct property and request | Pending | |
| Owner or Admin can reject another request | Pending | |
| Rejected guest receives no stay access | Pending | |
| Manual revocation immediately ends an approved session | Pending | |
| Approval, rejection, and revocation are audited | Pending | |

## 7. In-stay guest experience

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Approved guest can access hotel information | Pending | |
| Guest can ask property-specific questions | Pending | |
| Guest can communicate with the hotel team | Pending | |
| Messages appear in the correct Team Inbox conversation | Pending | |
| Staff replies reach the correct guest session | Pending | |
| No other tenant's knowledge or conversations are exposed | Pending | |
| Bot does not claim PMS-backed room or booking authority | Pending | |

## 8. Checkout expiry

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Access remains valid before the exact checkout time | Pending | |
| Access automatically expires at the exact checkout time | Pending | |
| Expired token cannot access information or messaging | Pending | |
| Refreshing or reopening the QR does not restore access | Pending | |
| A new stay requires a new front-desk-approved request | Pending | |

## 9. Architecture and database evidence

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Production live and readiness health remain green | Pending | |
| `HotelGuestAccessRequest` retains enabled and forced RLS | Pending | |
| Tenant-isolation policy remains active | Pending | |
| Stay sessions remain signed and property-bound | Pending | |
| `stayAccessEnabled` is enforced by public, staff, and resident routes | Pending | |
| Audit records cover all sensitive lifecycle actions | Pending | |
| Existing HotelGPT tenants remain disabled unless explicitly enabled | Pending | |
| Non-HotelGPT bots cannot use the stay module | Pending | |
| PM2 remains stable with no new production errors | Pending | |

## 10. Final acceptance record

| Check | Status | Evidence or defect reference |
| --- | --- | --- |
| Record every verified result | Pending | |
| Clearly separate verified and untested behavior | Pending | |
| Record defects with reproducible steps | Pending | |
| Fix only confirmed in-scope defects | Pending | |
| Run focused tests and a production build for every fix | Pending | |
| Back up and redeploy safely if required | Pending | |
| Repeat affected production checks after deployment | Pending | |
| Record the release and rollback details | Pending | |
| Mark the journey accepted only after every critical check passes | Pending | |

## Defect log

| ID | Severity | Journey step | Reproduction | Expected | Actual | Fix/release | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HG-001 | High | Hotel onboarding · Step 1 business basics | From the authenticated onboarding page, enter the hotel details and choose **Save and continue**. | The current tenant's organization record is updated under forced RLS and the page confirms the save. | Production returned a generic save failure. The server recorded Prisma `P2025` because tenant resolution completed in one transaction and `organization.update()` ran after that tenant context ended. The supplied public-email field also contained a phone number, which was not reported clearly. | Deployed as `hotelgpt-onboarding-4c11bcc`: the complete authenticated onboarding write stays inside `withTenantDatabaseContext`, and the optional public email is validated on both client and server. Rollback: `/var/backups/aifrogi/onboarding-step1-4c11bcc-20260923`. | Pending authenticated retry with a valid public email or a blank field. |

## Final decision

- Acceptance status: `Pending`
- Accepted production release: `Pending`
- Accepted by: `Pending`
- Acceptance date: `Pending`
- Remaining limitations: `Pending`
