export interface EndpointSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  auth: boolean;
  description: string;
  request?: Record<string, string>;
  response?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface PageRoute {
  path: string;
  group: 'marketing' | 'auth' | 'app';
  auth: boolean;
  description: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface SchemaSpec {
  table: string;
  columns: SchemaColumn[];
  foreignKeys?: Array<{ column: string; references: string }>;
  uniqueConstraints?: string[];
}

export interface AppSpec {
  info: { title: string; version: string; baseUrl: string };
  endpoints: EndpointSpec[];
  routes: PageRoute[];
  schemas: SchemaSpec[];
}
