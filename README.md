# POJO Constructor

![Jest coverage](https://raw.githubusercontent.com/dany-fedorov/pojo-constructor/main/badges/coverage-jest%20coverage.svg)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Code Style by Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Strictest TypeScript Config](https://badgen.net/badge/TS/strictest "Strictest TypeScript Config")](https://www.npmjs.com/package/@tsconfig/strictest)
[![Package License MIT](https://img.shields.io/npm/l/pojo-constructor.svg)](https://www.npmjs.org/package/pojo-constructor)
[![Npm Version](https://img.shields.io/npm/v/pojo-constructor.svg)](https://www.npmjs.org/package/pojo-constructor)

Configuration as code helper for TypeScript - write own constructor for each property, sync or async.

Idea is that a setup like this allows you to focus on individual properties of a big configuration object, which is
useful when
a property can control complicated behaviour and selecting a proper value for it should be a maintainable piece of code.
Example use cases

- Maintaining configuration for server-side application code
- Building options for a complex JS class

> **Warning**
> Please use fixed version (remove ^ from package.json).

* [API](#api)
* [Examples](#examples)
  * [1. Simple server-side config](#1-simple-server-side-config)

# API

WIP. Please check out source code or https://dany-fedorov.github.io/pojo-constructor/.

- type `PojoConstructorSync` + function `constructPojoSync` - for use with sync methods
- type `PojoConstructorAsync` + function  `constructPojoAsync` - for use with async methods
- type `PojoConstructor` + function `constructPojo` - allows to combine sync and async methods by returning an object
  like this `{ sync: () => {}, promise: () => {} }`

# Examples

## 1. [Simple server-side config](./examples/example-1-simple-server-side-config-sync.ts)

(Run with `npm run ts-file ./examples/example-1-simple-server-side-config-sync.ts`)

```ts
/*
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
 * Print result.
 */
console.log(JSON.stringify(configDev, null, 2));
```

prints

```json
{
  "appName": "awesome-app-in-dev",
  "listenOnPort": 3003,
  "thirdPartyApiEndpoint": "https://sandbox.thrird-party-api.example.com"
}
```

