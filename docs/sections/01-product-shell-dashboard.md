# Section 01: Product Shell And Dashboard

Status: Deployed; awaiting product-owner acceptance
Target score: 8.5/10

## Think

Primary user: a client owner or operations manager opening AiFrogi to understand the day and act quickly.

Primary job: identify time-sensitive work, verify that WhatsApp operations are healthy, and move into the correct workflow without interpreting technical dashboards.

Current weaknesses:

- Repeated white cards create a flat, template-like experience.
- Information has insufficient priority, time sensitivity, and ownership.
- Navigation is a feature list rather than a job-oriented structure.
- Account/workspace identity and connection status feel secondary.
- Performance numbers lack context and do not naturally lead to action.
- The dashboard works, but does not yet feel like a mature operating system.

## Rethink

The first viewport will contain:

1. A concise operational greeting and workspace context.
2. A ranked action queue with cause, urgency, owner, and destination.
3. A compact messaging pulse rather than four equal statistic cards.
4. Recent conversations with clear reply state.
5. A narrow health rail for connection, billing evidence, automation, and support.

Navigation groups:

- Operate: Today, Inbox, Contacts.
- Grow: Campaigns, Workflows, Analytics.
- Manage: Setup, Support, Settings.

## Acceptance Gates

- A first-time client can identify the most important action within three seconds.
- The first desktop viewport contains no more than two dominant framed regions.
- Every displayed metric uses real workspace data.
- Every visible command navigates to a working destination.
- Meta and billing language explains impact without exposing implementation jargon.
- Connected, disconnected, empty, warning, and healthy states are renderable and understandable.
- No horizontal overflow at 390px, 768px, 1024px, and 1440px widths.
- Keyboard focus is visible and headings preserve a logical hierarchy.
- Typecheck and production build pass.
- Production PM2 is healthy after deployment.
- Product owner rating is at least 8.5/10 before Section 02 begins.

## Implemented

- Replaced the flat card dashboard with an operational greeting, ranked action queue, compact messaging pulse, conversation workspace, and account-health rail.
- Revised the typography to a simpler product-system style based on the `Today` menu item weight rather than heavy uppercase labels.
- Added three colored dashboard direction lanes: `Reply`, `Reach`, and `Reliability`.
- Reworked analytics from scattered KPI cards into one recommendation-led view with colored health cards, progress bars, and a summary rail.
- Grouped navigation by `Operate`, `Grow`, and `Manage` jobs.
- Reframed navigation groups as visible product sections with helper labels so the menu hierarchy reads as a system.
- Made desktop navigation visible by default and mobile navigation explicitly controlled.
- Added workspace identity, WhatsApp connection state, and a compact account footer.
- Added real-data ownership labels to actions: `You`, `AiFrogi`, and `Meta`.
- Added healthy, warning, empty, and disconnected dashboard states through one reusable view.
- Added dashboard loading and recoverable error experiences.
- Preserved real production metrics and destinations; no decorative controls were introduced.

## Test Evidence

- TypeScript typecheck: passed.
- ESLint: passed with no new warnings; existing repository warnings remain.
- Local production build: passed.
- Production build: passed.
- Responsive overflow checks passed at 390px, 768px, 1024px, and 1440px.
- Warning state: ranked reply and campaign actions visible.
- Healthy state: `Messaging is operating normally` and `All systems normal` visible.
- Empty state: first-test guidance and a dedicated conversation empty state visible.
- Disconnected state: setup action and account-health warning visible.
- Mobile navigation opens with all job groups visible and the close control clear of the brand.
- Production PM2: online with zero unstable restarts after deployment.
- Production data remained intact: 1 organization, 25 leads, 87 messages, and 1 live onboarding profile at verification time.
- Revision visual QA passed for dashboard preview at desktop width: no horizontal overflow and direction cards visible.
- Revision visual QA passed for analytics preview at desktop width: one recommendation, three graphical health cards, and summary rail visible.
- Revision mobile QA passed at 390px viewport for dashboard and analytics: no horizontal overflow.
- Visual polish revision: Apple-first font stack, warmer background, softer dashboard hero, friendlier card shadows, rounded graphical direction cards, and calmer pulse metrics.

## Achieve Gate

Engineering gates are complete. Product-owner live review and rating remain required. Section 02 must not begin until this section is accepted at 8.5/10 or the remaining feedback is implemented and retested.
