// Stage navigation is independent of the collaborative game's state.
export async function mountStageSelector(host, current, source = './stages.json') {
  try {
    const response = await fetch(source);
    if (!response.ok) return;
    const stages = await response.json();
    if (!Array.isArray(stages) || stages.length < 2) return;
    const valid = stages.filter(s => typeof s.id === 'string' && typeof s.label === 'string' && typeof s.href === 'string');
    if (valid.length < 2) return;
    const select = document.createElement('select');
    select.className = 'stage-selector';
    select.setAttribute('aria-label', 'Stage');
    for (const stage of valid) {
      const option = new Option(stage.label, stage.href);
      option.selected = stage.id === current;
      select.add(option);
    }
    select.addEventListener('change', () => {
      const url = new URL(select.value, location.href);
      if (url.origin === location.origin) location.assign(url.href);
    });
    host.append(select);
  } catch { /* Optional navigation: the game works without a stage list. */ }
}
if (document.querySelector('#modes') && !document.querySelector('[data-competitive]')) {
  mountStageSelector(document.querySelector('#modes'), 'collaborative');
}
