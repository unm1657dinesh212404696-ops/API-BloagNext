// Blocks NoSQL operator injection ($where, a.b keys) and neutralises HTML/script tags (XSS).
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v);
    }
    return out;
  }
  if (typeof value === 'string') {
    return value.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
                .replace(/<(\/?)\s*(iframe|object|embed|style)[^>]*>/gi, '')
                .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
                .replace(/javascript:/gi, '');
  }
  return value;
};

module.exports = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) {
    const q = clean(req.query);
    for (const k of Object.keys(req.query)) delete req.query[k];
    Object.assign(req.query, q);
  }
  next();
};
