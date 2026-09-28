(function (root) {
  'use strict';
  const battleRatings = [];
  for (let whole = 14; whole >= 1; whole--) {
    for (const decimal of [7, 3, 0]) battleRatings.push(`${whole}.${decimal}`);
  }

  async function resolveAircraftIds(manualIds, filters, fetchPage) {
    if (manualIds.length) return [...manualIds];
    const ids = [];
    const query = new URLSearchParams(filters);
    query.set('limit', '200');
    for (let offset = 0; ; ) {
      query.set('offset', String(offset));
      const page = await fetchPage('/api/aircraft?' + query);
      ids.push(...page.items.map(aircraft => aircraft.id));
      offset += page.items.length;
      if (offset >= page.total) break;
      if (!page.items.length) throw new Error('Каталог изменился. Повторите открытие голосования.');
    }
    if (!ids.length) throw new Error('По выбранным фильтрам самолёты не найдены. Измените фильтры.');
    return [...new Set(ids)];
  }
  const options = { battleRatings, resolveAircraftIds };
  if (typeof module !== 'undefined' && module.exports) module.exports = options;
  else root.MlmlkaVoting = options;
})(typeof window === 'undefined' ? globalThis : window);
