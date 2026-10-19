const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/G1/Downloads/Beyond Academics - Blog Version.md';
const outDir = 'C:/Users/G1/Downloads/Blog/beyond-academics-directory/data';

fs.mkdirSync(outDir, { recursive: true });

const text = fs.readFileSync(srcPath, 'utf8');
const lines = text.split(/\r?\n/);
const categories = [];
let current = null;

for (const rawLine of lines) {
  const line = rawLine.trimEnd();

  if (/^###\s+/.test(line)) {
    const title = line.replace(/^###\s+/, '').trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    current = { title, slug, competitions: [] };
    categories.push(current);
    continue;
  }

  if (!current) continue;
  if (!line.startsWith('|')) continue;
  if (
    line.startsWith('|---') ||
    line.includes('Competition | Category') ||
    line.includes('If your child enjoys') ||
    line.includes('By experience level')
  ) {
    continue;
  }

  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  if (cells.length < 7 || !cells[0] || cells[0].toLowerCase() === 'competition') continue;

  const name = cells[0];
  const category = cells[1] || current.title;
  const level = cells[2] || '';
  const grades = cells[3] || '';
  const format = cells[4] || '';
  const difficulty = cells[5] || '';
  const bestFor = cells[6] || '';
  let website = cells[7] || '';

  if (website && !/^https?:\/\//i.test(website)) {
    if (
      website.toLowerCase().includes('official organiser website') ||
      website.toLowerCase().includes('official website') ||
      website === ''
    ) {
      website = '';
    } else if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(website)) {
      website = 'https://' + website;
    } else if (website.toLowerCase() === 'n/a' || website.toLowerCase() === 'varies') {
      website = '';
    }
  }

  current.competitions.push({
    name,
    category,
    level,
    grades,
    format,
    difficulty,
    best_for: bestFor,
    official_website: website || null,
    verification_note: website ? '' : 'Official website requires manual verification.'
  });
}

const validCategories = categories.filter((cat) => cat.competitions.length > 0);
const payload = {
  generated_from: srcPath,
  categories: validCategories
};

fs.writeFileSync(path.join(outDir, 'competitions.json'), JSON.stringify(payload, null, 2));
console.log('categories:', validCategories.length);
console.log('entries:', validCategories.reduce((sum, cat) => sum + cat.competitions.length, 0));
console.log(validCategories.map((cat) => ({ title: cat.title, count: cat.competitions.length })));
