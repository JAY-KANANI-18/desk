# AxoDesk Brand And Design System Guidelines

## Do Not Change State Rule

This document was generated from the live codebase. If you change a design token, update this document in the same commit.

Sources used: `package.json`, `tailwind.config.js`, `tailwind.css`, `vite.config.ts`, `src/styles/design-system.css`, `src/components/ui/`, `src/hooks/useIsMobile.ts`, `src/lib/tagAppearance.ts`, and existing `workspace/*.md` notes. The workspace notes did not define additional brand tokens.

## Source Of Truth Notes

- The active shared UI components use `src/styles/design-system.css` variables most heavily.
- `tailwind.css` defines the Tailwind/shadcn-style HSL variables and dark-mode variables used by Tailwind tokens such as `bg-background`, `text-foreground`, `border-border`, and `text-primary-*`.
- There is a live primary-token ambiguity: `src/styles/design-system.css` defines `--color-primary: #4f46e5`, while `tailwind.css` defines `--primary: #6A49F2` and `tailwind.config.js` defines the `primary` scale with `primary.600: #6A49F2`. Do not invent a new color. Prefer the token already used by the component being edited.
- `vite.config.ts` PWA manifest uses `theme_color: #4f46e5` and `background_color: #ffffff`.
- `public/offline.html`, `public/widget.js`, and `widget.js` contain isolated public/offline/widget variables. They are not the shared app design-system tokens and should not be used for application UI.

## Colors

### Application CSS Variables

| Token | Value | Intended Usage |
| --- | --- | --- |
| `--color-primary` | `#4f46e5` | Primary shared-component action, focus, selected, link, tag fallback, spinner accent |
| `--color-primary-hover` | `#4338ca` | Primary hover state and link hover |
| `--color-primary-light` | `#e0e7ff` | Primary soft backgrounds, focus rings, selected surfaces |
| `--color-secondary` | `#64748b` | Secondary/neutral semantic token |
| `--color-success` | `#10b981` | Success state, online/status dot default |
| `--color-warning` | `#f59e0b` | Warning state and SMS channel token |
| `--color-error` | `#ef4444` | Error/destructive validation and destructive actions |
| `--color-info` | `#3b82f6` | Informational tag/status token |
| `--color-channel-whatsapp` | `#25d366` | WhatsApp badge/channel surface |
| `--color-channel-facebook` | `#1877f2` | Facebook badge/channel surface |
| `--color-channel-telegram` | `#229ed9` | Telegram badge/channel surface |
| `--color-channel-email` | `var(--color-primary)` | Email badge/channel surface |
| `--color-channel-sms` | `var(--color-warning)` | SMS badge/channel surface |
| `--color-channel-web` | `var(--color-gray-700)` | Web/webchat badge/channel surface |
| `--color-channel-messenger` | `#0084ff` | Messenger badge/channel surface |
| `--color-channel-gmail` | `#ea4335` | Gmail badge/channel surface |
| `--surface-channel-instagram` | `linear-gradient(135deg, #f58529 0%, #dd2a7b 55%, #8134af 100%)` | Instagram channel badge surface |
| `--color-gray-50` | `#f9fafb` | App background, hover surface, page shell background |
| `--color-gray-100` | `#f3f4f6` | Soft neutral surface, ghost hover, disabled input background |
| `--color-gray-200` | `#e5e7eb` | Borders, dividers, card borders |
| `--color-gray-300` | `#d1d5db` | Input border, disabled/neutral controls |
| `--color-gray-400` | `#9ca3af` | Muted icons, placeholder text, metadata |
| `--color-gray-500` | `#6b7280` | Secondary text and icon tone |
| `--color-gray-600` | `#4b5563` | Tab inactive text and read-only text |
| `--color-gray-700` | `#374151` | Secondary action text, body support text |
| `--color-gray-800` | `#1f2937` | Strong neutral text and tooltip border |
| `--color-gray-900` | `#111827` | Primary text and dark button/tooltip background |

### Tailwind CSS Variables

| Token | Light Value | Dark Value | Intended Usage |
| --- | --- | --- | --- |
| `--background` | `0 0% 100%` | `224 71% 4%` | Tailwind `background` page color |
| `--foreground` | `222.2 47.4% 11.2%` | `213 31% 91%` | Tailwind foreground text color |
| `--muted` | `210 40% 96.1%` | `223 47% 11%` | Muted surface |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215.4 16.3% 56.9%` | Muted text |
| `--popover` | `0 0% 100%` | `224 71% 4%` | Popover surface |
| `--popover-foreground` | `222.2 47.4% 11.2%` | `215 20.2% 65.1%` | Popover text |
| `--border` | `214.3 31.8% 91.4%` | `216 34% 17%` | Tailwind `border` token |
| `--input` | `214.3 31.8% 91.4%` | `216 34% 17%` | Tailwind `input` token |
| `--card` | `transparent` | `transparent` | Tailwind card surface |
| `--card-foreground` | `222.2 47.4% 11.2%` | `213 31% 91%` | Tailwind card text |
| `--primary` | `#6A49F2` | `210 40% 98%` | Tailwind primary token; note light value is hex while dark value is HSL parts |
| `--primary-foreground` | `210 40% 98%` | `222.2 47.4% 1.2%` | Text on primary |
| `--secondary` | `210 40% 96.1%` | `222.2 47.4% 11.2%` | Tailwind secondary token |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | Text on secondary |
| `--accent` | `210 40% 96.1%` | `216 34% 17%` | Accent surface |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | Text on accent |
| `--destructive` | `0 100% 50%` | `0 63% 31%` | Tailwind destructive token |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | Text on destructive |
| `--ring` | `215 20.2% 65.1%` | `216 34% 17%` | Tailwind focus ring |
| `--radius` | `0.5rem` | `0.5rem` | Tailwind radius base |

### Tailwind Primary Scale

| Token | Value | Usage |
| --- | --- | --- |
| `primary.50` | `#F2EEFF` | Light purple surface |
| `primary.100` | `#E4DCFF` | Light purple surface |
| `primary.200` | `#CBB8FF` | Purple border/surface |
| `primary.300` | `#B293FF` | Purple accent |
| `primary.400` | `#9970FF` | Purple accent |
| `primary.500` | `#805CFF` | Purple action/accent |
| `primary.600` | `#6A49F2` | Tailwind primary base |
| `primary.700` | `#5938D6` | Primary hover/deep |
| `primary.800` | `#472BB0` | Deep primary |
| `primary.900` | `#35208A` | Deep primary |
| `primary.950` | `#24155F` | Deepest primary |

### Semantic Mapping

| Role | Token(s) |
| --- | --- |
| Primary action | Shared UI: `--color-primary`; Tailwind primary scale: `primary.600` / `--primary` |
| Secondary action | `--color-gray-700`, `--color-gray-300`, white surface; Tailwind `secondary` |
| Danger/destructive | `--color-error`, Tailwind `destructive` |
| Success | `--color-success` |
| Warning | `--color-warning` plus existing warning oranges in components |
| Neutral/surface | `--color-gray-50`, `--color-gray-100`, white, `--background`, `--card` |
| Text primary | `--color-gray-900`, Tailwind `foreground` |
| Text secondary | `--color-gray-500`, `--color-gray-600`, `--color-gray-700`, Tailwind `muted-foreground` |
| Text disabled | Disabled controls use opacity plus `--color-gray-500` / `--color-gray-600` |
| Border | `--color-gray-200`, `--color-gray-300`, Tailwind `border` |
| Overlay/backdrop | Shared modal overlay `rgb(17 24 39 / 0.48)`; mobile sheet backdrop `bg-slate-950/35` with blur |

## Typography

### Font Families

| Token/Name | Value | Usage |
| --- | --- | --- |
| `--font-family-base` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Body and design-system base |
| `fontFamily.sans` | `ui-sans-serif`, `system-ui`, `sans-serif`, emoji fallbacks | Tailwind default sans |
| `fontFamily.inter` | `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`, emoji fallbacks | Tailwind Inter family |
| `fontFamily.iconfont` | `iconfont`, `ui-sans-serif`, `system-ui`, `sans-serif`, emoji fallbacks | Icon font compatibility |

No mono font token is defined in the live token files.

### Font Sizes

| Token | Value | Intended Use |
| --- | --- | --- |
| `--font-size-xs` | `0.75rem` / 12px | Captions, labels, helper text, compact buttons |
| `--font-size-sm` | `0.875rem` / 14px | Standard controls and body UI text |
| `--font-size-base` | `1rem` / 16px | Body base and large button text |
| `--font-size-lg` | `1.125rem` / 18px | Modal title and larger labels |
| `--font-size-xl` | `1.25rem` / 20px | Small page headings |
| `--font-size-2xl` | `1.5rem` / 24px | Desktop page title (`PageLayout` h1) |
| `--font-size-3xl` | `1.875rem` / 30px | Large display heading |
| `--font-size-4xl` | `2.25rem` / 36px | Largest display heading |

Responsive typography utility behavior in `design-system.css`: below `768px`, `.text-responsive-2xl` becomes `--font-size-xl`, `.text-responsive-3xl` becomes `--font-size-2xl`, and `.text-responsive-4xl` becomes `--font-size-3xl`.

### Font Weights

| Token | Value | Usage |
| --- | --- | --- |
| `--font-weight-normal` | `400` | Body text |
| `--font-weight-medium` | `500` | Buttons, labels, metadata emphasis |
| `--font-weight-semibold` | `600` | Section titles, page title, tags |
| `--font-weight-bold` | `700` | Count badges, strong labels |

### Line Height And Letter Spacing

| Token | Value | Usage |
| --- | --- | --- |
| `--line-height-tight` | `1.25` | Buttons and compact labels |
| `--line-height-normal` | `1.5` | Body, inputs, helper text |
| `--line-height-relaxed` | `1.75` | Relaxed body copy |

No global letter-spacing token is defined. Existing components use explicit tracking utilities for uppercase eyebrow/section labels, such as `tracking-[0.08em]`, `tracking-[0.12em]`, and `tracking-[0.16em]`.

## Spacing

| Token | Value | Intended Use |
| --- | --- | --- |
| `--spacing-xs` | `0.25rem` / 4px | Tight gaps, small helper margins, chip internals |
| `--spacing-sm` | `0.5rem` / 8px | Standard inline gaps, button gap, compact padding |
| `--spacing-md` | `1rem` / 16px | Standard component padding, field gaps |
| `--spacing-lg` | `1.5rem` / 24px | Page padding, modal header/body padding |
| `--spacing-xl` | `2rem` / 32px | Control height math, larger spacing |
| `--spacing-2xl` | `3rem` / 48px | Larger avatar/control sizes and large gaps |

Usage patterns:

- Component internal padding: `--spacing-sm` and `--spacing-md` are the defaults for buttons, inputs, select options, modal controls, and chips.
- Section gaps: `--spacing-md` and `--spacing-lg` are used for modal body grids, page header controls, and panel content.
- Page margins: desktop `PageLayout` uses `--spacing-lg` for content padding and header padding.
- Inline gaps: `--spacing-xs` and `--spacing-sm` are used between icons, labels, chips, breadcrumbs, and toolbar controls.
- Tailwind container config centers containers with `padding: 2rem` and a `2xl` container width of `1400px`.

## Border Radius

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | `0.375rem` / 6px | Checkbox box, compact rounded details |
| `--radius-md` | `0.5rem` / 8px | Buttons, inputs, select dropdowns, tags where not full-pill, square avatars |
| `--radius-lg` | `0.75rem` / 12px | Modal panels, select-card buttons, inset select rows |
| `--radius-xl` | `1rem` / 16px | Larger app surfaces |
| `--radius-full` | `9999px` | Pills, circular avatars, switches, count badges |
| `--radius` | `0.5rem` | Tailwind base radius |

Tailwind config maps `rounded-lg` to `var(--radius)`, `rounded-md` to `calc(var(--radius) - 2px)`, and `rounded-sm` to `calc(var(--radius) - 4px)`.

## Shadows And Elevation

| Token | Value | Elevation Usage |
| --- | --- | --- |
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Cards and subtle framed controls |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Hovered cards and dropdown-style elevation |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Tooltips and elevated surfaces |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Modal and menu overlays |

Live components also contain utility shadows such as `shadow-sm`, `shadow-md`, `shadow-xl`, `ring-black/5`, and mobile sheet shadow `0_-18px_50px_rgba(15,23,42,0.18)`.

## Breakpoints

| Breakpoint | Pixel Value | Live Behavior |
| --- | --- | --- |
| `sm` | `640px` | Design-system responsive button visibility and container max width |
| `md` | `768px` | Main mobile/desktop split; `useIsMobile()` returns true at `max-width: 767px`; `PageLayout` renders children only on mobile and full desktop shell at `768px+` |
| `lg` | `1024px` | Larger container and responsive visibility utilities |
| `xl` | `1280px` | Larger container and responsive visibility utilities |
| `2xl` | `1536px` utility breakpoint; `1400px` Tailwind container screen | Extra-large responsive utilities and Tailwind container cap |

The mobile/desktop split for `useIsMobile` is `768px`: mobile is `0-767px`, desktop is `768px+`.

## Motion And Animation

### Transition Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--transition-fast` | `150ms ease-in-out` | Dropdown and tooltip opacity/transform transitions |
| `--transition-base` | `200ms ease-in-out` | Button/input/card transitions and shared modal fade/transform |
| `--transition-slow` | `300ms ease-in-out` | Available slow transition token |

### Live Motion Patterns

| Interaction | Motion |
| --- | --- |
| Center modal open/close | `opacity var(--transition-base), transform var(--transition-base)` with scale/translate |
| Side modal open/close | `opacity var(--transition-base), transform var(--transition-base)` with horizontal translate |
| Modal overlay | `opacity var(--transition-base)` |
| Mobile sheet | `420ms` bottom-up transform, `cubic-bezier(0.22,1,0.36,1)`, backdrop opacity `420ms ease-out` |
| Select/dropdown menu | `opacity var(--transition-fast), transform var(--transition-fast)` |
| Tooltip | `opacity var(--transition-fast), transform var(--transition-fast)` |
| Toggle switch | Tailwind `duration-200` color/knob transform |
| Accordion utilities | `accordion-down/up 0.2s ease-out` in Tailwind config |
| Call windows | `incomingCallEnter 0.34s cubic-bezier(0.22, 1, 0.36, 1)`, `activeCallEnter 0.28s cubic-bezier(0.22, 1, 0.36, 1)`, ring/pulse/blink keyframes |
| Notifications | `slideInLeft 0.28s cubic-bezier(0.22, 1, 0.36, 1)` and `notifProgress 5.5s linear` |
| Loading spinner | `spin 0.6s linear infinite` |

## Iconography

- Icon library: `lucide-react` (`^0.453.0`).
- Use Lucide icons for buttons, menu actions, fields, tags, status affordances, modal close/back actions, select chevrons, and channel badges where an icon exists.
- `iconfont` exists as a Tailwind font-family and `@font-face`, but the shared UI layer uses Lucide for component icons.

### Standard Icon Sizes

| Component Size | Icon Size |
| --- | --- |
| Button `2xs` | `10px` |
| Button `xs` | `12px` |
| Button `sm` | `14px` |
| Button `md` | `16px` |
| Button `lg` | `18px` |
| Avatar channel badge `2xs` | `6px` |
| Avatar channel badge `xs` / `sm` | `8px` |
| Avatar channel badge `base` / `md` / `lg` | `10px` |
| Avatar channel badge `xl` | `12px` |
| Avatar channel badge `2xl` | `14px` |
| Select chevron `inline` | `13px` |
| Select chevron `pill` / `toolbar` | `14px` |
| Select chevron `field` | `16px` |
| Tag remove icon `sm` | `12px` |
| Tag remove icon `md` | `14px` |
| Shared modal back/close | `18px` |
| Mobile sheet close | `16px` |

Custom icon-like surfaces:

- Avatar channel badge icons are mapped in `src/components/ui/avatar/shared.tsx`.
- `DataTable` uses Lucide sort/action icons internally.
- `TagColorSwatchPicker` uses color circles, not icon glyphs.

## Component Visual Standards

### Button, IconButton, And Button Compatibility Wrapper

Import from `src/components/ui/button` for direct primitives or `src/components/ui/Button` for compatibility.

Visual base: `.btn focus-visible`, inline-flex center alignment, `gap: --spacing-sm`, border `1px solid transparent`, `transition: all --transition-base`, disabled opacity `0.5`, radius default `--radius-md`.

Sizes:

| Size | Height | Padding | Font Size | Icon |
| --- | --- | --- | --- | --- |
| `2xs` | `1.25rem` | `0.125rem 0.375rem` | `0.625rem` | `10px` |
| `xs` | `1.75rem` | `0.25rem 0.625rem` | `--font-size-xs` | `12px` |
| `sm` | `calc(--spacing-xl + --spacing-xs)` | `0.375rem 0.75rem` | `--font-size-xs` | `14px` |
| `md` | `calc(--spacing-xl + --spacing-md)` | `--spacing-sm --spacing-md` | `--font-size-sm` | `16px` |
| `lg` | `calc(--spacing-2xl + --spacing-sm)` | `0.75rem 1.5rem` | `--font-size-base` | `18px` |

Radii: `none: 0`, `default: --radius-md`, `lg: --radius-lg`, `full: --radius-full`.

Variants:

| Variant | Visual Rule |
| --- | --- |
| `primary` | `--color-primary` background/border, white text; hover `--color-primary-hover` |
| `secondary` | white background, `--color-gray-300` border, `--color-gray-700` text; hover `--color-gray-50` |
| `ghost` | transparent, `--color-gray-700`; hover `--color-gray-100` |
| `inherit-ghost` | transparent, inherits text, hover `rgba(148, 163, 184, 0.12)` |
| `unstyled` | no padding, no border, radius `0`, inherits color |
| `list-row` | white row, bottom border `--color-gray-100`, padding `0.75rem 1rem`, selected `#eef2ff` |
| `tab` | transparent, bottom border selected `--color-primary`, selected text `--color-primary`, height `3rem` |
| `select-card` | white card, `--color-gray-200` border; selected uses mixed primary-light and `--color-primary` border |
| `soft` | `--color-gray-100` background, `--color-gray-700` text; hover `--color-gray-200` |
| `soft-primary` | `--color-primary-light` background, `--color-primary` text |
| `soft-warning` | live warning orange surface/text (`#fff7ed`, `#c2410c`, hover `#ffedd5`) |
| `dashed` | white, dashed `--color-gray-300` border, `--color-gray-500`; hover primary-light/primary |
| `inverse-primary` | white background/border, `--color-primary` text; hover primary-light |
| `facebook` | Facebook blue `#1877F2`, hover `#166FE5`, white text |
| `dark` | `--color-gray-900` background/border, white text; hover `--color-gray-700` |
| `danger` | `--color-error` background/border, white text |
| `danger-ghost` | transparent, `--color-error`; hover red alpha surface |
| `success` | `--color-success`, white text |
| `warning` | `--color-warning`, white text |
| `link` | transparent, `--color-primary`, no padding; hover underline and `--color-primary-hover` |

`IconButton` is `Button` with `iconOnly`, a required `aria-label`, and default `variant="ghost"`.

### DisclosureButton

Full-width accordion/disclosure header with `transition-colors`, `focus-visible` primary-light ring, ChevronDown rotation, and `size="sm"` or `md`.

Tones:

- `default`: neutral gray mixed surface, `--color-gray-800` text.
- `primary`: primary-light mixed surface, `--color-primary` text/icon.
- `warning`: live orange warning values (`#fff7ed`, `#ffedd5`, `#fed7aa`, `#c2410c`, `#d97706`).
- `danger`: error mixed surface and error-derived text/icon.

Appearance:

- `surface`: colored bordered row.
- `plain`: transparent row, hover `--color-gray-50`.

### SelectableCard

Wraps `Button variant="select-card"` with `size="lg"`, `radius="lg"`, `fullWidth`, `contentAlign="start"`, and preserved child layout. The indicator is a 20px circular check: selected uses `border-indigo-500 bg-indigo-600 text-white`; unselected uses `border-gray-200 bg-white text-transparent`.

### BaseInput, Input, TextareaInput, And Textarea

Shared field shell label: `text-sm font-medium text --color-gray-700`, required marker `--color-error`, helper/error text `--color-gray-500` or `--color-error`.

Base `.input`: full width, `--spacing-sm --spacing-md` padding, `--font-size-sm`, `--line-height-normal`, white background, `--color-gray-300` border, `--radius-md`, focus border `--color-primary`, focus shadow `0 0 0 3px --color-primary-light`, disabled background `--color-gray-100`.

Sizes:

- `xs`: `0.25rem 0.625rem`, `--font-size-xs`.
- `sm`: `0.375rem 0.75rem`, `--font-size-xs`.
- `md`: base `.input`.
- `lg`: `0.75rem 1rem`, `--font-size-base`.

Appearances:

- `default`: base input.
- `auth`: rounded `2xl`, white, gray border, gray placeholder.
- `toolbar`: rounded-xl slate mobile surface, desktop rounded-lg bordered white.
- `sidebar`: legacy sidebar colors (`#e0e4ed`, `#fafbfc`, `#1c2030`, `#c8cdd8`).
- `inline-edit`: transparent input with bottom border `--color-gray-400`; focus `--color-primary`.
- `composer` / `composer-inline` / `composer-note`: transparent borderless composer fields with compact text sizing and no focus shadow.

`TextareaInput` uses the same field styles, adds `resize-none`, optional auto-resize, optional char count, and default `rows=4`.

### PasswordInput, CopyInput, InlineEditableInput

- `PasswordInput` composes `BaseInput` and uses a right action button with `getActionButtonClassName`; Eye/EyeOff icons are `16px`.
- `CopyInput` composes read-only `BaseInput`, right action button, and copied state. Read-only uses `--color-gray-100` background and `--color-gray-600` text.
- `InlineEditableInput` displays a rounded inline trigger with transparent border, `--spacing-sm --spacing-xs` padding, hover `--color-gray-50`, focus primary-light ring; edit state uses shared input control and round action buttons.

### CheckboxInput, ToggleSwitch, RangeInput, ColorInput

- `CheckboxInput`: hidden native checkbox plus visual box. `sm` is `14px`, `md` is `16px`; checked background/border `--color-primary`, unchecked white with `--color-gray-300`; focus ring `--color-primary-light`.
- `ToggleSwitch`: `sm` track `h-4 w-7`, `md` track `h-5 w-9`; checked track `--color-primary`, unchecked `--color-gray-200`; white knob with `shadow-sm`.
- `RangeInput`: native range styled as `h-2`, rounded-full, `bg-gray-200`, accent `--color-primary`, focus ring `--color-primary-light`.
- `ColorInput`: 40px swatch button with `--radius-md`, border `--color-gray-200` or `--color-error`, dynamic swatch background, paired text input.

### VerificationCodeInput, TagInput, TagColorSwatchPicker

- `VerificationCodeInput`: six-cell default grid, each cell `h-14`, rounded `2xl`, center `text-lg font-semibold`; selected state uses indigo Tailwind colors, invalid state uses red Tailwind colors.
- `TagInput`: wrapped token-entry surface with min height `40px`, `--radius-md`, white background, `--color-gray-200`/`--color-error` border; selected values render with `Tag`; suggestions use ghost `Button` rows inside a `--radius-md` dropdown with `shadow-sm`.
- `TagColorSwatchPicker`: 28px circular swatches, selected scale `110%` and `--color-gray-900` border, focus ring `--color-primary-light`; swatch color is dynamic from provided `hex`.

### Select Components

Shared select controller owns keyboard navigation, outside dismiss, highlighted row state, dropdown presence, and `150ms` opacity/transform animation.

Field trigger matches input styling. Other trigger appearances:

- `pill`: rounded-full, white, `--color-gray-300` border, `--color-gray-700` text, `shadow-sm`.
- `toolbar`: rounded-full transparent trigger, active background `--color-primary-light`, active text `--color-primary`, hover `--color-gray-100`.
- `inline`: borderless rounded-full text trigger, selected `--color-primary`, empty `--color-gray-500`.

Dropdown: absolute panel, `--radius-md`, `--color-gray-200` border, white background, `shadow-md`, z-index `--z-dropdown`.

Option rows: `--spacing-md --spacing-sm` padding, selected/highlighted backgrounds use primary-light or gray surfaces. `surface="inset"` rows use `--radius-lg` and inset margins.

Component-specific rules:

- `BaseSelect`: single-select field list.
- `MultiSelect`: selected options render as `SelectChip` pills; menu header includes clear action.
- `SearchableSelect`: adds shared search input at dropdown top.
- `CompactSelectMenu`: compact grouped dropdown with optional search, leading content, descriptions, selected CheckCircle2, and `pill` trigger by default.
- `SelectWithIconLabel`: field select with leading icon in trigger/options.
- `UserAssignSelect`: field select with `SelectUserAvatar`, clear X action, and optional unassigned row.
- `TagSelect`: grouped multiselect for tag-like values with selected chips.
- `WorkspaceTagSelect`: searchable multiselect, optional selected display below trigger, optional `Tag` rendering, loading spinner, and empty-action row.
- `WorkspaceTagManager`: label row plus add `IconButton`; selected tags render below through `WorkspaceTagSelect`.
- `Select`: compatibility native select wrapper using the same input visual styling.

### Tag, Badge, And CountBadge

`Tag`: inline-flex pill, rounded-full border, font-medium, leading-none, transition-colors. `sm` uses `gap 6px`, `px 10px`, `py 3px`, `text-xs`; `md` uses `--spacing-xs`, `px 3`, `py 1.5`, `text-sm`. Default background color is `tag-indigo`. Presets resolve through `--color-*` variables or `src/lib/tagAppearance.ts`, then render as `rgba(base, 0.12)` background and `rgba(base, 0.22)` border. Remove button is circular and uses current color.

`Badge`: legacy compatibility span with `.badge` base. Variants:

- `primary`: `--color-primary-light` background, `--color-primary` text.
- `success`: `#d1fae5` background, `--color-success` text.
- `warning`: `#fef3c7` background, `--color-warning` text.
- `error`: `#fee2e2` background, `--color-error` text.
- `gray`: `--color-gray-100` background, `--color-gray-700` text.

`CountBadge`: rounded-full, bold, compact numeric badge. Tones: primary `bg-indigo-100 text-indigo-700`, neutral `bg-gray-100 text-gray-500`, warning `bg-orange-100 text-orange-700`, danger `bg-red-100 text-red-700`; compact badges switch to stronger filled colors.

Tag color options from `tagAppearance.ts`: `tag-grey #9ca3af`, `tag-red #f87171`, `tag-orange #fb923c`, `tag-yellow #fbbf24`, `tag-green #4ade80`, `tag-blue #60a5fa`, `tag-indigo #818cf8`, `tag-purple #c084fc`, `tag-pink #f472b6`.

### Avatar Components

`Avatar` is an inline-flex shrink-0 wrapper. Shape `circle` uses `--radius-full`; shape `square` uses `--radius-md`. Fallback tones: `primary` uses `--color-primary-light` and `--color-primary`; `neutral` uses `--color-gray-300` and `--color-gray-900`. Status dot default is `--color-success` with a `--color-gray-50` border.

Sizes:

| Size | Dimension | Font | Status Dot |
| --- | --- | --- | --- |
| `2xs` | `1.25rem` | `0.625rem` | `0.5rem` |
| `xs` | `calc(--spacing-md + --spacing-sm)` | `--font-size-xs` | `--spacing-sm` |
| `sm` | `--spacing-xl` | `--font-size-xs` | `--spacing-sm` |
| `base` | `2.5rem` | `--font-size-sm` | `calc(--spacing-sm + --spacing-xs)` |
| `md` | `--spacing-2xl` | `--font-size-sm` | `calc(--spacing-sm + --spacing-xs)` |
| `lg` | `calc(--spacing-2xl + --spacing-sm)` | `--font-size-base` | `calc(--spacing-sm + --spacing-xs)` |
| `xl` | `calc(--spacing-2xl + --spacing-md)` | `--font-size-lg` | `--spacing-md` |
| `2xl` | `6rem` | `1.875rem` | `calc(--spacing-md + --spacing-xs)` |

`AvatarWithBadge` overlays a channel badge, default placement `overlap`, white `0 0 0 2px` ring, channel colors from avatar shared tokens. `AvatarGroup` overlaps avatars using each size's `overlapOffset` and renders a neutral `+n` overflow circle.

### Tooltip And RichTooltip

`Tooltip` is portal-based, desktop/touch-aware, and disabled on mobile. Default delay is `400ms`; default max width is `280px`. Surface is `--color-gray-900`, border `--color-gray-800`, white text, `--radius-md`, `--spacing-sm` horizontal padding, `shadow-lg`, z-index `--z-tooltip`. Position auto-flips among top, bottom, left, and right with a 10px gap and 12px viewport padding.

`RichTooltip` composes `Tooltip` with optional icon, title, and description. Default max width is `320px`; icon uses `--color-primary-light`, title white, description `--color-gray-200`.

### Modal Components

`CenterModal`, `SideModal`, and `MobileSheet` all use shared focus/Escape/body-lock utilities. Header/footer layout belongs to the shared modal API.

`CenterModal`: max widths `sm 28rem`, `md 36rem`, `lg 48rem`, `xl 64rem`, `fullscreen 100vw/100vh`; white panel, `--color-gray-200` border, `shadow-xl`, radius `--radius-lg` except fullscreen. Open motion scales from `0.97` and translates `8px`.

`SideModal`: default width `480px`, full height, right-side panel with `--radius-lg` on left corners, `shadow-xl`, white surface, `--color-gray-200` border. Open motion translates from `24px`.

`MobileSheet`: mobile-only (`md:hidden`) bottom/fullscreen sheet. Backdrop is slate 950 at 35% with 2px blur. Sheet uses 420ms bottom-up transform; fullscreen mode fills `100dvh`; bottom-sheet mode uses max height `88vh`, min height `42vh`, top radius `28px`, optional borderless mode, handle bar, sticky footer safe-area padding.

`ModalLayout`: grid wrapper with `gap --spacing-md`, padding `sm/md/lg` mapped to spacing tokens, optional two columns at `md+`.

### Layout, Navigation, And Text Utilities

`PageLayout`: desktop-only page shell. Mobile returns children unchanged. Desktop root uses `bg --color-gray-50`; header uses white background, bottom border `--color-gray-200`, `--spacing-lg` horizontal and `--spacing-md` vertical padding. Title is `text-2xl font-semibold --color-gray-900`; eyebrow is uppercase `11px`, `tracking 0.16em`, `--color-gray-400`; subtitle is `--color-gray-500`. Content default padding is `--spacing-lg`.

`Breadcrumb`: inline nav with `--spacing-xs` gaps, ChevronRight separator `--color-gray-400`, active/current text `--color-gray-700`, links/buttons `--color-primary` with `--color-primary-hover` hover and primary-light focus ring.

`TruncatedText`: renders ellipsis/truncation by length or CSS line clamp and wraps desktop-only `Tooltip` when truncation occurs.

### Card, DataTable, And ListPagination

`Card`: `.card` white surface, `--color-gray-200` border, `--radius-lg`, `--spacing-lg` padding, `--shadow-sm`; `hover` adds `--shadow-md` and `translateY(-2px)`.

`DataTable`: desktop table uses white header/body, gray borders/dividers, compact uppercase header labels, row hover gray. Mobile layout uses rounded white cards, slate utility colors, and a custom low elevation shadow. Row action menus are portaled with rounded-xl, white surface, gray border, `shadow-xl`, and `ring-black/5`.

`ListPagination`: desktop footer is white with top border gray-200, compact rounded-lg buttons, active page `bg-indigo-600 text-white`. Mobile uses an intersection-observer sentinel and pill loading/scroll labels with slate utility colors.

## Current Token Gaps To Keep Honest

- Dark mode is defined in `tailwind.css`, but `src/styles/design-system.css` does not define dark equivalents for its `--color-*` variables.
- Several shared components still use Tailwind utility colors or hardcoded hex values for legacy compatibility (`DataTable`, `ListPagination`, `VerificationCodeInput`, warning tones, Facebook blue, MobileSheet slate overlay). Do not copy those values into new surfaces unless the existing component API requires them.
- No global font-size tokens exist for every semantic heading level (`h1` through caption); current heading use is component-specific, especially `PageLayout`.
- No dedicated overlay/backdrop CSS variable exists; modal overlays currently use inline RGB/Tailwind slate values.
