declare class RFB {
  constructor(container: HTMLElement, url: string, options?: any);
  viewOnly: boolean;
  resizeSession(): void;
  sendPassword(password: string): void;
  // Add more methods if needed
}

declare module 'src/types/novnc' {
  export = RFB;
}
