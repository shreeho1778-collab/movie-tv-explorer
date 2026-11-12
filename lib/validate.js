// Small input-validation helpers used by the API (the database validates again)
export const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const toIntList = (arr) =>
  Array.isArray(arr) ? [...new Set(arr.map(toInt).filter(Boolean))] : [];

export const emptyToNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : v);

export function validateMovie(b) {
  const errors = [];
  if (!b.Title || !String(b.Title).trim()) errors.push('Title is required');
  if (!['Movie', 'TV Show'].includes(b.Type)) errors.push('Type must be Movie or TV Show');
  if (emptyToNull(b.Rating) !== null) {
    const r = Number(b.Rating);
    if (Number.isNaN(r) || r < 0 || r > 10) errors.push('Rating must be between 0 and 10');
  }
  if (emptyToNull(b.Runtime) !== null && !toInt(b.Runtime)) errors.push('Runtime must be a positive whole number');
  return errors;
}

export function validatePerson(b) {
  const errors = [];
  if (!b.Name || !String(b.Name).trim()) errors.push('Name is required');
  if (emptyToNull(b.Gender) !== null && !['Male', 'Female', 'Other'].includes(b.Gender))
    errors.push('Gender must be Male, Female or Other');
  return errors;
}

// Build a MySQL BOOLEAN MODE full-text term with prefix matching
export function fulltextTerm(q) {
  return String(q)
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length > 0)
    .map((w) => w + '*')
    .join(' ');
}
