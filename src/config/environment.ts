import { ConfigType } from '@types';
import Development from './env/development';
import Production from './env/production';

const env = process.env.NODE_ENV;

function getConfig(): ConfigType {
  switch (env) {
    case 'development':
      return Development;
    case 'production':
      return Production;
    default:
      return Development;
  }
}

export default getConfig();
