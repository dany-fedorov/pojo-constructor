import {
  PojoConstructorSync,
  constructPojoSync,
} from '../src/PojoConstructorSync';

type AppConfig = {
  appName: string;
  listenOnPort: number;
  thirdPartyApiEndpoint: string;
};

type Env = 'dev' | 'staging' | 'production';

class AppConfigPojoConstructor implements PojoConstructorSync<AppConfig, Env> {
  appName(env: Env) {
    return ['awesome-app-in', env].join('-');
  }

  listenOnPort() {
    return 3003;
  }

  thirdPartyApiEndpoint(env: Env) {
    switch (env) {
      case 'dev':
      case 'staging':
        return 'https://sandbox.thrird-party-api.example.com';
      case 'production':
        return 'https://api.example.com';
      default:
        throw new Error('Unknown env');
    }
  }
}

console.log('--- dev ---');
const configDev = constructPojoSync<AppConfig, Env>(
  new AppConfigPojoConstructor(),
  'dev',
);
console.log(JSON.stringify(configDev, null, 2));
console.log('--- staging ---');
const configStaging = constructPojoSync<AppConfig, Env>(
  new AppConfigPojoConstructor(),
  'staging',
);
console.log(JSON.stringify(configStaging, null, 2));
console.log('--- production ---');
const configProd = constructPojoSync<AppConfig, Env>(
  new AppConfigPojoConstructor(),
  'production',
);
console.log(JSON.stringify(configProd, null, 2));
