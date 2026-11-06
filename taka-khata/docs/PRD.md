# PRD: Taka Khata (টাকা খাতা)

## Overview
A very simple phone app for one person to record every taka received (for example from her father) and every taka spent (hostel, cook, wifi, electricity, gas, food and more), so that at any moment she can see how much money should be left. It also lets her check that against the money she actually has, so she can find out when she forgot to write an expense.

## Target user
A university student living in a hostel who receives money in several small instalments each month and loses track of where it went. Not technical. The app must be understandable by a small child: big buttons, few screens, plain words. Her friends will use the same app on their own phones.

## Goals
1. Add a received amount or a spent amount in under 10 seconds.
2. Always show one big number: money that should be left now.
3. Show where money went this month (by category) in a way anyone understands.
4. Let the user compare "should be left" with "actually in hand" and see the difference.
5. Work fully offline on an Android phone, installable from a link with no app store.

## Non-goals (v1 will NOT do)
- No login, no accounts, no cloud sync, no server.
- No splitting bills between roommates, no multi-person groups.
- No bank/bKash/Nagad integration, no SMS reading.
- No budgets, reminders, notifications, dark mode, or AI features.
- No photos/receipts.

## Features

### F1 Record money received
User story: As a student, I want to write down money I received, so that my balance is correct.
Acceptance:
- Fields: amount (required, greater than 0), from (optional text, suggestions from past entries, default suggestion "Baba/বাবা"), date (default today, cannot be in the future), note (optional).
- After saving, return to Home and balance is updated.

### F2 Record money spent
User story: As a student, I want to write what I spent and on what, so that I know where my money went.
Acceptance:
- Fields: amount (required, greater than 0), category (required, shown as big tappable tiles), date (default today, cannot be in the future), note (optional).
- Default categories: Hostel Rent, Cook, Food, Wifi, Electricity, Gas, Transport, Study, Other (with Bangla names, see Schema.md).
- After saving, return to Home and balance is updated.

### F3 Home screen
User story: As a student, I want to open the app and instantly see how much money I should have.
Acceptance:
- Shows "should be left now" (total received minus total spent, all time) as the biggest number.
- Shows this month received and this month spent.
- Two huge buttons: "Received / টাকা পেলাম" and "Spent / খরচ করলাম".
- Shows the last 5 entries with a link to see all.
- Empty state: friendly sentence and the two buttons.

### F4 History
User story: As a student, I want to see and fix past entries.
Acceptance:
- List grouped by day, newest first, filter by month (previous/next month arrows) and by type (All, Received, Spent).
- Tap an entry to edit or delete. Delete asks for confirmation and offers Undo for 5 seconds.

### F5 Monthly report
User story: As a student, I want to see which things took most of my money this month.
Acceptance:
- Month picker. Total received, total spent, left (received minus spent for that month).
- Spent by category as horizontal bars with amount and percent, sorted high to low. No chart library.
- Tapping a category opens History filtered to that category and month.

### F6 Check my money (Cash check)
User story: As a student, I want to type the money I actually have and see if it matches my records.
Acceptance:
- User enters the real amount in hand (cash + mobile wallet, one number).
- App shows expected amount, real amount, and difference.
- If equal: friendly "Matches" message. If real is less: "You have X less. You may have forgotten to write a spend." with a button "Add it as a forgotten expense" that opens the expense form with amount and category Other prefilled. If real is more: "You have X more. You may have forgotten to write money received." with a button that opens the received form prefilled.
- Each check is saved in history of checks (date, counted, expected, difference).

### F7 Languages
Bangla and English. Switch on the More screen and on first launch. Default Bangla. Numbers use Bangla digits in Bangla mode and Latin digits in English mode. Currency symbol ৳.

### F8 Backup and restore
- Export all data to one JSON file (downloaded to the phone).
- Import from that JSON file. Importing replaces all current data after a clear confirmation.

### F9 Categories
- User can add a new category (name, pick one icon from a fixed set), rename, and hide (archive) any category. Default categories cannot be deleted, only hidden. Hidden categories still show in old entries.

### F10 Install and offline
- Installable as PWA on Android Chrome, works with no internet after first load.
- An "Install on phone" help screen with simple steps in both languages.

## Constraints
- Mobile first (360 to 430px wide), also usable on desktop.
- Free to host (static hosting). No backend.
- Each person's data stays only on their own phone.

## Success criteria for v1
A new user can add a received amount and a spent amount, see the correct balance, run a cash check, export a backup, and use everything offline, without reading any instructions.

## Out of scope / future ideas
Roommate bill splitting, cloud sync, monthly budget limits, reminders, dark mode, charts over time.
