import { ConfigType } from '@types';


function getConfig(): ConfigType {
  return {
    env: 'development',
    server: {
      port: 8081,
    }
  }
}

export default getConfig();
