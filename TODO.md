- [ ] (refactor) Try make default input type = undefined, see test "cachingProxy access - only evaluated once - async
  concur"
- [x] (refactor) pojoConstructorThrownIn does not fulfill its purpose when caching proxy is not used - there is no stack
  trace of
  calls. Make a "catchingProxy" that will allow to track nested calls made with "this.field"
- [x] (refactor) Change readme to present a more convenient OO pattern with new PojoConstructor
- [ ] (feat) Add a decorator option to decorate all methods.
- [x] (feat) Add metadata option returned from method with { value }
- [x] (feat) Make .pojo return `PojoHost` with `{ value, metadata }` fields, but also with `get` method that can
  fetch `{ value, metadata }` for path like `['a', 0]`
- [ ] (feat) Allow to create alternative objects (variants)
  with `{ value, metadata, variants: { obj_1: { value, metadata }, ... } }`
- [ ] (feat) Update adapter to take into account `metadata` and `pojos`
- [ ] (chore) Get rid of ts-toolbelt dependency
- [ ] (feat) Allow to parametrize metadata type
- [ ] (dist,docs) Site. Now, same README can be found in several places - npm, github, typedoc. I'd like to make it one
  place.
  Options
    - Try out typedoc markdown, typeodoc hugo etc plugins, or maybe it is wotrth creating your own plugin?
    - Try to create a standalone site for README content, but I think it is better when it is integrated with API docs
- [ ] (dist) Think about banner, or logo, or a quick comparison like "bad code on the left, good code on the right",
  something marketing-like and cringey
- [x] (feat) Better constructor experience [.create()]
- [ ] (feat) Adapter for unboxed (done, but untested)
- [x] (feat) PojoConstructorDecorators same as PojoConstructorAdapters
