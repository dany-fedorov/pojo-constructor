- [ ] Try make default input type = undefined, see test "cachingProxy access - only evaluated once - async concur"
- [x] pojoConstructorThrownIn does not fulfill its purpose when caching proxy is not used - there is no stack trace of
  calls. Make a "catchingProxy" that will allow to track nested calls made with "this.field"
- [x] Change readme to present a more convenient OO pattern with new PojoConstructor
- [ ] Add a decorator option to decorate all methods.
- [ ] Add metadata option returned from method with { value }
- [ ] Make .new return `PojoHost` with `{ value, metadata }` fields, but also with `get` method that can fetch `{ value, metadata }` for path like `['a', 0]`
- [ ] Allow to create objects in parallel with `{ value, metadata, variants: { parallelObj: { value, metadata } } }`
- [ ] Update adapter to take into account `metadata` and `pojos`
- [ ] Site. Now, same README can be found in several places - npm, github, typedoc. I'd like to make it one place.
  Options
  - Try out typedoc markdown, typeodoc hugo etc plugins, or maybe it is wotrth creating your own plugin?
  - Try to create a standalone site for README content, but I think it is better when it is integrated with API docs
- [ ] Think about banner, or logo, or a quick comparison like "bad code on the left, good code on the right", something marketing-like and cringey
