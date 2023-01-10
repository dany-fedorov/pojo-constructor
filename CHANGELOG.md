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
