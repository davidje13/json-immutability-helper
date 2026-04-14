export const specFromDiff = (existing, updated, options = {}) =>
  internalSpecFromDiff(existing, updated, options, true) ?? {};

function internalSpecFromDiff(existing, updated, options, needsInit) {
  if (existing === updated) {
    return null;
  }

  if (!updated || typeof updated !== 'object') {
    return updated === undefined ? ['unset'] : ['=', updated];
  }
  if (
    existing &&
    (typeof existing !== typeof updated || Array.isArray(existing) !== Array.isArray(updated))
  ) {
    return ['=', updated];
  }

  if (!Array.isArray(updated)) {
    const changes = [];
    for (const [key, v] of Object.entries(updated)) {
      const old = existing?.[key];
      const spec = internalSpecFromDiff(old, v, options, true);
      if (spec) {
        changes.push([key, spec]);
      }
    }
    if (!options.ignoreOmittedProperties && existing) {
      for (const key of Object.keys(existing)) {
        if (!(key in updated)) {
          changes.push([key, ['unset']]);
        }
      }
    }
    if (!changes.length) {
      return existing ? null : ['init', {}];
    }
    const spec = Object.fromEntries(changes);
    return needsInit ? ['seq', ['init', {}], spec] : spec;
  }

  const { arrayKey } = options;
  if (arrayKey && updated.every((o) => o && typeof o === 'object' && arrayKey in o)) {
    const changes = [];
    const seen = new Set();
    for (const item of updated) {
      const existingItem = existing?.find(
        (o) => o && typeof o === 'object' && o[arrayKey] === item[arrayKey],
      );
      if (existingItem) {
        seen.add(existingItem);
      }
      const spec = internalSpecFromDiff(existingItem, item, options, false);
      if (spec) {
        changes.push([
          'update',
          ['first', { [arrayKey]: ['=', item[arrayKey]] }],
          spec,
          existingItem ?? {},
        ]);
      }
    }
    if (!options.ignoreOmittedArrayItems && existing) {
      for (const item of existing) {
        if (!seen.has(item)) {
          changes.push(['delete', ['first', { [arrayKey]: ['=', item[arrayKey]] }]]);
        }
      }
    }
    if (!changes.length) {
      return null;
    }
    if (needsInit) {
      return ['seq', ['init', []], ...changes];
    }
    return changes.length === 1 ? changes[0] : ['seq', ...changes];
  }

  if (!existing || existing.length !== updated.length) {
    return ['=', updated];
  }
  for (let i = 0; i < updated.length; ++i) {
    if (internalSpecFromDiff(existing[i], updated[i], options, false)) {
      return ['=', updated];
    }
  }

  return null;
}
