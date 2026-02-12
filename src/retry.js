class RetryPolicy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.delay = options.delay || 100;
    this.backoff = options.backoff || 2;
  }

  async execute(fn) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const wait = this.delay * Math.pow(this.backoff, attempt);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
    }
    throw lastError;
  }

  getDelay(attempt) {
    return this.delay * Math.pow(this.backoff, attempt);
  }
}

module.exports = { RetryPolicy };
