# AiFrogi Sovereign Black & Antique Gold Design System

Status: Approved for implementation  
Owner: AiFrogi product team  
Applies to: Public website, authentication, client workspace, Super Admin, onboarding, knowledge, inbox, reports, and partner widgets

## 1. Brand intent

AiFrogi is positioned as a premium **Sovereign Business Bot** platform: each bot owns its approved intelligence, preserves its business data, and acts only within granted authority. The interface must feel controlled, trustworthy, precise, and commercially premium.

The visual language is **black, warm white, and Dark Antique Gold**. Gold is a signature and decision colour—not decoration. Operational state colours keep their conventional meanings so that beauty never reduces clarity or safety.

## 2. Core palette

| Token | Value | Purpose |
| --- | --- | --- |
| `--ink-950` | `#050505` | Public hero backgrounds, highest-emphasis structure |
| `--ink-900` | `#101010` | Navigation, primary text, premium buttons |
| `--ink-800` | `#1C1C1C` | Dark cards and secondary dark surfaces |
| `--ink-700` | `#2B2B2B` | Elevated dark controls |
| `--ink-600` | `#404040` | Secondary text on light surfaces |
| `--gold-700` | `#6D5310` | Accessible gold text on light surfaces |
| `--gold-600` | `#8A6A16` | Dark Antique Gold; primary signature and focus colour |
| `--gold-500` | `#B28728` | Active and hover accents |
| `--gold-400` | `#D4AF37` | Small highlights only |
| `--gold-300` | `#E2C66D` | Borders and highlights on dark surfaces |
| `--gold-100` | `#F3E5B5` | Soft selected states and subtle backgrounds |
| `--warm-50` | `#F7F4ED` | Main operational workspace background |
| `--warm-25` | `#FBFAF7` | Soft cards and input backgrounds |
| `--white` | `#FFFFFF` | Cards and high-clarity surfaces |

## 3. Semantic product tokens

```css
--background: var(--warm-50);
--surface: var(--white);
--surface-soft: var(--warm-25);
--surface-muted: #EEE9DE;
--text: var(--ink-900);
--text-muted: #68645C;
--border: #DED8CB;
--primary: var(--gold-500);
--primary-strong: var(--gold-600);
--primary-soft: #F8F0D8;
--secondary: var(--ink-900);
--secondary-soft: #ECEAE5;
```

Legacy magenta is retired from product UI. During migration, old primary usages map to the new gold tokens; they must not be replaced with arbitrary gold hex values inside components.

## 4. Operational state colours

These colours are semantic and must not be recoloured as gold:

- Success / connected / verified: green
- Warning / pending / attention: amber
- Error / blocked / failed: red
- Information / neutral system guidance: blue or graphite
- Brand action / selection / focus: antique gold

Every state uses text or an icon in addition to colour. Gold never means success.

## 5. Surface strategy

### Public marketing

- Bold black and white composition with restrained gold accents.
- Dark hero or high-contrast opening section is preferred.
- Gold is used for one primary action, short rules, selected proof points, and small premium details.
- Avoid metallic gradients, glow effects, and decorative luxury clichés.

### Authentication

- Black brand panel paired with a warm-white form surface.
- Clear account type and role context.
- Gold primary action with visible keyboard focus and strong contrast.

### Client workspace and Super Admin

- Warm-white canvas for lower eye strain.
- Black navigation establishes structure and authority.
- White cards, graphite text, quiet borders, and subtle shadows.
- Gold indicates the selected navigation item, primary action, or controlled attention.
- Dense operational data remains calm and readable; do not turn the backend into an all-black dashboard.

### Partner widget

- The partner business remains the conversational identity.
- AiFrogi provides the black/gold intelligence frame and a subtle centred `Powered by AiFrogi` attribution.
- The partner may supply photography and a restrained local accent, but accessibility and state meanings remain controlled by AiFrogi.

## 6. Typography

- Product UI: system sans stack for speed, clarity, and multilingual resilience.
- Marketing display: a refined serif may be introduced only for large, short headlines after performance and layout validation.
- Body copy stays sans-serif.
- Eyebrows use small uppercase text with modest tracking; never use gold for long paragraphs.
- Minimum body size: 14px in operational interfaces, 16px for public content and widget conversation text.

## 7. Component rules

### Buttons

- Primary: Dark Antique Gold background with white text; hover uses Antique Gold with ink text where contrast requires it.
- Secondary: black background with white text.
- Surface: white with quiet border and ink text.
- Ghost: transparent with a warm neutral hover.
- Danger: semantic red only.
- Minimum interactive height: 40px; 44px preferred for public and mobile experiences.

### Cards

- Default cards are white with `--border` and a restrained shadow.
- Selected cards use a gold border and pale-gold tint.
- Dark cards are reserved for high-value summaries or public presentation, not ordinary forms.

### Forms

- Warm-white or white fields with ink text.
- Focus uses a 3px Dark Antique Gold outline plus border change.
- Placeholder text must remain readable.
- Validation feedback uses semantic status colours and plain-language text.

### Navigation

- Primary application navigation uses Deep Black.
- Active items use a pale gold treatment on light surfaces or Dark Antique Gold treatment on dark surfaces.
- Icons follow the same semantic token as their label.

### Tables, inbox, and reports

- Use white rows, warm alternating/hover surfaces, graphite metadata, and high-contrast ink values.
- Gold may mark selection or priority but never replaces status colours.
- Conversation ownership and response modes remain explicit: `AI responding`, `Human requested`, `Human joined`, and `Conversation closed`.

## 8. Accessibility and motion

- Target WCAG 2.2 AA: 4.5:1 for normal text and 3:1 for large text and interface boundaries.
- Never use `#B28728`, `#D4AF37`, or lighter gold for small text on white without contrast verification. Use `#6D5310` for gold text on light surfaces.
- All interactive controls have visible `:focus-visible` treatment.
- Information cannot depend on colour alone.
- Respect `prefers-reduced-motion`.
- Animation supports orientation and waiting states; it must not delay work.

## 9. Implementation order

1. Shared palette and semantic CSS tokens
2. Authentication and application shell
3. Dashboard, AI Operations Inbox, and reports
4. Onboarding and intelligence/knowledge management
5. Super Admin
6. Public marketing pages
7. Webtechnosys partner widget
8. Desktop/mobile, keyboard, reduced-motion, and contrast QA

## 10. Release acceptance

- No visible legacy magenta remains on the approved release surfaces.
- All operational states retain correct semantic colours and labels.
- Login, client navigation, Super Admin, onboarding, knowledge, inbox, and widget are usable by keyboard.
- Primary copy and controls meet WCAG AA contrast.
- Desktop and mobile layouts pass visual review.
- Existing end-to-end behaviour and automated tests remain green.
- Deployment has a tagged, recoverable release and verified rollback path.

