class TaskQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 3;
    this.timeout = options.timeout || 30000;
    this.running = 0;
    this.queue = [];
    this.results = [];
    this.errors = [];
  }

  async add(taskFn, label = 'unnamed') {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn: taskFn, label, resolve, reject });
      this._process();
    });
  }

  async _process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      this.running++;

      this._runTask(task)
        .then((result) => {
          this.results.push({ label: task.label, result });
          task.resolve(result);
        })
        .catch((err) => {
          this.errors.push({ label: task.label, error: err.message });
          task.reject(err);
        })
        .finally(() => {
          this.running--;
          this._process();
        });
    }
  }

  async _runTask(task) {
    return Promise.race([
      task.fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Task "${task.label}" timed out`)), this.timeout)
      ),
    ]);
  }

  getStats() {
    return {
      completed: this.results.length,
      failed: this.errors.length,
      pending: this.queue.length,
      running: this.running,
    };
  }

  reset() {
    this.queue = [];
    this.results = [];
    this.errors = [];
    this.running = 0;
  }
}

module.exports = { TaskQueue };
