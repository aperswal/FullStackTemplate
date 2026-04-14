/** Email provider interface - implement this to add a new email service. */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}
