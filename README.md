# POJO Constructor

![Jest coverage](./badges/coverage-jest%20coverage.svg)

Configuration as code helper for TypeScript.

> **Warning**
> Please use fixed version (remove ^ from package.json).

## API

WIP. Please check out

- type `PojoConstructorSync` + function `constructPojoSync` - for use with sync methods
- type `PojoConstructorAsync` + function  `constructPojoAsync` - for use with async methods
- type `PojoConstructor` + function `constructPojo` - allows to combine sync and async methods

## Examples

### 1. [Simple sync example](./examples/simple-sync-example.ts) (run with `npm run tsfile ./examples/simple-sync-example.ts`)

```ts
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
const { value: configDev } = constructPojoSync<AppCfg, Env>(
  new AppCfgCtor(),
  'dev',
);
/**
 * {
 *   "appName": "awesome-app-in-dev",
 *   "listenOnPort": 3003,
 *   "thirdPartyApiEndpoint": "https://sandbox.thrird-party-api.example.com"
 * }
 */
```
