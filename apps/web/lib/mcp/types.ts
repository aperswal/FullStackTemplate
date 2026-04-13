export interface SitePage {
  path: string;
  title: string;
  description: string;
  auth: boolean;
}

export interface SiteAction {
  name: string;
  description: string;
  auth: boolean;
  method: string;
  path: string;
  input?: Record<string, string>;
}

export interface SiteSpec {
  site: { name: string; description: string; features: string[] };
  pages: SitePage[];
  actions: SiteAction[];
}
