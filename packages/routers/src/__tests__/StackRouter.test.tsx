import { CommonActions, StackRouter, StackActions } from '..';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

it('gets initial state from route names and params with initialRouteName', () => {
  const router = StackRouter();

  expect(
    router.getInitialState({
      initialRouteName: 'baz',
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
    })
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'baz-test', name: 'baz', params: { answer: 42 } }],
    stale: false,
    type: 'stack',
  });
});

it('gets initial state from route names and params without initialRouteName', () => {
  const router = StackRouter();

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
    })
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false,
    type: 'stack',
  });
});

it('gets rehydrated state from partial state', () => {
  const router = StackRouter();

  const options = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
  };

  expect(
    router.getRehydratedState(
      {
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-1', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
  });

  expect(
    router.getRehydratedState(
      {
        index: 2,
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-1', name: 'baz' },
          { key: 'qux-2', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    index: 2,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
  });

  expect(
    router.getRehydratedState(
      {
        index: 4,
        routes: [],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false,
    type: 'stack',
  });
});

it("doesn't rehydrate state if it's not stale", () => {
  const router = StackRouter();

  const state = {
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false as const,
    type: 'stack' as const,
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
    })
  ).toBe(state);
});

it('gets state on route names change', () => {
  const router = StackRouter();

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 2,
        key: 'stack-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
        type: 'stack',
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
      }
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
  });

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'stack-test',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
        type: 'stack',
      },
      {
        routeNames: ['baz', 'qux'],
        routeParamList: {
          baz: { name: 'John' },
        },
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'baz-test', name: 'baz', params: { name: 'John' } }],
    stale: false,
    type: 'stack',
  });
});

it('gets state on route names change with initialRouteName', () => {
  const router = StackRouter();

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'stack-test',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
        type: 'stack',
      },
      {
        initialRouteName: 'qux',
        routeNames: ['baz', 'qux'],
        routeParamList: {
          baz: { name: 'John' },
        },
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'qux-test', name: 'qux' }],
    stale: false,
    type: 'stack',
  });
});

it('handles navigate action', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      {
        key: 'qux-test',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      CommonActions.navigate('bar', { answer: 96 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 96 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('unknown'),
      options
    )
  ).toBe(null);

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar-0', name: 'bar' },
        ],
      },
      CommonActions.navigate({ key: 'unknown' }),
      options
    )
  ).toBe(null);

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      {
        type: 'NAVIGATE',
        payload: { key: 'baz-0', name: 'baz' },
      },
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz-0', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate({ key: 'baz-1', name: 'baz' }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-0', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'baz-1', name: 'baz' },
    ],
  });
});

it('handles go back action', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.goBack(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'baz', name: 'baz' }],
      },
      CommonActions.goBack(),
      options
    )
  ).toBe(null);
});

it('handles pop action', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.pop(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.pop(2),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.pop(4),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-0', name: 'qux' },
        ],
      },
      {
        ...StackActions.pop(),
        target: 'root',
        source: 'bar-0',
      },
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 4,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-0', name: 'qux' },
          { key: 'quy-0', name: 'quy' },
          { key: 'quz-0', name: 'quz' },
        ],
      },
      {
        ...StackActions.pop(2),
        target: 'root',
        source: 'qux-0',
      },
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-0', name: 'baz' },
      { key: 'quy-0', name: 'quy' },
      { key: 'quz-0', name: 'quz' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      StackActions.pop(),
      options
    )
  ).toBe(null);
});

it('handles pop to top action', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popToTop(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });
});

it('replaces focused screen with replace', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      StackActions.replace('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

it('replaces active screen with replace', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('qux', { answer: 42 }),
        source: 'baz',
      },
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

it("doesn't handle replace if source key isn't present", () => {
  const router = StackRouter();
  const options = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('qux', { answer: 42 }),
        source: 'magic',
        target: 'root',
      },
      options
    )
  ).toBe(null);
});

it("doesn't handle replace if screen to replace with isn't present", () => {
  const router = StackRouter();
  const options = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('nonexistent', { answer: 42 }),
        source: 'magic',
      },
      options
    )
  ).toBe(null);
});

it('handles push action', () => {
  const router = StackRouter();
  const options = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      baz: { foo: 21 },
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('baz'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 3,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { foo: 21 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('baz', { bar: 29 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 3,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { foo: 21, bar: 29 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('unknown'),
      options
    )
  ).toBe(null);
});

it('changes index on focus change', () => {
  const router = StackRouter();

  expect(
    router.getStateForRouteFocus(
      {
        index: 2,
        key: 'stack-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        stale: false,
        type: 'stack',
      },
      'baz-0'
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
    ],
    stale: false,
    type: 'stack',
  });

  const state = {
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
    ],
    stale: false as const,
    type: 'stack' as const,
  };

  expect(router.getStateForRouteFocus(state, 'qux-0')).toEqual(state);
});
