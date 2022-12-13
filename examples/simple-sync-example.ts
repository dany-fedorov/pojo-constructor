import { PojoConstructorSync, constructPojoSync } from '../src/PojoConstructorSync';

type AppConfig = {
  appName: string;
  listenOnPort: number;
  thirdPartyApiEndpoint: string;
};

class AppConfigPojoConstructor
  implements PojoConstructorSync<AppConfig, 'dev' | 'staging' | 'production'>
{
  appName(env) {
    return ['awesome-app-in', env].join('-');
  }

  listenOnPort() {
    return 3003;
  }

  thirdPartyApiEndpoint(env) {
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
const configDev = constructPojoSync(new AppConfigPojoConstructor(), {
  input: 'dev',
});
console.log(JSON.stringify(configDev, null, 2));
console.log('--- staging ---');
const configStaging = constructPojoSync(new AppConfigPojoConstructor(), {
  input: 'staging',
});
console.log(JSON.stringify(configStaging, null, 2));
console.log('--- production ---');
const configProd = constructPojoSync(new AppConfigPojoConstructor(), {
  input: 'production',
});
console.log(JSON.stringify(configProd, null, 2));
