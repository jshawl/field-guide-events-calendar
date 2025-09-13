declare global {
  namespace FullCalendar {
    class Calendar {
      constructor(element: Element, options?: any);
      addEvent(event: unknown): void;
      removeAllEvents(): void;
      render(): string;
    }
  }
}

export {};
