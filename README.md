# POJO Constructor

![Jest coverage](https://raw.githubusercontent.com/dany-fedorov/pojo-constructor/main/badges/coverage-jest%20coverage.svg)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Code Style by Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Package License MIT](https://img.shields.io/npm/l/pojo-constructor.svg)](https://www.npmjs.org/package/pojo-constructor)
[![Strictest TypeScript Config](https://badgen.net/badge/TS/Strictest "Strictest TypeScript Config")](https://www.npmjs.com/package/@tsconfig/strictest)
[![Npm Version](https://img.shields.io/npm/v/pojo-constructor.svg)](https://www.npmjs.org/package/pojo-constructor)

Configuration as code helper for TypeScript - write own constructor for each property, sync or async.

> **Warning**
> Please use fixed version (remove ^ from package.json).

## Examples

### 1. [Simple sync example](./examples/simple-sync-example.ts) (run with `npm run tsfile ./examples/simple-sync-example.ts`)

```ts
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

/**
 * Produce configuration for dev env.
 */
const configDev = constructPojoSync(AppCfgCtor, 'dev' as Env);

/**
 * Result.
 */
console.log(JSON.stringify(configDev, null, 2));
/**
 * {
 *   "appName": "awesome-app-in-dev",
 *   "listenOnPort": 3003,
 *   "thirdPartyApiEndpoint": "https://sandbox.thrird-party-api.example.com"
 * }
 */
```

## Why?

### 1. Better way to scale up configuration objects.

Separate "pure" methods are easier to add, understand and
maintain than imperative script that constructs the configuration object.

### 2. Better pattern for server configuration.

For example: Server uses a database endpoint and a third party api endpoint. Usually, you'll make DB_HOST and
THIRD_PARTY_API env variables and parametrize this way. This means you can run your server with whatever combination
of DB_HOST and THIRD_PARTY_API variables, but usually you have just several sets of configurations really - .e.g. dev,
staging and production depending on release lifecycle stage.

I think, having as much of server configuration as possible in code is beneficial for several reasons.

1. A sever developer has access and is responsible for more configuration. This is important in a
   setting where developer can have limited access to infrastructure - e.g. cannot change task definitions for AWS ECS.
   As a person who makes changes more often than a DevOps person, sever developer should have as much freedom as
   possible to tweak configuration.

2. Better captures an environment in which server is run. E.g. if your env variables are just
   RELEASE_STAGE=dev|staging|production and RUNTIME_ENV=local|remote_ecs this is much easier to understand all supported
   ways to run the server, and it is easy to make sure configuration is right programmatically - e.g. make a rule that
   you cannot run production env locally.

3. Configuration as code - flexibility of the programming language + type safety.

## API

WIP. Please check out source code.

- type `PojoConstructorSync` + function `constructPojoSync` - for use with sync methods
- type `PojoConstructorAsync` + function  `constructPojoAsync` - for use with async methods
- type `PojoConstructor` + function `constructPojo` - allows to combine sync and async methods by returning an object
  like this `{ sync: () => {}, promise: () => {} }`

