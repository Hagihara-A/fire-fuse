import { GetData } from "./GetData.js";
import { MySchema, Assert, Exact } from "./index.test";

describe(`GetData`, () => {
  test(`GetData<MySchema, "user"> is exactlly User | Count`, () => {
    type D = GetData<MySchema, "user">;
    type _ = Assert<Exact<D, MySchema["user"][string]["doc"]>>;
  });

  test(`GetData<MySchema, "cities"> is exactlly Record<string, never>`, () => {
    type D = GetData<MySchema, "cities">;
    type _ = Assert<Exact<D, MySchema["cities"]["v1" | "v2"]["doc"]>>;
  });

  test(`GetData<MySchema, "user/string"> is exactlly User | Count`, () => {
    type D = GetData<MySchema, `user/${string}`>;
    type _ = Assert<Exact<D, MySchema["user"][string]["doc"]>>;
  });

  test(`GetData<MySchema, "cities/v1/cities"> is exactlly City`, () => {
    type D = GetData<MySchema, "cities/v1/cities">;
    type _ = Assert<
      Exact<D, MySchema["cities"]["v1"]["col"]["cities"][string]["doc"]>
    >;
  });

  test(`GetData<MySchema, "cities/v1/cities/string"> is exactlly City`, () => {
    type D = GetData<MySchema, `cities/v1/cities/${string}`>;
    type _ = Assert<
      Exact<D, MySchema["cities"]["v1"]["col"]["cities"][string]["doc"]>
    >;
  });
});
