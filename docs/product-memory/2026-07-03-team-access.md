# AiFrogi Team Access

Date: 2026-07-03

## Implemented

- Client Admins can invite team members as Owner, Admin, Agent, or Viewer.
- Invitation links contain random one-time tokens; only SHA-256 token hashes are stored.
- Invitations expire after 72 hours and can be reissued.
- Invited users create personal passwords of at least 10 characters.
- Passwords are stored with scrypt and a random salt.
- Personal accounts authenticate through the normal AiFrogi login route.
- The session records the workspace role so protected client-management routes enforce least privilege.
- Client Admins can update roles, suspend access, and restore accounts.
- The final active Owner cannot be demoted or suspended until another active Owner exists.
- Invitation email uses the configured AiFrogi SMTP mailbox. A secure copyable link remains available when email delivery is unavailable.
- The old shared-credential editor is removed from Client Settings. Existing platform-owner compatibility access remains in place during transition.

## Role Boundaries

- Owner: full client administration and ownership continuity.
- Admin: workspace, team, campaign, automation, knowledge, analytics, and setup management.
- Agent: Today, inbox, contacts, approved knowledge, and support.
- Viewer: operational visibility without management access.
- Super Admin: separate AiFrogi platform command center.

Passwords, invitation tokens, SMTP secrets, and session tokens must never enter Git or product memory.

