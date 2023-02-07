import type { PojoConstructorSyncProps } from '../src/PojoConstructorSync/PojoConstructorSyncProps';
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
class AppCfgCtor implements PojoConstructorSyncProps<AppCfg, Env> {
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

console.log('- dev:');
const { value: configDev } = constructPojoSync(AppCfgCtor, 'dev' as Env);
console.log(configDev);

console.log();
console.log('- staging:');
const { value: configStaging } = constructPojoSync(
  AppCfgCtor,
  'staging' as Env,
);
console.log(configStaging);

console.log();
console.log('- production:');
const { value: configProduction } = constructPojoSync(
  AppCfgCtor,
  'production' as Env,
);
console.log(configProduction);
