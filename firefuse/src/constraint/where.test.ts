import * as fs from "firebase/firestore";
import { Assert, City, Exact, Room, TsTestData } from "../index.test.js";
import {
  LegalOperation,
  ArrayOp,
  EqualOp,
  GreaterOrLesserOp,
  LegalValue,
  Where,
} from "./where.js";

type RefTestData = {
  readonly ref: fs.DocumentReference<Room>;
  readonly refs: (fs.DocumentReference<Room> | null)[];
};

describe(`LegalOperation`, () => {
  test(`LegalOperation<City, "regions"> is ArrayOp | EqualOp`, () => {
    type T = LegalOperation<City, "regions">;
    type _ = Assert<Exact<ArrayOp | EqualOp, T>>;
  });
  test(`LegalOperation<City, "regions"> is ArrayOp | EqualOp`, () => {
    type T = LegalOperation<City, "regions">;
    type _ = Assert<Exact<ArrayOp | EqualOp, T>>;
  });
  test(`LegalOperation<RefTestData, "ref"> is EqualOp`, () => {
    type OP = LegalOperation<RefTestData, "ref">;
    type _ = Assert<Exact<EqualOp, OP>>;
  });
  test(`LegalOperation<RefTestData, "refs"> is EqualOp | ArrayOp`, () => {
    type OP = LegalOperation<RefTestData, "refs">;
    type _ = Assert<Exact<EqualOp | ArrayOp, OP>>;
  });
  test(`LegalOperation<{ a: fs.Timestamp }, "a"> is EqualOp | GreaterOrLesserOp`, () => {
    type OP = LegalOperation<{ a: fs.Timestamp }, "a">;
    type _ = Assert<Exact<EqualOp | GreaterOrLesserOp, OP>>;
  });
});

describe(`LegaolValue`, () => {
  test(`string exact LegalValue<City, "regions", "array-contains">`, () => {
    type T = LegalValue<City, "regions", "array-contains">;
    type _ = Assert<Exact<T, string>>;
  });
  test("(string | null)[] array-contains string | null", () => {
    type T = {
      a: (string | null)[];
    };
    type V = LegalValue<T, "a", "array-contains">;
    type _ = Assert<Exact<string | null, V>>;
  });
  test("(string | null)[]| undefined array-contains string | null", () => {
    type T = {
      a?: (string | null)[];
    };
    type V = LegalValue<T, "a", "array-contains">;
    type _ = Assert<Exact<string | null, V>>;
  });
  test("LegalValue<City, 'state', '=='> is string | null", () => {
    type V = LegalValue<City, "state", "==">;
    type _ = Assert<Exact<string | null, V>>;
  });
  test("LegalValue<City, 'state', '=='> is string | null", () => {
    type V = LegalValue<TsTestData, "ts", "==">;
    type _ = Assert<Exact<fs.Timestamp, V>>;
  });
  test(`LegalValue<RefTestData, "ref", "=="> is DocRef<Room>`, () => {
    type V = LegalValue<RefTestData, "ref", "==">;
    type _ = Assert<Exact<fs.DocumentReference<Room>, V>>;
  });
  test(`LegalValue<RefTestData, "refs", "=="> is (DocRef | null)[]`, () => {
    type V = LegalValue<RefTestData, "refs", "==">;
    type _ = Assert<Exact<(fs.DocumentReference<Room> | null)[], V>>;
  });
});

describe(`where`, () => {
  const where = fs.where as Where<City>;

  test("able to create where(capital, ==, true)", () => {
    expect(() => where("capital", "==", true)).not.toThrow();
  });

  test(`able to create where("regions", "array-contains", "west_coast")`, () => {
    expect(() =>
      where("regions", "array-contains", "west_coast")
    ).not.toThrow();
  });
});
