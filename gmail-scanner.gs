// =============================================================
// GMAIL SCANNER — Google Apps Script
// School Application Email Tracker for Michael Sarmento
// Auto-scans Gmail every 12 hours → pushes updates to GitHub
// GitHub → Vercel auto-deploys → public dashboard updates live
// =============================================================

// ---- STEP 1: FILL IN YOUR DETAILS BELOW ----
const CONFIG = {
  github: {
    owner: 'YOUR_GITHUB_USERNAME',    // e.g. 'mzsarmento'
    repo:  'school-tracker',          // name of your GitHub repo
    token: 'YOUR_GITHUB_PAT',         // Personal Access Token (read below)
    dataPath: 'data/tracker.json',    // path inside the repo
    branch: 'main'
  },
  vercelUrl: 'https://YOUR-APP.vercel.app', // your Vercel dashboard URL
  ownerEmail: 'mzsarmento@gmail.com',
  scan: {
    daysBack: 1,      // how many days back to check (1 = since yesterday)
    maxThreads: 20,   // max Gmail threads per school per scan
  }
};

// ---- SCHOOL DOMAINS ----
const SCHOOLS = {
  'uc_berkeley':      { domain: 'berkeley.edu',  name: 'UC Berkeley',         short: 'UCB',       type: 'UC'  },
  'ucla':             { domain: 'ucla.edu',       name: 'UCLA',                short: 'UCLA',      type: 'UC'  },
  'uc_irvine':        { domain: 'uci.edu',        name: 'UC Irvine',           short: 'UCI',       type: 'UC'  },
  'uc_santa_barbara': { domain: 'ucsb.edu',       name: 'UC Santa Barbara',    short: 'UCSB',      type: 'UC'  },
  'uc_riverside':     { domain: 'ucr.edu',        name: 'UC Riverside',        short: 'UCR',       type: 'UC'  },
  'uc_santa_cruz':    { domain: 'ucsc.edu',       name: 'UC Santa Cruz',       short: 'UCSC',      type: 'UC'  },
  'cal_poly_slo':     { domain: 'calpoly.edu',    name: 'Cal Poly SLO',        short: 'Cal Poly',  type: 'CSU' },
  'sjsu':             { domain: 'sjsu.edu',        name: 'San Jose State',      short: 'SJSU',      type: 'CSU' },
  'sdsu':             { domain: 'sdsu.edu',        name: 'San Diego State',     short: 'SDSU',      type: 'CSU' },
  'csuf':             { domain: 'fullerton.edu',   name: 'Cal State Fullerton', short: 'CSUF',      type: 'CSU' },
  'sac_state':        { domain: 'csus.edu',        name: 'Sacramento State',    short: 'Sac State', type: 'CSU' }
};

// ---- KEYWORD PATTERNS ----
// Add or edit keywords here to improve detection accuracy.
// Format: { subjectWords: [], bodyWords: [], minScore: 0-1 }
const PATTERNS = {
  acceptance: {
    subjectWords: ['congratulations', 'admitted', 'accepted', 'offer of admission',
                   'pleased to offer', 'welcome to', 'you\'ve been admitted'],
    bodyWords:    ['congratulations', 'you have been admitted', 'we are pleased to offer',
                   'offer of admission', 'welcome to the class', 'admitted to'],
    minScore: 0.4
  },
  rejection: {
    subjectWords: ['unable to offer', 'we regret', 'application decision',
                   'thank you for applying', 'after careful review'],
    bodyWords:    ['unable to offer admission', 'we regret to inform', 'after careful consideration',
                   'we cannot offer', 'not selected', 'will not be able to offer'],
    minScore: 0.4
  },
  waitlist: {
    subjectWords: ['waitlist', 'wait list', 'alternate list', 'waitlisted'],
    bodyWords:    ['waitlist', 'wait list', 'waitlisted', 'alternate list',
                   'added to our waitlist'],
    minScore: 0.3
  },
  action_required: {
    subjectWords: ['action required', 'deadline', 'reminder', "don't forget", 'final reminder',
                   'submit', 'complete your', 'update required', 'documents needed'],
    bodyWords:    ['must complete', 'required to submit', 'deadline is', 'due by',
                   'submit by', 'please complete', 'action is required'],
    minScore: 0.3
  }
  // anything that doesn't match above = 'informational'
};


// =============================================================
// MAIN FUNCTION — triggered every 12 hours
// =============================================================
function scanGmail() {
  const startTime = new Date();
  Logger.log('=== SCAN STARTED: ' + startTime.toISOString() + ' ===');

  // 1. Load current data from GitHub
  let trackerData;
  try {
    trackerData = loadTrackerData();
    Logger.log('Loaded tracker data. Last scan: ' + trackerData.metadata.last_scan);
  } catch (e) {
    Logger.log('FATAL: Could not load tracker data — ' + e.message);
    GmailApp.sendEmail(CONFIG.ownerEmail,
      '[Scanner Error] Could not load tracker.json',
      'Error loading data from GitHub:\n\n' + e.message +
      '\n\nCheck your CONFIG (token, owner, repo) and try testScan() in the Apps Script editor.');
    return;
  }

  const existingIds = new Set((trackerData.email_log || []).map(e => e.id));
  let totalNew = 0;
  const newDecisions = [];
  const changeLog = [];

  // 2. Scan each school
  for (const [key, info] of Object.entries(SCHOOLS)) {
    try {
      const result = scanSchool(key, info, existingIds);

      result.newEmails.forEach(email => {
        trackerData.email_log.unshift(email);
        existingIds.add(email.id);
        totalNew++;
      });

      // Decision detected → update school status
      if (result.decisionFound) {
        const d = result.decisionFound;
        newDecisions.push({ school: info.name, ...d });
        changeLog.push(info.name + ': ' + d.status);

        const school = trackerData.schools[key];
        if (school) {
          school.status          = d.status;
          school.decision_date   = d.date;
          school.confidence      = d.confidence;
          if (!school.notes) school.notes = '';
          school.notes = (d.status === 'accepted' ? '🎉 ADMITTED! ' : '') +
                         'Decision email received ' + d.date;
        }
      }

      // Merge new action items (no duplicates)
      if (result.newActionItems.length > 0) {
        const school = trackerData.schools[key];
        if (school) {
          const existing = new Set(school.action_items || []);
          result.newActionItems.forEach(item => {
            if (!existing.has(item)) {
              school.action_items = [...(school.action_items || []), item];
              existing.add(item);
            }
          });
        }
      }
    } catch (e) {
      Logger.log('Error scanning ' + info.name + ': ' + e.message);
    }
  }

  // 3. Trim email log to 100 entries
  trackerData.email_log = trackerData.email_log.slice(0, 100);

  // 4. Update metadata
  trackerData.metadata.last_scan = new Date().toISOString();
  trackerData.metadata.total_scans = (trackerData.metadata.total_scans || 0) + 1;
  trackerData.metadata.total_emails_processed =
    (trackerData.metadata.total_emails_processed || 0) + totalNew;

  // 5. Log the scan
  trackerData.scan_history = [{
    scan_date:      new Date().toISOString().split('T')[0],
    scan_timestamp: new Date().toISOString(),
    emails_found:   totalNew,
    new_decisions:  newDecisions.length,
    notes: totalNew > 0
      ? 'Found ' + totalNew + ' new emails. ' +
        (changeLog.length > 0 ? 'Decisions: ' + changeLog.join(', ') : 'No decision changes.')
      : 'No new emails since last scan.'
  }, ...(trackerData.scan_history || [])].slice(0, 50);

  // 6. Save to GitHub
  try {
    saveTrackerData(trackerData);
    Logger.log('=== SCAN COMPLETE: ' + totalNew + ' new emails, ' + newDecisions.length + ' decisions. Saved to GitHub. ===');
  } catch (e) {
    Logger.log('ERROR saving to GitHub: ' + e.message);
  }

  // 7. Email alert if a decision was found
  if (newDecisions.length > 0) {
    sendDecisionAlert(newDecisions);
  }

  return { totalNew, decisions: newDecisions.length };
}


// =============================================================
// SCAN A SINGLE SCHOOL
// =============================================================
function scanSchool(schoolKey, schoolInfo, existingIds) {
  const result = { newEmails: [], decisionFound: null, newActionItems: [] };

  // Build date filter (only look at emails from last N days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CONFIG.scan.daysBack);
  const dateStr = Utilities.formatDate(cutoff, 'GMT', 'yyyy/MM/dd');

  const query = 'from:' + schoolInfo.domain + ' after:' + dateStr;
  const threads = GmailApp.search(query, 0, CONFIG.scan.maxThreads);

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const msgId = message.getId();
      if (existingIds.has(msgId)) continue; // already logged

      const subject = (message.getSubject() || '').substring(0, 120);
      const body    = (message.getPlainBody() || '').substring(0, 4000);
      const date    = Utilities.formatDate(message.getDate(), 'GMT', 'yyyy-MM-dd');

      const cls    = classifyEmail(subject, body);
      const items  = extractActionItems(subject, body);

      result.newEmails.push({
        id:         msgId,
        school:     schoolKey,
        date:       date,
        subject:    subject,
        category:   cls.category,
        confidence: cls.confidence,
        from:       message.getFrom().substring(0, 60)
      });

      result.newActionItems.push(...items);

      // Is this a decision?
      if (['acceptance','rejection','waitlist'].includes(cls.category) && cls.confidence >= 0.5) {
        const statusMap = { acceptance: 'accepted', rejection: 'rejected', waitlist: 'waitlisted' };
        // Only overwrite if higher confidence than existing detection this scan
        if (!result.decisionFound || cls.confidence > result.decisionFound.confidence) {
          result.decisionFound = {
            status:     statusMap[cls.category],
            date:       date,
            confidence: cls.confidence,
            subject:    subject
          };
        }
      }
    }
  }

  Logger.log(schoolInfo.name + ': ' + result.newEmails.length + ' new emails');
  return result;
}


// =============================================================
// EMAIL CLASSIFIER
// =============================================================
function classifyEmail(subject, body) {
  const subj = subject.toLowerCase();
  const bod  = body.toLowerCase().substring(0, 2000);

  const scores = { acceptance: 0, rejection: 0, waitlist: 0, action_required: 0 };

  for (const [category, cfg] of Object.entries(PATTERNS)) {
    // Subject match is worth more (0.5 each), body match is 0.25 each
    cfg.subjectWords.forEach(kw => { if (subj.includes(kw)) scores[category] += 0.5; });
    cfg.bodyWords.forEach(kw    => { if (bod.includes(kw))  scores[category] += 0.25; });
  }

  // Find winning category
  let best = 'informational';
  let bestScore = 0.25; // informational baseline

  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore && score >= PATTERNS[cat].minScore) {
      best      = cat;
      bestScore = score;
    }
  }

  return {
    category:   best,
    confidence: Math.min(0.99, Math.round(bestScore * 100) / 100)
  };
}


// =============================================================
// ACTION ITEM EXTRACTOR
// =============================================================
function extractActionItems(subject, body) {
  const items = [];
  const text = (subject + ' ' + body).substring(0, 3000);

  // Look for deadline-style sentences
  const patterns = [
    /(?:submit|complete|send|upload|confirm|pay|register)[^.]{0,60}(?:march|april|may)\s+\d{1,2}/gi,
    /deadline[^.]{0,60}(?:march|april|may)\s+\d{1,2}/gi,
    /due[^.]{0,40}(?:march|april|may)\s+\d{1,2}/gi,
    /by\s+(?:march|april|may)\s+\d{1,2}[^.]{0,50}/gi,
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.slice(0, 2).forEach(m => {
      const clean = m.trim().replace(/\s+/g, ' ').substring(0, 80);
      if (clean.length > 10 && !items.includes(clean)) items.push(clean);
    });
  });

  return items.slice(0, 3);
}


// =============================================================
// GITHUB API — LOAD DATA
// =============================================================
function loadTrackerData() {
  const url = [
    'https://api.github.com/repos',
    CONFIG.github.owner,
    CONFIG.github.repo,
    'contents',
    CONFIG.github.dataPath
  ].join('/') + '?ref=' + CONFIG.github.branch;

  const resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: githubHeaders(),
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('GitHub GET failed (' + resp.getResponseCode() + '): ' +
      resp.getContentText().substring(0, 300));
  }

  const file    = JSON.parse(resp.getContentText());
  const content = Utilities.newBlob(
    Utilities.base64Decode(file.content.replace(/\n/g, ''))
  ).getDataAsString();

  // Store SHA so we can update the file
  PropertiesService.getScriptProperties().setProperty('github_file_sha', file.sha);

  return JSON.parse(content);
}


// =============================================================
// GITHUB API — SAVE DATA
// =============================================================
function saveTrackerData(data) {
  const sha = PropertiesService.getScriptProperties().getProperty('github_file_sha');
  if (!sha) throw new Error('Missing file SHA — run loadTrackerData() first');

  const url = [
    'https://api.github.com/repos',
    CONFIG.github.owner,
    CONFIG.github.repo,
    'contents',
    CONFIG.github.dataPath
  ].join('/');

  const payload = {
    message: 'Auto-scan ' + new Date().toISOString().split('T')[0] +
             ' · scan #' + data.metadata.total_scans,
    content:  Utilities.base64Encode(JSON.stringify(data, null, 2)),
    sha:      sha,
    branch:   CONFIG.github.branch
  };

  const resp = UrlFetchApp.fetch(url, {
    method:      'put',
    contentType: 'application/json',
    headers:     githubHeaders(),
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = resp.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('GitHub PUT failed (' + code + '): ' +
      resp.getContentText().substring(0, 300));
  }

  // Update SHA for subsequent saves in same session
  const updated = JSON.parse(resp.getContentText());
  PropertiesService.getScriptProperties().setProperty('github_file_sha', updated.content.sha);
  Logger.log('Saved to GitHub. New SHA: ' + updated.content.sha);
}

function githubHeaders() {
  return {
    'Authorization': 'token ' + CONFIG.github.token,
    'Accept':        'application/vnd.github.v3+json',
    'User-Agent':    'SchoolTracker-GAS/1.0'
  };
}


// =============================================================
// DECISION ALERT EMAIL
// =============================================================
function sendDecisionAlert(decisions) {
  let body = 'Hi Michael,\n\nNew application decision(s) detected:\n\n';
  decisions.forEach(d => {
    const emoji = d.status === 'accepted' ? '🎉' : d.status === 'rejected' ? '😔' : '⏳';
    body += emoji + ' ' + d.school + ': ' + d.status.toUpperCase() +
            ' (' + d.date + ')\n  Subject: "' + d.subject + '"\n\n';
  });
  body += '\nView your full dashboard:\n' + CONFIG.vercelUrl +
          '\n\nGood luck, Michael! 🤞\n— Your School Tracker Bot';

  GmailApp.sendEmail(
    CONFIG.ownerEmail,
    '🎓 Application Decision Alert! (' + decisions.map(d => d.school).join(', ') + ')',
    body
  );
  Logger.log('Decision alert sent to ' + CONFIG.ownerEmail);
}


// =============================================================
// SETUP — Run this ONCE manually to create the schedule
// =============================================================
function setupTrigger() {
  // Remove any existing scanGmail triggers
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'scanGmail')
    .forEach(t => ScriptApp.deleteTrigger(t));

  // Create new 12-hour trigger
  ScriptApp.newTrigger('scanGmail')
    .timeBased()
    .everyHours(12)
    .create();

  Logger.log('✅ Trigger created. scanGmail() will run every 12 hours automatically.');
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('All triggers removed.');
}


// =============================================================
// MANUAL TEST HELPERS
// =============================================================

// Run this to test without touching GitHub (logs only)
function testClassifyOnly() {
  const tests = [
    { subject: 'Congratulations! You have been admitted to UC Berkeley', body: 'We are pleased to offer you admission.' },
    { subject: 'Application Decision Update', body: 'After careful consideration we are unable to offer admission.' },
    { subject: 'Final Reminder: Submit TAU by March 15', body: 'Your Transfer Academic Update is due by March 15.' },
    { subject: 'Explore campus life at UCLA', body: 'Come discover what UCLA has to offer.' },
    { subject: 'You have been waitlisted', body: 'We have placed your application on our waitlist.' },
  ];

  tests.forEach(t => {
    const result = classifyEmail(t.subject, t.body);
    Logger.log('[' + result.category + ' / ' + Math.round(result.confidence * 100) + '%] ' + t.subject);
  });
}

// Full test scan — reads from GitHub, scans Gmail, logs results (does NOT save)
function testScan() {
  Logger.log('=== TEST SCAN (read-only, no GitHub save) ===');
  const data = loadTrackerData();
  Logger.log('Loaded tracker data. Schools: ' + Object.keys(data.schools).join(', '));

  const existingIds = new Set(data.email_log.map(e => e.id));
  let totalNew = 0;

  for (const [key, info] of Object.entries(SCHOOLS)) {
    const result = scanSchool(key, info, existingIds);
    totalNew += result.newEmails.length;
    if (result.decisionFound) {
      Logger.log('⚠️ DECISION FOUND for ' + info.name + ': ' + JSON.stringify(result.decisionFound));
    }
    result.newEmails.forEach(e => Logger.log('  NEW: [' + e.category + '] ' + e.subject));
  }

  Logger.log('=== TEST COMPLETE: ' + totalNew + ' new emails total ===');
}

// Check what's in your tracker.json right now
function viewCurrentData() {
  const data = loadTrackerData();
  Logger.log('Last scan: ' + data.metadata.last_scan);
  Logger.log('Total scans: ' + data.metadata.total_scans);
  Logger.log('Email log entries: ' + data.email_log.length);
  Object.entries(data.schools).forEach(([k, s]) => {
    Logger.log('  ' + s.name + ': ' + s.status);
  });
}
