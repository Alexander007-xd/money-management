# UI Spec: Taka Khata

## Design principles
The app should feel like a clean, friendly paper account book (খাতা), not a generic AI-made app. Warm paper background, dark green ink, simple words, big numbers, big buttons. A small child should understand every screen with no explanation.

Things to AVOID (they make an app look auto-generated): purple/blue gradients, glassmorphism, neon glows, emoji as icons, many cards with identical shadows, tiny grey text, default Inter-only look, decorative blobs, more than one accent color.

Signature details (use consistently):
1. Ledger rows: label on the left, amount on the right, joined by a dotted leader line.
2. Paper background with a very faint ruled-line texture on Home only.
3. Money received is always green with a plus sign. Money spent is always brick red with a minus sign. Never swap.

## Design tokens (`src/styles/tokens.css`)
```css
:root {
  --paper: #FBF7EF;
  --surface: #FFFFFF;
  --line: #E6DECF;
  --ink: #1F2A24;
  --ink-muted: #5F594D;
  --income: #1E7B4F;
  --income-soft: #E3F2EA;
  --expense: #B5412F;
  --expense-soft: #F8E6E1;
  --warning: #B7791F;
  --focus: #1F2A24;

  --radius-s: 10px;
  --radius-m: 16px;
  --radius-l: 24px;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px;

  --font: "Hind Siliguri", system-ui, sans-serif;
  --fs-body: 17px;
  --fs-small: 15px;
  --fs-title: 22px;
  --fs-big: 28px;
  --fs-balance: 46px;
}
```
Typography: single family Hind Siliguri (supports Bangla and English), weights 400, 500, 700, self-hosted through `@fontsource/hind-siliguri` so it works offline. Numbers use `font-variant-numeric: tabular-nums`. Minimum text size 15px, body 17px. Line height 1.5.

Spacing: page horizontal padding 20px. Tap targets minimum 48px height. Focus outline 3px solid `--focus` with 2px offset.

Icons: `lucide-react` line icons, 24px, stroke 2. Category icon names are in Schema.md.

## Components

### Button
- `primary-income` (green background, white text), `primary-expense` (red background, white text), `secondary` (white, 2px ink border), `ghost` (text only).
- Height 56px, radius `--radius-m`, font weight 700, full width on forms.
- States: default, pressed (darken 8%), disabled (40% opacity, no pointer), loading (text replaced by "..." and disabled).

### BigActionButton (Home)
Two side-by-side tiles, each at least 120px high, radius `--radius-l`. Left: green soft background `--income-soft`, plus icon, label "Received / টাকা পেলাম". Right: red soft background `--expense-soft`, minus icon, label "Spent / খরচ করলাম". Label 22px bold.

### BalanceCard
Top of Home. Small label "Money that should be left / এখন যত টাকা থাকা উচিত", number at `--fs-balance` bold in `--ink`. Negative balance shows in `--expense` with a one-line hint: "You wrote more spending than money received. Check your entries." No card border, sits directly on paper with a dotted underline.

### LedgerRow
Left: icon in a 40px circle with soft background, title (category or source) and small muted date/note below. Right: amount with sign and color. A dotted leader (`border-bottom: 2px dotted var(--line)`) fills the gap between title and amount. Whole row is tappable (min height 64px).

### CategoryTile (expense form)
Grid of 3 columns, each tile square-ish (min 96px), icon on top, name below. Selected tile: 3px ink border and soft red background. Unselected: white with `--line` border.

### AmountInput
Large centered number field (font 44px bold), numeric keypad (`inputmode="decimal"`), ৳ symbol at left. Autofocus on open. Error text below in `--expense`, 15px.

### Field (text, date)
Label above (17px, 500), input 56px high, radius `--radius-m`, 2px `--line` border, focus border `--ink`. Date uses native date input with `max` set to today.

### BottomNav
4 items: Home, History, Report, More. 64px high, icon + label (label always visible), active item uses ink color and a 3px top bar, inactive `--ink-muted`. Hidden on form screens.

### Toast
Bottom, above nav, dark ink background, white text, 5 seconds, optional "Undo" text button.

### ConfirmDialog
Centered sheet on dim overlay, title, one sentence, two buttons (Cancel secondary, Confirm primary). Destructive confirm uses expense color.

### EmptyState
Simple line illustration is NOT required. Use one icon (48px, muted), one friendly sentence, one button.

### BarRow (Report)
Label + amount on first line, then a 14px high bar with radius 7px, background `--line`, fill `--expense` at the category percent, percent text at right.

## Per-screen layout

### Welcome
Centered app name "টাকা খাতা / Taka Khata" (title), one sentence ("Write what you get, write what you spend, always know what is left."), two big language buttons "বাংলা" and "English", then it goes to Home.

### Home
1. Header: app name small, left. Date right.
2. BalanceCard.
3. Row with two BigActionButtons.
4. "This month" strip: two small ledger rows (Received, Spent).
5. "Check my money" card (secondary style) linking to CashCheck, with one-line explanation.
6. "Latest" section: 5 LedgerRows, "See all" link.
Empty state: BalanceCard shows 0, below the buttons show EmptyState text "Nothing written yet. Start with the first amount."

### AddIncome / AddExpense
Top bar: back arrow and title ("Money received" / "Money spent"). AmountInput first. Expense: CategoryTile grid next. Then date field (default today, shown as "Today" with change option), then note (optional, collapsed to a "Add note" link), then one primary button "Save / সেভ করুন" fixed at bottom. Income also has "From" field with chips below it: Baba/বাবা, Mama/মা, Other, plus recent values.

### EditEntry
Same form as add, plus a ghost-style red "Delete" button at the bottom.

### History
Top: month switcher (left/right arrows, month name). Below: 3 segmented chips (All, Received, Spent). Optional category chip row when type is Spent. List grouped by day with a sticky day header ("Today", "Yesterday", or date) and its day total on the right. Empty state when nothing in the filter.

### Report
Month switcher. Three summary rows (Received, Spent, Left). Then "Where money went" with BarRows. If no spending: EmptyState. Link "Check my money" at the bottom.

### CashCheck
Title "Check my money". Explanation sentence: "Count the money you really have (cash and mobile wallet) and type it here." Show "Should be left: ৳X" first, then AmountInput for real amount, button "Check". Result block: big colored status (green "Matches", red/amber "X less" or "X more"), explanation sentence, action button when different, "Check again". Below: list of last 5 checks as LedgerRows.

### More
List of large rows: Language (switch), Categories, Backup, Install on phone, About (version).

### Categories
List of categories with icon and name, toggle to show/hide, rename button, "Add category" button (name in current language used for both fields, icon picker grid of the 12 allowed icons).

### Backup
Two big buttons: "Save backup file" and "Restore from backup". Under each a short explanation. A reminder card: "Your data lives only on this phone. Save a backup once a week."

### InstallHelp
Numbered short steps for Android Chrome ("Tap the three dots, tap Add to Home screen, tap Install") in both languages. If the browser's install prompt is available, show an "Install" button.

## Responsive and accessibility rules
- Design for 360px width first; max content width 480px centered on larger screens.
- Contrast ratio at least 4.5:1 for text.
- Every icon-only button has an aria-label (translated).
- Never rely on color alone: always show the sign (+ or -) and the words Received/Spent.
- Respect `prefers-reduced-motion`.

## Motion
Only two: a 150ms fade/slide on page change and a 120ms press scale (0.98) on buttons. Nothing else.

## Copy tone
Short, warm, simple words, no accounting jargon. Bangla copy uses everyday words. All strings live in the two i18n files.
