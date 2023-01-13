# POJO Constructor

![Jest coverage](https://raw.githubusercontent.com/dany-fedorov/pojo-constructor/main/badges/coverage-jest%20coverage.svg)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Code Style by Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Strictest TypeScript Config](https://badgen.net/badge/typescript/strictest "Strictest TypeScript Config")](https://www.npmjs.com/package/@tsconfig/strictest)
[![Package License MIT](https://img.shields.io/npm/l/pojo-constructor.svg)](https://www.npmjs.org/package/pojo-constructor)
[![Npm Version](https://img.shields.io/npm/v/pojo-constructor.svg)](https://www.npmjs.org/package/pojo-constructor)

Configuration as code helper for TypeScript - write own constructor for each property, sync or async.

A setup like this allows you to focus on individual properties of configuration object, which is
useful when
single property can control complicated behaviour and selecting a proper value for it should be a maintainable piece of
code.

Example use cases

- Maintaining configuration for server-side application code
- Building options for a complex JS class

* [Examples](#examples)
    * [1. Simple server-side config, sync mode](#1-simple-server-side-config-sync-mode)
    * [2. Server-side config with feature flags, async mode](#2-server-side-config-with-feature-flags-async-mode)
* [API](#api)
    * [PojoConstructorSync](#pojoconstructorsync)
    * [PojoConstructorAsync](#pojoconstructorasync)
    * [PojoConstructor](#pojoconstructor)
* [Links](#links)
    * [GitHub](#github)
    * [Npm](#npm)

# Examples

## 1. [Simple server-side config, sync mode](./examples/example-1-simple-server-side-config-sync-mode.ts)

(Run with `npm run ts-file ./examples/example-1-simple-server-side-config-sync-mode.ts`)

```typescript
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
const appCfgCtor = new PojoConstructorSync<AppCfg, Env>({
  appName(env: Env) {
    return { value: `awesome-app-in-${env}` };
  },

  listenOnPort() {
    return { value: 3003 };
  },

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
  },
});

/**
 * Produce configuration for dev env.
 */
const configDev = appCfgCtor.new('dev' as Env);

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

## 2. [Server-side config with feature flags, async mode](./examples/example-2-simple-server-side-config-async-mode.ts)

(Run with `npm run ts-file ./examples/example-2-simple-server-side-config-async-mode.ts`)

```typescript
type AppCfg = {
  appName: string;
  listenOnPort: number;
  featureFlags: {
    feature1: boolean;
    feature2: boolean;
  };
};

type Env = 'dev' | 'staging' | 'production';

const appCfgCtor = new PojoConstructorAsync<AppCfg, Env>({
  async appName(env: Env) {
    return { value: `awesome-app-in-${env}` };
  },

  async listenOnPort() {
    return { value: 3003 };
  },

  /**
   * Emulates fetching feature flags from database or a CMS.
   */
  async featureFlags(env: Env) {
    const GET_0_OR_1 = `https://www.random.org/integers/?num=1&min=0&max=1&col=1&base=2&format=plain&rnd=id.${env}`;
    const feature1Flag = Boolean(
      Number((await axios.get(GET_0_OR_1 + 'feature1')).data),
    );
    const feature2Flag = Boolean(
      Number((await axios.get(GET_0_OR_1 + 'feature2')).data),
    );
    return {
      value: {
        feature1: feature1Flag,
        feature2: feature2Flag,
      },
    };
  },
});

(async () => {
  const configDev = await appCfgCtor.new('dev' as Env);
  console.log(JSON.stringify(configDev, null, 2));
})();
```

prints

```json
{
  "appName": "awesome-app-in-dev",
  "featureFlags": {
    "feature1": false,
    "feature2": true
  },
  "listenOnPort": 3003
}
```

# API

## [PojoConstructorSync](https://dany-fedorov.github.io/pojo-constructor/classes/PojoConstructorSync.html)

Constructor methods for each of properties returns `{ value }` object synchronously.

## [PojoConstructorAsync](https://dany-fedorov.github.io/pojo-constructor/classes/PojoConstructorAsync.html)

Constructor methods for each of properties returns promise for `{ value }` object.

## [PojoConstructor](https://dany-fedorov.github.io/pojo-constructor/classes/PojoConstructor.html)

Can operate in both sync mode and async mode.<br>
Constructor methods for each of properties returns and object with either on of two methods or
both - `{ sync, promise }`.

- `promise` - returns promise for `{ value }` object
- `sync` - returns `{ value }` object synchronously

# Links

##### GitHub

https://github.com/dany-fedorov/pojo-constructor.git

##### Npm

https://www.npmjs.com/package/pojo-constructor
