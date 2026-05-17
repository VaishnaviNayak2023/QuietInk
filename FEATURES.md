# QuietInk — Feature Documentation

> **Version:** 1.0.4  
> **Architecture:** React 19 + TypeScript + Tailwind CSS + IndexedDB (Offline-First)  
> **Target:** Mobile PWA (Progressive Web App)

---

## Table of Contents

1. [App Overview](#app-overview)
2. [Screen 1: Splash Screen](#screen-1-splash-screen)
3. [Screen 2: Onboarding](#screen-2-onboarding)
4. [Screen 3: Notes List (Normal Mode)](#screen-3-notes-list-normal-mode)
5. [Screen 4: Note Editor](#screen-4-note-editor)
6. [Screen 5: Private Space Menu](#screen-5-private-space-menu)
7. [Screen 6: Secure Vault](#screen-6-secure-vault)
8. [Screen 7: Decrypted Record Viewer](#screen-7-decrypted-record-viewer)
9. [Screen 8: Safety Planner](#screen-8-safety-planner)
10. [Screen 9: Silent SOS](#screen-9-silent-sos)
11. [Screen 10: Emergency Contacts](#screen-10-emergency-contacts)
12. [Screen 11: Device Safety Monitor](#screen-11-device-safety-monitor)
13. [Screen 12: AI Safety Assistant](#screen-12-ai-safety-assistant)
14. [Screen 13: Help Library](#screen-13-help-library)
15. [Security & Encryption](#security--encryption)
16. [Stealth Access Methods](#stealth-access-methods)
17. [Cross-Cutting Features](#cross-cutting-features)

---

## App Overview

QuietInk appears on the surface as a simple, minimal **notes and journaling app**. Underneath, it contains a hidden **Private Space** with safety tools designed for people in dangerous situations (e.g., domestic violence survivors). The Private Space is only accessible through hidden stealth triggers — no visible buttons, menus, or icons hint at its existence.

**Design Philosophy:**
- Surface level: Clean, minimal journaling app — nothing more
- Hidden level: Full safety suite with encrypted vault, SOS, AI assistant
- No browser-native dialogs (`alert`, `confirm`, `prompt`) — all replaced with custom in-app modals to avoid breaking stealth
- Offline-first — all data stored in IndexedDB, works without internet
- Mobile-first — renders as a phone-sized frame (390×844px)

---

## Screen 1: Splash Screen

**Purpose:** Brief animated loading screen shown when app first opens.

**Features:**
- Minimal "quietink" text with letter-spacing animation
- Thin horizontal line fade-in
- Auto-dismisses after 2.5 seconds
- Smooth fade-out transition to main screen

**Technical:**
- Uses Framer Motion for animations
- `absolute inset-0` positioned within the phone frame container

---

## Screen 2: Onboarding

**Purpose:** First-time setup — configure the app identity and master PIN.

**Features:**
- **Public Identity Name** — what the app title shows in Normal Mode (e.g., "My Personal Journal"). This is the name visible if someone opens the app.
- **Master PIN** — 4-digit PIN used to:
  - Access Private Space
  - Encrypt/decrypt vault items
  - Authorize sensitive operations (step-up auth)
- Clicking "Finalize Configuration" saves settings to IndexedDB and enters Normal Mode

**Data Stored:**
- `onboardingComplete: true` (settings store)
- `securePin: <hashed>` (settings store)
- `displayName: <name>` (settings store)
- PIN verifier for future authentication (encrypted with PBKDF2 + AES-256)

---

## Screen 3: Notes List (Normal Mode)

**Purpose:** The app's public face — a standard notes/journal list.

**Features:**
- **Header:** Shows the public identity name (e.g., "ANYA") + settings gear icon
- **Search Bar:** Functional search that filters notes by title/content
  - *Hidden feature:* Typing the 4-digit PIN in the search box silently enters Private Space
- **Notes List:** Displays all notes sorted by last updated
  - Each note shows: title, preview text (first 80 chars), formatted date
  - Hover reveals a trash icon for quick deletion
  - Click opens the Note Editor
- **Create New Note:** Button at bottom creates a new note with a default title
- **Footer:** Shows "QuietInk v1.0.4" and note count — purely journal-like

**Stealth Triggers from this screen:**
1. Type 4-digit PIN in search bar → enters Private Space
2. Long-press (2 seconds) on the app title → enters Private Space
3. Type `safe://open` or `#private_mode` in any note → enters Private Space

---

## Screen 4: Note Editor

**Purpose:** Full-screen note editing view.

**Features:**
- **Back button** — returns to notes list
- **Editable title** — inline title editing in the header
- **Delete button** — trash icon in header, triggers confirmation modal
- **Full-screen textarea** — for note content, auto-saves on every keystroke
- **Stealth keyword trigger** — typing `safe://open` or `#private_mode` in note content silently switches to Private Space

**Auto-save:** Every character change is immediately persisted to IndexedDB and synced to Firestore (if signed in).

---

## Screen 5: Private Space Menu

**Purpose:** Dashboard of all safety tools, accessible only via stealth triggers + correct PIN.

**Layout:** 2×4 grid of feature cards + system panels below.

**Feature Cards:**
| Card | Screen | Description |
|------|--------|-------------|
| Secure Vault | `vault` | Encrypted file storage |
| Safety Planner | `planning` | Safety checklist with persistent checkboxes |
| Silent SOS | `sos` | Emergency distress signal |
| Action Contacts | `contacts` | Emergency contact management |
| Device Monitor | `safety-check` | Device safety scan simulation |
| AI Assistant | `ai` | Gemma 4–powered safety chatbot |
| Help Library | `library` | Offline safety knowledge base |
| Security Settings | (inline) | Auto-lock timer configuration |

**System Panels (below grid):**

### Cloud Sync Panel
- **Signed out:** Shows "Cloud Sync Disabled" with Google Sign-In button
- **Signed in:** Shows account email + Push/Pull buttons
  - **Push to Cloud:** Uploads encrypted data to Firestore
  - **Pull from Cloud:** Downloads and replaces local data from Firestore
  - Confirmation modal before pulling (destructive action)

### Security Settings (togglable)
- **Auto-Lock Timer:** Enable/disable + configurable timer (1/2/5/10/15/30 minutes)
- When enabled, Private Space auto-locks after inactivity period

### System Metrics
- Encryption status: AES-256 Active
- Cloud status: SYNC ACTIVE or AIR-GAPPED

### Quick Actions
- **Dark Mode / Light Mode toggle** — persisted to IndexedDB
- **Export Backup** — downloads full JSON backup file

### Safety Termination
- **Emergency System Wipe** — permanently deletes ALL data (vault, contacts, notes, settings)
- Requires confirmation modal + step-up PIN re-authentication
- Wipes IndexedDB stores, Firestore data, and local storage

**Header:** "PRIVATE SPACE" with EXIT button (returns to Normal Mode).

---

## Screen 6: Secure Vault

**Purpose:** Encrypted storage for sensitive files — photos, text notes, voice recordings, documents.

**Features:**
- **Item List:** Shows all vault entries with type badge (TEXT/IMAGE/VOICE/DOCUMENT), title, and timestamp
- **Delete Entry:** Trash icon per item, requires step-up PIN auth
- **View Entry:** Click any item → PIN re-authentication → decrypted view opens
- **Add New Items:**
  - **+ TEXT:** Opens inline form to type a label and text content, encrypts and saves
  - **+ IMAGE:** Opens file picker for images, prompts for title
  - **+ VOICE:** Records audio via microphone (MediaRecorder API), prompts for title
  - **+ DOCUMENT:** Opens file picker for any file type, prompts for title

**Encryption:** All content is encrypted with AES-256 using a key derived from the master PIN via PBKDF2 (100,000 iterations). The encrypted payload is stored as a string in IndexedDB.

---

## Screen 7: Decrypted Record Viewer

**Purpose:** Temporary viewing overlay for a decrypted vault item.

**Features:**
- **Image type:** Displays the decrypted image with `object-contain` sizing
- **Text type:** Displays decrypted text in monospace font with scroll
- **Voice type:** Audio player with playback controls
- **Document type:** Shows first 500 chars of content + "DOWNLOAD & VIEW" button
- **Close button** — clears decrypted content from memory immediately
- Footer text: "Temporary Decrypted Buffer • Not cached on disk"

**Security:** Decrypted content is held only in React state. Closing the overlay sets it to `null`, removing it from memory. No decrypted content is ever written to disk.

---

## Screen 8: Safety Planner

**Purpose:** Interactive safety checklist for personal safety planning.

**Features:**
- Checklist of safety planning items with checkboxes
- **Persistent state:** Checkbox states are saved to IndexedDB (`planChecks` setting)
- Completed items show with strikethrough text
- Items include things like: emergency bag, important documents, safe location, etc.

---

## Screen 9: Silent SOS

**Purpose:** Emergency distress signal that sends a coded message to emergency contacts.

**Features:**
- **3-second hold button:** Press and hold the large SOS button for 3 seconds to trigger
- **Auto-sends SMS:** Opens `sms:` URL to the first emergency contact with the pre-configured code message
- **Post-trigger:** Shows "SOS SENT" state + direct SMS links to up to 3 contacts
- **No contacts warning:** If no contacts configured, shows "Add emergency contacts first"
- Silent — no sound, no visible notification to bystanders

---

## Screen 10: Emergency Contacts

**Purpose:** Manage trusted emergency contacts with coded messages.

**Features:**
- **Contact List:** Shows name, phone number, and coded message for each contact
- **Delete Contact:** Trash icon per contact, requires step-up PIN auth
- **Add Contact Form:**
  - Name field
  - Phone number field
  - Code message field (pre-populated: "Can you pick up milk?")
  - Save button
- Contacts are stored in IndexedDB and synced to Firestore if signed in

**Code Message:** A innocent-sounding message that the contact understands means "I need help" (e.g., "Can you pick up milk?").

---

## Screen 11: Device Safety Monitor

**Purpose:** Simulated device safety scan.

**Features:**
- Animated scanning progress bar
- Displays "STATUS: SAFE" when scan completes
- Decorative feature to reassure the user (does not perform actual system scanning)

---

## Screen 12: AI Safety Assistant

**Purpose:** Context-aware safety chatbot for guidance and information.

**Architecture:** Hybrid engine with automatic fallback:

### Online Mode (Gemma 4)
- Routes queries to server-side Gemma API proxy (`/api/chat`)
- Full conversational AI with safety-focused system prompt
- Markdown-rendered responses

### Offline Mode (Local RAG)
- Keyword-matching against the built-in Safety Library
- Scores library entries by keyword relevance
- Returns the best-matching safety protocol
- Works with zero network connectivity

**UI Features:**
- Engine indicator badges (Gemma/Local, Online/Offline, Secure E2E)
- Chat message history with role-based styling
- Loading animation while processing
- Input field with Enter-to-send
- "RETURN TO SYSTEM CORE" button to go back

**Fallback Behavior:** If online but Gemma API fails, automatically falls back to local engine.

---

## Screen 13: Help Library

**Purpose:** Static, offline-accessible safety knowledge base.

**Features:**
- Curated safety articles organized by category
- Markdown-rendered content
- Categories include: digital safety, physical safety, legal resources, etc.
- Always available — no internet required
- Sourced from `src/constants/library.ts`

---

## Security & Encryption

### Encryption Pipeline
| Component | Details |
|-----------|---------|
| Algorithm | AES-256 (via CryptoJS) |
| Key Derivation | PBKDF2 with 100,000 iterations |
| Salt | Randomly generated 128-bit salt per device, stored in IndexedDB |
| PIN Verification | Encrypted "VERIFIED" string — decryption proves correct PIN |

### Step-Up Authentication
Sensitive operations require the user to re-enter their PIN via an in-app modal:
- Viewing vault items
- Deleting vault items
- Deleting contacts
- Emergency wipe

### Emergency Wipe
- Triggered from Private Space menu
- Requires confirmation modal + step-up PIN auth
- Deletes: all IndexedDB stores, Firestore data (if signed in), local storage
- Forces page reload to reset app state

### Auto-Lock
- Configurable inactivity timer (1–30 minutes)
- On timeout: clears validated PIN, switches to Normal Mode
- Shows "Session timed out for security" alert
- Timer resets on any mouse/keyboard activity

### Shake-to-Lock
- Uses DeviceMotion API
- 3 rapid shakes (acceleration delta > 25) within 1 second
- Instantly exits Private Space, clears PIN
- Works on mobile devices with accelerometer

---

## Stealth Access Methods

There are **4 hidden ways** to enter Private Space. None are visible in the UI:

| Method | How | Where |
|--------|-----|-------|
| **Search PIN** | Type 4-digit PIN in the search box | Notes List screen |
| **Long Press** | Hold app title for 2 seconds | Notes List header |
| **Note Keyword** | Type `safe://open` in any note | Note Editor |
| **Note Keyword** | Type `#private_mode` in any note | Note Editor |

All methods silently transition to Private Space with no visible indicator to bystanders.

---

## Cross-Cutting Features

### Custom Modal System (`Modal.tsx`)
All user interactions use in-app modals instead of browser-native dialogs:
- **AlertModal** — information display with "Understood" button
- **ConfirmModal** — yes/no confirmation with optional danger styling
- **PromptModal** — text input with submit/cancel

Exposed via `useModal()` hook: `showAlert()`, `showConfirm()`, `showPrompt()`

### Dark Mode
- Toggle in Private Space quick actions
- Persisted to IndexedDB
- CSS custom properties override light theme values
- Applied via `.dark` class on root element

### PWA Support
- `manifest.json` — enables "Add to Home Screen" on mobile
- `sw.js` — service worker for offline caching
- Apple mobile web app meta tags
- Description: "A personal digital journal" (stealth-safe)

### Data Persistence (IndexedDB)
All data stored locally in IndexedDB with 4 stores:
- `notes` — journal entries
- `contacts` — emergency contacts
- `vault` — encrypted vault items
- `settings` — app configuration (PIN, display name, dark mode, plan checks, etc.)

### Cloud Sync (Optional)
- Google authentication via Firebase Auth
- Firestore document storage with ownership validation
- All data encrypted with PIN before upload
- Push/Pull model — manual sync, not automatic
- Firestore security rules enforce per-user data isolation

### Export Backup
- Downloads full JSON file containing notes, contacts, and vault data
- Vault items remain encrypted in the export
- Filename includes timestamp for versioning

### Offline-First Architecture
- All features work without internet
- AI assistant falls back to local RAG engine
- Cloud sync is optional enhancement
- No external API calls required for core functionality

---

## File Structure

```
src/
├── App.tsx                    # Main application (all screens)
├── main.tsx                   # React entry point
├── index.css                  # Tailwind + dark mode CSS
├── components/
│   └── Modal.tsx              # Custom modal system + useModal hook
├── services/
│   ├── storage.ts             # IndexedDB + Firestore storage layer
│   ├── vaultService.ts        # AES-256 encryption pipeline
│   ├── aiService.ts           # Hybrid AI (Gemma + local RAG)
│   └── firebase.ts            # Firebase config + auth
├── constants/
│   └── library.ts             # Safety knowledge base content
└── lib/
    └── utils.ts               # cn() helper
public/
├── manifest.json              # PWA manifest
└── sw.js                      # Service worker
```
