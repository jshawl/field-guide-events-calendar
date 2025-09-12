declare global {
  namespace FullCalendar {
    class Calendar {
      constructor(element: Element, options?: any);
      render();
    }
  }
}

export {};
