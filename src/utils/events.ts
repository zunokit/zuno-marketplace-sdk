/**
 * Event emitter for SDK events
 */

type EventCallback = (...args: unknown[]) => void;

/**
 * Simple event emitter for handling SDK events
 */
export class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event)!.add(callback);
  }

  /**
   * Subscribe to an event once
   */
  once(event: string, callback: EventCallback): void {
    const wrappedCallback: EventCallback = (...args: unknown[]) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };

    this.on(event, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);

    if (callbacks) {
      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.events.get(event);

    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}
