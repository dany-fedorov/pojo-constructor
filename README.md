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
    * [3. Using combined (sync + async) mode declaration](#3-using-combined--sync--async--mode-declaration)
    * [4. Optional properties vs undefined value](#4-optional-properties-vs-undefined-value)
    * [5. Using cache](#5-using-cache)
* [API](#api)
    * [PojoConstructorSync](#pojoconstructorsync)
    * [PojoConstructorAsync](#pojoconstructorasync)
    * [PojoConstructor](#pojoconstructor)
* [Links](#links)
    * [GitHub](#github)
    * [Npm](#npm)

# Examples

## 1. [Simple server-side config, sync mode](./examples/example-1-simple-server-side-config-sync-mode.ts)

<small>(Run with `npm run ts-file ./examples/example-1-simple-server-side-config-sync-mode.ts`)</small>

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

```
{
  appName: 'awesome-app-in-dev',
  listenOnPort: 3003,
  thirdPartyApiEndpoint: 'https://sandbox.thrird-party-api.example.com'
}
```

## 2. [Server-side config with feature flags, async mode](./examples/example-2-simple-server-side-config-async-mode.ts)

<small>(Run with `npm run ts-file ./examples/example-2-simple-server-side-config-async-mode.ts`)</small>

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

```
{
  appName: 'awesome-app-in-dev',
  featureFlags: { feature1: false, feature2: true },
  listenOnPort: 3003
}
```

## 3. [Using combined (sync + async) mode declaration](./examples/example-3-simple-server-side-config-combined-mode.ts)

<small>(Run with `npm run ts-file ./examples/example-3-simple-server-side-config-combined-mode.ts`)</small>

Using "sync mode" fails because `featureFlags` property constructor does not return a `sync` function, but this fail is
handled by `handler` and so the rest of the object is still constructed.

Using "async mode" falls back on `sync` functions.

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

const appCfgCtor = new PojoConstructor<AppCfg, Env>({
  appName(env: Env) {
    const sync = () => {
      return { value: `awesome-app-in-${env}` };
    };
    return { sync };
  },

  listenOnPort() {
    const sync = () => {
      return { value: 3003 };
    };
    return { sync };
  },

  /**
   * Emulates fetching feature flags from database or a CMS.
   */
  featureFlags(env: Env) {
    const promise = async () => {
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
    };
    return { promise };
  },
});

function handler(caught: unknown, { key }: PojoConstructorOptionsCatchFn) {
  console.log(`- - Caught trying to construct ${key}`);
  console.log(caught);
  console.log('---');
}

console.log('- dev (sync mode):');
const configDev = appCfgCtor.new('dev' as Env, { catch: handler }).sync();
console.log(configDev);

(async () => {
  console.log('- dev (async mode):');
  const configDev = await appCfgCtor.new('dev' as Env).promise();
  console.log(configDev);
})();
```

## 4. [Optional properties vs undefined value](./examples/example-4-optional-fields.ts)

<small>(Run with `npm run ts-file ./examples/example-4-optional-fields.ts`)</small>

Notice that providing `{ value: undefined }` and empty object `{}` is different in the same way as having a property on
an object with value `undefined` and not having a property on an object.

```typescript
type AppCfg = {
  dev_option?: string;
  prod_option: string | undefined;
};

type Env = 'dev' | 'staging' | 'production';

type Input = { env: Env; prodOption?: string };

const appCfgCtor = new PojoConstructorSync<AppCfg, Input>({
  dev_option({ env }) {
    if (env === 'dev') {
      return { value: 'this-option-is-only-set-in-dev' };
    }
    return {};
  },

  prod_option({ prodOption }) {
    return {
      value: prodOption,
    };
  },
});
```

produces

```
- dev:
{
  dev_option: 'this-option-is-only-set-in-dev',
  prod_option: undefined
}

- staging:
{ prod_option: undefined }

- production:
{ prod_option: 'prodOption value' }
```

## 5. [Using cache](./examples/example-5-cache.ts)

<small>(Run with `npm run ts-file ./examples/example-5-cache.ts`)</small>

Using `cache` proxy you can make sure that property constructor method is only called once.

```typescript
type AppCfg = {
  remote_fetched_option: string;
  derived_option_1: string;
  derived_option_2: string;
};

let remoteCalls = 0;

const appCfgCtor = new PojoConstructorAsync<AppCfg>({
  /**
   * Emulates fetching config from database or a CMS.
   */
  async remote_fetched_option() {
    const GET_0_OR_1 = `https://www.random.org/integers/?num=1&min=0&max=1&col=1&base=2&format=plain&rnd=id.${Date.now()}`;
    const value = (await axios.get(GET_0_OR_1)).data;
    remoteCalls++;
    return {
      value: 'remote_fetched_option : ' + value,
    };
  },

  async derived_option_1(_, { cache }) {
    return {
      value:
        'derived_option_1 / ' + (await cache.remote_fetched_option()).value,
    };
  },

  async derived_option_2(_, { cache }) {
    return {
      value: 'derived_option_2 / ' + (await cache.derived_option_1()).value,
    };
  },
});

(async () => {
  const cfg = await appCfgCtor.new();
  console.log(cfg);
  console.log({ remoteCalls });
})();
```

prints

```
{
  derived_option_1: 'derived_option_1 / remote_fetched_option : 1',
  derived_option_2: 'derived_option_2 / derived_option_1 / remote_fetched_option : 1',
  remote_fetched_option: 'remote_fetched_option : 1'
}
{ remoteCalls: 1 }
```

# API

## [PojoConstructorSync](https://dany-fedorov.github.io/pojo-constructor/classes/PojoConstructorSync.html)

Constructor methods for each of properties returns `{ value }` object synchronously.

## [PojoConstructorAsync](https://dany-fedorov.github.io/pojo-constructor/classes/PojoConstructorAsync.html)

Constructor methods for each of properties returns promise for `{ value }` object.

## [PojoConstructor](https://dany-fedorov.github.io/pojo-constructor/classes/PojoConstructor.html)

Can operate in both sync mode and async mode.<br>
Constructor methods for each of properties returns and object with either one of `sync`, `promise` methods or both.

All of these are valid:<br>

- `{ sync, promise }`.
- `{ sync }`.
- `{ promise }`.

Where

- `promise` - returns promise for `{ value }` object
- `sync` - returns `{ value }` object synchronously

If you only specify `sync` methods, you can use them for "async mode" (calling `PojoConstructor#new().promise()`),
but you cannot use "sync mode" (calling `PojoConstructor#new().sync()`) if you only specify `promise` method.

You can specify `promise` methods for some fields and still construct an object in "sync mode" if you also specify
a `catch` option.
`catch` will be called each time constructing a property fails, but all properties that do not fail will be added to
resulting object.

# Links

##### GitHub

https://github.com/dany-fedorov/pojo-constructor.git

##### Npm

https://www.npmjs.com/package/pojo-constructor
