const { TaskQueue } = require('../src/queue');

describe('TaskQueue', () => {
  it('should execute tasks and return results', async () => {
    const q = new TaskQueue({ concurrency: 2 });
    const r1 = q.add(() => Promise.resolve('a'), 'task-a');
    const r2 = q.add(() => Promise.resolve('b'), 'task-b');

    expect(await r1).toBe('a');
    expect(await r2).toBe('b');
  });

  it('should respect concurrency limit', async () => {
    const q = new TaskQueue({ concurrency: 1 });
    const order = [];

    const t1 = q.add(async () => {
      order.push('start-1');
      await new Promise((r) => setTimeout(r, 50));
      order.push('end-1');
      return 1;
    }, 'slow');

    const t2 = q.add(async () => {
      order.push('start-2');
      return 2;
    }, 'fast');

    await Promise.all([t1, t2]);
    expect(order).toEqual(['start-1', 'end-1', 'start-2']);
  });

  it('should handle task errors', async () => {
    const q = new TaskQueue();
    await expect(
      q.add(() => Promise.reject(new Error('boom')), 'fail')
    ).rejects.toThrow('boom');

    expect(q.getStats().failed).toBe(1);
  });

  it('should timeout long tasks', async () => {
    const q = new TaskQueue({ timeout: 50 });
    await expect(
      q.add(() => new Promise((r) => setTimeout(r, 200)), 'slow')
    ).rejects.toThrow(/timed out/);
  });

  it('should track stats', async () => {
    const q = new TaskQueue();
    await q.add(() => Promise.resolve(1), 'a');
    await q.add(() => Promise.resolve(2), 'b');

    const stats = q.getStats();
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(0);
  });

  it('should reset state', async () => {
    const q = new TaskQueue();
    await q.add(() => Promise.resolve(1), 'a');
    q.reset();

    expect(q.getStats().completed).toBe(0);
  });
});
