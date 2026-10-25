// Assets (data, images, PDF) are found relative to this script, so the page also works when embedded on another site.
const assetBase = (() => {
  const script = document.currentScript;
  try {
    return new URL('./beyond-academics-directory/', script && script.src ? script.src : document.baseURI).href;
  } catch (error) {
    return './beyond-academics-directory/';
  }
})();

const root = document.getElementById('beyond-academics-directory');
if (root) root.replaceChildren();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeWebsite(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function scopeFor(level) {
  const normalized = String(level || '').toLowerCase();
  if (normalized.includes('national') && normalized.includes('international')) return 'progression';
  if (normalized.includes('international')) return 'international';
  if (normalized.includes('national')) return 'national';
  return 'other';
}

function participationFor(format) {
  const normalized = String(format || '').toLowerCase();
  const individual = normalized.includes('individual');
  const team = normalized.includes('team');
  if (individual && team) return 'both';
  if (individual) return 'individual';
  if (team) return 'team';
  return 'unspecified';
}

const categoryDescriptions = {
  '🤖 Robotics & Engineering': 'These hands-on challenges bring engineering, programming, electronics, and teamwork together. Students design, build, and test robots or engineered systems, from beginner activities to advanced autonomous and marine robotics.',
  '🔬 Science & Research': 'Students develop a question, investigate it, and communicate findings through research presentations and science fairs. Topics in this directory include environmental, water, earth, and broader STEM research.',
  '📚 Mathematics & Olympiads': 'Olympiads challenge logic, patterns, and mathematical reasoning rather than calculation speed. The listings include school-level contests and advanced national-to-international pathways.',
  '💻 Coding & Computational Thinking': 'These contests range from computational-thinking puzzles and programming contests to software challenges. Students practice algorithms, coding fluency, and problem-solving individually or in teams.',
  '🧠 Artificial Intelligence': 'AI competitions ask students to understand and apply intelligent systems, not just use AI tools. The handbook includes machine learning, AI projects, and social-impact applications, from school challenges to university programs.',
  '💡 Innovation & Design': 'Students start with a real-world problem, then develop and test a practical design or invention. Topics span product design, sustainability, engineering, social impact, and innovation pitches.',
  '💼 Entrepreneurship': 'Entrepreneurship challenges help students shape ideas into ventures through business planning, market strategy, and pitching. The handbook includes school, college, technology, and social-enterprise pathways.',
  '🚀 Space & Astronomy': 'These opportunities explore space science and engineering through satellite and CanSat design, model rocketry, space robotics, astronomy, and software. They range from school education programs to advanced engineering challenges.',
  '🛸 Drones & Autonomous Systems': 'Drone and autonomous-system competitions combine aerodynamics, electronics, software, and AI. Students may design aircraft or UAV systems, build autonomous missions, or take part in piloting and racing events.',
  '🎮 Game Development & Interactive Technology': 'Game-development competitions bring together code, art, mechanics, and storytelling to create interactive experiences. Formats range from short game jams to student showcases and engine-specific challenges.',
  '🎓 National & Academic Competitions': 'This section brings together national initiatives and academic or leadership competitions run by Indian bodies, institutions, and global programs. Entries include hackathons, innovation challenges, Olympiad pathways, academic debate, and Model UN; check each event’s own eligibility and scope.'
};

const domainIcons = {
  robot: '<rect x="17" y="20" width="30" height="22" rx="5"/><circle cx="26" cy="31" r="2.6" fill="currentColor"/><circle cx="38" cy="31" r="2.6" fill="currentColor"/><path d="M27 37h10M32 20v-8M13 28v8M51 28v8M24 42v4M40 42v4M22 46h20v10H22z"/><circle cx="32" cy="10" r="2.5"/>',
  science: '<path d="M26 10h12M28 10v14L15 47a5 5 0 0 0 4.5 7.5h25A5 5 0 0 0 49 47L36 24V10M21 40h22"/><circle cx="29" cy="46" r="2"/><circle cx="37" cy="48" r="1.6"/>',
  math: '<path d="M13 24h38M24 24c0 12-2 19-7 24M40 24v17c0 5 2 7 7 6"/>',
  code: '<path d="M24 20L11 32l13 12M40 20l13 12-13 12M35 15l-6 34"/>',
  ai: '<rect x="19" y="19" width="26" height="26" rx="5"/><circle cx="32" cy="32" r="5"/><path d="M27 19v-7M37 19v-7M27 45v7M37 45v7M19 27h-7M19 37h-7M45 27h7M45 37h7"/>',
  innovation: '<path d="M24 41c-6-4-8-10-6-16a14 14 0 0 1 28 0c2 6 0 12-6 16v4H24zM26 51h12M28 57h8M32 18v10M27 23l5 5 5-5"/>',
  entrepreneur: '<path d="M10 54h44M16 54V42M27 54V34M38 54V28M49 54V22M11 34l14-10 9 6 15-14M41 16h8v8"/>',
  space: '<path d="M32 7c9 6 13 17 10 30H22C19 24 23 13 32 7zM22 37l-9 9 9-2M42 37l9 9-9-2M28 45l4 11 4-11"/><circle cx="32" cy="25" r="4.5"/>',
  drone: '<rect x="25" y="27" width="14" height="10" rx="3"/><path d="M25 29l-11-8M39 29l11-8M25 35l-11 8M39 35l11 8"/><ellipse cx="12" cy="19" rx="8" ry="2.6"/><ellipse cx="52" cy="19" rx="8" ry="2.6"/><ellipse cx="12" cy="45" rx="8" ry="2.6"/><ellipse cx="52" cy="45" rx="8" ry="2.6"/>',
  game: '<path d="M17 24h30a9 9 0 0 1 9 8l2 11a6 6 0 0 1-10.5 4L43 41H21l-4.5 6A6 6 0 0 1 6 43l2-11a9 9 0 0 1 9-8zM22 28v9M17.5 32.5h9"/><circle cx="41" cy="31" r="2"/><circle cx="47" cy="36" r="2"/>',
  national: '<path d="M21 12h22v16a11 11 0 0 1-22 0zM21 17h-8c0 9 3 12 9 13M43 17h8c0 9-3 12-9 13M32 39v9M23 54h18M26 48h12"/>'
};

function domainIconKey(title) {
  const t = String(title || '').toLowerCase();
  const map = [['robot', 'robot'], ['science', 'science'], ['math', 'math'], ['coding', 'code'], ['artificial', 'ai'], ['innovation', 'innovation'], ['entrepreneur', 'entrepreneur'], ['space', 'space'], ['drone', 'drone'], ['game', 'game'], ['national', 'national']];
  const hit = map.find(([needle]) => t.includes(needle));
  return hit ? hit[1] : 'national';
}

const spotlights = [
  {
    id: 'drone-spotlight',
    match: /drone/i,
    image: 'drone-flight.jpg',
    alt: 'A quadcopter drone hovering in flight against an overcast sky',
    width: 547,
    height: 365,
    reversed: false,
    title: 'Inside a Drone: What Students Learn',
    intro: 'Drone challenges bring aerodynamics, electronics, and software together in one machine. Explore the parts that students design, build, and program.',
    hint: 'Tap the glowing points to explore the drone',
    hotspots: [
      { x: 24, y: 42, title: 'Rotors & propulsion', text: 'Spinning propellers create lift. Students learn about thrust, aerodynamics, and how motor and propeller choices change flight time.' },
      { x: 56, y: 44, title: 'Camera & payload', text: 'Cameras and sensors turn a flying frame into a tool for mapping, inspection, and autonomous missions.' },
      { x: 48, y: 57, title: 'Flight controller', text: 'The onboard computer stabilizes the drone and follows code. This is where programming and AI come into drone challenges.' },
      { x: 52, y: 83, title: 'Frame & landing gear', text: 'A light, strong frame protects the electronics and carries the battery. Weight and balance decide how well a design flies.' }
    ]
  },
  {
    id: 'robotics-spotlight',
    match: /robot/i,
    image: 'robotics-teamwork.jpg',
    alt: 'Students working together with screwdrivers to assemble and wire a small wheeled robot',
    width: 612,
    height: 407,
    reversed: true,
    title: 'Inside a Robot: Build, Wire, and Test',
    intro: 'Robotics challenges combine mechanics, electronics, and code, and they are won by teams that build together. Explore the parts students assemble, wire, and program.',
    hint: 'Tap the glowing points to explore the robot',
    hotspots: [
      { x: 29, y: 69, title: 'Sensors', text: 'Distance and obstacle sensors let a robot detect the world around it. Students learn how machines sense and react.' },
      { x: 33, y: 20, title: 'Arm & gripper', text: 'Arms and grippers turn motion into tasks such as picking, placing, and sorting. Mechanical design and precision both matter.' },
      { x: 43, y: 50, title: 'Wiring & electronics', text: 'Wires, controllers, and power connections link every part. Careful wiring and repeated testing prevent most last-minute failures.' },
      { x: 52, y: 74, title: 'Wheels & motors', text: 'Motors and wheels set speed, grip, and control. Teams balance power, weight, and reliability.' }
    ]
  }
];

function renderSpotlight(categories) {
  return spotlights.map((config) => {
    const category = categories.find((item) => config.match.test(item.title || ''));
    if (!category) return '';
    const pins = config.hotspots.map((spot, index) => `<button type="button" class="beyond-academics-hotspot" data-hotspot="${index}" style="--x:${spot.x}%;--y:${spot.y}%" aria-label="${escapeHtml(spot.title)}" aria-pressed="false"><span></span></button>`).join('');
    const items = config.hotspots.map((spot, index) => `<li data-hotspot-panel="${index}"><strong>${escapeHtml(spot.title)}</strong><span>${escapeHtml(spot.text)}</span></li>`).join('');
    return `<section class="beyond-academics-spotlight${config.reversed ? ' is-reversed' : ''}" id="${config.id}">
      <div class="beyond-academics-spotlight-media"><div class="beyond-academics-spotlight-photo" data-tilt><img src="${assetBase}assets/images/${config.image}" alt="${escapeHtml(config.alt)}" width="${config.width}" height="${config.height}" loading="lazy" decoding="async" />${pins}</div><p class="beyond-academics-spotlight-hint">${escapeHtml(config.hint)}</p></div>
      <div class="beyond-academics-spotlight-copy"><p class="beyond-academics-kicker">Spotlight</p><h2>${escapeHtml(config.title)}</h2><p>${escapeHtml(config.intro)}</p><ul class="beyond-academics-hotspot-list">${items}</ul></div>
    </section>`;
  }).join('\n\n    ');
}

function setupSpotlight() {
  document.querySelectorAll('.beyond-academics-spotlight').forEach(setupSpotlightSection);
}

function setupSpotlightSection(section) {
  section.classList.add('is-enhanced');
  const pins = Array.from(section.querySelectorAll('[data-hotspot]'));
  const items = Array.from(section.querySelectorAll('[data-hotspot-panel]'));
  let timer = null;
  const activate = (index) => {
    pins.forEach((pin) => {
      const on = pin.dataset.hotspot === index;
      pin.classList.toggle('is-active', on);
      pin.setAttribute('aria-pressed', String(on));
    });
    items.forEach((item) => item.classList.toggle('is-active', item.dataset.hotspotPanel === index));
  };
  const choose = (index) => {
    if (timer) { clearInterval(timer); timer = null; }
    activate(index);
  };
  pins.forEach((pin) => ['click', 'mouseenter', 'focus'].forEach((type) => pin.addEventListener(type, () => choose(pin.dataset.hotspot))));
  items.forEach((item) => item.addEventListener('click', () => choose(item.dataset.hotspotPanel)));
  let current = 0;
  activate('0');
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    timer = setInterval(() => {
      current = (current + 1) % pins.length;
      activate(String(current));
    }, 3800);
  }
}

function setupTilt() {
  document.querySelectorAll('[data-tilt]').forEach(setupTiltPhoto);
}

function setupTiltPhoto(photo) {
  if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
  const reset = () => {
    photo.style.setProperty('--tilt-x', '0deg');
    photo.style.setProperty('--tilt-y', '0deg');
  };
  photo.addEventListener('pointermove', (event) => {
    const rect = photo.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    photo.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
    photo.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
    photo.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(0)}%`);
    photo.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(0)}%`);
  });
  photo.addEventListener('pointerleave', reset);
}

function renderSuggestForm(categories) {
  const domains = categories.map((category) => {
    const name = String(category.title || '').replace(/^[^\p{L}\p{N}]+/u, '');
    return `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
  }).join('');
  return `<section class="beyond-academics-editorial beyond-academics-suggest" id="suggest-a-competition">
      <p class="beyond-academics-kicker">Help us grow this handbook</p>
      <h2>Know a Competition We Missed?</h2>
      <p>If you know a STEM, robotics, AI, coding, science, space, or innovation competition that is not listed in this handbook, share its link and details below. Our team will review your suggestion.</p>
      <div class="beyond-academics-form-notice" role="status" hidden></div>
      <form class="beyond-academics-suggest-form" method="post">
        <div class="beyond-academics-suggest-grid">
          <div class="beyond-academics-field"><label for="ba-name">Competition name <span aria-hidden="true">*</span></label><input id="ba-name" name="ba_name" type="text" maxlength="200" required /></div>
          <div class="beyond-academics-field"><label for="ba-link">Official website link <span aria-hidden="true">*</span></label><input id="ba-link" name="ba_link" type="url" placeholder="https://" maxlength="500" required /></div>
          <div class="beyond-academics-field"><label for="ba-domain">Domain</label><select id="ba-domain" name="ba_domain"><option value="">Not sure</option>${domains}<option value="Other">Other</option></select></div>
          <div class="beyond-academics-field"><label for="ba-age">Age or grade</label><input id="ba-age" name="ba_age" type="text" placeholder="For example: Grades 7–12 or ages 13–18" maxlength="100" /></div>
          <div class="beyond-academics-field"><label for="ba-participation">Participation</label><select id="ba-participation" name="ba_participation"><option value="">Not sure</option><option value="Individual">Individual</option><option value="Team">Team</option><option value="Individual or Team">Individual or Team</option></select></div>
          <div class="beyond-academics-field"><label for="ba-contact-name">Your name (optional)</label><input id="ba-contact-name" name="ba_contact_name" type="text" maxlength="120" autocomplete="name" /></div>
          <div class="beyond-academics-field beyond-academics-field-wide"><label for="ba-details">Details about the competition</label><textarea id="ba-details" name="ba_details" rows="5" maxlength="2000" placeholder="Who can take part, what the competition involves, when it usually runs, or anything else that would help us."></textarea></div>
          <div class="beyond-academics-field beyond-academics-field-wide"><label for="ba-contact-email">Your email (optional)</label><input id="ba-contact-email" name="ba_contact_email" type="email" maxlength="200" autocomplete="email" /></div>
        </div>
        <div class="beyond-academics-hp" aria-hidden="true"><label>Leave this field empty<input name="ba_hp" type="text" tabindex="-1" autocomplete="off" /></label></div>
        <button type="submit" class="beyond-academics-primary-button">Send suggestion</button>
        <p class="beyond-academics-form-note">Name and email are optional and only used if we need to follow up about your suggestion.</p>
      </form>
    </section>`;
}

function setupSuggestForm() {
  const form = document.querySelector('.beyond-academics-suggest-form');
  if (!form) return;
  const notice = form.parentNode.querySelector('.beyond-academics-form-notice');
  const endpoint = (window.BeyondAcademicsConfig && window.BeyondAcademicsConfig.suggestEndpoint) || '';
  const show = (kind, message) => {
    notice.hidden = false;
    notice.className = `beyond-academics-form-notice is-${kind}`;
    notice.textContent = message;
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!endpoint) {
      show('success', 'Preview only: this page is not connected to a server, so nothing was sent.');
      form.reset();
      return;
    }
    const data = new FormData(form);
    if (data.get('ba_hp')) {
      show('success', 'Thank you! We have received your suggestion and will review it.');
      form.reset();
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    data.set('_subject', `New competition suggestion: ${data.get('ba_name') || ''}`);
    fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        show('success', 'Thank you! We have received your suggestion and will review it.');
        form.reset();
      })
      .catch(() => show('error', 'Something went wrong while sending your suggestion. Please try again.'))
      .then(() => { button.disabled = false; });
  });
}

function renderDomainGallery(categories) {
  const cards = categories.map((category) => {
    const slug = slugify(category.title || 'category');
    const name = String(category.title || '').replace(/^[^\p{L}\p{N}]+/u, '');
    return `<a class="beyond-academics-domain-card" href="#master-directory" data-domain-filter="${slug}"><span class="beyond-academics-domain-icon"><svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${domainIcons[domainIconKey(category.title)]}</svg></span><span class="beyond-academics-domain-name">${escapeHtml(name)}</span><span class="beyond-academics-domain-count">${category.competitions.length} competitions</span></a>`;
  }).join('');
  return `<section class="beyond-academics-domain-gallery" id="domain-gallery">
      <div class="beyond-academics-section-heading"><p class="beyond-academics-kicker">Explore by interest</p><h2>STEM Competition Domains at a Glance</h2><p>From robots and rockets to code and startups, choose a domain to jump to its competitions in the master directory.</p></div>
      <div class="beyond-academics-domain-grid">${cards}</div>
    </section>`;
}

function normalizeGrade(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*\/\s*/g, ' & ')
    .replace(/(?<=[A-Za-z])\s*–\s*(?=[A-Za-z])/g, ' & ');
}

const AGE_GROUPS = ['Ages 6–12', 'Ages 13–18', 'Ages 18+', 'Open / varies'];

const AGE_BANDS = {
  'Ages 6–12': [6, 12],
  'Ages 13–18': [13, 18],
  'Ages 18+': [18, 24]
};

const AGE_SPANS = {
  '16+ & University & Open': [16, 24],
  'Elementary': [5, 11],
  'Middle School': [11, 14],
  'High School': [14, 18],
  'College': [18, 24],
  'University': [18, 24],
  'School': [5, 18],
  'School Students': [5, 18],
  'Students': [5, 24],
  'Youth': [13, 24],
  'Primary & High School': [5, 18],
  'Elementary & Middle School': [5, 14],
  'Middle & High School': [11, 18],
  'Middle School & University': [11, 24],
  'High School & University': [14, 24],
  'School & College': [5, 24],
  'School & University': [5, 24],
  'School & Professional': [5, 24],
  'University & Recent Graduates': [18, 24],
  'Students & Professionals': [13, 24],
  'Students & Young Innovators': [5, 24]
};

function ageSpan(label) {
  let match;
  if ((match = label.match(/^Grades (\d+)–(\d+)$/))) return [Number(match[1]) + 5, Number(match[2]) + 6];
  if ((match = label.match(/^(\d+)–(\d+) Years$/))) return [Number(match[1]), Number(match[2])];
  if ((match = label.match(/^Under (\d+)–University$/))) return [Number(match[1]) - 2, 24];
  if ((match = label.match(/^Students under (\d+)$/))) return [5, Number(match[1]) - 1];
  if ((match = label.match(/^Class (\d+)$/))) return [Number(match[1]) + 5, Number(match[1]) + 6];
  if (/^K–12$/.test(label) || /^School Students \(up to Class 12\)$/.test(label)) return [5, 18];
  return AGE_SPANS[label] || null;
}

function ageGroupsFor(label) {
  if (label === 'Open' || label === 'Varies') return AGE_GROUPS.slice();
  const span = ageSpan(label);
  if (!span) return [];
  return AGE_GROUPS.filter((group) => {
    if (!AGE_BANDS[group]) return false;
    const [low, high] = AGE_BANDS[group];
    return span[0] <= high && span[1] >= low;
  });
}

function collectEntries(categories) {
  const unique = new Map();
  categories.forEach((category) => {
    const categorySlug = slugify(category.title || 'category');
    category.competitions.forEach((competition) => {
      const key = String(competition.name || '').trim().toLowerCase();
      const entry = { ...competition, grades: normalizeGrade(competition.grades), categoryTitle: category.title, categorySlug };
      if (!unique.has(key)) {
        unique.set(key, { name: competition.name, appearances: [] });
      }
      unique.get(key).appearances.push(entry);
    });
  });

  return Array.from(unique.values()).map((item) => {
    const appearances = item.appearances;
    const values = (field) => Array.from(new Set(appearances.map((entry) => String(entry[field] || '').trim()).filter(Boolean)));
    return {
      name: item.name,
      appearances,
      categories: Array.from(new Map(appearances.map((entry) => [entry.categorySlug, entry.categoryTitle])).entries()),
      grades: values('grades'),
      gradeKeys: Array.from(new Set(appearances.flatMap((entry) => ageGroupsFor(entry.grades)))),
      levels: values('level'),
      formats: values('format'),
      difficulties: values('difficulty'),
      bestFor: Array.from(new Set(appearances.map((entry) => entry.best_for ? `${String(entry.categoryTitle).replace(/^[^\p{L}\p{N}]+/u, '')}: ${entry.best_for}` : '').filter(Boolean))),
      websites: Array.from(new Set(appearances.map((entry) => safeWebsite(entry.official_website)).filter(Boolean)))
    };
  });
}

function difficultyCount(value) {
  return (String(value || '').match(/⭐/g) || []).length;
}

function renderControls(prefix, categories = [], grades = []) {
  const domains = categories.map((category) => {
    const slug = slugify(category.title || 'category');
    return `<option value="${slug}">${escapeHtml(String(category.title).replace(/^[^\p{L}\p{N}]+/u, ''))}</option>`;
  }).join('');
  const gradeOptions = grades.map((grade) => `<option value="${escapeHtml(grade.toLowerCase())}">${escapeHtml(grade)}</option>`).join('');
  return `
    <div class="beyond-academics-finder-grid" data-filter-form="${prefix}">
      <div class="beyond-academics-field beyond-academics-search-field">
        <label for="${prefix}-search">Search</label>
        <input id="${prefix}-search" type="search" placeholder="Name, interest, category, or format" autocomplete="off" />
      </div>
      <div class="beyond-academics-field">
        <label for="${prefix}-domain">Domain</label>
        <select id="${prefix}-domain"><option value="all">All domains</option>${domains}</select>
      </div>
      <div class="beyond-academics-field">
        <label for="${prefix}-grade">Age</label>
        <select id="${prefix}-grade"><option value="all">All listed ages</option>${gradeOptions}</select>
      </div>
      <div class="beyond-academics-field">
        <label for="${prefix}-scope">Scope</label>
        <select id="${prefix}-scope"><option value="all">All scopes</option><option value="national">National</option><option value="progression">National to International</option><option value="international">International</option></select>
      </div>
      <div class="beyond-academics-field">
        <label for="${prefix}-format">Participation</label>
        <select id="${prefix}-format"><option value="all">Any format</option><option value="individual">Individual</option><option value="team">Team</option><option value="both">Individual or Team</option></select>
      </div>
      <div class="beyond-academics-field">
        <label for="${prefix}-difficulty">Difficulty Level</label>
        <select id="${prefix}-difficulty"><option value="all">All levels</option><option value="1">1 Star (Beginner)</option><option value="2">2 Star (Easy)</option><option value="3">3 Star (Intermediate)</option><option value="4">4 Star (Advanced)</option><option value="5">5 Star (Expert)</option></select>
      </div>
      <div class="beyond-academics-field beyond-academics-actions-field">
        <button type="button" class="beyond-academics-secondary-button" data-clear-filters="${prefix}">Clear filters</button>
      </div>
    </div>
  `;
}

function itemAttributes(entry) {
  const domains = entry.categories.map(([slug]) => slug).join('|');
  const grades = entry.gradeKeys.map((value) => value.toLowerCase()).join('|');
  const scopes = Array.from(new Set(entry.levels.map(scopeFor))).join('|');
  const formats = Array.from(new Set(entry.formats.map(participationFor))).join('|');
  const difficulty = Array.from(new Set(entry.difficulties.map(difficultyCount))).join('|');
  const search = [entry.name, ...entry.categories.map(([, title]) => title), ...entry.grades, ...entry.levels, ...entry.formats, ...entry.difficulties, ...entry.bestFor].join(' ').toLowerCase();
  return `data-search="${escapeHtml(search)}" data-domains="${escapeHtml(domains)}" data-grades="${escapeHtml(grades)}" data-scopes="${escapeHtml(scopes)}" data-formats="${escapeHtml(formats)}" data-difficulties="${escapeHtml(difficulty)}"`;
}

function labels(values) {
  return values.length ? values.map(escapeHtml).join('<br>') : '<span class="beyond-academics-link-placeholder">Not listed in source</span>';
}

function officialLinks(websites) {
  if (!websites.length) return '<span class="beyond-academics-link-placeholder">Not listed in source</span>';
  return websites.map((website) => `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Official site</a>`).join('<br>');
}

// Level badges: colour follows the scope (national, international, national to international).
function levelBadges(levels) {
  if (!levels.length) return '<span class="beyond-academics-link-placeholder">Not listed in source</span>';
  return levels.map((level) => `<span class="beyond-academics-level beyond-academics-level-${scopeFor(level)}">${escapeHtml(level)}</span>`).join(' ');
}

function renderMasterRow(entry) {
  return `<tr ${itemAttributes(entry)}><th scope="row" data-label="Competition">${escapeHtml(entry.name)}</th><td data-label="Scope / level">${levelBadges(entry.levels)}</td><td data-label="Age">${labels(entry.grades)}</td><td data-label="Format">${labels(entry.formats)}</td><td data-label="Difficulty Level">${labels(entry.difficulties)}</td><td data-label="Domain">${labels(entry.bestFor)}</td><td data-label="Official website">${officialLinks(entry.websites)}</td></tr>`;
}

function renderCategory(category) {
  const categorySlug = slugify(category.title || 'category');
  return `<section class="beyond-academics-category-section" id="${categorySlug}">
    <div class="beyond-academics-section-heading"><h3><span class="beyond-academics-category-icon" aria-hidden="true"><svg viewBox="0 0 64 64" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">${domainIcons[domainIconKey(category.title)]}</svg></span>${escapeHtml(String(category.title).replace(/^[^\p{L}\p{N}]+/u, ''))}</h3><p>${escapeHtml(categoryDescriptions[category.title] || '')}</p></div>
  </section>`;
}

function setupFilters(prefix, selector, total) {
  const form = document.querySelector(`[data-filter-form="${prefix}"]`);
  const items = Array.from(document.querySelectorAll(selector));
  const count = document.getElementById(`${prefix}-count`);
  const empty = document.getElementById(`${prefix}-empty`);
  const search = document.getElementById(`${prefix}-search`);
  const fields = {
    domain: document.getElementById(`${prefix}-domain`),
    grade: document.getElementById(`${prefix}-grade`),
    scope: document.getElementById(`${prefix}-scope`),
    format: document.getElementById(`${prefix}-format`),
    difficulty: document.getElementById(`${prefix}-difficulty`)
  };

  const allGradeOptions = Array.from(fields.grade.options);

  function syncGradeOptions() {
    const domain = fields.domain.value;
    const available = new Set();
    items.forEach((item) => {
      if (domain !== 'all' && !(item.dataset.domains || '').split('|').includes(domain)) return;
      (item.dataset.grades || '').split('|').forEach((grade) => available.add(grade));
    });
    const current = fields.grade.value;
    fields.grade.replaceChildren(...allGradeOptions.filter((option) => option.value === 'all' || available.has(option.value)));
    fields.grade.value = Array.from(fields.grade.options).some((option) => option.value === current) ? current : 'all';
  }

  function minStars(item) {
    const values = (item.dataset.difficulties || '').split('|').map(Number).filter((n) => n > 0);
    return values.length ? Math.min(...values) : Infinity;
  }

  function sortByDifficulty() {
    const body = items[0] && items[0].parentNode;
    if (!body) return;
    items.slice().sort((a, b) => minStars(a) - minStars(b)).forEach((item) => body.appendChild(item));
  }

  function apply() {
    syncGradeOptions();
    const needle = (search.value || '').trim().toLowerCase();
    let shown = 0;
    items.forEach((item) => {
      const domains = (item.dataset.domains || '').split('|');
      const grades = (item.dataset.grades || '').split('|');
      const scopes = (item.dataset.scopes || '').split('|');
      const formats = (item.dataset.formats || '').split('|');
      const difficulties = (item.dataset.difficulties || '').split('|');
      const matches = (!needle || (item.dataset.search || '').includes(needle))
        && (fields.domain.value === 'all' || domains.includes(fields.domain.value))
        && (fields.grade.value === 'all' || grades.includes(fields.grade.value))
        && (fields.scope.value === 'all' || scopes.includes(fields.scope.value))
        && (fields.format.value === 'all' || formats.includes(fields.format.value))
        && (fields.difficulty.value === 'all' || difficulties.includes(fields.difficulty.value));
      item.classList.toggle('beyond-academics-hidden', !matches);
      if (matches) shown += 1;
    });
    sortByDifficulty();
    if (count) count.textContent = `${shown} of ${total} competitions`;
    if (empty) empty.hidden = shown !== 0;
  }

  if (!form) return;
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  form.querySelector(`[data-clear-filters="${prefix}"]`).addEventListener('click', () => {
    form.querySelectorAll('input').forEach((input) => { input.value = ''; });
    form.querySelectorAll('select').forEach((select) => { select.value = 'all'; });
    apply();
  });
  apply();
}

function buildHandbook(data) {
  const categories = Array.isArray(data.categories) ? data.categories.filter((category) => Array.isArray(category.competitions) && category.competitions.length) : [];
  const uniqueEntries = collectEntries(categories);
  const grades = Array.from(new Set(uniqueEntries.flatMap((entry) => entry.gradeKeys))).sort((a, b) => AGE_GROUPS.indexOf(a) - AGE_GROUPS.indexOf(b));
  const categoryLinks = categories.map((category) => {
    const id = slugify(category.title || 'category');
    return `<li><a href="#${id}">${escapeHtml(String(category.title).replace(/^[^\p{L}\p{N}]+/u, ''))}<span>${category.competitions.length} entries</span></a></li>`;
  }).join('');
  const uniqueCount = uniqueEntries.length;
  const masterRows = uniqueEntries.map(renderMasterRow).join('');
  const categorySections = categories.map(renderCategory).join('');
  const gradeOptions = Array.from(new Set(grades));

  const tableControls = renderControls('master', categories, gradeOptions);

  root.innerHTML = `<div class="beyond-academics-directory" id="top">
    <header class="beyond-academics-hero">
      <div class="beyond-academics-hero-copy">
        <p class="beyond-academics-kicker">10xTechClub · Student handbook</p>
        <h1>Beyond Academics</h1>
        <p class="beyond-academics-subtitle">A Categorized list of National and International Competitions</p>
        <p class="beyond-academics-intro">A student's guide to STEM, Robotics, AI, Coding, Science, Engineering, Space &amp; Innovation Competitions.</p>
        <a href="#handbook-directory" class="beyond-academics-primary-button">Browse the handbook</a>
      </div>
      <figure class="beyond-academics-hero-figure"><img src="${assetBase}assets/images/hero-robot.png" alt="A wheeled robot with ultrasonic sensors and control boards, with a robotic arm and tools on the workbench behind it" width="1627" height="967" loading="lazy" decoding="async" /><p style="text-align: center; margin-top: 8px; margin-bottom: 0; font-size: 0.95rem; font-weight: bold; font-style: italic; color: var(--beyond-academics-text);">For the Students of Age 6 to 20 & Above</p></figure>
    </header>

    <details class="beyond-academics-toc" id="handbook-directory" open>
      <summary><span><small>CONTENTS</small>Handbook directory</span><span class="beyond-academics-toc-toggle" aria-hidden="true">+</span></summary>
      <ol class="beyond-academics-toc-list">
        <li><a href="#introduction">Why this handbook exists</a></li>
        <li><a href="#stem-journey">The Four Stages of a STEM Journey</a></li>
        <li><a href="#domain-gallery">STEM Competition Domains at a Glance</a></li>
        <li><a href="#competition-categories">Competition Categories</a></li>
        <li><a href="#finding-the-right-fit">Finding the Right Fit</a></li>
        <li><a href="#master-directory">Master Competition Directory</a></li>
        <li><a href="#how-to-succeed">How to Actually Succeed</a></li>
        <li><a href="#designing-the-journey">Designing the Journey, Instead of Just Competing</a></li>
        <li><a href="#student-letter">A Letter to Students</a></li>
      </ol>
    </details>

    <section class="beyond-academics-intro-section" id="introduction">
      <h2>Why this handbook exists</h2>
      <p>For decades, academic success has been measured by marks, ranks, and report cards. That still matters, but the world has changed. Universities, employers, and innovators are now looking beyond grades, valuing curiosity, creativity, initiative, resilience, and the ability to solve real problems.</p>
      <p>These qualities aren't built by textbooks alone. They're built by robots that don't work the first time, by presenting ideas in front of judges, by writing code to solve real problems, by launching rockets, designing drones, and pitching startup ideas.</p>
      <p>Yet despite thousands of STEM competitions available across India and the world, discovering the right opportunities can be challenging. Information is scattered across hundreds of organisations, government initiatives, and private institutions, making it difficult to know where to begin.</p>
      <p>That’s what this guide is for: to help students discover competitions that match their interests, strengths, and current skill level. Whether a student is passionate about robotics, curious about AI, excited by space exploration, or eager to turn ideas into something real, this handbook helps them find opportunities to learn, experiment, and challenge themselves.</p>
      <p>A student doesn’t need to read from beginning to end. They can start with the contents, choose the category that matches their interests, compare a few options, and shortlist the ones that feel exciting and achievable. The goal isn’t to enter the most competitions; it’s to find the right ones for the student.</p>
    </section>

    <section class="beyond-academics-editorial beyond-academics-about" id="about-10xtechclub"><h2>What Is 10xTechClub?</h2><p>10xTechClub is a hands-on STEM learning and technology education centre in Pune, India, empowering students to explore emerging technologies, build real-world projects, and develop future-ready skills. Through experiential, project-based learning, students explore Robotics, Artificial Intelligence (AI), Coding, Electronics, Python, 3D Printing, IoT, SpaceTech, and other exciting fields of innovation.</p><p>At 10xTechClub, learning goes beyond textbooks. Students are encouraged to experiment, solve problems, collaborate, design prototypes, participate in hackathons, and turn their ideas into working projects. With structured learning pathways, mentor guidance, and opportunities to apply their knowledge, they develop critical thinking, creativity, teamwork, and an innovation-driven mindset.</p><p>We believe that every curious learner deserves opportunities to explore their potential beyond the classroom. That is why <em>Beyond Academics: The Ultimate STEM Competition Handbook</em> brings together a curated guide to STEM, robotics, science, AI, coding, engineering, space, and innovation competitions in India and around the world. Designed for curious students aged 6–19 and above, this resource helps students discover exciting opportunities, understand competition pathways, and explore ways to turn their curiosity and practical skills into meaningful learning experiences.</p><p><strong>Whether a student is taking first steps into robotics or aspiring to participate in national and international innovation challenges, this handbook is the starting point for exploring what is possible beyond academics.</strong></p></section>

    <section class="beyond-academics-editorial beyond-academics-journey" id="stem-journey">
      <p class="beyond-academics-kicker">The STEM journey</p>
      <h2>The Four Stages of a STEM Journey</h2>
      <p>Every meaningful STEM journey tends to follow a similar arc. The directory is organised so a student can find where they are right now and see where they could go next.</p>
      <ol class="beyond-academics-stages">
        <li><strong>Explore</strong><span>Try different fields with low-pressure, beginner-friendly competitions.</span></li>
        <li><strong>Build</strong><span>Go deeper into one or two areas and build real projects.</span></li>
        <li><strong>Compete</strong><span>Enter more advanced, selective competitions.</span></li>
        <li><strong>Innovate</strong><span>Apply skills to original ideas, mentorship, and real-world impact.</span></li>
      </ol>
      <p><a href="#handbook-directory">Back to handbook directory</a></p>
    </section>

    ${renderDomainGallery(categories)}

    <section class="beyond-academics-category-collection" id="competition-categories">
      <div class="beyond-academics-section-heading"><h2>Competition Categories</h2><p>These categories follow the handbook's domain groupings. Read each summary to see what students do in that domain.</p></div>
      ${categorySections}
    </section>

    <section class="beyond-academics-editorial beyond-academics-fit" id="finding-the-right-fit">
      <p class="beyond-academics-kicker">Choose with purpose</p><h2>Finding the Right Fit</h2>
      <div class="beyond-academics-table-wrapper"><table class="beyond-academics-table"><caption>Use interests as a starting point for exploring directory domains</caption><thead><tr><th scope="col">If the student enjoys...</th><th scope="col">Look at...</th></tr></thead><tbody>
        <tr><th scope="row">Building robots or machines</th><td>Robotics · Engineering · Drones</td></tr>
        <tr><th scope="row">Programming and creating software</th><td>Coding · Artificial Intelligence · Game Development</td></tr>
        <tr><th scope="row">Solving puzzles and logical problems</th><td>Mathematics Olympiads</td></tr>
        <tr><th scope="row">Experimenting and asking “Why?”</th><td>Science &amp; Research</td></tr>
        <tr><th scope="row">Space and astronomy</th><td>Space Competitions</td></tr>
        <tr><th scope="row">Inventing and creating new ideas</th><td>Innovation &amp; Design</td></tr>
        <tr><th scope="row">Starting businesses or pitching ideas</th><td>Entrepreneurship</td></tr>
        <tr><th scope="row">Electronics and embedded systems</th><td>Robotics · Engineering · Drones</td></tr>
        <tr><th scope="row">Debating global issues or world affairs</th><td>Academic Enrichment · Debate · Model United Nations</td></tr>
      </tbody></table></div>
      <h3>By experience level</h3><ul><li><strong>Beginner:</strong> FIRST LEGO League Explore, Bebras, INSPIRE MANAK, Minecraft Education, Brackeys Game Jam.</li><li><strong>Intermediate:</strong> WRO, Robotex, Codeavour, Technovation, IAAC.</li><li><strong>Advanced:</strong> FRC, IOAI, ISEF, RoboCup.</li></ul>
      <h3>By Goal</h3><p>A student who wants to build a strong portfolio should explore Robotics, AI, Research, and Entrepreneurship. One aiming to strengthen university applications should consider Olympiads, Research, Robotics, and Debate. One who wants to develop leadership skills should explore Robotics, Entrepreneurship, Innovation, and Model UN.</p>
      <p>There's no single “best” competition, only the one that’s right for the student today. Building a strong foundation through beginner-friendly experiences will almost always take a student further than rushing into advanced competitions.</p>
      <p><a href="#handbook-directory">Back to handbook directory</a></p>
    </section>

    ${renderSpotlight(categories)}

    <section class="beyond-academics-directory-block" id="master-directory">
      <div class="beyond-academics-section-heading"><p class="beyond-academics-kicker">Search all domains</p><h2>Master Competition Directory</h2><p>One listing per unique competition name. Where the handbook repeats a competition across domains, its source-listed domains and “Best For” guidance are combined here. Use the filters to narrow the list.</p></div>
      <div class="beyond-academics-directory-note"><strong>Source notes:</strong> Eligibility, format, level, difficulty, and “Best For” are shown only when present in the handbook. Difficulty is the guide's comparative rating, not an organiser rating. Cost and time commitment are not listed when the source does not provide them. Scope filters are derived from the source's level wording. This is a suggested list and does not imply endorsement of any competition.</div>
      ${tableControls}
      <div class="beyond-academics-results-meta" id="master-count" aria-live="polite"></div>
      <p class="beyond-academics-empty-state" id="master-empty" hidden>No competitions match these filters. Try a broader search or clear filters.</p>
      <div style="display: flex; align-items: flex-start; gap: 16px; justify-content: space-between;">
        <div id="master-content" class="beyond-academics-collapsible-content" style="flex: 1;"><div class="beyond-academics-table-wrapper beyond-academics-master-table"><table class="beyond-academics-table"><caption>Unique competitions and source-provided details</caption><thead><tr><th scope="col">Competition</th><th scope="col">Scope / level</th><th scope="col">Age</th><th scope="col">Format</th><th scope="col">Difficulty Level</th><th scope="col">Domain</th><th scope="col">Official website</th></tr></thead><tbody>${masterRows}</tbody></table></div>
      <p class="beyond-academics-return"><a href="#handbook-directory">Back to handbook directory</a></p>
        </div>
        <button class="beyond-academics-collapse-toggle" id="master-toggle" aria-expanded="true" aria-controls="master-content" title="Toggle master directory" style="flex-shrink: 0; margin-top: 4px;"><span aria-hidden="true">−</span></button>
      </div>
    </section>

    <section class="beyond-academics-download" id="download-directory"><span class="beyond-academics-download-icon"><svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 8h20l10 10v38H18zM38 8v10h10M32 28v14M26 36l6 6 6-6"/></svg></span><div class="beyond-academics-download-copy"><p class="beyond-academics-kicker">Free download</p><h2>Take the Directory Along</h2><p>Download a printable PDF of all national and international STEM competitions across all categories, with levels, ages, formats, difficulty ratings, and official websites. Verify all details directly with the organizers before registering.</p><p class="beyond-academics-download-meta">PDF · 14 pages · Released Oct 2026</p></div><a class="beyond-academics-primary-button beyond-academics-download-button" href="${assetBase}assets/downloads/STEM-Competition-Directory.pdf" download="STEM-Competition-Directory.pdf">Download PDF</a></section>

    <section class="beyond-academics-editorial beyond-academics-success" id="how-to-succeed">
      <p class="beyond-academics-kicker">Prepare thoughtfully</p><h2>How to Actually Succeed</h2><p>Discovering the right competition is only step one. Here’s what separates students who thrive from those who simply participate.</p>
      <ol>
        <li><strong>Understand the Format Before Committing.</strong> Check what is evaluated, whether the competition suits the student’s current level, its objectives, and the timeline. Read the rulebook first; it tells students what judges expect. Choose a competition that matches the student’s skills while challenging them to grow, not just one that is famous.</li>
        <li><strong>Think Like a Judge.</strong> Explain how the problem was identified, how decisions were made, and what was learned. Perfect jargon is less important than clarity. Practise explaining the project to someone unfamiliar with it and check whether they understand the ideas.</li>
        <li><strong>Build Projects That Stand Out.</strong> Start with a real problem, who it affects, and why it matters. Then research, prototype, and test the solution. “I want to build a robot” is less focused than “I want to help people who struggle to open jars.”</li>
        <li><strong>Build as a Team, Not a Group of Individuals.</strong> Divide responsibilities, but make sure everyone can explain the entire project. If a teammate cannot explain the bigger picture, judges may notice. Communicate regularly, not just near deadlines.</li>
        <li><strong>Document Along the Way.</strong> Record what was tried, what failed, what changed, and why from day one. These notes make presentations easier and can later support the student’s portfolio for college applications.</li>
        <li><strong>Present Like It’s a Conversation.</strong> Judges may see dozens of teams in a day. Speak naturally, demonstrate understanding, and tell the story behind the project instead of reciting a memorised script.</li>
        <li><strong>Avoid the Predictable Mistakes.</strong> Starting late, skipping the rulebook, building before researching, testing only once, or focusing only on winning can undermine the work. One week before the event, check readiness against these basics.</li>
        <li><strong>Think Beyond the Competition Itself.</strong> A portfolio of projects and documented learning can open doors to college opportunities and scholarships. Refine a good project for another event. At the start of each year, plan the skills to develop, competitions to enter, mentors needed, and progress to document. Review the plan every six months.</li>
      </ol>
      <aside class="beyond-academics-practical-notes">
        <p><strong>Quick tip:</strong> Choose a competition because it fits the student’s skills and stretches them, not just because it is famous.</p>
        <h3>Put the guidance into practice</h3>
        <p>Compare “I want to build a robot” with a problem-led idea: “I want to help people who struggle to open jars.” Start with who is affected and why it matters, then research, prototype, and test the solution.</p>
        <p><strong>One week before the event:</strong> do a readiness check. Revisit the rulebook and judging criteria, confirm the timeline, make sure the project has been tested, and check that every teammate can explain the whole project in clear language.</p>
      </aside>
    </section>

    <section class="beyond-academics-editorial beyond-academics-closing" id="designing-the-journey">
      <p class="beyond-academics-kicker">Keep learning beyond the event</p><h2>Designing the Journey, Instead of Just Competing</h2>
      <p>Instead of asking which competition comes next, ask what the student hopes to achieve this year. One year might focus on learning robotics; the next might build on that with an AI-powered project. Progress comes from building on each experience, not from the number of events entered.</p>
      <p>Setbacks are part of the process, and even strong teams lose. Treat a result as a lesson rather than a verdict: what worked, what did not, and what can be tried differently? Writing a few honest lines in a “Lessons Learned” notebook after each event can do more for long-term growth than a trophy.</p>
      <p>Measure success by the skills developed, not the certificates collected. Confidence, curiosity, resilience, and problem-solving last beyond any competition. The aim is to build the kind of thinking that lasts, not simply to chase medals.</p>
    </section>

    <section class="beyond-academics-editorial beyond-academics-student-letter" id="student-letter">
      <p class="beyond-academics-kicker">A closing note</p>
      <h2>A Letter to Students</h2>
      <p>Dear student,</p>
      <p>A student does not have to know everything before beginning. They can choose a question that sparks their curiosity, find a challenge that feels possible but not effortless, and take the first step. Their first idea may change when tested. That is not failure; that is how learning works.</p>
      <p>A student should keep a record of what they try, what surprises them, and what they would change; ask teammates for their ideas; make sure everyone can explain the project; and remember that a clear explanation is often stronger than complicated words.</p>
      <p>A student may win, or may not. Either way, the skills they practise, the problems they learn to solve, and the confidence they build belong to them. Students should keep making, keep asking questions, and let each challenge help them decide what to explore next.</p>
      <p>With encouragement,<br><strong>10xTechClub Team</strong></p>
    </section>

    <section class="beyond-academics-cta" id="next-step"><span class="beyond-academics-cta-icon"><svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M32 7c9 6 13 17 10 30H22C19 24 23 13 32 7zM22 37l-9 9 9-2M42 37l9 9-9-2M28 45l4 11 4-11"/><circle cx="32" cy="25" r="4.5"/></svg></span><div class="beyond-academics-cta-copy"><h2>Get the Preparation Students Need to Compete</h2><p><strong>Discovering a competition is exciting—but turning a student’s ambition into a working project takes preparation, practice, and the right guidance.</strong></p><p>Through our <strong>Premier Accelerator Program (PAP)</strong> for students aged 12–17, 10xTechClub helps students progress from learning technology concepts to building projects, experimenting with ideas, and tackling real-world challenges. With exposure to Robotics, AI, Python, IoT, and Embedded Systems, alongside mentor guidance and soft skills development, they can build valuable experience for robotics competitions, coding challenges, hackathons, and innovation programs.</p><p>Rather than preparing for just one event, students develop skills they can apply across multiple challenges—learning to build, test, improve, and present their ideas with confidence.</p><p><strong>Take the next step from aspiring competitor to confident creator.</strong></p><p><a href="https://10xtechclub.com/" target="_blank" rel="noopener noreferrer"><strong>Explore 10xTechClub</strong></a></p></div></section>


    ${renderSuggestForm(categories)}
    <footer class="beyond-academics-disclaimer"><h2>Disclaimer</h2><p><em>Please note: This is a curated informational list of potential competition opportunities, not an endorsement by 10xTechClub. Competition details may change; always verify eligibility, dates, fees, and rules on the official competition website before participating.</em></p><p><a href="#handbook-directory">Back to handbook directory</a></p><a href="#top" class="beyond-academics-back-top" aria-label="Back to top">Back to top ↑</a></footer>
  </div>`;


  const items = uniqueEntries.map((entry, index) => {
    const item = { '@type': 'ListItem', position: index + 1, name: entry.name };
    if (entry.websites[0]) item.url = entry.websites[0];
    return item;
  });
  const jsonLd = document.createElement('script');
  jsonLd.type = 'application/ld+json';
  jsonLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    mainEntity: { '@type': 'ItemList', name: 'STEM competitions directory', numberOfItems: items.length, itemListElement: items }
  }).replace(/</g, '\\u003c');
  document.head.appendChild(jsonLd);

  const contents = document.querySelector('.beyond-academics-toc');
  const compactContents = window.matchMedia('(max-width: 760px)');
  const updateContentsMode = () => { contents.open = !compactContents.matches; };
  updateContentsMode();
  compactContents.addEventListener('change', updateContentsMode);

  setupFilters('master', '#master-directory tbody tr', uniqueCount);
  setupSpotlight();
  setupTilt();
  setupSuggestForm();

  // Setup master directory collapse/expand
  const masterToggle = document.getElementById('master-toggle');
  const masterContent = document.getElementById('master-content');
  if (masterToggle && masterContent) {
    masterToggle.addEventListener('click', function(e) {
      e.preventDefault();
      const isExpanded = masterToggle.getAttribute('aria-expanded') === 'true';
      masterToggle.setAttribute('aria-expanded', !isExpanded);
      masterContent.classList.toggle('is-collapsed');
      masterToggle.textContent = isExpanded ? '+' : '−';
    });
  }


  root.addEventListener('click', (event) => {
    const domainLink = event.target.closest('[data-domain-filter]');
    if (!domainLink) return;
    const domainSelect = document.getElementById('master-domain');
    if (!domainSelect) return;
    domainSelect.value = domainLink.dataset.domainFilter;
    domainSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

const suppliedData = window.BeyondAcademicsDirectoryData;
if (suppliedData && Array.isArray(suppliedData.categories)) {
  buildHandbook(suppliedData);
} else {
  fetch(assetBase + 'data/competitions.json')
    .then((response) => {
      if (!response.ok) throw new Error('Could not load handbook competition data.');
      return response.json();
    })
    .then(buildHandbook)
    .catch((error) => {
      if (root) root.innerHTML = `<div class="beyond-academics-directory"><p>Unable to load the handbook: ${escapeHtml(error.message)}</p></div>`;
    });
}
