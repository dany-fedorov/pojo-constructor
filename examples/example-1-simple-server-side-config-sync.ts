import type { PojoConstructorPropsSync } from '../src/PojoConstructorSync/PojoConstructorPropsSync';
import { constructPojoSync } from '../src/PojoConstructorSync/constructPojoSync';

/**
 * Use TypeScript to make configuration type safe.
 */
type AppCfg = {
  appName: string;
  listenOnPort: number;
  thirdPartyApiEndpoint: string;
};

type Env = 'dev' | 'staging' | 'production';

/**
 * Define configuration properties in methods of a class.
 */
class AppCfgCtor implements PojoConstructorPropsSync<AppCfg, Env> {
  appName(env: Env) {
    return { value: `awesome-app-in-${env}` };
  }

  listenOnPort() {
    return { value: 3003 };
  }

  thirdPartyApiEndpoint(env: Env) {
    switch (env) {
      case 'dev':
      case 'staging':
        return { value: 'https://sandbox.thrird-party-api.example.com' };
      case 'production':
        return { value: 'https://api.example.com' };
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
