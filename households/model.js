export const categories = Object.freeze(['harvest', 'cash', 'attendance', 'weather']);

const visibleCategories = Object.freeze(['harvest', 'cash', 'weather']);
const stateSets = Object.freeze({
  harvest: ['good', 'weak', 'failed'],
  cash: ['enough', 'low', 'loan'],
  attendance: ['regular', 'irregular', 'dropout'],
  weather: ['sun', 'rain', 'storm'],
});

const contexts = Object.freeze([
  { id: 'C01', colorName: 'RED', light: '#a74638', dark: '#d06c58' },
  { id: 'C02', colorName: 'BLUE', light: '#316b8c', dark: '#6ca4c4' },
  { id: 'C03', colorName: 'AMBER', light: '#8b681d', dark: '#bd9c4e' },
  { id: 'C04', colorName: 'GREEN', light: '#39785c', dark: '#75ae8e' },
  { id: 'C05', colorName: 'PURPLE', light: '#72528e', dark: '#ad91c4' },
  { id: 'C06', colorName: 'PINK', light: '#a24b7d', dark: '#ce83ae' },
]);

const teamIds = ['A', 'B', 'C', 'D'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix32(value) {
  let x = value | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function hashSeed(seed, ...parts) {
  let hash = mix32(Number.isFinite(seed) ? Math.trunc(seed) : 0);
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i++) {
      hash = mix32(hash ^ text.charCodeAt(i));
    }
    hash = mix32(hash ^ text.length);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

function roundKey(teamId, roundIndex, category, value, contextId) {
  return `${contextId}:${teamId}${roundIndex + 1}:${category}:${value}`;
}

function grade(value, thresholds, states) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) return states[i];
  }
  return states[thresholds.length];
}

function makeCue(teamId, roundIndex, category, value, contextId) {
  return {
    key: roundKey(teamId, roundIndex, category, value, contextId),
    context: contextId,
    value,
  };
}

// Archive and live rows call this exact sampler with independent random seeds.
function drawRow(rng, teamId, index, contextIndex) {
  const context = contexts[contextIndex];
  const pressure = [-.12, .24, -.28, .10, -.05, .32][contextIndex];
  const latent = pressure + (rng() - .5) * 1.5;
  const harvest = grade(latent + (rng() - .5) * .7, [.48, -.08], ['failed','weak','good']);
  const cash = grade(latent * .8 + (rng() - .5) * .85, [.40, -.15], ['loan','low','enough']);
  const w = rng();
  const weather = w < .45 ? 'rain' : w < .80 ? 'sun' : 'storm';
  // Synthetic association, not a claim of empirical dropout rates.
  const risk = clamp(.045 + (harvest==='failed'?.24:harvest==='weak'?.09:0)
    + (cash==='loan'?.24:cash==='low'?.07:0) + (weather==='storm'?.12:weather==='sun'?.025:0)
    + pressure*.08, .025, .80);
  const attendance = rng() < risk ? 'dropout' : rng() < .35 ? 'irregular' : 'regular';
  const values = {harvest,cash,attendance,weather};
  return {id:`${teamId}${index+1}`,teamId,roundIndex:index,contextId:context.id,
    initialCategory:pick(rng,visibleCategories),
    targetCues:Object.fromEntries(categories.map(c=>[c,makeCue(teamId,index,c,values[c],context.id)])),
    fatal:attendance==='dropout'};
}
function updateContext(previous) {
  const c=previous.targetCues;
  // A compact summary of the previous survey, not the hidden current outcome.
  return (stateSets.harvest.indexOf(c.harvest.value)*2
    + stateSets.cash.indexOf(c.cash.value) + stateSets.weather.indexOf(c.weather.value))%6;
}

function entropy(probability) {
  const p = clamp(probability, 1e-9, 1 - 1e-9);
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

function topologicalCounts(values, total) {
  const totalWeight = values.reduce((sum, value) => sum + value.weight, 0);
  if (totalWeight <= 0) {
    const even = Math.floor(total / values.length);
    let remainder = total - even * values.length;
    return values.map((entry) => {
      const count = even + (remainder > 0 ? 1 : 0);
      remainder -= remainder > 0 ? 1 : 0;
      return { ...entry, count };
    });
  }
  const allocated = values.map((entry) => {
    const exact = (entry.weight / totalWeight) * total;
    return {
      ...entry,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });
  let used = allocated.reduce((sum, entry) => sum + entry.count, 0);
  const sorted = [...allocated].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; used < total; i++, used++) {
    sorted[i % sorted.length].count++;
  }
  return values.map((entry) => {
    const match = sorted.find((candidate) => candidate.label === entry.label);
    return { ...entry, count: match ? match.count : 0 };
  });
}

function selectPool(pack, round, revealedSet) {
  const visible=[...revealedSet];
  const pool=pack.historiesByTeam[round.teamId].filter(sample=>sample.contextId===round.contextId
    && visible.every(c=>sample.targetCues[c].value===round.targetCues[c].value));
  if(pool.length)return pool;
  // Deterministic conditional simulation for a rare archive gap. No mismatched fallback.
  const rng=makeRng(hashSeed(pack.seed,'backfill',round.teamId,round.contextId,
    visible.sort().map(c=>c+':'+round.targetCues[c].value).join('|')));
  const ctx=contexts.findIndex(c=>c.id===round.contextId),extra=[];
  for(let n=0;n<100000&&extra.length<30;n++){
    const sample=drawRow(rng,round.teamId,n,ctx);
    if(visible.every(c=>sample.targetCues[c].value===round.targetCues[c].value))extra.push(sample);
  }
  if(!extra.length)throw Error('Unsupported evidence combination');
  return extra;
}

function posteriorFatal(pool) {
  const fatal = pool.filter((sample) => sample.fatal).length;
  return (fatal + 1) / (pool.length + 2);
}

function inspectionWeights(pool, round, revealedSet) {
  const total = pool.length || 1;
  const currentFatal = posteriorFatal(pool);
  const currentEntropy = entropy(currentFatal);
  const choices = categories
    .filter((category) => !revealedSet.has(category))
    .map((category) => {
      const groups = new Map();
      for (const sample of pool) {
        const value = sample.targetCues[category].value;
        let group = groups.get(value);
        if (!group) {
          group = [];
          groups.set(value, group);
        }
        group.push(sample);
      }
      let conditionalEntropy = 0;
      for (const group of groups.values()) {
        const p = posteriorFatal(group);
        conditionalEntropy += (group.length / total) * entropy(p);
      }
      const gain = Math.max(0, currentEntropy - conditionalEntropy);
      return { label: category, weight: gain };
    });
  return choices;
}

export function createPack(seed = 15, count = 200) {
  const normalizedSeed = Number.isFinite(seed) ? Math.trunc(seed) : 15;
  const sheetCount = Number.isFinite(count) ? Math.max(1, Math.trunc(count)) : 200;
  const packId = `HH1-${normalizedSeed}-${sheetCount}`;
  const historiesByTeam = {};
  const teams = teamIds.map((teamId, teamIndex) => {
    const rng=makeRng(hashSeed(normalizedSeed,'live',teamId)),rounds=[];
    let contextIndex=(normalizedSeed%6+6+teamIndex)%6;
    for(let i=0;i<6;i++){
      const r=drawRow(rng,teamId,i,contextIndex);rounds.push(r);contextIndex=updateContext(r);
    }
    const archiveRng=makeRng(hashSeed(normalizedSeed,'archive',teamId));
    historiesByTeam[teamId]=Array.from({length:3600},(_,i)=>drawRow(archiveRng,teamId,i,i%6));
    return {id:teamId,rounds,audienceCount:Math.floor(sheetCount/4)+(teamIndex<sheetCount%4?1:0)};
  });
  return {
    version: 'HH1',
    packId,
    seed: normalizedSeed,
    sheetCount,
    roundCount: 6,
    revealTokens: 3,
    interventions: 2,
    contexts: contexts.map((context) => ({ ...context })),
    teams,
    historiesByTeam,
  };
}

export function poll(pack, round, revealed = [], tokens = 0) {
  const revealedSet = new Set(revealed);
  const pool = selectPool(pack, round, revealedSet);
  const total = pack.teams.find(t=>t.id===round.teamId).audienceCount;
  const fatalRate = posteriorFatal(pool);
  const actionWeights = [];

  if (revealedSet.has('attendance')) {
    const attendance = round.targetCues.attendance.value;
    const go = attendance === 'dropout' ? 0 : total;
    const avoid = total - go;
    return {
      counts: {
        go,
        avoid,
        harvest: 0,
        cash: 0,
        attendance: 0,
        weather: 0,
      },
      total,
      matched: pool.length,
    };
  }

  if (tokens <= 0) {
    const avoidRatio = clamp(fatalRate, 0.02, 0.98);
    actionWeights.push({ label: 'go', weight: 1 - avoidRatio });
    actionWeights.push({ label: 'avoid', weight: avoidRatio });
  } else {
    const certainty = 1 - 4 * fatalRate * (1 - fatalRate);
    const actionShare = clamp(0.42 + 0.5 * certainty, 0.42, 0.92);
    const goWeight = 1 - fatalRate;
    const avoidWeight = fatalRate;
    actionWeights.push({ label: 'go', weight: actionShare * goWeight });
    actionWeights.push({ label: 'avoid', weight: actionShare * avoidWeight });
  }

  const inspectionShare = tokens > 0 ? 1 - actionWeights.reduce((sum, entry) => sum + entry.weight, 0) : 0;
  const inspections = inspectionWeights(pool, round, revealedSet);
  const inspectionTotal = inspections.reduce((sum, entry) => sum + entry.weight, 0);
  const adjustedInspections = inspections.map((entry) => ({
    label: entry.label,
    weight: inspectionTotal > 0 ? entry.weight * (inspectionShare / inspectionTotal) : inspectionShare / Math.max(1, inspections.length),
  }));

  const weighted = topologicalCounts([...actionWeights, ...adjustedInspections], total);
  const counts = {
    go: 0,
    avoid: 0,
    harvest: 0,
    cash: 0,
    attendance: 0,
    weather: 0,
  };
  for (const entry of weighted) {
    counts[entry.label] = entry.count;
  }
  return { counts, total, matched: pool.length };
}
