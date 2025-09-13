declare global {
  namespace FullCalendar {
    class Calendar {
      constructor(element: Element, options?: any);
      addEvent(event: Event): void;
      removeAllEvents(): void;
      render(): string;
    }

    type Event = {
      allDay: boolean;
      campaignName?: string;
      end: Date;
      id: string;
      start: Date;
      title: string;
    };
  }
}

export {};
