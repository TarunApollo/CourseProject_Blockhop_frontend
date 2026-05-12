// headless scheduler 

// schedule a task
// const task = runtime.scheduler.schedule(5000, () => {
// });

// update the scheduler
// runtime.scheduler.update(deltaMs);

// cancel the scheduler
// const task = scheduler.schedule(xxxx);
// task.remove();

export type ScheduledTask = {
  remove: () => void;
};

type ScheduledEntry = {
  dueMs: number;
  callback: () => void;
  cancelled: boolean;
};

export class Scheduler {
  private nowMs = 0;
  private tasks: ScheduledEntry[] = [];

  schedule(delayMs: number, callback: () => void): ScheduledTask {
    const task: ScheduledEntry = {
      dueMs: this.nowMs + delayMs,
      callback,
      cancelled: false,
    };

    this.tasks.push(task);

    // return handle for remove task
    return {
      remove: () => {
        task.cancelled = true;
      },
    };
  }

  update(deltaMs: number): void {
    this.nowMs += deltaMs;

    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const task = this.tasks[i];

      // remove the cancelled taks
      if (task.cancelled) {
        this.tasks.splice(i, 1);
        continue;
      }

      // handle the finished task
      if (task.dueMs <= this.nowMs) {
        this.tasks.splice(i, 1);
        task.callback();
      }
    }
  }

}