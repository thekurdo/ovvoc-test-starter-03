const { RetryPolicy } = require('../src/retry');

describe('RetryPolicy', () => {
  it('should succeed on first try', async () => {
    const policy = new RetryPolicy();
    const result = await policy.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('should retry on failure', async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 10 });
    let attempts = 0;
    const result = await policy.execute((attempt) => {
      attempts++;
      if (attempt < 2) throw new Error('not yet');
      return 'done';
    });
    expect(result).toBe('done');
    expect(attempts).toBe(3);
  });

  it('should throw after max retries', async () => {
    const policy = new RetryPolicy({ maxRetries: 1, delay: 10 });
    await expect(
      policy.execute(() => { throw new Error('always fails'); })
    ).rejects.toThrow('always fails');
  });

  it('should calculate exponential backoff delay', () => {
    const policy = new RetryPolicy({ delay: 100, backoff: 2 });
    expect(policy.getDelay(0)).toBe(100);
    expect(policy.getDelay(1)).toBe(200);
    expect(policy.getDelay(2)).toBe(400);
  });
});
