interface ConfigServer {
  port: number;
}

export interface ConfigType {
  env: string;
  server: ConfigServer;
}
