const romanNumerals = new Set(['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']);

export function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeBasicText(value: string) {
  return cleanWhitespace(
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[()[\]{}]/g, ' ')
      .replace(/[.,/\\|:_;'"`~!@#$%^*+=?<>]/g, ' ')
      .replace(/-/g, ' '),
  );
}

export function joinSingleLetterTokens(value: string) {
  const tokens = cleanWhitespace(value).split(' ');
  const output: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].length === 1 && /^[a-z]$/.test(tokens[index])) {
      let joined = tokens[index];
      while (index + 1 < tokens.length && tokens[index + 1].length === 1 && /^[a-z]$/.test(tokens[index + 1])) {
        index += 1;
        joined += tokens[index];
      }
      output.push(joined);
    } else {
      output.push(tokens[index]);
    }
  }
  return output.join(' ');
}

export function normalizeIdentifier(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function normalizeAddressText(value: string) {
  return joinSingleLetterTokens(normalizeBasicText(value))
    .replace(/\broad\b/g, 'rd')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bindustrial\s+estate\b/g, 'industrial estate')
    .replace(/\barea\b/g, 'area')
    .trim();
}

export function extractPlantMarker(value: string) {
  const normalized = normalizeBasicText(value);
  const marker = normalized.match(/\b(?:plant|unit|works|factory)\s+([a-z0-9]+|i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/);
  if (!marker) return '';
  const token = marker[1];
  return romanNumerals.has(token) ? token : token.replace(/^0+/, '');
}

export function levenshteinSimilarity(a: string, b: string) {
  const left = cleanWhitespace(a);
  const right = cleanWhitespace(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  if (left === right) return 1;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1);
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

