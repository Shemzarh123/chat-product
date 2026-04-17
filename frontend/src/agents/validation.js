// AO Validation Agent - Risk Minimization for message loss/risk
const SPAM_KEYWORDS = ['buy', 'free', 'click', 'win'];
const PII_PATTERN = /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

export const ValidationAgent = {
  isSpam(content) {
    return SPAM_KEYWORDS.some(keyword => content.toLowerCase().includes(keyword));
  },

  containsPII(content) {
    return PII_PATTERN.test(content);
  },

  isRisky(content) {
    return this.isSpam(content) || this.containsPII(content);
  },

  validate(content) {
    if (this.isRisky(content)) {
      return { valid: false, risk: 'spam_or_pii', warning: 'Potential spam or personal info detected' };
    }
    return { valid: true };
  },

  sanitize(content) {
    return content.replace(PII_PATTERN, '[REDACTED]');
  }
};

