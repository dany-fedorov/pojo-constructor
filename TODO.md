- Try make default input type = undefined, see test "cachingProxy access - only evaluated once - async concur"
- pojoConstructorThrownIn does not fulfill its purpose when caching proxy is not used - there is no stack trace of
  calls. Make a "catchingProxy" that will allow to track nested calls made with "this.field"
