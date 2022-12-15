import {
  PojoConstructorSync,
  constructPojoFromInstanceSync,
  constructPojoSync,
} from '../src/PojoConstructorSync';

type AppCfg = {
  appName: string;
  listenOnPort: number;
  thirdPartyApiEndpoint: string;
};

type Env = 'dev' | 'staging' | 'production';

class AppCfgCtor implements PojoConstructorSync<AppCfg, Env> {
  appName(env: Env) {
    return `awesome-app-in-${env}`;
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
const configDev = constructPojoSync(AppCfgCtor, 'dev' as Env);
console.log(JSON.stringify(configDev, null, 2));

console.log('--- staging ---');
const configStaging = constructPojoSync(AppCfgCtor, 'staging' as Env);
console.log(JSON.stringify(configStaging, null, 2));

console.log('--- production ---');
const configProduction = constructPojoSync(AppCfgCtor, 'production' as Env);
console.log(JSON.stringify(configProduction, null, 2));
