const btn = document.getElementById('run');
const input = document.getElementById('cards');
const output = document.getElementById('output');
const setCodesEl = document.getElementById('setCodes');

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

btn.addEventListener('click', async () => {
  const raw = input.value || '';
  const names = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  if (names.length === 0) {
    output.textContent = 'Please enter one or more card names (one per line).';
    return;
  }

  btn.disabled = true;
  output.textContent = 'Working…';

  try {
    const lines = [];
    for (const name of names) {
      const sets = await getPrintSets(name);
      const line = `${name}: ${sets.length ? sets.join(', ') : '(not found)'}`;
      lines.push(line);
      await sleep(120);
    }
    output.textContent = lines.join('\n');
  } catch (err) {
    console.error(err);
    output.textContent = 'Something went wrong. Open the console for details.';
  } finally {
    btn.disabled = false;
  }
});


async function getPrintSets(cardName, {} = {}) {
  const qParts = [`!"${cardName}"`];

  const params = new URLSearchParams({
    order: 'released',
    unique: 'prints',
    q: qParts.join(' ')
  });

  let url = `https://api.scryfall.com/cards/search?${params.toString()}`;
  const seen = new Set();
  const result = [];

  while (url) {
    const page = await fetchJSON(url);

    if (page.object === 'error') {
      break;
    }

    for (const card of page.data || []) {
      const value = card.set?.toUpperCase();
      if (value && !seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
    }

    if (page.has_more && page.next_page) {
      await sleep(120);
      url = page.next_page;
    } else {
      url = null;
    }
  }

  return result;
}

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  return res.json();
}
