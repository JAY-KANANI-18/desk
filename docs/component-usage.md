# AxoDesk Component Usage Guide

Before writing any new UI element, check this file first. If a shared component exists for the job, use it. Do not create a new component if one already exists here.

This guide was generated from `src/components/ui/`. Root-level files such as `src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Toggle.tsx`, `Modal.tsx`, `Avatar.tsx`, `Tooltip.tsx`, `Breadcrumb.tsx`, `PageLayout.tsx`, and `TruncatedText.tsx` are compatibility paths. Prefer folder barrels for new work when available, but keep existing root imports stable unless the task is an import cleanup.

## Button

Import path: `src/components/ui/button` or compatibility path `src/components/ui/Button`.

Use it for every visible button, action row, tab, selectable card trigger, link-style action, and loading action.

Do not use it for icon-only controls where `IconButton` gives clearer semantics, or for native file picker inputs.

Props:

- `variant?: "primary" | "secondary" | "ghost" | "inherit-ghost" | "unstyled" | "list-row" | "tab" | "select-card" | "soft" | "soft-primary" | "soft-warning" | "dashed" | "inverse-primary" | "facebook" | "dark" | "danger" | "danger-ghost" | "link" | "success" | "warning"`; default `"primary"`; controls visual tone.
- `selected?: boolean`; default `false`; applies selected styling for select-card, tab, and list-row variants.
- `size?: "2xs" | "xs" | "sm" | "md" | "lg"`; default `"md"`; controls height, padding, font size, and icon size.
- `leftIcon?: React.ReactNode`; default `undefined`; renders an icon before children.
- `rightIcon?: React.ReactNode`; default `undefined`; renders an icon after children.
- `iconOnly?: boolean`; default `false`; renders a square icon button shape.
- `loading?: boolean`; default `false`; disables the button and shows a spinner.
- `loadingLabel?: React.ReactNode`; default `children`; label used when `loadingMode="inline"`.
- `loadingMode?: "overlay" | "inline"`; default `"overlay"`; controls spinner placement.
- `fullWidth?: boolean`; default `false`; stretches the button to full width.
- `radius?: "none" | "default" | "lg" | "full"`; default `"default"`; controls border radius.
- `contentAlign?: "center" | "start"`; default `"center"`; aligns content.
- `preserveChildLayout?: boolean`; default `false`; keeps custom child layout untouched.
- `type?: "button" | "submit" | "reset"`; default `"button"`; button type.
- `isLoading?: boolean`; default `false`; compatibility alias on root `src/components/ui/Button`.
- Native button attributes are also accepted except the native `type` shape is narrowed.

Minimal:

```tsx
import { Button } from "@/components/ui/button";

<Button onClick={save}>Save</Button>
```

Advanced:

```tsx
<Button
  variant="list-row"
  selected={isSelected}
  fullWidth
  contentAlign="start"
  preserveChildLayout
  loading={isSaving}
  loadingMode="inline"
>
  <span className="flex min-w-0 flex-col text-left">
    <span className="font-medium">Assign to team</span>
    <span className="text-xs text-[var(--color-gray-500)]">Routes future replies</span>
  </span>
</Button>
```

Migration note: replaces raw `<button>` elements, ad hoc tab buttons, clickable list rows, custom link buttons, and one-off loading button markup.

## IconButton

Import path: `src/components/ui/button`.

Use it for icon-only actions with a required accessible name.

Do not use it when visible text is needed; use `Button` with `leftIcon` or `rightIcon`.

Props:

- `icon: React.ReactNode`; required; icon content.
- `aria-label: string`; required; accessible name.
- `variant?: ButtonVariant`; default `"ghost"`; visual tone.
- `size?: ButtonSize`; default `"md"`; icon button dimensions.
- `radius?: ButtonProps["radius"]`; default inherited Button default; shape.
- `loading?: boolean`; default `false`; disables and shows spinner.
- `type?: "button" | "submit" | "reset"`; default `"button"` through Button.
- Native button attributes are also accepted except children and `aria-label`.

Minimal:

```tsx
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";

<IconButton icon={<X size={16} />} aria-label="Close" onClick={onClose} />
```

Advanced:

```tsx
<IconButton
  icon={<RefreshCw size={14} />}
  aria-label="Refresh notifications"
  variant="soft-primary"
  size="sm"
  radius="full"
  loading={refreshing}
/>
```

Migration note: replaces raw icon-only `<button>` elements and native `title=` icon hints when paired with `Tooltip`.

## FloatingActionButton

Import path: `src/components/ui/button` or compatibility path `src/components/ui/FloatingActionButton`.

Use it for one primary mobile-only page action on dense list pages.

Do not render it on desktop or use it for secondary toolbar actions.

Props:

- `label: string`; required; accessible name and title.
- `icon: React.ReactNode`; required; visible icon.
- `offset?: "default" | "low"`; default `"default"`; vertical mobile offset.
- Inherits Button props except `children`, `iconOnly`, `leftIcon`, `radius`, and `size`.

Minimal:

```tsx
<FloatingActionButton
  label="New contact"
  icon={<Plus size={24} />}
  onClick={openCreateContact}
/>
```

Migration note: replaces page-local fixed mobile action buttons and keeps them above the mobile bottom nav.

## DisclosureButton

Import path: `src/components/ui/button`.

Use it for accordion headers, collapsible panel headers, and disclosure rows.

Do not use it for menu dropdown triggers or regular CTAs.

Props:

- `open?: boolean`; default `false`; rotates the chevron.
- `tone?: "default" | "primary" | "warning" | "danger"`; default `"default"`; visual tone.
- `appearance?: "surface" | "plain"`; default `"surface"`; filled or plain row.
- `size?: "sm" | "md"`; default `"md"`; row padding and label size.
- `leadingIcon?: React.ReactNode`; default `undefined`; icon before label.
- `children: React.ReactNode`; required; label.
- Native button attributes are accepted except children.

Minimal:

```tsx
<DisclosureButton open={open} onClick={toggle}>
  Advanced settings
</DisclosureButton>
```

Advanced:

```tsx
<DisclosureButton
  open={dangerOpen}
  tone="danger"
  appearance="plain"
  size="sm"
  leadingIcon={<AlertTriangle size={14} />}
  onClick={toggleDanger}
>
  Danger zone
</DisclosureButton>
```

Migration note: replaces raw accordion header buttons and hand-rolled chevron rows.

## SelectableCard

Import path: `src/components/ui/SelectableCard`.

Use it for option cards where the whole row/card selects a value.

Do not use it for navigation cards or table/list rows that are not selection controls.

Props:

- `selected: boolean`; required; selected state.
- `title: React.ReactNode`; required; primary label.
- `description?: React.ReactNode`; default `undefined`; secondary text.
- `helper?: React.ReactNode`; default `undefined`; extra helper text.
- `leading?: React.ReactNode`; default `undefined`; leading icon/avatar.
- `indicator?: React.ReactNode`; default built-in check indicator; custom trailing indicator.
- `showIndicator?: boolean`; default `true`; toggles trailing indicator.
- Inherits Button props except `children`, `variant`, `selected`, `leftIcon`, `rightIcon`, and `contentAlign`; component defaults are `size="lg"`, `radius="lg"`, `fullWidth=true`.

Minimal:

```tsx
<SelectableCard
  selected={plan === "starter"}
  title="Starter"
  onClick={() => setPlan("starter")}
/>
```

Advanced:

```tsx
<SelectableCard
  selected={channel === "whatsapp"}
  title="WhatsApp"
  description="Use a WhatsApp Cloud API sender"
  helper="Recommended"
  leading={<MessageCircle size={18} />}
  disabled={saving}
  onClick={() => setChannel("whatsapp")}
/>
```

Migration note: replaces raw clickable option cards and `article role="button"` selectors.

## BaseInput

Import path: `src/components/ui/inputs`.

Use it for standard text-like input fields.

Do not use it for passwords, textareas, checkboxes, ranges, color pickers, token inputs, or native file pickers.

Props:

- `type?: "text" | "email" | "number" | "date" | "time" | "datetime-local" | "password" | "search" | "tel" | "url"`; default `"text"`; input type.
- `label?: string`; default `undefined`; field label.
- `error?: string`; default `undefined`; error message and invalid styling.
- `invalid?: boolean`; default `false`; invalid styling without message.
- `hint?: string`; default `undefined`; helper text.
- `size?: "xs" | "sm" | "md" | "lg"`; default `"md"`; control size.
- `appearance?: "default" | "auth" | "toolbar" | "sidebar" | "inline-edit" | "composer" | "composer-inline" | "composer-note"`; default `"default"`; visual style.
- `labelVariant?: "default" | "sidebar"`; default `"default"`; label style.
- `leftIcon?: React.ReactNode`; default `undefined`; left adornment.
- `rightIcon?: React.ReactNode`; default `undefined`; right adornment.
- `autoWidth?: boolean`; default `false`; sizes width to content.
- `minWidthCh?: number`; default `8`; minimum auto width.
- `maxWidthCh?: number`; default `32`; maximum auto width.
- `hideNativePickerIndicator?: boolean`; default `false`; hides date/time picker indicator.
- Native input attributes are accepted except native `size` and unrestricted `type`.

Minimal:

```tsx
<BaseInput label="Email" type="email" value={email} onChange={handleEmail} />
```

Advanced:

```tsx
<BaseInput
  type="search"
  appearance="toolbar"
  size="sm"
  leftIcon={<Search size={14} />}
  placeholder="Search contacts"
  value={query}
  onChange={(event) => setQuery(event.target.value)}
/>
```

Migration note: replaces raw text, email, number, date, time, search, tel, and url `<input>` controls except file pickers.
Search inputs hide the browser-native clear affordance so shared or local clear buttons do not render a second `x`.

## Input

Import path: `src/components/ui/Input`.

Use it when editing existing code already importing the compatibility input wrapper.

Do not use it for new code when `BaseInput` from `src/components/ui/inputs` is clearer.

Props:

- All `BaseInput` props except `hint` and `size`.
- `helperText?: string`; default `undefined`; maps to `BaseInput` `hint`.
- `inputSize?: BaseInputProps["size"]`; default `"md"`; maps to `BaseInput` `size`.
- Native input attributes are accepted except native `size` and unrestricted `type`.

Minimal:

```tsx
<Input label="Name" value={name} onChange={handleName} />
```

Advanced:

```tsx
<Input
  type="datetime-local"
  helperText="Uses the workspace timezone"
  inputSize="sm"
  hideNativePickerIndicator
  value={scheduledAt}
  onChange={handleScheduledAt}
/>
```

Migration note: compatibility replacement for old shared `Input` imports and raw inputs in older files.

## PasswordInput

Import path: `src/components/ui/inputs`.

Use it for password fields with built-in show/hide behavior.

Do not use `BaseInput type="password"` unless a visibility toggle must be absent.

Props:

- All `BaseInput` props except `type` and `rightIcon`.
- `size?: InputSize`; default `"md"`; also sizes the visibility action.
- `disabled?: boolean`; default `false`; disables input and visibility action.

Minimal:

```tsx
<PasswordInput label="Password" value={password} onChange={handlePassword} />
```

Advanced:

```tsx
<PasswordInput
  label="New password"
  appearance="auth"
  error={passwordError}
  autoComplete="new-password"
  required
  value={password}
  onChange={handlePassword}
/>
```

Migration note: replaces raw password inputs and page-local eye toggle buttons.

## TextareaInput

Import path: `src/components/ui/inputs`.

Use it for multiline text entry.

Do not use it for single-line inputs or contenteditable composers.

Props:

- `label?: string`; default `undefined`; field label.
- `error?: string`; default `undefined`; error message and invalid styling.
- `hint?: string`; default `undefined`; helper text.
- `disabled?: boolean`; default `false`; disables textarea.
- `readOnly?: boolean`; default `false`; read-only styling.
- `size?: InputSize`; default `"md"`; control size.
- `appearance?: InputAppearance`; default `"default"`; visual style.
- `labelVariant?: FieldLabelVariant`; default `"default"`; label style.
- `leftIcon?: React.ReactNode`; default `undefined`; top-left adornment.
- `rightIcon?: React.ReactNode`; default `undefined`; top-right adornment.
- `autoResize?: boolean`; default `false`; auto-resizes height.
- `maxRows?: number`; default `8`; maximum auto-resize rows.
- `rows?: number`; default `4`; initial row count.
- `showCharCount?: boolean`; default `false`; shows `current/maxLength` when `maxLength` is set.
- Native textarea attributes are accepted except native `size`.

Minimal:

```tsx
<TextareaInput label="Notes" value={notes} onChange={handleNotes} />
```

Advanced:

```tsx
<TextareaInput
  appearance="composer-note"
  rows={2}
  autoResize
  maxRows={6}
  maxLength={500}
  showCharCount
  placeholder="Add an internal note"
  value={note}
  onChange={handleNote}
/>
```

Migration note: replaces raw `<textarea>` controls and page-local textarea styling.

## Textarea

Import path: `src/components/ui/Textarea`.

Use it when editing older code already importing the compatibility wrapper.

Do not use it for new code when `TextareaInput` is clearer.

Props:

- All `TextareaInput` props except `hint`.
- `helperText?: string`; default `undefined`; maps to `TextareaInput` `hint`.
- Native textarea attributes are accepted except native `size`.

Minimal:

```tsx
<Textarea value={message} onChange={handleMessage} />
```

Advanced:

```tsx
<Textarea
  label="Description"
  helperText="Shown internally only"
  rows={5}
  error={descriptionError}
/>
```

Migration note: compatibility replacement for old shared `Textarea` imports and raw textareas.

## CopyInput

Import path: `src/components/ui/inputs`.

Use it for read-only values that users need to copy.

Do not use it for editable text fields.

Props:

- `value?: string | number`; default `""`; copied and displayed value.
- `label?: string`; default `undefined`; field label.
- `hint?: string`; default `undefined`; helper text.
- `error?: string`; default `undefined`; error text and styling.
- `size?: InputSize`; default `"md"`; field and action size.
- Native input attributes are accepted except `size`, `readOnly`, `type`, and `value`.

Minimal:

```tsx
<CopyInput label="Webhook URL" value={webhookUrl} />
```

Advanced:

```tsx
<CopyInput
  label="Verify token"
  value={verifyToken}
  hint="Use this value in Meta settings."
  disabled={!verifyToken}
/>
```

Migration note: replaces read-only input plus custom copy button pairs.

## InlineEditableInput

Import path: `src/components/ui/inputs`.

Use it for click-to-edit inline labels, names, and compact table/list fields.

Do not use it for full forms where `BaseInput` and explicit save/cancel actions are clearer.

Props:

- `value: string`; required; current value.
- `onSave: (value: string) => void | Promise<void>`; required; commit handler.
- `placeholder?: string`; default `"Click to edit"`; empty-state text.
- `disabled?: boolean`; default `false`; disables edit trigger.
- `renderText?: (value: string) => React.ReactNode`; default plain value or placeholder; custom read view.
- `size?: InputSize`; default `"md"`; edit input/action size.
- `className?: string`; default `undefined`; wrapper class.
- `inputClassName?: string`; default `undefined`; edit input class.

Minimal:

```tsx
<InlineEditableInput value={title} onSave={renameTitle} />
```

Advanced:

```tsx
<InlineEditableInput
  value={workflowName}
  onSave={saveWorkflowName}
  size="sm"
  placeholder="Untitled workflow"
  renderText={(value) => <TruncatedText text={value || "Untitled workflow"} />}
/>
```

Migration note: replaces raw inline edit inputs and hand-rolled save/cancel micro controls.

## CheckboxInput

Import path: `src/components/ui/inputs`.

Use it for checkbox semantics, confirmations, and multiselect cards.

Do not use `ToggleSwitch` where the UI is conceptually a checkbox.

Props:

- `checked: boolean`; required; checked state.
- `onChange?: (checked: boolean) => void`; default `undefined`; checked change callback.
- `size?: "sm" | "md"`; default `"md"`; visual checkbox size.
- `label?: React.ReactNode`; default `undefined`; label content.
- `description?: React.ReactNode`; default `undefined`; helper description.
- Native input attributes are accepted except `type`, `size`, `checked`, and native `onChange`.

Minimal:

```tsx
<CheckboxInput checked={agreed} onChange={setAgreed} label="I agree" />
```

Advanced:

```tsx
<CheckboxInput
  checked={selectedIds.includes(user.id)}
  onChange={(checked) => toggleUser(user.id, checked)}
  size="sm"
  label={user.name}
  description={user.email}
  disabled={saving}
/>
```

Migration note: replaces raw checkbox inputs and fake checkbox cards.

## ToggleSwitch

Import path: `src/components/ui/toggle`.

Use it for on/off switches and settings toggles.

Do not use it for checkbox confirmation or multi-select semantics.

Props:

- `checked: boolean`; required; switch state.
- `onChange?: (checked: boolean) => void`; default `undefined`; change callback.
- `label?: string`; default `undefined`; label text.
- `labelPosition?: "left" | "right"`; default `"right"`; label side.
- `disabled?: boolean`; default `false`; disabled state.
- `size?: "sm" | "md"`; default `"md"`; switch dimensions.
- Native input attributes are accepted except `checked`, `children`, `onChange`, `size`, and `type`.

Minimal:

```tsx
<ToggleSwitch checked={enabled} onChange={setEnabled} />
```

Advanced:

```tsx
<ToggleSwitch
  checked={autoAssign}
  onChange={setAutoAssign}
  label="Auto-assign conversations"
  labelPosition="left"
  size="sm"
  disabled={!canEdit}
/>
```

Migration note: replaces raw checkbox switches and page-local toggle styling.

## Toggle

Import path: `src/components/ui/Toggle`.

Use it when editing older code already importing the compatibility wrapper.

Do not use it for new code when `ToggleSwitch` is clearer.

Props:

- `checked?: boolean`; default from `enabled` or `false`; switch state.
- `enabled?: boolean`; default `false`; compatibility state alias.
- `onChange?: (value: boolean) => void`; default `undefined`; change callback.
- `onToggle?: () => void`; default `undefined`; compatibility callback called after change.
- `ariaLabel?: string`; default `props["aria-label"]`; compatibility accessible label.
- All `ToggleSwitch` props except `checked` and `onChange`.

Minimal:

```tsx
<Toggle enabled={enabled} onToggle={toggleEnabled} />
```

Advanced:

```tsx
<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Enabled"
  size="sm"
  ariaLabel="Enable automation"
/>
```

Migration note: compatibility replacement for older toggle components.

## RangeInput

Import path: `src/components/ui/inputs`.

Use it for slider semantics.

Do not use raw `input type="range"` in application code.

Props:

- `valueLabel?: string | number`; default `undefined`; fixed-width displayed value.
- Native input attributes are accepted except `type`.

Minimal:

```tsx
<RangeInput min={0} max={100} value={score} onChange={handleScore} />
```

Advanced:

```tsx
<RangeInput
  min={0}
  max={10}
  step={1}
  value={temperature}
  valueLabel={temperature}
  onChange={handleTemperature}
  disabled={locked}
/>
```

Migration note: replaces raw range inputs.

## ColorInput

Import path: `src/components/ui/inputs`.

Use it for text-plus-color-picker fields.

Do not use it for preset tag color swatches; use `TagColorSwatchPicker`.

Props:

- `value: string`; required; current color string.
- `onChange?: (value: string) => void`; default `undefined`; change callback.
- `label?: string`; default `undefined`; field label.
- `hint?: string`; default `undefined`; helper text.
- `error?: string`; default `undefined`; error text and styling.
- `size?: InputSize`; default `"md"`; text input size.
- `placeholder?: string`; default `"#2563EB"`; text placeholder.
- Native input attributes are accepted except `type`, `size`, `value`, and native `onChange`.

Minimal:

```tsx
<ColorInput label="Brand color" value={color} onChange={setColor} />
```

Advanced:

```tsx
<ColorInput
  value={themeColor}
  onChange={setThemeColor}
  label="Widget color"
  hint="Used for the chat launcher."
  error={colorError}
  disabled={!canEdit}
/>
```

Migration note: replaces raw color picker plus text input pairs.

## TagInput

Import path: `src/components/ui/inputs`.

Use it for freeform token/chip entry.

Do not use it for workspace conversation tags; use `WorkspaceTagManager` or `WorkspaceTagSelect`.

Props:

- `id?: string`; default generated; field id.
- `label?: string`; default `undefined`; field label.
- `hint?: string`; default `undefined`; helper text.
- `error?: string`; default `undefined`; error text and styling.
- `values: string[]`; required; selected token values.
- `onChange?: (values: string[]) => void`; default `undefined`; change callback.
- `placeholder?: string`; default `undefined`; input placeholder.
- `disabled?: boolean`; default `false`; disables entry/removal.
- `maxTagWidth?: number | string`; default `220`; max rendered tag width.
- `normalizeValue?: (value: string) => string`; default trim and remove trailing commas; token normalization.
- `suggestions?: Array<{ value: string; label: string }>`; default `[]`; dropdown suggestions.
- `getValueLabel?: (value: string) => string`; default raw value; display label.

Minimal:

```tsx
<TagInput values={domains} onChange={setDomains} placeholder="Add domain" />
```

Advanced:

```tsx
<TagInput
  label="Allowed websites"
  values={websites}
  onChange={setWebsites}
  suggestions={[{ value: "example.com", label: "example.com" }]}
  normalizeValue={(value) => value.trim().toLowerCase()}
  getValueLabel={(value) => value.replace(/^https?:\/\//, "")}
  maxTagWidth={260}
/>
```

Migration note: replaces comma-separated raw inputs and local token/chip entry widgets.

## TagColorSwatchPicker

Import path: `src/components/ui/inputs`.

Use it for choosing from preset tag colors.

Do not use it for arbitrary hex color entry; use `ColorInput`.

Props:

- `id?: string`; default generated; field id.
- `label?: string`; default `undefined`; field label.
- `hint?: string`; default `undefined`; helper text.
- `error?: string`; default `undefined`; error text.
- `value: string`; required; selected option value.
- `options: Array<{ value: string; hex: string; label?: string }>`; required; swatches.
- `disabled?: boolean`; default `false`; disables swatches.
- `onChange?: (value: string) => void`; default `undefined`; selection callback.

Minimal:

```tsx
<TagColorSwatchPicker value={color} options={TAG_COLOR_OPTIONS} onChange={setColor} />
```

Advanced:

```tsx
<TagColorSwatchPicker
  label="Tag color"
  value={tagColor}
  options={TAG_COLOR_OPTIONS}
  onChange={setTagColor}
  error={colorError}
  disabled={saving}
/>
```

Migration note: replaces page-local color swatch rows.

## VerificationCodeInput

Import path: `src/components/ui/inputs`.

Use it for OTP and verification-code entry.

Do not use it for arbitrary segmented text fields.

Props:

- `value: string[]`; required; digit array.
- `onChange: (nextValue: string[]) => void`; required; change callback.
- `length?: number`; default `6`; number of cells.
- `invalid?: boolean`; default `false`; invalid styling.
- `disabled?: boolean`; default `false`; disables cells.
- `autoFocus?: boolean`; default `false`; focuses first cell.
- `ariaLabelPrefix?: string`; default `"Verification code digit"`; accessible label prefix.

Minimal:

```tsx
<VerificationCodeInput value={code} onChange={setCode} />
```

Advanced:

```tsx
<VerificationCodeInput
  value={code}
  onChange={setCode}
  length={6}
  invalid={hasError}
  disabled={verifying}
  autoFocus
  ariaLabelPrefix="Email verification digit"
/>
```

Migration note: replaces raw multi-cell OTP inputs.

## BaseSelect

Import path: `src/components/ui/select`.

Use it for accessible single selection from a static option list.

Do not use it for compact toolbar pickers or searchable pickers.

Props:

- `options: Array<{ value: string; label: string; disabled?: boolean }>`; required; list options.
- `value?: string`; default `undefined`; selected value.
- `onChange?: (value: string) => void`; default `undefined`; selection callback.
- Shared field props: `id?`, `name?`, `label?`, `hint?`, `error?`, `required?`, `placeholder?` default `"Select an option"`, `disabled?` default `false`, `size?` default `"md"`, `emptyMessage?` default `"No options available."`, `className?`.

Minimal:

```tsx
<BaseSelect options={roleOptions} value={role} onChange={setRole} />
```

Advanced:

```tsx
<BaseSelect
  label="Role"
  required
  size="sm"
  options={roleOptions}
  value={role}
  onChange={setRole}
  error={roleError}
  emptyMessage="No roles available."
/>
```

Migration note: replaces raw `<select>` fields and simple page-local dropdowns.

## Select

Import path: `src/components/ui/Select`.

Use it only where the older native select experience is intentionally preferred or already imported.

Do not use it for new custom dropdowns; use `BaseSelect`, `CompactSelectMenu`, or another select primitive.

Props:

- `label?: string`; default `undefined`; field label.
- `error?: string`; default `undefined`; error text and styling.
- `helperText?: string`; default `undefined`; helper text.
- `options: Array<{ value: string; label: string }>`; required; native option list.
- `size?: InputSize`; default `"md"`; control size.
- `appearance?: InputAppearance`; default `"default"`; visual style.
- `labelVariant?: FieldLabelVariant`; default `"default"`; label style.
- Native select attributes are accepted except native `size`.

Minimal:

```tsx
<Select options={timezoneOptions} value={timezone} onChange={handleTimezone} />
```

Advanced:

```tsx
<Select
  label="Timezone"
  helperText="Used for schedules"
  options={timezoneOptions}
  size="sm"
  error={timezoneError}
  required
/>
```

Migration note: compatibility replacement for old shared native select usage.

## MultiSelect

Import path: `src/components/ui/select`.

Use it for selecting multiple simple values from one option list.

Do not use it for workspace tags where color/emoji display is needed.

Props:

- `options: SelectOption[]`; required; list options.
- `value: string[]`; required; selected values.
- `onChange?: (value: string[]) => void`; default `undefined`; selection callback.
- Shared field props: `id?`, `name?`, `label?`, `hint?`, `error?`, `required?`, `placeholder?` default `"Select one or more options"`, `disabled?` default `false`, `size?` default `"md"`, `emptyMessage?` default `"No options available."`, `className?`.

Minimal:

```tsx
<MultiSelect options={channelOptions} value={channels} onChange={setChannels} />
```

Advanced:

```tsx
<MultiSelect
  label="Channels"
  options={channelOptions}
  value={channels}
  onChange={setChannels}
  placeholder="Select channels"
  error={channelError}
  size="sm"
/>
```

Migration note: replaces custom multiselect dropdowns and checkbox menus.

## SearchableSelect

Import path: `src/components/ui/select`.

Use it for single selection when the option list needs search.

Do not use it for compact toolbar menus; use `CompactSelectMenu`.

Props:

- `options: SelectOption[]`; required; list options.
- `value?: string`; default `undefined`; selected value.
- `onChange?: (value: string) => void`; default `undefined`; selection callback.
- `searchPlaceholder?: string`; default `"Search options..."`; search field placeholder.
- Shared field props: `id?`, `name?`, `label?`, `hint?`, `error?`, `required?`, `placeholder?` default `"Search and select"`, `disabled?` default `false`, `size?` default `"md"`, `emptyMessage?` default `"No matching options."`, `className?`.

Minimal:

```tsx
<SearchableSelect options={users} value={userId} onChange={setUserId} />
```

Advanced:

```tsx
<SearchableSelect
  label="Owner"
  options={userOptions}
  value={ownerId}
  onChange={setOwnerId}
  searchPlaceholder="Search teammates..."
  emptyMessage="No teammates found."
/>
```

Migration note: replaces custom searchable single-select dropdowns.

## CompactSelectMenu

Import path: `src/components/ui/select`.

Use it for compact dropdown selectors in headers, toolbars, composers, and menus that are true selections.

Do not use it for action panels that are not semantically selecting a value.

Props:

- `id?: string`; default generated; trigger id.
- `value?: string`; default `undefined`; selected value.
- `groups: Array<{ label?: string; options: CompactSelectMenuOption[] }>`; required; grouped options.
- `onChange: (value: string) => void`; required; selection callback.
- `triggerContent?: React.ReactNode`; default selected label or placeholder; custom trigger content.
- `placeholder?: string`; default `"Select option"`; fallback trigger text.
- `disabled?: boolean`; default `false`; disables trigger.
- `size?: SelectSize`; default `"sm"`; trigger size.
- `hasValue?: boolean`; default derived from selected option; controls placeholder/active styling.
- `fullWidth?: boolean`; default `false`; stretches trigger.
- `triggerAppearance?: "field" | "pill" | "inline" | "toolbar" | "button"`; default `"pill"`; trigger style.
- `dropdownWidth?: "trigger" | "sm" | "md" | "lg"`; default `"trigger"`; menu width.
- `dropdownAlign?: "start" | "end"`; default `"start"`; menu alignment.
- `dropdownPlacement?: "top" | "bottom"`; default `"bottom"`; menu placement.
- `searchable?: boolean`; default `false`; shows search field.
- `searchPlaceholder?: string`; default `"Search..."`; search placeholder.
- `emptyMessage?: string`; default `"No options available."`; empty text.
- `triggerClassName?: string`; default `undefined`; trigger class.

Option props:

- `value`, `label`; required.
- `description?`, `descriptionTone?`, `leading?`, `tone?`, `searchText?`, `alwaysVisible?`.

Minimal:

```tsx
<CompactSelectMenu
  value={status}
  groups={[{ options: statusOptions }]}
  onChange={setStatus}
/>
```

Advanced:

```tsx
<CompactSelectMenu
  value={assigneeId}
  groups={[{ label: "Team", options: assigneeOptions }]}
  onChange={setAssigneeId}
  triggerAppearance="toolbar"
  dropdownWidth="md"
  dropdownAlign="end"
  searchable
  searchPlaceholder="Search users"
/>
```

Migration note: replaces custom selected-value dropdowns, AI prompt selectors, variable selectors, and channel/availability pickers when they are true selections.

## ButtonSelectMenu

Import path: `src/components/ui/select`.

Use it when a shared `Button`-style trigger should open the compact select menu, such as an Add action that needs the user to choose the item type.

It accepts the same grouped options and dropdown/search/mobile-sheet props as `CompactSelectMenu`, plus `label`, `leftIcon`, `variant`, `size`, `radius`, and `selected` for the button trigger.

```tsx
<ButtonSelectMenu
  value=""
  groups={[{ options: itemTypeOptions }]}
  onChange={addItem}
  label="Add item"
  leftIcon={<Plus size={14} />}
  variant="dashed"
  dropdownWidth="md"
/>
```

## VariableSuggestionMenu

Import path: `src/components/ui/select`.

Use it for composer autocomplete menus that insert `{{variable}}` tokens after a `$` trigger.

Do not use it for normal selected-value dropdowns; use `CompactSelectMenu` for those.

Props:

- `isOpen: boolean`; required; controls menu visibility.
- `query?: string`; default `""`; current typed query after `$`.
- `options: Array<{ key: string; label: string; description?: string }>`; required; variable options.
- `highlightedIndex: number`; required; keyboard-highlighted row.
- `onHighlightChange: (index: number) => void`; required; hover/highlight callback.
- `onSelect: (option) => void`; required; insertion callback.
- `showEmptyState?: boolean`; default `false`; shows no-results state when no options exist.
- `emptyMessage?: string`; default derived from query; empty-state text.
- `className?: string`; default `""`; menu positioning override.

Minimal:

```tsx
<VariableSuggestionMenu
  isOpen={query !== null}
  query={query ?? ""}
  options={filteredVariables}
  highlightedIndex={highlightedIndex}
  onHighlightChange={setHighlightedIndex}
  onSelect={insertVariable}
/>
```

Migration note: replaces page-local composer variable dropdowns in reply, email, comment, note, and template editors.

## MentionSuggestionMenu

Import path: `src/components/ui/select`.

Use it for composer autocomplete menus that insert teammate mentions after an `@` trigger.

Do not use it for assignee filters or selected-user fields; use `UserAssignSelect`, `CompactSelectMenu`, or `BaseSelect` for those.

Props:

- `isOpen: boolean`; required; controls menu visibility.
- `query?: string`; default `""`; current typed query after `@`.
- `options: Array<{ id: string; label: string; subtitle?: string; avatarSrc?: string; status?: "online" | "offline" | "away" | "busy"; statusLabel?: string }>`; required; mention options.
- `highlightedIndex: number`; required; keyboard-highlighted row.
- `onHighlightChange: (index: number) => void`; required; hover/highlight callback.
- `onSelect: (option) => void`; required; insertion callback.
- `title?: string`; default `"Mention teammate"`; menu heading.
- `showEmptyState?: boolean`; default `false`; shows no-results state when no options exist.
- `emptyMessage?: string`; default derived from query; empty-state text.
- `className?: string`; default `""`; menu positioning override.

Minimal:

```tsx
<MentionSuggestionMenu
  isOpen={query !== null}
  query={query ?? ""}
  options={mentionOptions}
  highlightedIndex={highlightedIndex}
  onHighlightChange={setHighlightedIndex}
  onSelect={insertMention}
/>
```

Migration note: replaces page-local composer mention dropdowns in reply, email, comment, and note editors.

## SelectWithIconLabel

Import path: `src/components/ui/select`.

Use it for single selects where every option needs a leading icon.

Do not use it for channel badges/avatars where `AvatarWithBadge` or registry-driven display is needed.

Props:

- `options: Array<SelectOption & { icon?: React.ReactNode }>`; required; options with icons.
- `value?: string`; default `undefined`; selected value.
- `onChange?: (value: string) => void`; default `undefined`; selection callback.
- Shared field props with defaults: `placeholder="Select a channel"`, `disabled=false`, `size="md"`, `emptyMessage="No channels available."`.

Minimal:

```tsx
<SelectWithIconLabel options={channelOptions} value={channel} onChange={setChannel} />
```

Advanced:

```tsx
<SelectWithIconLabel
  label="Channel"
  options={channelOptions}
  value={channel}
  onChange={setChannel}
  error={channelError}
  required
/>
```

Migration note: replaces icon-and-label native selects and local channel dropdowns.

## UserAssignSelect

Import path: `src/components/ui/select`.

Use it for assigning or clearing an assignee/user.

Do not use it for generic user filtering when no assignment semantics exist.

Props:

- `options: Array<SelectOption & { avatarSrc?: string; avatarName?: string; subtitle?: string }>`; required; user options.
- `value?: string`; default `undefined`; selected user id.
- `onChange?: (value: string | undefined) => void`; default `undefined`; assignment callback.
- `clearable?: boolean`; default `true`; includes unassigned/clear behavior.
- `unassignLabel?: string`; default `"Unassigned"`; label for clear row.
- Shared field props with defaults: `placeholder="Assign user"`, `disabled=false`, `size="md"`, `emptyMessage="No users available."`.

Minimal:

```tsx
<UserAssignSelect options={users} value={assigneeId} onChange={setAssigneeId} />
```

Advanced:

```tsx
<UserAssignSelect
  label="Assignee"
  options={userOptions}
  value={assigneeId}
  onChange={setAssigneeId}
  clearable
  unassignLabel="No owner"
  error={assigneeError}
/>
```

Migration note: replaces local assignee dropdowns and unassigned menu rows.

## TagSelect

Import path: `src/components/ui/select`.

Use it for grouped tag-like multiselect when simple label/description options are enough.

Do not use it for workspace conversation tags with colors, emoji, creation, or selected-below layout; use `WorkspaceTagManager`.

Props:

- `groups: Array<{ label: string; options: Array<{ value: string; label: string; description?: string; disabled?: boolean }> }>`; required; grouped options.
- `value: string[]`; required; selected values.
- `onChange?: (value: string[]) => void`; default `undefined`; change callback.
- Shared field props with defaults: `placeholder="Select tags"`, `disabled=false`, `size="md"`, `emptyMessage="No tags available."`.

Minimal:

```tsx
<TagSelect groups={tagGroups} value={tags} onChange={setTags} />
```

Advanced:

```tsx
<TagSelect
  label="Labels"
  groups={tagGroups}
  value={selectedTags}
  onChange={setSelectedTags}
  placeholder="Select labels"
  error={tagError}
/>
```

Migration note: replaces grouped custom tag multiselects.

## WorkspaceTagSelect

Import path: `src/components/ui/select`.

Use it as the low-level workspace tag picker when custom composition is genuinely required.

Do not use it for the common label/add-button/selected-tags pattern; use `WorkspaceTagManager`.

Props:

- `options: WorkspaceTagSelectOption[]`; required; tag options with `value`, `label`, optional `color`, `emoji`, `description`, `disabled`, `busy`, and `data`.
- `value: string[]`; required; selected tag values.
- `onChange?: (value: string[]) => void`; default `undefined`; selection callback.
- `onToggleOption?: (option, nextSelected) => void | Promise<void>`; default `undefined`; custom async toggle.
- `searchPlaceholder?: string`; default `"Search tags"`; search placeholder.
- `selectedDisplay?: "trigger" | "below" | "none"`; default `"trigger"`; selected display location.
- `selectedAppearance?: "chip" | "tag"`; default `"chip"`; selected display style.
- `optionAppearance?: "label" | "tag"`; default `"label"`; option row style.
- `triggerSummary?: React.ReactNode | ((selectedOptions, allOptions) => React.ReactNode)`; default `undefined`; custom trigger summary.
- `clearActionLabel?: string`; default `"Clear all"`; menu clear action label.
- `emptyActionLabel?: string | ((query: string) => string)`; default `undefined`; empty-state action label.
- `onEmptyAction?: (query: string) => void`; default `undefined`; empty-state action callback.
- `dropdownPlacement?: "top" | "bottom"`; default `"bottom"`; menu placement.
- `dropdownAlign?: "start" | "end"`; default `"start"`; menu alignment.
- `dropdownWidth?: "trigger" | "sm" | "md" | "lg"`; default `"trigger"`; menu width.
- `menuTitle?: string`; default `"Tags"`; menu header title.
- `emptySelectedContent?: React.ReactNode`; default `undefined`; content below when none selected.
- `renderTrigger?: (props: WorkspaceTagSelectRenderTriggerProps) => React.ReactNode`; default shared trigger; custom trigger renderer.
- Shared field props with defaults: `placeholder="Select tags"`, `disabled=false`, `size="md"`, `emptyMessage="No tags available."`.

Minimal:

```tsx
<WorkspaceTagSelect options={tagOptions} value={tagIds} onChange={setTagIds} />
```

Advanced:

```tsx
<WorkspaceTagSelect
  options={tagOptions}
  value={tagIds}
  onChange={setTagIds}
  selectedDisplay="below"
  selectedAppearance="tag"
  optionAppearance="tag"
  dropdownWidth="md"
  emptyActionLabel={(query) => `Create "${query}"`}
  onEmptyAction={createTag}
/>
```

Migration note: replaces custom workspace tag dropdown internals only when the high-level manager cannot fit.

## WorkspaceTagManager

Import path: `src/components/ui/select`.

Use it for full workspace tag areas: label row, add button, searchable picker, and selected tags rendered below.

Do not build page-local tag picker plus selected-tag list compositions.

Props:

- Inherits selected tag behavior props from `WorkspaceTagSelect`: `options`, `value`, `onChange`, `onToggleOption`, `onEmptyAction`, `emptyActionLabel`, `emptyMessage`, `emptySelectedContent`, `searchPlaceholder`, `selectedAppearance`, `optionAppearance`, `dropdownPlacement`, `dropdownAlign`, `dropdownWidth`, `menuTitle`, `disabled`.
- `label?: React.ReactNode`; default `"Tags"`; label content.
- `required?: boolean`; default `false`; shows required marker.
- `hint?: React.ReactNode`; default `undefined`; helper text under control.
- `labelAppearance?: "form" | "field" | "sidebar" | "section"`; default `"field"`; label style.
- `clearActionLabel?: string`; default `undefined`; optional clear action.
- `onClearAll?: () => void`; default `undefined`; custom clear action.
- `addButtonAriaLabel?: string`; default `"Add tag"`; closed trigger label.
- `closeButtonAriaLabel?: string`; default `"Close tag picker"`; open trigger label.
- `addButtonVariant?: ButtonVariant`; default `"secondary"`; add trigger tone.
- `addButtonSize?: ButtonSize`; default `"xs"`; add trigger size.
- `addIcon?: LucideIcon`; default `Plus`; trigger icon.

Minimal:

```tsx
<WorkspaceTagManager options={tagOptions} value={tagIds} onChange={setTagIds} />
```

Advanced:

```tsx
<WorkspaceTagManager
  label="Conversation tags"
  labelAppearance="section"
  options={tagOptions}
  value={tagIds}
  onChange={setTagIds}
  clearActionLabel="Clear"
  emptyActionLabel={(query) => `Create "${query}"`}
  onEmptyAction={createTag}
  dropdownAlign="end"
  dropdownWidth="md"
/>
```

Migration note: replaces page-local tag-management sections across inbox, contacts, broadcast, imports, and workflows.

## Tag

Import path: `src/components/ui/tag` or compatibility path `src/components/ui/Tag`.

Use it for chips, pills, labels, status tags, removable selected values, and compact metadata.

Do not use it for numeric unread counts; use `CountBadge`.

Props:

- `label: string`; required; displayed text.
- `emoji?: string`; default `undefined`; leading emoji.
- `bgColor?: string`; default `"tag-indigo"`; preset, CSS var, hex, or color string.
- `textColor?: string`; default derived from background; text color override.
- `size?: "sm" | "md"`; default `"md"`; tag size.
- `onRemove?: () => void`; default `undefined`; shows remove button.
- `onClick?: () => void`; default `undefined`; makes tag keyboard/click interactive.
- `icon?: React.ReactNode`; default `undefined`; leading icon.
- `disabled?: boolean`; default `false`; disables interaction.
- `maxWidth?: number | string`; default `undefined`; truncates and shows desktop tooltip.
- Native span attributes are accepted except `color` and native `onClick`.

Minimal:

```tsx
<Tag label="Active" bgColor="success" />
```

Advanced:

```tsx
<Tag
  label="VIP customer"
  emoji="*"
  bgColor="tag-purple"
  size="sm"
  maxWidth={160}
  onRemove={removeTag}
  disabled={saving}
/>
```

Migration note: replaces one-off chips, pills, manual status badges, and removable tag spans.

## Badge

Import path: `src/components/ui/Badge`.

Use it only for legacy surfaces that already depend on the older badge classes.

Do not use it for new status chips; use `Tag`.

Props:

- `variant?: "primary" | "success" | "warning" | "error" | "gray"`; default `"gray"`; badge tone.
- `children: React.ReactNode`; required; badge content.
- Native span attributes are accepted.

Minimal:

```tsx
<Badge>Draft</Badge>
```

Advanced:

```tsx
<Badge variant="warning" className="uppercase">
  Pending
</Badge>
```

Migration note: older replacement for badges; new migrations should usually use `Tag`.

## CountBadge

Import path: `src/components/ui/CountBadge`.

Use it for compact numeric counts and unread badges.

Do not use `Tag` for tiny numeric count bubbles.

Props:

- `count?: number | null`; default `undefined`; count to render.
- `max?: number`; default `99`; maximum before overflow label.
- `tone?: "primary" | "neutral" | "warning" | "danger"`; default `"primary"`; tone.
- `size?: "xs" | "sm" | "md"`; default `"sm"`; dimensions.
- `showZero?: boolean`; default `false`; renders zero counts.
- `compact?: boolean`; default `false`; uses compact absolute badge style.
- Native span attributes are accepted except children.

Minimal:

```tsx
<CountBadge count={unread} />
```

Advanced:

```tsx
<CountBadge count={failedCount} max={9} tone="danger" size="xs" compact />
```

Migration note: replaces custom unread bubbles and stretched tag-count pills.

## Avatar

Import path: `src/components/ui/avatar` or compatibility path `src/components/ui/Avatar`.

Use it for user, contact, team, and entity avatars.

Do not hand-roll initials circles or image fallbacks.

Props:

- `src?: string`; default `undefined`; image URL.
- `name: string`; required; fallback initials and alt basis.
- `size?: "2xs" | "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl"`; default `"md"`; dimensions.
- `shape?: "circle" | "square"`; default `"circle"`; avatar shape.
- `fallbackTone?: "primary" | "neutral"`; default `"primary"`; fallback color tone.
- `showStatus?: boolean`; default `false`; shows status dot.
- `statusColor?: string`; default `--color-success`; status dot color.
- `alt?: string`; default `name`; image/fallback accessible label.
- Native span attributes are accepted except children.

Minimal:

```tsx
<Avatar name={contact.name} src={contact.avatarUrl} />
```

Advanced:

```tsx
<Avatar
  name={user.name}
  src={user.avatarUrl}
  size="base"
  fallbackTone="neutral"
  showStatus
  statusColor="var(--color-success)"
/>
```

Migration note: replaces manual avatar circles, initials helpers, and inline status-dot avatar markup.

## AvatarWithBadge

Import path: `src/components/ui/avatar` or compatibility path `src/components/ui/Avatar`.

Use it for avatars that need a channel indicator.

Do not use it when no badge/channel indicator is needed; use `Avatar`.

Props:

- All `Avatar` props.
- `badgeType: "whatsapp" | "instagram" | "facebook" | "telegram" | "email" | "sms" | "web" | "messenger" | "gmail" | "webchat"`; required; badge style.
- `badgeSize?: string`; default size derived from avatar size; custom badge size.
- `badgeSrc?: string`; default `undefined`; custom badge image.
- `badgeAlt?: string`; default empty string; badge image alt.
- `badgePlacement?: "inset" | "overlap"`; default `"overlap"`; badge placement.

Minimal:

```tsx
<AvatarWithBadge name={contact.name} badgeType="whatsapp" />
```

Advanced:

```tsx
<AvatarWithBadge
  name={conversation.contactName}
  src={conversation.avatarUrl}
  size="base"
  badgeType="instagram"
  badgePlacement="overlap"
  showStatus
/>
```

Migration note: replaces manual channel badge overlays on avatars.

## AvatarGroup

Import path: `src/components/ui/avatar` or compatibility path `src/components/ui/Avatar`.

Use it for stacked user/contact avatar groups.

Do not use it for arbitrary icon stacks or non-avatar counters.

Props:

- `avatars: AvatarProps[]`; required; avatars to render.
- `max?: number`; default `4`; max visible avatars.
- `size?: AvatarSize`; default `"md"`; group avatar size.
- `overlap?: boolean`; default `true`; overlaps avatars.
- `onMoreClick?: React.MouseEventHandler<HTMLButtonElement>`; default `undefined`; makes overflow count clickable.

Minimal:

```tsx
<AvatarGroup avatars={teamMembers.map((member) => ({ name: member.name, src: member.avatarUrl }))} />
```

Advanced:

```tsx
<AvatarGroup
  avatars={participants}
  max={3}
  size="sm"
  overlap
  onMoreClick={() => setShowPeople(true)}
/>
```

Migration note: replaces local stacked avatar rows and `+n` overflow circles.

## Tooltip

Import path: `src/components/ui/tooltip` or compatibility path `src/components/ui/Tooltip`.

Use it for desktop-only hover/focus hints.

Do not use native `title=` attributes, and do not render tooltip-only UX on mobile.

Props:

- `content: string | React.ReactNode`; required; tooltip content.
- `children: React.ReactNode`; required; trigger.
- `position?: "auto" | "top" | "bottom" | "left" | "right"`; default `"auto"`; preferred placement.
- `delay?: number`; default `400`; open delay in ms.
- `disabled?: boolean`; default `false`; disables tooltip.
- `maxWidth?: number | string`; default `280`; tooltip max width.

Minimal:

```tsx
<Tooltip content="Refresh">
  <IconButton icon={<RefreshCw size={16} />} aria-label="Refresh" />
</Tooltip>
```

Advanced:

```tsx
<Tooltip content={<span>Only owners can publish</span>} position="bottom" delay={250} disabled={canPublish}>
  <span>
    <Button disabled={!canPublish}>Publish</Button>
  </span>
</Tooltip>
```

Migration note: replaces native `title=` attributes and local tooltip implementations.

## RichTooltip

Import path: `src/components/ui/tooltip` or compatibility path `src/components/ui/Tooltip`.

Use it for desktop-only explanatory tooltips with a title and description.

Do not use it for simple one-word hints; use `Tooltip`.

Props:

- `icon?: React.ReactNode`; default `undefined`; leading icon in tooltip body.
- `title: string`; required; title text.
- `description: string`; required; description text.
- Inherits `Tooltip` props except `content`; defaults are `position="auto"`, `delay=400`, `disabled=false`, `maxWidth=320`.

Minimal:

```tsx
<RichTooltip title="AI paused" description="The assistant will not reply until resumed.">
  <Tag label="Paused" bgColor="warning" />
</RichTooltip>
```

Advanced:

```tsx
<RichTooltip
  icon={<Bot size={14} />}
  title="Approval required"
  description="AI drafts must be reviewed before sending on this channel."
  position="right"
  maxWidth={360}
>
  <IconButton icon={<Info size={16} />} aria-label="Approval info" />
</RichTooltip>
```

Migration note: replaces custom rich hover cards used only for explanatory hints.

## TruncatedText

Import path: `src/components/ui/truncated-text` or compatibility path `src/components/ui/TruncatedText`.

Use it for dynamic strings in constrained spaces.

Do not manually slice dynamic text or rely on native `title=`.

Props:

- `text: string`; required; source text.
- `maxLines?: number`; default `undefined`; CSS line clamp count.
- `maxLength?: number`; default `undefined`; character truncation limit.
- `showTooltip?: boolean`; default `true`; shows full text on desktop when truncated.
- `className?: string`; default `undefined`; class for rendered element.
- `as?: React.ElementType`; default `"span"`; rendered element.
- Native HTML attributes for the rendered element are accepted except children.

Minimal:

```tsx
<TruncatedText text={contact.name} maxLength={32} />
```

Advanced:

```tsx
<TruncatedText
  as="p"
  text={messagePreview}
  maxLines={2}
  showTooltip
  className="text-sm text-[var(--color-gray-600)]"
/>
```

Migration note: replaces manual string truncation and native title-based overflow hints.

## CenterModal

Import path: `src/components/ui/modal` or compatibility path `src/components/ui/Modal`.

Use it for centered dialogs, forms, confirmations, and desktop modals.

Do not use it for mobile bottom sheets; use `MobileSheet`.

Props:

- `isOpen: boolean`; required; modal state.
- `onClose: () => void`; required; close callback.
- `title: React.ReactNode`; required; modal title.
- `subtitle?: React.ReactNode`; default `undefined`; subtitle.
- `headerIcon?: React.ReactNode`; default `undefined`; icon near title.
- `onBack?: () => void`; default `undefined`; back button handler.
- `headerActions?: React.ReactNode`; default `undefined`; actions near close button.
- `footer?: React.ReactNode`; default `undefined`; custom footer.
- `footerMeta?: React.ReactNode`; default `undefined`; left footer meta.
- `secondaryAction?: React.ReactNode`; default `undefined`; footer secondary action.
- `primaryAction?: React.ReactNode`; default `undefined`; footer primary action.
- `closeOnOverlayClick?: boolean`; default `true`; overlay click closes.
- `showOverlay?: boolean`; default `true`; renders backdrop.
- `allowBackgroundInteraction?: boolean`; default `false`; lets clicks through frame wrapper.
- `lockBodyScroll?: boolean`; default `true`; locks body scroll.
- `showCloseButton?: boolean`; default `true`; shows close icon.
- `bodyPadding?: "none" | "sm" | "md" | "lg"`; default `"md"`; body padding.
- `children: React.ReactNode`; required; body content.
- `size?: "sm" | "md" | "lg" | "xl" | "fullscreen"`; default `"md"`; max width.
- `width?: number | string`; default derived from size; explicit width.

Minimal:

```tsx
<CenterModal isOpen={open} onClose={close} title="Create tag">
  <TagForm />
</CenterModal>
```

Advanced:

```tsx
<CenterModal
  isOpen={open}
  onClose={close}
  title="Invite user"
  subtitle="They will receive an email invite."
  size="lg"
  onBack={goBack}
  primaryAction={<Button loading={saving}>Send invite</Button>}
  secondaryAction={<Button variant="secondary" onClick={close}>Cancel</Button>}
  footerMeta={<span className="text-xs text-[var(--color-gray-500)]">Workspace owner only</span>}
>
  <InviteForm />
</CenterModal>
```

Migration note: replaces raw fixed overlays, one-off center dialogs, and older shared `Modal` implementations. `Modal` is a compatibility alias for `CenterModal`.

## ResponsiveModal

Import path: `src/components/ui/modal` or compatibility path `src/components/ui/Modal`.

Use it for flows that should render as a centered modal on desktop and a bottom/fullscreen sheet on mobile.

Do not hand-roll separate `CenterModal` and `MobileSheet` branches for new responsive modal flows.

Props:

- Inherits `CenterModal` props except `isOpen`, `onClose`, `title`, and `children`.
- `isOpen: boolean`; required; modal state.
- `onClose: () => void`; required; close callback.
- `title: React.ReactNode`; required; desktop title.
- `mobileTitle?: React.ReactNode`; default desktop title; mobile sheet title.
- `mobileFooter?: React.ReactNode`; default desktop `footer`; mobile sheet footer.
- `mobileHeaderActions?: React.ReactNode`; default `undefined`; mobile sheet header actions.
- `mobileFullScreen?: boolean`; default `false`; mobile sheet fills viewport.
- `mobileBorderless?: boolean`; default `false`; mobile sheet border style.
- `mobileBodyClassName?: string`; default `undefined`; optional wrapper around mobile body.
- `children: React.ReactNode`; required; body content.

Minimal:

```tsx
<ResponsiveModal isOpen={open} onClose={close} title="New broadcast">
  <BroadcastForm />
</ResponsiveModal>
```

Advanced:

```tsx
<ResponsiveModal
  isOpen={open}
  onClose={close}
  title="New broadcast"
  mobileTitle={<h2 className="text-base font-semibold">New broadcast</h2>}
  headerIcon={<Users size={20} />}
  size="md"
  width={512}
  bodyPadding="none"
  mobileFullScreen
  mobileFooter={<BroadcastActions />}
  primaryAction={<Button>Send</Button>}
  secondaryAction={<Button variant="secondary">Cancel</Button>}
>
  <BroadcastForm />
</ResponsiveModal>
```

Migration note: replaces paired desktop/mobile modal branches while reusing `CenterModal` and `MobileSheet` internally.

## Modal

Import path: `src/components/ui/Modal`.

Use it only when maintaining older code that imports the compatibility alias.

Do not use it for new code; import `CenterModal` from `src/components/ui/modal`.

Props:

- Same as `CenterModalProps`; `Modal` is exported as `CenterModal`.

Minimal:

```tsx
<Modal isOpen={open} onClose={close} title="Confirm">
  <p>Are you sure?</p>
</Modal>
```

Advanced:

```tsx
<Modal
  isOpen={open}
  onClose={close}
  title="Edit workspace"
  size="lg"
  primaryAction={<Button>Save</Button>}
  secondaryAction={<Button variant="secondary" onClick={close}>Cancel</Button>}
>
  <WorkspaceForm />
</Modal>
```

Migration note: compatibility alias for old `Modal` imports; migrate to `CenterModal` during import cleanup.

## ConfirmDeleteModal

Import path: `src/components/ui/modal` or compatibility path `src/components/ui/Modal`.

Use it for destructive delete confirmations that need the standard contact-delete style across desktop and mobile.

Props:

- `open: boolean`; required; controls visibility.
- `entityName: string`; required; display name for default heading.
- `entityType: string`; required; entity label for default title and confirm button.
- `onConfirm: () => Promise<void> | void`; required; confirm callback.
- `onCancel: () => void`; required; close/cancel callback.
- `isDeleting?: boolean`; default `false`; disables actions and shows loading on confirm.
- `title?`, `heading?`, `body?`, `confirmLabel?`; optional copy overrides.

Minimal:

```tsx
<ConfirmDeleteModal
  open={deleteOpen}
  entityName={userName}
  entityType="organization user"
  onCancel={closeDelete}
  onConfirm={deleteUser}
/>
```

Migration note: replaces page-local destructive modal clones and direct delete buttons without confirmation.

## SideModal

Import path: `src/components/ui/modal` or compatibility path `src/components/ui/Modal`.

Use it for desktop side drawers and contextual panels.

Do not use it for bottom sheets or centered confirmations.

Props:

- All base modal props from `CenterModal` except `size`.
- `width?: number | string`; default `480`; drawer width.

Minimal:

```tsx
<SideModal isOpen={open} onClose={close} title="Details">
  <DetailsPanel />
</SideModal>
```

Advanced:

```tsx
<SideModal
  isOpen={open}
  onClose={close}
  title="Broadcast details"
  width={560}
  showOverlay={false}
  allowBackgroundInteraction
  lockBodyScroll={false}
  bodyPadding="none"
>
  <BroadcastDetails />
</SideModal>
```

Migration note: replaces one-off side panels and contextual drawers.

## MobileSheet

Import path: `src/components/ui/modal`.

Use it for mobile bottom sheets and mobile fullscreen sheets.

Do not use it on desktop; desktop should use `CenterModal` or `SideModal`.

Props:

- `isOpen: boolean`; required; sheet state.
- `title: React.ReactNode`; required; header title node.
- `onClose: () => void`; required; close callback.
- `children: React.ReactNode`; required; sheet body.
- `headerActions?: React.ReactNode`; default `undefined`; header actions.
- `footer?: React.ReactNode`; default `undefined`; footer content.
- `fullScreen?: boolean`; default `false`; fills mobile viewport.
- `borderless?: boolean`; default `false`; removes sheet borders.
- `closeOnOverlayClick?: boolean`; default `true`; overlay click closes.
- `showOverlay?: boolean`; default `true`; renders backdrop.
- `lockBodyScroll?: boolean`; default `true`; locks body scroll.
- `showCloseButton?: boolean`; default `true`; shows close action.

Minimal:

```tsx
<MobileSheet isOpen={open} onClose={close} title="Filters">
  <FilterList />
</MobileSheet>
```

Advanced:

```tsx
<MobileSheet
  isOpen={open}
  onClose={close}
  title={<h2 className="text-lg font-semibold">Compose broadcast</h2>}
  fullScreen
  borderless
  headerActions={<Button size="xs">Save</Button>}
  footer={<Button fullWidth>Send</Button>}
>
  <Composer />
</MobileSheet>
```

Migration note: replaces the old `components/topbar/MobileSheet` import and any inline mobile bottom-sheet overlays.

## ModalLayout

Import path: `src/components/ui/modal` or compatibility path `src/components/ui/Modal`.

Use it for simple grid spacing inside modal bodies.

Do not use it as a modal shell; use `CenterModal`, `SideModal`, or `MobileSheet`.

Props:

- `children: React.ReactNode`; required; layout content.
- `padding?: "sm" | "md" | "lg"`; default `"md"`; outer padding.
- `columns?: 1 | 2`; default `1`; grid columns with two columns at `md+`.

Minimal:

```tsx
<ModalLayout>
  <BaseInput label="Name" />
</ModalLayout>
```

Advanced:

```tsx
<ModalLayout padding="lg" columns={2}>
  <BaseInput label="First name" />
  <BaseInput label="Last name" />
</ModalLayout>
```

Migration note: replaces ad hoc modal body grid wrappers.

## PageLayout

Import path: `src/components/ui/layout` or compatibility path `src/components/ui/PageLayout`.

Use it for every new desktop page view.

Do not wrap mobile-only views; `PageLayout` already returns children unchanged on mobile.

Props:

- `leading?: React.ReactNode`; default `undefined`; control before title.
- `eyebrow?: React.ReactNode`; default `undefined`; eyebrow label above title.
- `title: string`; required; page title.
- `subtitle?: string`; default `undefined`; page subtitle.
- `breadcrumbs?: BreadcrumbItem[]`; default `[]`; breadcrumb items.
- `actions?: React.ReactNode`; default `undefined`; right-side header actions.
- `toolbar?: React.ReactNode`; default `undefined`; header toolbar row.
- `aside?: React.ReactNode`; default `undefined`; full-height desktop side content rendered beside the page header and body.
- `asideOpen?: boolean`; default open when `aside` exists; controls the desktop side content collapse state.
- `asideWidth?: number | string`; default `undefined`; desktop side content width when open.
- `asideClassName?: string`; default `undefined`; extra class names for the controlled desktop side content wrapper.
- `children: React.ReactNode`; required; page content.
- `className?: string`; default `undefined`; root class.
- `contentClassName?: string`; default built-in scroll/padding class; content wrapper class.

Minimal:

```tsx
<PageLayout title="Contacts">
  <ContactsTable />
</PageLayout>
```

Advanced:

```tsx
<PageLayout
  leading={<IconButton icon={<ArrowLeft size={16} />} aria-label="Back" onClick={goBack} />} 
  eyebrow="Channels / WhatsApp"
  title="WhatsApp Cloud API"
  breadcrumbs={[{ label: "Channels", href: "/channels" }, { label: "WhatsApp" }]}
  toolbar={<BaseInput type="search" placeholder="Search templates" />}
  actions={<Button leftIcon={<Plus size={16} />}>Create</Button>}
  aside={<ContactDetailsPanel />}
  asideOpen={Boolean(selectedContact)}
  asideWidth={292}
>
  <TemplateList />
</PageLayout>
```

Migration note: replaces one-off desktop page shells and custom desktop headers.

## Breadcrumb

Import path: `src/components/ui/layout` or compatibility path `src/components/ui/Breadcrumb`.

Use it inside page shells or subpage headers to show route hierarchy.

Do not build custom breadcrumb rows.

Props:

- `items: Array<{ label: string; href?: string; onClick?: () => void }>`; required; breadcrumb items.
- `separator?: React.ReactNode`; default ChevronRight icon; separator.

Minimal:

```tsx
<Breadcrumb items={[{ label: "Channels", href: "/channels" }, { label: "Manage" }]} />
```

Advanced:

```tsx
<Breadcrumb
  items={[
    { label: "Settings", href: "/workspace/settings" },
    { label: "Tags", onClick: openTags },
    { label: selectedTag.name },
  ]}
  separator={<Slash size={12} />}
/>
```

Migration note: replaces page-local breadcrumb link rows.

## Card

Import path: `src/components/ui/Card`.

Use it only for older shared card surfaces already relying on `.card` styles.

Do not create nested page-section cards or new decorative section wrappers.

Props:

- `hover?: boolean`; default `false`; enables hover elevation.
- `children: React.ReactNode`; required; card content.
- Native div attributes are accepted.

Minimal:

```tsx
<Card>Content</Card>
```

Advanced:

```tsx
<Card hover className="space-y-3">
  <h3 className="font-semibold">Workspace</h3>
  <p className="text-sm text-[var(--color-gray-500)]">Active</p>
</Card>
```

Migration note: replaces older `.card` wrappers only; do not use as a new page shell.

## DataTable

Import path: `src/components/ui/DataTable`.

Use it for data tables with desktop table and mobile card behavior.

Do not use it for simple static lists or layouts that are not tabular data.

Props:

- `rows: T[]`; required; table rows.
- `columns: Array<{ id: string; header: React.ReactNode; cell: (row: T) => React.ReactNode; sortable?: boolean; sortField?: SortField; align?: "left" | "center" | "right"; className?: string; headerClassName?: string; mobile?: "primary" | "secondary" | "detail" | "hidden"; mobileLabel?: React.ReactNode }>`; required; column definitions.
- `getRowId: (row: T) => string | number`; required; stable row id.
- `loading?: boolean`; default `false`; loading state.
- `loadingLabel?: string`; default `"Loading..."`; loading text.
- `emptyTitle?: string`; default `"No records found"`; empty title.
- `emptyDescription?: string`; default `undefined`; empty description.
- `sort?: { field?: SortField; direction: "asc" | "desc"; onChange: (field: SortField) => void }`; default `undefined`; sort state.
- `rowActions?: (row: T) => Array<{ id: string; label: string; icon?: React.ReactNode; tone?: "default" | "danger"; disabled?: boolean; onClick: (row: T) => void | Promise<void> }>`; default `undefined`; row action menu.
- `onRowClick?: (row: T) => void`; default `undefined`; clickable rows.
- `getRowClassName?: (row: T) => string | undefined`; default `undefined`; row class hook.
- `renderMobileCard?: (row: T, helpers: { actions: React.ReactNode }) => React.ReactNode`; default built-in card; mobile renderer.
- `mobileLoadMore?: { hasMore: boolean; loading?: boolean; onLoadMore: () => void; loadingLabel?: string; endLabel?: string }`; default `undefined`; infinite mobile load.
- `footer?: React.ReactNode`; default `undefined`; desktop footer.
- `minTableWidth?: number`; default `800`; desktop table min width.
- `className?: string`; default `""`; root class.

Minimal:

```tsx
<DataTable
  rows={contacts}
  getRowId={(contact) => contact.id}
  columns={[{ id: "name", header: "Name", cell: (contact) => contact.name }]}
/>
```

Advanced:

```tsx
<DataTable
  rows={contacts}
  getRowId={(contact) => contact.id}
  loading={loading}
  sort={sort}
  columns={columns}
  rowActions={(contact) => [
    { id: "edit", label: "Edit", icon: <Pencil size={14} />, onClick: editContact },
    { id: "delete", label: "Delete", tone: "danger", icon: <Trash2 size={14} />, onClick: deleteContact },
  ]}
  onRowClick={openContact}
  mobileLoadMore={{ hasMore, loading: loadingMore, onLoadMore }}
  footer={<ListPagination {...paginationProps} />}
/>
```

Migration note: replaces page-local table shells, mobile table-card forks, sort buttons, and action menus.

## ListPagination

Import path: `src/components/ui/ListPagination`.

Use it for paginated list/table footers with matching mobile sentinel behavior.

Do not use it for infinite-only lists that have no page/total state.

Props:

- `page: number`; required; current page.
- `totalPages: number`; required; page count.
- `total: number`; required; total items.
- `limit: number`; required; page size.
- `itemLabel: string`; required; plural item label.
- `onPageChange: (page: number) => void`; required; page change callback.

Minimal:

```tsx
<ListPagination page={page} totalPages={totalPages} total={total} limit={20} itemLabel="contacts" onPageChange={setPage} />
```

Advanced:

```tsx
<ListPagination
  page={pagination.page}
  totalPages={pagination.totalPages}
  total={pagination.total}
  limit={pagination.limit}
  itemLabel="broadcasts"
  onPageChange={(nextPage) => loadPage(nextPage)}
/>
```

Migration note: replaces custom pagination button rows and mobile load-more sentinels for paginated resources.
