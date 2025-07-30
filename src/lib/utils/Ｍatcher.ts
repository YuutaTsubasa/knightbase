type Matcher<T, R> = {
  when: (predicate: (value: T) => boolean, result: () => R) => Matcher<T, R>;
  whenEquals: (value: T, result: () => R) => Matcher<T, R>;
  otherwise: (result: () => R) => R;
};

export function match<T, R>(value: T): Matcher<T, R> {
  const conditions: { predicate: (v: T) => boolean; result: () => R }[] = [];

  return {
    when(predicate, result) {
      conditions.push({ predicate, result });
      return this;
    },
    whenEquals(value, result) {
      conditions.push({ predicate: v => v === value, result });
      return this;
    },
    otherwise(result) {
      for (const { predicate, result: r } of conditions) {
        if (predicate(value)) return r();
      }
      return result();
    }
  };
}