export type ScheduledTask = {
  remove: () => void;
};

export type SchedulerResource = {
  schedule(delayMs: number, callback: () => void): ScheduledTask;
};

//TODO:Add impl of headless scheduler