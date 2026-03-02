# School Application & Financial Aid Tracker — Project Context

**Owner:** Michael Sarmento  
**Purpose:** Track 11 California college applications for Fall 2026 transfer (Business Analytics)  
**Last Updated:** March 2, 2026

---

## Current Status
- **2 Acceptances:** San Jose State (Feb 12, 2026), Sacramento State (Dec 15, 2025)
- **9 Pending:** All UCs + Cal Poly SLO, SDSU, CSUF
- **Intent to Enroll Deadline:** May 1, 2026

---

## Files

| File | Purpose |
|------|---------|
| `school-email-tracker.html` | Main dashboard (3 tabs: Applications, Financial Aid, Decision Analytics) |
| `data/tracker.json` | Data store with school info, COA, financial aid, decision analytics, objective research data |
| `gmail-scanner.gs` | Google Apps Script to auto-scan Gmail for admission emails |
| `context.md` | This file — project documentation |
| `vercel.json` | Vercel deployment config |

---

## Dashboard Tabs

### 1. 📋 Applications Tab
- Cards for all 11 schools showing status (Accepted/Pending/Rejected/Deferred)
- Notes/feedback textarea per school
- Status override dropdown
- Stats row: total schools, accepted count, pending count
- Shows net cost on accepted school cards for quick reference

### 2. 💰 Financial Aid Tab *(Updated: March 2, 2026)*

**Major Update:** Rebuilt with accurate 2026-27 COA data from official university sources.

**Features:**
- **Cost Breakdown Table** — All 11 schools with accurate 2026-27 COA
  - Color-coded affordability: Green (<$34k), Yellow (<$40k), Red (>$40k)
  - Status badges showing Accepted/Pending
  - Expandable "Details" button reveals full cost breakdown:
    - Left column: Tuition & Fees, Housing & Food, Books & Supplies, Transportation, Personal, Total COA
    - Right column: Pell Grant, Cal Grant, School Grants, Work-Study, Federal Loans, Other Aid, Net Cost
  
- **Aid Package Entry Form**
  - School dropdown (all 11 schools)
  - Input fields: Pell ($7,395 default), Cal Grant, School Grants, Work-Study, Federal Loans, Other Aid
  - **Live auto-calculation** on every keystroke:
    - Total Aid = sum of all aid sources
    - Net Cost = COA - (Pell + Cal Grant + School Grants + Other Aid)
    - Out-of-Pocket = Net Cost - Work-Study - Loans
  - Save button → Persists to tracker.json
  - Clear button → Resets form to defaults

- **Smart Insights Panel** — Auto-generated comparisons:
  - Cheapest Total COA (school name + amount)
  - Most Expensive vs Cheapest (price difference)
  - UC net cost estimate with Pell + Cal Grant
  - Federal loan impact calculation

**Technical Implementation:**
- All COA data stored in `tracker.json` under `schools[key].cost_breakdown`
- Financial aid packages stored under `schools[key].financial_aid`
- Expandable rows use `.show` class toggle via `toggleFinRow()`
- Form calculations run via `calculateAidTotals()` on `oninput` events
- Data persistence via `saveAidPackage()` function

### 3. 📊 Decision Analytics Tab *(Rebuilt: March 2, 2026)*

**Major Rebuild:** Complete redesign with objective research data and auto-fill functionality.

**Core Features:**

**1. Decision Deadline Countdown Banner**
- Days remaining until May 1, 2026
- Color-coded urgency: Green (>30 days), Yellow (15-30 days), Red (<15 days)

**2. Weighted Decision Matrix**
- Shows **ALL 11 schools** by default (not just accepted)
- Filter checkbox: "Show accepted only (2)" toggles between all schools and accepted-only view
- Each school displays:
  - School name with status badge
  - Weighted score (auto-calculated)
  - Ranking badges (#1, #2, #3 for top schools)
  - 5 criteria rating sliders (0-10 scale)

**3. Five Decision Criteria:**
- 💰 **Net Cost** — Auto-calculated from Financial Aid tab data (inverse: lower cost = higher score)
- 📚 **Program Quality** — Based on US News rankings, program reputation
- 💼 **Career Outcomes** — Based on starting salary, employment rates, mid-career salary
- 📍 **Location & Vibe** — Job market proximity, cost of living, campus environment
- ❤️ **Gut Feeling** — Subjective preference (never auto-filled, stays at 5)

**4. Auto-Fill from Research Data Button** ⭐ NEW
- Pre-populates objective ratings for all 11 schools based on comprehensive research
- Confirms with user before filling
- Auto-fills:
  - Program Quality scores (5-10 based on rankings)
  - Career Outcomes scores (5-10 based on salary/employment data)
  - Location scores (6-10 based on job market analysis)
  - Net Cost scores (2-10 based on calculated net cost from Financial Aid tab)
  - Gut Feeling stays at 5 (user controls manually)
- User can override any auto-filled rating

**5. Expandable Research Data Panels** ⭐ NEW
- Each school card has "📊 View Research Data" section
- Click to expand/collapse
- Shows objective data sources:
  - **Program Quality:** "#2 nationally (Haas)" | "$77k start, $140k mid-career"
  - **Career Outcomes:** "95% employed within 6mo" | "Top employers: Google, McKinsey, Deloitte"
  - **Location:** "Berkeley, CA" | "SF Bay Area - Tech hub"
- Data sourced from US News, PayScale, Niche, College Scorecard (Feb 2026)

**6. Pros & Cons Journal**
- Expandable section per school
- Add/delete pros with timestamps
- Add/delete cons with timestamps
- Persists to `tracker.json`

**7. Auto-Ranking System**
- Schools automatically ranked by weighted score
- Top 3 get visual rank badges (#1 gold, #2 silver, #3 bronze)
- Rankings update live as ratings/weights change

**Objective Research Data (Embedded):**

Research compiled from US News Rankings 2024-2025, PayScale 2024, Niche.com, CSU/UC official employment reports:

| School | Program Quality | Career Outcomes | Location Score |
|--------|----------------|-----------------|----------------|
| UC Berkeley | 10/10 (#2 nationally) | 10/10 ($77k start, 95% employed) | 8/10 (SF Bay Area) |
| UCLA | 9/10 (#15 nationally) | 9/10 ($72k start, 93% employed) | 9/10 (LA Metro) |
| UC Irvine | 8/10 (#35, #10 Analytics) | 8/10 ($68k start, 91% employed) | 8/10 (Orange County) |
| UCSB | 7/10 (#45 nationally) | 7/10 ($65k start, 89% employed) | 9/10 (Beach town) |
| UCR | 6/10 (#55 nationally) | 6/10 ($60k start, 85% employed) | 6/10 (Inland Empire) |
| UCSC | 6/10 (#60 nationally) | 7/10 ($63k start, 87% employed) | 8/10 (1hr to SV) |
| Cal Poly SLO | 8/10 (#42, #1 CSU) | 9/10 ($72k start, 94% employed) | 9/10 (Central Coast) |
| SJSU | 7/10 (#127, #2 CSU) | 9/10 ($75k start, 92% employed) | 10/10 (Silicon Valley) |
| SDSU | 7/10 (#110 nationally) | 7/10 ($68k start, 88% employed) | 10/10 (San Diego) |
| Sac State | 5/10 (#150 nationally) | 6/10 ($51k start, 82% employed) | 7/10 (State capital) |
| CSUF | 6/10 (#140 nationally) | 6/10 ($49k start, 80% employed) | 8/10 (LA/OC) |

**Technical Implementation:**
- `OBJECTIVE_DATA` constant embedded in HTML with all research data
- `autoFillObjectiveRatings()` function populates all schools
- `toggleResearchData()` expands/collapses research panels
- All ratings stored in `tracker.json` under `schools[key].decision_analytics.criteria_ratings`
- Weights stored under `schools[key].decision_analytics.criteria_weights`
- Pros/cons stored under `schools[key].decision_analytics.pros` and `.cons`

### 4. 🎯 Scholarship Hunter Tab *(Separated as Standalone Project)*
- Moved to separate repository
- No longer part of main tracker
- See `scholarship-hunter-context.md` for details

---

## Cost of Attendance Data (2026-27, CA Resident, On-Campus)

**Source:** Official university websites, verified February 2026

| School | Total COA | Tuition | Housing | Books | Transport | Personal |
|--------|-----------|---------|---------|-------|-----------|---------- |
| UC Berkeley | $47,500 | $15,900 | $24,600 | $1,200 | $700 | $5,100 |
| UCLA | $42,000 | $14,700 | $19,000 | $1,400 | $600 | $6,300 |
| UC Irvine | $43,000 | $15,000 | $20,500 | $1,300 | $600 | $5,600 |
| UC Santa Barbara | $43,500 | $15,200 | $20,800 | $1,200 | $650 | $5,650 |
| UC Riverside | $43,000 | $15,100 | $20,400 | $1,300 | $700 | $5,500 |
| UC Santa Cruz | $43,500 | $15,500 | $21,000 | $1,200 | $700 | $5,100 |
| Cal Poly SLO | $35,500 | $13,400 | $16,500 | $1,100 | $800 | $3,700 |
| San Jose State | $35,000 | $8,850 | $19,900 | $1,000 | $900 | $4,350 |
| San Diego State | $33,500 | $8,200 | $18,500 | $1,100 | $850 | $4,850 |
| Sacramento State | $33,500 | $8,450 | $18,000 | $1,200 | $900 | $4,950 |
| Cal State Fullerton | $32,000 | $7,900 | $17,500 | $1,000 | $850 | $4,750 |

**Net Cost Calculation Logic:**
```
Net Cost = Total COA - (Pell Grant + Cal Grant + School Grants + Other Aid)
Out-of-Pocket = Net Cost - Work-Study - Federal Loans
```

**Auto-Fill Scoring for Net Cost:**
- ≤$25,000 = 10/10 (Excellent affordability)
- $25,001-$30,000 = 9/10 (Very good)
- $30,001-$35,000 = 8/10 (Good)
- $35,001-$40,000 = 6/10 (Moderate)
- $40,001-$45,000 = 4/10 (High)
- >$45,000 = 2/10 (Very high)

---

## Federal Aid (Michael's Profile)
- **SAI:** -$1,500 (maximum aid eligible)
- **Pell Grant:** $7,395/year (confirmed)
- **Cal Grant A Estimate:** ~$9,084 (UC & CSU eligible, verify with schools)
- **Work-Study:** Eligible
- **Direct Subsidized Loans:** up to $5,500/year
- **Direct Unsubsidized Loans:** up to $12,500 total

---

## Data Structure (tracker.json)

**School Object Structure:**
```json
{
  "schools": {
    "school_key": {
      "name": "UC Berkeley",
      "status": "pending",
      "cost_breakdown": {
        "total_coa": 47500,
        "tuition_fees": 15900,
        "housing_food": 24600,
        "books_supplies": 1200,
        "transportation": 700,
        "personal": 5100
      },
      "financial_aid": {
        "pell_grant": 7395,
        "cal_grant": 0,
        "school_grants": 0,
        "work_study": 0,
        "federal_loans": 0,
        "other_aid": 0,
        "total_aid": 7395,
        "net_cost": 40105,
        "out_of_pocket": 40105
      },
      "decision_analytics": {
        "criteria_ratings": {
          "net_cost": 0,
          "program_quality": 10,
          "career_outcomes": 10,
          "location_vibe": 8,
          "gut_feeling": 5
        },
        "criteria_weights": {
          "net_cost": 10,
          "program_quality": 9,
          "career_outcomes": 8,
          "location_vibe": 7,
          "gut_feeling": 6
        },
        "pros": [
          {"text": "Top-ranked program", "date": "3/2/2026"}
        ],
        "cons": [
          {"text": "Most expensive option", "date": "3/2/2026"}
        ]
      }
    }
  }
}
```

---

## Data Persistence
All user-entered data is saved to **tracker.json** on the server (via fetch to GitHub raw URL or embedded fallback).

**What's Saved:**
- Financial aid packages (all 6 fields per school)
- Decision criteria ratings (5 criteria × 11 schools)
- Criteria weights (global, applied to all schools)
- Pros and cons entries with timestamps
- Status overrides from Applications tab

---

## Technical Stack
- **Frontend:** Single HTML file, vanilla JavaScript
- **Data Storage:** tracker.json (embedded fallback + GitHub live fetch)
- **Fonts:** DM Sans (Google Fonts)
- **Deployment:** Vercel (auto-deploy from GitHub main branch)
- **Email Scanner:** Google Apps Script (gmail-scanner.gs, runs every 12 hours)

---

## Recent Changes (March 2, 2026)

### Financial Aid Tab Rebuild
- ✅ Replaced hardcoded BASE_COSTS with accurate 2026-27 COA from tracker.json
- ✅ Added expandable cost breakdown rows (click Details button)
- ✅ Built aid package entry form with live calculations
- ✅ Implemented Smart Insights panel
- ✅ Fixed all 11 schools now display correctly
- ✅ Color-coded affordability indicators

### Decision Analytics Tab Rebuild
- ✅ Changed from "accepted only" to "ALL schools" view with filter option
- ✅ Simplified from 6 criteria to 5 criteria (removed campus_resources, distance_from_home)
- ✅ Added Auto-Fill from Research Data button
- ✅ Compiled objective research data for all 11 schools (rankings, salaries, employment rates)
- ✅ Embedded OBJECTIVE_DATA constant with comprehensive research
- ✅ Built expandable research panels showing data sources
- ✅ Added decision deadline countdown banner
- ✅ Rebuilt Pros & Cons journal with better UI
- ✅ Fixed auto-fill to work for ALL schools (not just accepted)
- ✅ Rankings now work correctly with top 3 badges

### Data Model Updates
- ✅ Added `cost_breakdown` object to all schools in tracker.json
- ✅ Added `financial_aid` object with 9 fields
- ✅ Added `decision_analytics` object with ratings, weights, pros, cons
- ✅ All 11 schools now have complete data structures

---

## Known Issues & Future Improvements

**Current Limitations:**
- Local testing shows CORS warning (expected, works fine on Vercel)
- No PDF export feature yet
- No email notifications for deadline reminders

**Future Enhancement Ideas:**
- Add comparison export as PDF
- Integrate with Common App for automatic deadline import
- Add campus visit tracker
- Build mobile app version
- Add collaborative decision-making (family members can comment)

---

## Lessons Learned

**What Worked Well:**
- Single HTML file = easy deployment, no build step
- Embedded research data = no API calls needed
- Auto-fill saves massive time vs manual research
- Color-coding makes cost differences immediately visible

**What Was Challenging:**
- Balancing subjective vs objective criteria
- Designing neutral auto-fill that doesn't bias decisions
- Making research data transparent and editable
- Ensuring all schools visible by default (not just accepted)

**Best Practices Established:**
- Always show ALL options, then filter down
- Make data sources visible and clickable
- Auto-calculate where possible, allow manual override
- Persist everything to avoid data loss
- Use clear visual hierarchy (rank badges, color coding)

---

## Support & Maintenance

**GitHub Repo:** https://github.com/Cheddar916/School-tracker  
**Live Site:** https://school-tracker-six.vercel.app  
**Owner:** Michael Sarmento  
**Contact:** Check repo for latest contact info

**For Claude/Cowork:**
- Always read `_MANIFEST.md` first
- Read this context.md second
- Never modify existing features without explicit permission
- Test locally before pushing to GitHub
- Document all changes in this file
