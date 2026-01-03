# Varna Banker - AI Coding Agent Instructions

## Project Overview
Varna Banker is a Kivy-based mobile loan management application for tracking pawn/jewelry loans. It's a single-file Python app that manages loan entries with image attachments, interest calculations, and search functionality.

## Architecture & Key Components

### Main Entry Point: `kviy.py`
- **Single file application** - all UI and business logic in one module
- Uses **Kivy framework** for cross-platform mobile UI
- Persistent storage using **JSON file** (`loan_entries.json`) with no external database

### Core Classes (in dependency order)
1. **`FileChooserPopup`** - Modal dialog for image selection (line 20-43)
2. **`LoanForm`** - Main UI widget containing form fields and all business logic (line 45-230)
3. **`VarnaBankerApp`** - Kivy App entry point (line 232-234)

### Data Storage
- Records stored in `loan_entries.json` as JSON array of objects
- Each record contains 17 fields: Serial Number, Series Code, Date, Customer Name, Address, Phone, Item, Weight, Amount, Rate, Days, Duration, Interest Amount, Closing Date, Closing Amount, Vendor, Remarks
- Image paths stored as string references, not actual images

## Critical Workflows & Patterns

### Form Management
- Form fields defined in `self.fields` list (lines 69-72) - maintain this list when adding/removing fields
- Text input auto-focus pattern: `_focus_next()` moves focus to next field on text validation (lines 82-86)
- All inputs stored in `self.inputs` dictionary keyed by field name

### Interest Calculation
- Triggered by "Calculate Interest" button → `calculate_interest()` method (lines 88-110)
- Formula: `(Amount × Rate × Days) / (100 × 30)` - hardcoded 30-day month assumption
- Automatically calculates: duration breakdown (years/months/days), interest amount, closing amount
- Dates expected in `DD-MM-YYYY` format

### Record Persistence
- `save_record()` appends new records to JSON file (lines 117-125)
- `_show_records()` displays last 10 matching records in scrollable popup (lines 130-159)
- Search filters by "Customer Name" field using substring matching
- Silent failure on JSON decode errors - displays popup instead of crashing

### Image Handling
- Image selected via `FileChooserPopup` modal
- `load_image()` stores filepath and updates preview widget (lines 215-219)
- Preview uses Kivy `Image` widget with `reload()` call

## Development Workflows

### Building & Deployment
- Mobile APK built with **Buildozer** (see `buildozer.spec`)
- Build command: `buildozer android debug` or `buildozer android release`
- Android API: 33 (target), 21 (minimum)
- NDK version: 25b
- Required permissions: READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, CAMERA

### Local Development
- No setup.py or requirements.txt - single app file
- Run locally: `python kviy.py`
- Dependencies only on Kivy (specified in buildozer.spec under `requirements`)

## Project-Specific Conventions

### Date Handling
- All dates use `DD-MM-YYYY` format exclusively (enforced by strptime calls)
- Date calculations use `datetime.timedelta.days`
- Interest calculation assumes 30 days per month, 365 days per year

### UI Patterns
- Popups for error/success messages: `show_popup(title, message)`
- Modal dialogs (ModalView) for file selection and record viewing
- Grid layout (2 columns) for form field labels and inputs
- Button callbacks follow pattern: `btn.bind(on_release=self.method_name)`

### Error Handling
- Try-except blocks wrap risky operations (date parsing, JSON decode, interest calc)
- User-facing errors shown in popups, not logged
- Silent failures: malformed JSON doesn't crash, just shows "Error" popup

## Integration Points & Dependencies

### External Dependencies
- **Kivy**: UI framework (kivy.app, kivy.uix.*, kivy.properties)
- Standard library: datetime, os, json

### File I/O
- Single JSON file: `loan_entries.json` (created in app working directory)
- Image files: paths stored but not managed by app (referenced from device filesystem)

### No External Services
- No database, API, or network integration
- Entirely local/offline operation

## When Modifying This Codebase

### Adding New Fields
1. Add to `self.fields` list (line 69-72)
2. Form automatically creates label + input widget pair
3. Update interest calculation if field affects formula
4. Update record display lines in `_show_records()` if needed

### Fixing Date Issues
- Check date format is `DD-MM-YYYY` in user input
- Catch `ValueError` from strptime for malformed dates
- Remember 30-day month assumption in interest formula is intentional

### Improving Record Persistence
- All writes use JSON format - maintain compatibility
- Search implementation (line 142) is case-insensitive substring match
- Last 10 records shown by design (line 146) - change limit as needed

### Mobile Deployment Changes
- Buildozer config in `buildozer.spec` controls APK generation
- Ensure minimum API level 21 for Android compatibility
- Permissions list must include any new device features (camera, storage, etc.)
