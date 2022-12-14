# POJO Constructor

![Jest coverage](./badges/coverage-jest%20coverage.svg)

Configuration as code helper for TypeScript.

> **Warning**
> Please use fixed version (remove ^ from package.json).

## Examples

### 1. [Simple sync example](./examples/simple-sync-example.ts) (run with `npm run tsfile ./examples/simple-sync-example.ts`)

```ts
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

const configDev = constructPojoSync<AppConfig, Env>(
  new AppConfigPojoConstructor(),
  'dev',
);
console.log(JSON.stringify(configDev, null, 2));
/**
 * {
 *   "appName": "awesome-app-in-dev",
 *   "listenOnPort": 3003,
 *   "thirdPartyApiEndpoint": "https://sandbox.thrird-party-api.example.com"
 * }
 */
```
