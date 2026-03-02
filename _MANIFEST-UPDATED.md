# _MANIFEST.md
## School Application Tracker - File Guide for Claude/Cowork
**Last Updated:** March 2, 2026  
**Owner:** Michael Sarmento  
**Purpose:** This manifest tells Claude which files are the source of truth and which to ignore when working in this folder.

---

## SESSION START PROTOCOL
Before doing ANY work, Claude must:
1. Confirm it has read this MANIFEST
2. State which Tier 1 files it loaded
3. Say: "Ready. Here's what I loaded: [list files]. What would you like to work on?"

Do not begin executing tasks until this confirmation is complete.

---

## TIER 1: CANONICAL (Source of Truth - Read These First)
These are the current, authoritative files. Claude MUST read these before doing any work.

### Primary Application Files
- **`school-email-tracker.html`** — CURRENT production dashboard (3 tabs: Applications, Financial Aid, Decision Analytics)
  - Live version deployed on Vercel at school-tracker-six.vercel.app
  - Contains all existing functionality — preserve everything
  - **Last Major Update:** March 2, 2026 (Financial Aid + Decision Analytics tabs rebuilt)
  - DO NOT modify without explicit instruction
  
- **`data/tracker.json`** — CURRENT live data file
  - Updated by Gmail scanner every 12 hours
  - Single source of truth for all school statuses, deadlines, financial aid, and decision analytics
  - **New fields added March 2, 2026:**
    - `cost_breakdown` (6 fields: total_coa, tuition_fees, housing_food, books_supplies, transportation, personal)
    - `financial_aid` (9 fields: pell_grant, cal_grant, school_grants, work_study, federal_loans, other_aid, total_aid, net_cost, out_of_pocket)
    - `decision_analytics` (criteria_ratings, criteria_weights, pros, cons, gut_feeling_history, deal_breakers)
  
- **`context.md`** — AUTHORITATIVE project documentation *(updated March 2, 2026)*
  - Read this to understand the full system, feature history, and lessons learned
  - Documents all 3 tabs, data structures, and recent changes
  - Supersedes context_2_16_26.docx

### Configuration Files
- **`vercel.json`** — Vercel deployment config. DO NOT modify unless changing deployment settings.
- **`gmail-scanner.gs`** — Google Apps Script for automated Gmail scanning. Only modify if changing email detection logic.

### Documentation
- **`SETUP-GUIDE.md`** — Complete setup and troubleshooting reference. Read-only.

---

## TIER 2: DOMAIN-SPECIFIC (Load Only When Relevant)
Load these only when the task explicitly touches that domain.

- **`scholarship-hunter-context.md`** → Only when building the Scholarship Hunter as a *separate* project. Do NOT integrate into main tracker.
- **`school-email-monitor-guide.md`** → Only when troubleshooting the Gmail scanner or email detection.
- **`automation-workflow-guide.md`** → Only when the Gmail automation fails and manual workflow is needed.

---

## TIER 3: ARCHIVAL (Ignore Unless Explicitly Asked)
These are outdated or superseded. Claude should skip these entirely.

- **`context_2_16_26.docx`** — Old version of context.md. Superseded by context.md (updated March 2, 2026). Ignore.
- **`school-email-tracker-ORIGINAL.html`** — Pre-Financial Aid backup from Feb 26, 2026. Do not use unless explicitly restoring.
- **`school-email-tracker-FIXED-AUTOFILL.html`** — Development version from March 2, 2026. Merged into main HTML. Ignore.
- **Any file with** `-OLD`, `-BACKUP`, `-v1`, `-DRAFT`, `.bak`, `-FIXED`, `-COMPLETE` in the name → outdated, ignore
- **Any files in** `/drafts/` or `/archive/` → incomplete or historical, ignore
- **Any `.png`, `.jpg`, `.gif` files** → reference images only, ignore unless asked about visual design

---

## WHAT CHANGED (March 2, 2026)

### Tab 2: Financial Aid — Complete Rebuild
**Previous State:** Had placeholder hardcoded costs, basic form  
**New State:** Full-featured financial comparison tool

**Changes:**
- ✅ Replaced hardcoded BASE_COSTS with accurate 2026-27 COA from tracker.json
- ✅ Added expandable cost breakdown table (click "Details" button per school)
- ✅ Built comprehensive aid package entry form with live calculations
- ✅ Implemented Smart Insights panel (cheapest, most expensive, averages)
- ✅ Color-coded schools by affordability (green/yellow/red)
- ✅ All 11 schools now display with status badges

**New Functions Added:**
- `toggleFinRow(schoolKey)` — Expands/collapses cost details
- `loadAidPackage()` — Loads saved aid data into form
- `calculateAidTotals()` — Real-time calculation of Total Aid, Net Cost, Out-of-Pocket
- `saveAidPackage()` — Persists aid data to tracker.json
- `clearAidForm()` — Resets form to defaults

### Tab 3: Decision Analytics — Complete Rebuild
**Previous State:** Only showed accepted schools (2), old 6-criteria system  
**New State:** Shows all 11 schools, 5 simplified criteria, objective research data

**Changes:**
- ✅ Changed from "accepted only" to "ALL schools" with optional filter
- ✅ Simplified from 6 criteria → 5 criteria (removed campus_resources, distance_from_home)
- ✅ New criteria: Net Cost, Program Quality, Career Outcomes, Location & Vibe, Gut Feeling
- ✅ Added "Auto-Fill from Research Data" button
- ✅ Embedded comprehensive objective research for all 11 schools:
  - US News rankings (2024-2025)
  - PayScale salary data (starting + mid-career)
  - Employment rates from official university reports
  - Top employer lists
  - Location job market analysis
- ✅ Built expandable "📊 View Research Data" panels per school
- ✅ Added decision deadline countdown banner
- ✅ Fixed auto-fill to populate ALL schools (not just accepted)
- ✅ Rebuilt Pros & Cons journal with better UI

**New Constant Added:**
- `OBJECTIVE_DATA` — Embedded research data for all 11 schools (program rankings, salaries, employment rates, location scores)

**New Functions Added:**
- `autoFillObjectiveRatings()` — Pre-populates ratings from research data
- `toggleResearchData(schoolKey)` — Expands/collapses research panel
- Updated: `updateGlobalWeight()`, `updateSchoolRating()`, `toggleProscons()`, `addProItem()`, `deletePro()`, `addConItem()`, `deleteCon()`

### Data Structure Updates (tracker.json)
All 11 schools now have:
```json
{
  "cost_breakdown": { /* 6 fields */ },
  "financial_aid": { /* 9 fields */ },
  "decision_analytics": {
    "criteria_ratings": { /* 5 criteria */ },
    "criteria_weights": { /* 5 weights */ },
    "pros": [ /* array of {text, date} */ ],
    "cons": [ /* array of {text, date} */ ]
  }
}
```

---

## UNCERTAINTY PROTOCOL
When Claude is unsure about any action, follow this decision tree — in order:

1. **Unsure whether to modify a file?** → Create a new file instead. Never touch Tier 1 without explicit permission.
2. **File could belong to multiple categories?** → Ask the user before acting.
3. **Conflicting instructions between files?** → This MANIFEST wins. Then context.md. Then the HTML file.
4. **Less than 80% confident in a classification or change?** → Flag it and ask. Do not guess.
5. **No clear answer?** → Say "I'm not sure — here are my options: [list]. Which do you want?"

---

## FILE INTERACTION RULES

### When Adding New Features
1. Read `context.md` first to understand existing functionality
2. Read `school-email-tracker.html` to see current structure
3. NEVER remove existing features — only ADD
4. NEVER change fonts, colors, or styling unless explicitly told to
5. Preserve the Applications tab exactly as-is
6. Preserve Financial Aid and Decision Analytics functionality added March 2, 2026

### When Modifying Data
1. Read `data/tracker.json` first
2. NEVER delete existing fields — only ADD new ones
3. Preserve all existing school data
4. Update `context.md` after making changes
5. All 11 schools must have: cost_breakdown, financial_aid, decision_analytics objects

### When Troubleshooting
1. Check `context.md` first for recent changes
2. Check `SETUP-GUIDE.md` for setup issues
3. Check `gmail-scanner.gs` if email scanning is broken
4. Check `vercel.json` if deployment is broken
5. Do NOT assume files are outdated — ask first

---

## DO NOT CHANGE
- ❌ Existing Applications tab functionality
- ❌ Financial Aid tab expandable breakdowns, live calculations, Smart Insights
- ❌ Decision Analytics auto-fill feature, research data panels, all-schools view
- ❌ Fonts, color scheme (#0f1117, #6c5ce7, etc.), card/button/table styling
- ❌ Data structure in tracker.json (only ADD fields, never REMOVE)
- ❌ Any Tier 1 file without explicit user permission

## ALWAYS PRESERVE
- ✅ All 11 schools and their existing data
- ✅ Email activity log and system performance metrics
- ✅ Filter tabs (All/Accepted/Pending/UC/CSU) in Applications tab
- ✅ "Show accepted only" filter in Decision Analytics tab
- ✅ Feedback system (Correct/Wrong buttons) in Applications tab
- ✅ Auto-update functionality via GitHub
- ✅ Dark mode theme and visual design
- ✅ All research data in OBJECTIVE_DATA constant
- ✅ Live calculation functions (calculateAidTotals, etc.)

---

## PROJECT STRUCTURE
```
School-tracker/
├── _MANIFEST.md          ← this file, read first
├── context.md            ← authoritative project doc (updated March 2)
├── school-email-tracker.html  ← production dashboard (3 tabs)
├── data/
│   └── tracker.json      ← live data (expanded March 2)
├── vercel.json
├── gmail-scanner.gs
├── SETUP-GUIDE.md
├── school-email-monitor-guide.md  (Tier 2)
├── automation-workflow-guide.md   (Tier 2)
├── scholarship-hunter-context.md  (Tier 2 — separate project)
└── [Archived files: context_2_16_26.docx, *-ORIGINAL.html, *-FIXED-AUTOFILL.html]
```

---

## QUICK REFERENCE
| Task | Read These Files |
|------|--------------------|
| Building new features | context.md → school-email-tracker.html → tracker.json |
| Understanding Financial Aid tab | context.md (section 2.2) → HTML lines 437-525 |
| Understanding Decision Analytics tab | context.md (section 2.3) → HTML lines 527-610 |
| Understanding objective research data | context.md (research table) → OBJECTIVE_DATA constant |
| Fixing email scanner | gmail-scanner.gs → SETUP-GUIDE.md |
| Deployment issues | vercel.json → SETUP-GUIDE.md |
| Understanding data | data/tracker.json → context.md (data structure section) |
| Not sure | Ask the user first |

---

## RESEARCH DATA SOURCES (March 2, 2026)
Objective ratings compiled from:
- **US News & World Report** — Business program rankings 2024-2025
- **PayScale** — Starting salary and mid-career salary data (2024)
- **Niche.com** — Overall grades and student outcomes
- **College Scorecard** — Employment rates from U.S. Department of Education
- **Official University Reports** — CSU First Destination Surveys, UC Employment Outcomes Dashboard

All research data embedded in `OBJECTIVE_DATA` constant in HTML (lines ~291-301).

---

## VERSION HISTORY

**v1.3 (March 2, 2026)**
- Documented Financial Aid tab complete rebuild
- Documented Decision Analytics tab complete rebuild  
- Added OBJECTIVE_DATA research sources
- Updated data structure documentation for tracker.json
- Added new helper functions to Quick Reference
- Marked development files (FIXED-AUTOFILL) as Tier 3

**v1.2 (March 1, 2026)**
- Added Session Start Protocol (confirmation loop before any task)
- Added Uncertainty Protocol (decision tree for ambiguous situations)
- Explicitly marked context_2_16_26.docx as Tier 3 (superseded)
- Clarified conflict resolution order: MANIFEST > context.md > HTML

**v1.1 (March 1, 2026)**
- Added DO NOT CHANGE and ALWAYS PRESERVE sections
- Separated Scholarship Hunter as standalone project

**v1.0 (February 26, 2026)**
- Initial manifest created
- Established tier system for file prioritization

---

## KNOWN ISSUES & NOTES

**Expected Warnings:**
- CORS warning when testing locally (file:///) — Normal, works fine on Vercel
- "Live fetch failed" in console — Expected for local testing, fallback data loads correctly

**Current Limitations:**
- Auto-fill only works after clicking button (not automatic on page load)
- Research data is static (embedded, not live API)
- No PDF export feature yet

**Future Enhancement Ideas:**
- Add API integration for live ranking updates
- Build comparison export as PDF
- Add email notifications for deadline reminders
- Integrate campus visit tracker

---

**For questions or issues, check context.md first, then ask the user.**
