# [4.1.0](https://github.com/dany-fedorov/pojo-constructor/compare/v4.0.4...v4.1.0) (2023-01-13)


### Features

* Change some undocumented API and make more examples ([2e1d99c](https://github.com/dany-fedorov/pojo-constructor/commit/2e1d99ca16aa22fdeae2dbd7c98cb83633f17ab6))

## [4.0.4](https://github.com/dany-fedorov/pojo-constructor/compare/v4.0.3...v4.0.4) (2023-01-13)

## [4.0.3](https://github.com/dany-fedorov/pojo-constructor/compare/v4.0.2...v4.0.3) (2023-01-13)

## [4.0.2](https://github.com/dany-fedorov/pojo-constructor/compare/v4.0.1...v4.0.2) (2023-01-13)

## [4.0.1](https://github.com/dany-fedorov/pojo-constructor/compare/v4.0.0...v4.0.1) (2023-01-12)


### Bug Fixes

* Do not export syncProps2Props and fix README link ([354a840](https://github.com/dany-fedorov/pojo-constructor/commit/354a840023adb37eae4f09ef1dfb626a4f146130))

# [4.0.0](https://github.com/dany-fedorov/pojo-constructor/compare/v3.0.2...v4.0.0) (2023-01-12)


### Bug Fixes

* Add exports ([6cc02aa](https://github.com/dany-fedorov/pojo-constructor/commit/6cc02aab1dc7717b41e2d62b390d2fe2ca13fdbd))
* Add more exports and gen docs ([7ff5cbb](https://github.com/dany-fedorov/pojo-constructor/commit/7ff5cbb5ee43298e73c94aa1cabd10db6029a7d3))
* Remove unused directories ([b3b42ba](https://github.com/dany-fedorov/pojo-constructor/commit/b3b42bafc57990700bf417f1ee6611be0c4525aa))


### Features

* Add sync and async wrappers + fix some tests ([eb91533](https://github.com/dany-fedorov/pojo-constructor/commit/eb915334ffbbe0a46dcccec40c9f506d932f8982))
* Better API for keys stack + add error catching proxy ([71706cf](https://github.com/dany-fedorov/pojo-constructor/commit/71706cf0168d96b54d816ffcd02a64f1b7e2a67a))
* WIP on new API ([27cd0c2](https://github.com/dany-fedorov/pojo-constructor/commit/27cd0c28cfce74e8a156eff6272a67c690ba8561))


### BREAKING CHANGES

* - Introduce new API

## [3.0.2](https://github.com/dany-fedorov/pojo-constructor/compare/v3.0.1...v3.0.2) (2023-01-10)

## [3.0.1](https://github.com/dany-fedorov/pojo-constructor/compare/v3.0.0...v3.0.1) (2023-01-08)

# [3.0.0](https://github.com/dany-fedorov/pojo-constructor/compare/v2.0.5...v3.0.0) (2023-01-03)


### Features

* Change value setting interface ([5622bc4](https://github.com/dany-fedorov/pojo-constructor/commit/5622bc497ce1d03a9cca9f2ff57764671c4e94e2))


### BREAKING CHANGES

* Methods that set value should reutrn { value } object.
Methods that do not set a value should return empty object - {}.

## [2.0.5](https://github.com/dany-fedorov/pojo-constructor/compare/v2.0.4...v2.0.5) (2023-01-02)

## [2.0.4](https://github.com/dany-fedorov/pojo-constructor/compare/v2.0.3...v2.0.4) (2023-01-02)

## [2.0.3](https://github.com/dany-fedorov/pojo-constructor/compare/v2.0.2...v2.0.3) (2023-01-02)

## [2.0.2](https://github.com/dany-fedorov/pojo-constructor/compare/v2.0.1...v2.0.2) (2023-01-02)

## [2.0.1](https://github.com/dany-fedorov/pojo-constructor/compare/v2.0.0...v2.0.1) (2023-01-02)

# [2.0.0](https://github.com/dany-fedorov/pojo-constructor/compare/v1.5.0...v2.0.0) (2023-01-01)


* feat!: Do not add properties that threw error to result pojo ([89fcb8a](https://github.com/dany-fedorov/pojo-constructor/commit/89fcb8abfb49655bac691be98c6b8bfbc36f8c99))


### BREAKING CHANGES

* Previous versions will add fields that threw to result
pojo with undefined values.
