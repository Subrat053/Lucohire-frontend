const sanitizePayload = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const result = {};

  const EMAIL_FIELDS = new Set(['email', 'emailAddress', 'userEmail', 'loginEmail']);
  const sanitizeString = (key, value) => {
    if (typeof value !== 'string') return value;
    let cleaned = value.trim();
    if (!EMAIL_FIELDS.has(key) && key !== 'password' && key !== 'confirmPassword') {
      cleaned = cleaned.replace(/  +/g, ' ');
    }
    if (EMAIL_FIELDS.has(key)) {
      cleaned = cleaned.toLowerCase();
    }
    return cleaned;
  };

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = sanitizeString(key, val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) =>
        typeof item === 'string' ? item.trim() : item,
      );
    } else if (val !== null && val !== undefined && typeof val === 'object') {
      result[key] = sanitizePayload(val);
    } else {
      result[key] = val;
    }
  }
  return result;
};

const rawPayload = {
  email: "ananya.sharma@example.com"
};
const payload = sanitizePayload(rawPayload);
console.log("sanitized:", payload);
