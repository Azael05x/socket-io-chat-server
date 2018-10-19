import { ConfigType } from '@types';


function getConfig(): ConfigType {
  return {
    env: 'production',
    server: {
      port: 80,
    }
  }
}

export default getConfig();
