import {
  CommonActions,
  DrawerRouter,
  DrawerActions,
  DrawerNavigationState,
} from '..';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

it('gets initial state from route names and params with initialRouteName', () => {
  const router = DrawerRouter({ initialRouteName: 'baz' });

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
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
    stale: false,
    type: 'drawer',
  });
});

it('gets initial state from route names and params without initialRouteName', () => {
  const router = DrawerRouter();

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
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-test' }],
    stale: false,
    type: 'drawer',
  });
});

it('gets rehydrated state from partial state', () => {
  const router = DrawerRouter();

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
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false,
    type: 'drawer',
  });

  expect(
    router.getRehydratedState(
      {
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'baz-0' }],
    stale: false,
    type: 'drawer',
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
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'qux-2' }],
    stale: false,
    type: 'drawer',
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
    index: 2,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'qux-test' }],
    stale: false,
    type: 'drawer',
  });

  expect(
    router.getRehydratedState(
      {
        index: 1,
        history: [
          { type: 'route', key: 'bar-test' },
          { type: 'route', key: 'qux-test' },
          { type: 'route', key: 'foo-test' },
          { type: 'drawer' },
        ],
        routes: [],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'qux-test' },
      { type: 'drawer' },
    ],
    stale: false,
    type: 'drawer',
  });
});

it("doesn't rehydrate state if it's not stale", () => {
  const router = DrawerRouter();

  const state: DrawerNavigationState = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-test' }, { type: 'drawer' }],
    stale: false as const,
    type: 'drawer' as const,
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
    })
  ).toBe(state);
});

it('handles navigate action', () => {
  const router = DrawerRouter();
  const options = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'route', key: 'baz' },
    ],
  });
});

it('handles navigate action with open drawer', () => {
  const router = DrawerRouter();
  const options = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }, { type: 'drawer' }],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'route', key: 'baz' },
    ],
  });
});

it('handles open drawer action', () => {
  const router = DrawerRouter();
  const options = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      DrawerActions.openDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }, { type: 'drawer' }],
  });

  const state: DrawerNavigationState = {
    stale: false as const,
    type: 'drawer' as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }, { type: 'drawer' }],
  };

  expect(
    router.getStateForAction(state, DrawerActions.openDrawer(), options)
  ).toBe(state);
});

it('handles close drawer action', () => {
  const router = DrawerRouter();
  const options = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }, { type: 'drawer' }],
      },
      DrawerActions.closeDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }],
  });

  const state: DrawerNavigationState = {
    stale: false as const,
    type: 'drawer' as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'route', key: 'baz' },
    ],
  };

  expect(
    router.getStateForAction(state, DrawerActions.closeDrawer(), options)
  ).toBe(state);
});

it('handles toggle drawer action', () => {
  const router = DrawerRouter();
  const options = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }, { type: 'drawer' }],
      },
      DrawerActions.toggleDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      DrawerActions.toggleDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }, { type: 'drawer' }],
  });
});

it('updates history on focus change', () => {
  const router = DrawerRouter({ backBehavior: 'history' });

  const state: DrawerNavigationState = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false as const,
    type: 'drawer' as const,
  };

  expect(router.getStateForRouteFocus(state, 'bar-0').history).toEqual([
    { type: 'route', key: 'bar-0' },
  ]);

  expect(router.getStateForRouteFocus(state, 'baz-0').history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);
});

it('closes drawer on focus change', () => {
  const router = DrawerRouter({ backBehavior: 'history' });

  expect(
    router.getStateForRouteFocus(
      {
        index: 0,
        key: 'drawer-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'bar-0' }],
        stale: false,
        type: 'drawer',
      },
      'baz-0'
    )
  ).toEqual({
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    stale: false,
    type: 'drawer',
  });

  expect(
    router.getStateForRouteFocus(
      {
        index: 0,
        key: 'drawer-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'bar-0' }, { type: 'drawer' }],
        stale: false,
        type: 'drawer',
      },
      'baz-0'
    )
  ).toEqual({
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    stale: false,
    type: 'drawer',
  });
});
