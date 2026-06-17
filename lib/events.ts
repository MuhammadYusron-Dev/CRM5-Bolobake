type EventHandler = (payload: any) => Promise<void> | void;

class EventBus {
  private listeners: Record<string, EventHandler[]> = {};
  // Queue for processing events sequentially with delay to avoid Google Sheets Rate Limits
  private eventQueue: { eventName: string; payload: any }[] = [];
  private isProcessingQueue = false;

  public on(eventName: string, handler: EventHandler) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(handler);
  }

  public emit(eventName: string, payload: any) {
    // We don't block the caller, just push to queue and process in background
    this.eventQueue.push({ eventName, payload });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.eventQueue.length > 0) {
      const { eventName, payload } = this.eventQueue.shift()!;
      const handlers = this.listeners[eventName] || [];

      for (const handler of handlers) {
        try {
          await handler(payload);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event ${eventName}:`, error);
          // Catch errors so it doesn't break the queue or the main process
        }
      }

      // Add a 2-second delay between event processing if there are more events
      // to avoid hitting the Google Sheets "quota exceeded" 
      // (usually 60 requests per user per minute / 1 per second)
      if (this.eventQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    this.isProcessingQueue = false;
  }
}

export const eventBus = new EventBus();
