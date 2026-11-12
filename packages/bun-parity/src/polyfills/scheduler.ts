/**
 * W3C Prioritized Task Scheduling API implementation for Bun
 * Spec: https://wicg.github.io/scheduling-apis/
 */

export type TaskPriority = "user-blocking" | "user-visible" | "background";

export interface TaskPriorityChangeEventInit extends EventInit {
  previousPriority: TaskPriority;
}

export class TaskPriorityChangeEvent extends Event {
  readonly previousPriority: TaskPriority;

  constructor(type: string, init?: TaskPriorityChangeEventInit) {
    super(type, init);
    this.previousPriority = init?.previousPriority ?? "user-visible";
  }
}

export class TaskSignal extends AbortSignal {
  private _priority: TaskPriority;

  constructor(priority: TaskPriority = "user-visible") {
    super();
    this._priority = priority;
  }

  get priority(): TaskPriority {
    return this._priority;
  }

  /**
   * Internal dispatcher for priority changes
   */
  _setPriority(newPriority: TaskPriority) {
    if (this._priority === newPriority) return;
    const previousPriority = this._priority;
    this._priority = newPriority;
    const event = new TaskPriorityChangeEvent("prioritychange", {
      previousPriority,
    });
    this.dispatchEvent(event);
  }
}

export interface TaskControllerInit {
  priority?: TaskPriority;
}

export class TaskController extends AbortController {
  private readonly _taskSignal: TaskSignal;

  constructor(init?: TaskControllerInit) {
    super();
    this._taskSignal = new TaskSignal(init?.priority ?? "user-visible");
  }

  override get signal(): TaskSignal {
    return this._taskSignal;
  }

  setPriority(priority: TaskPriority): void {
    if (this._taskSignal.aborted) return;
    this._taskSignal._setPriority(priority);
  }
}

export interface SchedulerPostTaskOptions {
  priority?: TaskPriority;
  delay?: number;
  signal?: AbortSignal | TaskSignal;
}

interface QueuedTask<T> {
  id: number;
  priority: TaskPriority;
  fn: () => T | PromiseLike<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  signal?: AbortSignal | TaskSignal;
}

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  "user-blocking": 3,
  "user-visible": 2,
  background: 1,
};

export class PrioritizedScheduler {
  private _taskId = 0;
  private _queue: QueuedTask<any>[] = [];
  private _flushing = false;

  private _enqueue<T>(task: QueuedTask<T>) {
    this._queue.push(task);
    this._sortQueue();
    this._scheduleFlush();
  }

  private _sortQueue() {
    this._queue.sort((a, b) => {
      const weightDiff =
        PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.id - b.id; // FIFO for same priority
    });
  }

  private _scheduleFlush() {
    if (this._flushing) return;
    this._flushing = true;
    queueMicrotask(() => this._flush());
  }

  private _flush() {
    try {
      while (this._queue.length > 0) {
        const task = this._queue.shift()!;
        if (task.signal?.aborted) {
          const reason =
            task.signal.reason ??
            new DOMException("The task was aborted", "AbortError");
          task.reject(reason);
          continue;
        }

        try {
          const result = task.fn();
          task.resolve(result);
        } catch (err) {
          task.reject(err);
        }
      }
    } finally {
      this._flushing = false;
      if (this._queue.length > 0) {
        this._scheduleFlush();
      }
    }
  }

  postTask<T>(
    callback: () => T | PromiseLike<T>,
    options?: SchedulerPostTaskOptions,
  ): Promise<T> {
    if (typeof callback !== "function") {
      return Promise.reject(new TypeError("callback must be a function"));
    }

    const priority: TaskPriority =
      options?.priority ??
      (options?.signal instanceof TaskSignal
        ? options.signal.priority
        : "user-visible");
    const delay = options?.delay ?? 0;
    const signal = options?.signal;

    if (signal?.aborted) {
      const reason =
        signal.reason ?? new DOMException("The task was aborted", "AbortError");
      return Promise.reject(reason);
    }

    return new Promise<T>((resolve, reject) => {
      const taskId = ++this._taskId;

      const scheduleAction = () => {
        if (signal?.aborted) {
          const reason =
            signal.reason ??
            new DOMException("The task was aborted", "AbortError");
          reject(reason);
          return;
        }

        const task: QueuedTask<T> = {
          id: taskId,
          priority,
          fn: callback,
          resolve,
          reject,
          signal,
        };

        if (signal instanceof TaskSignal) {
          const onPriorityChange = () => {
            task.priority = signal.priority;
            this._sortQueue();
          };
          signal.addEventListener("prioritychange", onPriorityChange, {
            once: false,
          });
        }

        if (signal) {
          const onAbort = () => {
            const idx = this._queue.indexOf(task);
            if (idx !== -1) {
              this._queue.splice(idx, 1);
            }
            const reason =
              signal.reason ??
              new DOMException("The task was aborted", "AbortError");
            reject(reason);
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }

        this._enqueue(task);
      };

      if (delay > 0) {
        const timer = setTimeout(scheduleAction, delay);
        if (signal) {
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              const reason =
                signal.reason ??
                new DOMException("The task was aborted", "AbortError");
              reject(reason);
            },
            { once: true },
          );
        }
      } else {
        scheduleAction();
      }
    });
  }

  yield(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}

export function installScheduler(
  target: any = globalThis,
): PrioritizedScheduler {
  const schedulerInstance = new PrioritizedScheduler();

  if (!target.scheduler) {
    Object.defineProperty(target, "scheduler", {
      value: schedulerInstance,
      writable: true,
      configurable: true,
    });
  }

  if (!target.TaskController) {
    Object.defineProperty(target, "TaskController", {
      value: TaskController,
      writable: true,
      configurable: true,
    });
  }

  if (!target.TaskSignal) {
    Object.defineProperty(target, "TaskSignal", {
      value: TaskSignal,
      writable: true,
      configurable: true,
    });
  }

  if (!target.TaskPriorityChangeEvent) {
    Object.defineProperty(target, "TaskPriorityChangeEvent", {
      value: TaskPriorityChangeEvent,
      writable: true,
      configurable: true,
    });
  }

  return target.scheduler;
}
