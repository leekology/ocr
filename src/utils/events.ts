export type EventMap = object;

export class EventEmitter<Events extends EventMap> {
  private listeners = new Map<keyof Events, Set<(data: never) => void>>();

  on<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as (data: never) => void);
    return () => set!.delete(fn as (data: never) => void);
  }

  once<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): () => void {
    const unsub = this.on(event, (data) => {
      unsub();
      fn(data);
    });
    return unsub;
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const fn of set) fn(data as never);
    }
  }

  off<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): void {
    this.listeners.get(event)?.delete(fn as (data: never) => void);
  }
}
