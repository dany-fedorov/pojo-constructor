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
    * [Sync mode API](#sync-mode-api)
        * [constructPojoSync(CTorClass, constructPojoInput?, constructPojoOptions?)](#constructpojosyncctorclass-constructpojoinput-constructpojooptions)
        * [constructPojoFromInstanceSync(ctor, constructPojoInput?, constructPojoOptions?)](#constructpojofrominstancesyncctor-constructpojoinput-constructpojooptions)
        * [type PojoConstructorSync<Pojo, CtorInput>](#type-pojoconstructorsyncpojo-ctorinput)
    * [Async mode API](#async-mode-api)
        * [constructPojoAsync(CTorClass, constructPojoInput?, constructPojoOptions?)](#constructpojoasyncctorclass-constructpojoinput-constructpojooptions)
        * [constructPojoFromInstanceAsync(ctor, constructPojoInput?, constructPojoOptions?)](#constructpojofrominstanceasyncctor-constructpojoinput-constructpojooptions)
        * [type PojoConstructorAsync<Pojo, CtorInput>](#type-pojoconstructorasyncpojo-ctorinput)
    * [Sync + Async Combined API](#sync--async-combined-api)
        * [constructPojo(CTorClass, constructPojoInput?, constructPojoOptions?)](#constructpojoctorclass-constructpojoinput-constructpojooptions)
        * [constructPojoFromInstance(ctor, constructPojoInput?, constructPojoOptions?)](#constructpojofrominstancector-constructpojoinput-constructpojooptions)
        * [type PojoConstructor<Pojo, CtorInput>](#type-pojoconstructorpojo-ctorinput)
* [Links](#links)
    * [GitHub](#github)
    * [Npm](#npm)

# Examples

## 1. [Simple server-side config, sync mode](./examples/example-1-simple-server-side-config-sync.ts)

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

## 2. [Server-side config with feature flags, async mode](./examples/example-2-simple-server-side-config-async.ts)

(Run with `npm run ts-file ./examples/example-2-simple-server-side-config-async.ts`)

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

class AppCfgCtor implements PojoConstructorAsync<AppCfg, Env> {
  async appName(env: Env) {
    return { value: `awesome-app-in-${env}` };
  }

  async listenOnPort() {
    return { value: 3003 };
  }

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
  }
}

(async () => {
  const configDev = await constructPojoAsync(AppCfgCtor, 'dev' as Env);
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

# [API](https://dany-fedorov.github.io/pojo-constructor/modules.html)

## Sync mode API

#### [constructPojoSync(CTorClass, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoSync.html)

Wrapper
for [constructPojoFromInstanceSync(ctor, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoFromInstanceSync.html).<br>
Instantiates `CTorClass` passing `constructPojoInput` to constructor.

#### [constructPojoFromInstanceSync(ctor, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoFromInstanceSync.html)

Builds an object from `ctor` in sync mode by calling property constructor methods.

#### [type PojoConstructorSync<Pojo, CtorInput>](https://dany-fedorov.github.io/pojo-constructor/types/PojoConstructorSync.html)

A generic type that makes "Sync Pojo Constructor object" type from `Pojo` object type, check out the link for details.

## Async mode API

#### [constructPojoAsync(CTorClass, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoAsync.html)

Wrapper
for [constructPojoFromInstanceSync(ctor, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoFromInstanceAsync.html).<br>
Instantiates `CTorClass` passing `constructPojoInput` to constructor.

#### [constructPojoFromInstanceAsync(ctor, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoFromInstanceAsync.html)

Builds an object from `ctor` in async mode by calling property constructor methods.

#### [type PojoConstructorAsync<Pojo, CtorInput>](https://dany-fedorov.github.io/pojo-constructor/types/PojoConstructorAsync.html)

A generic type that makes "Async Pojo Constructor object" type from `Pojo` object type, check out the link for details.

## Sync + Async Combined API

#### [constructPojo(CTorClass, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojo.html)

Wrapper
for [constructPojoFromInstance(ctor, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoFromInstance.html).<br>
Instantiates `CTorClass` passing `constructPojoInput` to constructor.

#### [constructPojoFromInstance(ctor, constructPojoInput?, constructPojoOptions?)](https://dany-fedorov.github.io/pojo-constructor/functions/constructPojoFromInstance.html)

Returns object with `sync`, `promise` functions that can be called to build
an object from `ctor` in sync or async mode.

In sync mode, only `sync` functions returned by property methods are called.
In async mode, `promise` functions returned by property methods are called, but when there
is no `promise` function, async mode falls back to `sync` function.

#### [type PojoConstructor<Pojo, CtorInput>](https://dany-fedorov.github.io/pojo-constructor/types/PojoConstructor.html)

A generic type that makes "Combined Sync + Async Pojo Constructor object" type from `Pojo` object type.

# Links

##### GitHub

https://github.com/dany-fedorov/pojo-constructor.git

##### Npm

https://www.npmjs.com/package/pojo-constructor
