let lifeReceipts = [];

function safeISOString(timeStr) {
  if (!timeStr) return new Date().toISOString();
  let d = new Date(timeStr);
  if (!isNaN(d.getTime())) return d.toISOString();

  const parts = String(timeStr).split(/[-/ :]/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return new Date().toISOString();
}

function makeReceipt(id, timeStr, type, title, category, tags = [], extra = {}) {
  return {
    id: String(id),
    timestamp: safeISOString(timeStr),
    type: type,
    title: title || 'Digital Fragment',
    category: category,
    metadata: { tags: tags, ...extra }
  };
}

async function loadAllDatasets(onComplete) {
  let loaded = [];

  const parseFile = (filename, onRow) => {
    return new Promise((res) => {
      Papa.parse(`./${filename}`, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (r) => {
          if (r.data && r.data.length) {
            r.data.slice(0, 100).forEach((row, i) => onRow(row, i));
          }
          res();
        },
        error: () => res()
      });
    });
  };

  // 1. Spotify
  await parseFile('spotify_history.csv', (row, i) => {
    const time = row.ts || row.timestamp || row.date || Object.values(row)[0];
    const song = row.master_metadata_track_name || row.track_name || row.song || 'Track';
    const artist = row.master_metadata_album_artist_name || row.artist_name || row.artist || 'Artist';
    if (time) {
      loaded.push(makeReceipt(`sp-${i}`, time, 'music', `${song} - ${artist}`, 'Music', ['music', 'spotify']));
    }
  });

  // 2. Household Purchases
  await parseFile('Daily Household Transactions.csv', (row, i) => {
    const time = row.Date || row.Date_Time || Object.values(row)[0];
    const title = row.Subcategory || row.Category || row.Item || 'Household Purchase';
    const cost = row.Amount || row.Cost || 0;
    if (time) {
      loaded.push(makeReceipt(`hh-${i}`, time, 'purchase', title, 'Purchases', ['shopping', 'expense'], { cost }));
    }
  });

  // 3. Digital Transactions / UPI (Flexible column mapping)
  await parseFile('Augmented_IndiaTransactMultiFacet2024.csv', (row, i) => {
    const keys = Object.keys(row);
    // Dynamic fallback to any column containing date/time/timestamp or first column
    const timeKey = keys.find(k => /date|time|timestamp/i.test(k)) || keys[0];
    const time = row[timeKey];

    const titleKey = keys.find(k => /merchant|category|type|name|description/i.test(k)) || keys[1];
    const title = row[titleKey] || 'UPI / Digital Payment';

    const costKey = keys.find(k => /amount|inr|cost|price/i.test(k));
    const cost = costKey ? row[costKey] : 0;

    if (time) {
      loaded.push(makeReceipt(`upi-${i}`, time, 'transaction', title, 'Transactions', ['upi', 'digital-payment'], { cost }));
    }
  });

  if (loaded.length > 0) {
    loaded.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    lifeReceipts = loaded;
  }

  onComplete(lifeReceipts);
}

function findConnections(target, all) {
  const targetTime = new Date(target.timestamp).getTime();
  const THREE_HOURS = 3 * 60 * 60 * 1000;

  return all.filter(item => {
    if (item.id === target.id) return false;
    const timeDiff = Math.abs(new Date(item.timestamp).getTime() - targetTime);
    const timeMatch = timeDiff <= THREE_HOURS;
    const tagMatch = item.metadata.tags.some(t => target.metadata.tags.includes(t));
    return timeMatch || tagMatch;
  });
}