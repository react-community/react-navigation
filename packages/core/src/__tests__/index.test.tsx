import * as React from 'react';
import { render, act } from 'react-native-testing-library';
import { NavigationState } from '@react-navigation/routers';
import Screen from '../Screen';
import BaseNavigationContainer from '../BaseNavigationContainer';
import useNavigationBuilder from '../useNavigationBuilder';
import useNavigation from '../useNavigation';
import MockRouter, { MockRouterKey } from './__fixtures__/MockRouter';
import { NavigationContainerRef } from '../types';

beforeEach(() => (MockRouterKey.current = 0));

it('initializes state for a navigator on navigation', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen
          name="foo"
          component={FooScreen}
          initialParams={{ count: 10 }}
        />
        <Screen name="bar" component={jest.fn()} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={jest.fn()} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo', params: { count: 10 } },
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  });
});

it("doesn't crash when initialState is null", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = () => null;

  const element = (
    // @ts-ignore
    <BaseNavigationContainer initialState={null}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element)).not.toThrowError();
});

it('rehydrates state for a navigator on navigation', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const BarScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={jest.fn()} />
        <Screen name="bar" component={BarScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).lastCalledWith({
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
    stale: false,
    type: 'test',
  });
});

it("doesn't rehydrate state if the type of state didn't match router", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    type: 'something-else',
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <TestNavigator initialRouteName="foo">
        <Screen
          name="foo"
          component={FooScreen}
          initialParams={{ answer: 42 }}
        />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).lastCalledWith({
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo',
        name: 'foo',
        params: { answer: 42 },
      },
      { key: 'bar', name: 'bar' },
    ],
    stale: false,
    type: 'test',
  });
});

it('initializes state for nested screens in React.Fragment', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <React.Fragment>
          <Screen name="bar" component={jest.fn()} />
          <Screen name="baz" component={jest.fn()} />
        </React.Fragment>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  });
});

it('initializes state for nested navigator on navigation', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="baz">
        <Screen name="foo" component={jest.fn()} />
        <Screen name="bar" component={jest.fn()} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    stale: false,
    type: 'test',
    index: 2,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          type: 'test',
          index: 0,
          key: '1',
          routeNames: ['qux'],
          routes: [{ key: 'qux', name: 'qux' }],
        },
      },
    ],
  });
});

it("doesn't update state if nothing changed", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'NOOP' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toBeCalledTimes(0);
});

it("doesn't update state if action wasn't handled", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'INVALID' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const spy = jest.spyOn(console, 'error').mockImplementation();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toBeCalledTimes(0);

  expect(spy.mock.calls[0][0]).toMatch(
    "The action 'INVALID' was not handled by any navigator."
  );

  spy.mockRestore();
});

it('cleans up state when the navigator unmounts', () => {
  jest.useFakeTimers();

  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = render(element);

  root.update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
  });

  root.update(
    <BaseNavigationContainer onStateChange={onStateChange} children={null} />
  );

  act(() => jest.runAllTimers());

  expect(onStateChange).toBeCalledTimes(2);
  expect(onStateChange).lastCalledWith(undefined);
});

it('allows state updates by dispatching a function returning an action', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch((state: NavigationState) =>
        state.index === 0
          ? { type: 'NAVIGATE', payload: { name: state.routeNames[1] } }
          : { type: 'NOOP' }
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const BarScreen = () => null;

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={BarScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).toBeCalledWith({
    stale: false,
    type: 'test',
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
  });
});

it('updates route params with setParams', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  let setParams: (params: object) => void = () => undefined;

  const FooScreen = (props: any) => {
    setParams = props.navigation.setParams;

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => setParams({ username: 'alice' }));

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo', params: { username: 'alice' } },
      { key: 'bar', name: 'bar' },
    ],
  });

  act(() => setParams({ age: 25 }));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo', params: { username: 'alice', age: 25 } },
      { key: 'bar', name: 'bar' },
    ],
  });
});

it('updates route params with setParams applied to parent', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  let setParams: (params: object) => void = () => undefined;

  const FooScreen = (props: any) => {
    const parent = props.navigation.dangerouslyGetParent();
    if (parent) {
      setParams = parent.setParams;
    }

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">
          {() => (
            <TestNavigator initialRouteName="baz">
              <Screen name="baz" component={FooScreen} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => setParams({ username: 'alice' }));

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo',
        name: 'foo',
        params: { username: 'alice' },
        state: {
          index: 0,
          key: '1',
          routeNames: ['baz'],
          routes: [{ key: 'baz', name: 'baz' }],
          stale: false,
          type: 'test',
        },
      },
      { key: 'bar', name: 'bar' },
    ],
    stale: false,
    type: 'test',
  });

  act(() => setParams({ age: 25 }));

  expect(onStateChange).toBeCalledTimes(2);
  expect(onStateChange).lastCalledWith({
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo',
        name: 'foo',
        params: { username: 'alice', age: 25 },
        state: {
          index: 0,
          key: '1',
          routeNames: ['baz'],
          routes: [{ key: 'baz', name: 'baz' }],
          stale: false,
          type: 'test',
        },
      },
      { key: 'bar', name: 'bar' },
    ],
    stale: false,
    type: 'test',
  });
});

it('handles change in route names', async () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const onStateChange = jest.fn();

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator initialRouteName="bar">
        <Screen name="foo" component={jest.fn()} />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  root.update(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
        <Screen name="baz" component={jest.fn()} />
        <Screen name="qux" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toBeCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'baz', 'qux'],
    routes: [{ key: 'foo', name: 'foo' }],
  });
});

it('navigates to nested child in a navigator', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestComponent = ({ route }: any): any =>
    `[${route.name}, ${JSON.stringify(route.params)}]`;

  const onStateChange = jest.fn();

  const navigation = React.createRef<NavigationContainerRef>();

  const element = render(
    <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo-a" component={TestComponent} />
              <Screen name="foo-b" component={TestComponent} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar">
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen
                name="bar-a"
                component={TestComponent}
                initialParams={{ lol: 'why' }}
              />
              <Screen
                name="bar-b"
                component={TestComponent}
                initialParams={{ some: 'stuff' }}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"[foo-a, undefined]"`);

  act(
    () =>
      navigation.current &&
      navigation.current.navigate('bar', {
        screen: 'bar-b',
        params: { test: 42 },
      })
  );

  expect(element).toMatchInlineSnapshot(
    `"[bar-b, {\\"some\\":\\"stuff\\",\\"test\\":42}]"`
  );

  act(
    () =>
      navigation.current &&
      navigation.current.navigate('bar', {
        screen: 'bar-a',
        params: { whoa: 'test' },
      })
  );

  expect(element).toMatchInlineSnapshot(
    `"[bar-a, {\\"lol\\":\\"why\\",\\"whoa\\":\\"test\\"}]"`
  );
});

it('navigates to nested child in a navigator with initial: false', () => {
  const TestRouter: typeof MockRouter = () => {
    const router = MockRouter();

    return {
      ...router,

      getStateForAction(state, action, options) {
        switch (action.type) {
          case 'NAVIGATE': {
            if (!options.routeNames.includes(action.payload.name as any)) {
              return null;
            }

            const routes = [
              ...state.routes,
              {
                key: String(MockRouterKey.current++),
                name: action.payload.name,
                params: action.payload.params,
              },
            ];

            return {
              ...state,
              index: routes.length - 1,
              routes,
            };
          }

          default:
            return router.getStateForAction(state, action, options);
        }
      },
    } as typeof router;
  };

  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(TestRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestComponent = ({ route }: any): any =>
    `[${route.name}, ${JSON.stringify(route.params)}]`;

  const onStateChange = jest.fn();

  const navigation = React.createRef<NavigationContainerRef>();

  const first = render(
    <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo-a" component={TestComponent} />
              <Screen name="foo-b" component={TestComponent} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar">
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen
                name="bar-a"
                component={TestComponent}
                initialParams={{ lol: 'why' }}
              />
              <Screen
                name="bar-b"
                component={TestComponent}
                initialParams={{ some: 'stuff' }}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(first).toMatchInlineSnapshot(`"[foo-a, undefined]"`);
  expect(navigation.current?.getRootState()).toEqual({
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo',
        name: 'foo',
        state: {
          index: 0,
          key: '1',
          routeNames: ['foo-a', 'foo-b'],
          routes: [
            {
              key: 'foo-a',
              name: 'foo-a',
            },
            {
              key: 'foo-b',
              name: 'foo-b',
            },
          ],
          stale: false,
          type: 'test',
        },
      },
      { key: 'bar', name: 'bar' },
    ],
    stale: false,
    type: 'test',
  });

  act(
    () =>
      navigation.current &&
      navigation.current.navigate('bar', {
        screen: 'bar-b',
        params: { test: 42 },
      })
  );

  expect(first).toMatchInlineSnapshot(
    `"[bar-b, {\\"some\\":\\"stuff\\",\\"test\\":42}]"`
  );

  expect(navigation.current?.getRootState()).toEqual({
    index: 2,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: '2',
        name: 'bar',
        params: { params: { test: 42 }, screen: 'bar-b' },
        state: {
          index: 1,
          key: '3',
          routeNames: ['bar-a', 'bar-b'],
          routes: [
            {
              key: 'bar-a',
              name: 'bar-a',
              params: { lol: 'why' },
            },
            {
              key: 'bar-b',
              name: 'bar-b',
              params: { some: 'stuff', test: 42 },
            },
          ],
          stale: false,
          type: 'test',
        },
      },
    ],
    stale: false,
    type: 'test',
  });

  const second = render(
    <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo-a" component={TestComponent} />
              <Screen name="foo-b" component={TestComponent} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar">
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen
                name="bar-a"
                component={TestComponent}
                initialParams={{ lol: 'why' }}
              />
              <Screen
                name="bar-b"
                component={TestComponent}
                initialParams={{ some: 'stuff' }}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(second).toMatchInlineSnapshot(`"[foo-a, undefined]"`);
  expect(navigation.current?.getRootState()).toEqual({
    index: 0,
    key: '4',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo',
        name: 'foo',
        state: {
          index: 0,
          key: '5',
          routeNames: ['foo-a', 'foo-b'],
          routes: [
            { key: 'foo-a', name: 'foo-a' },
            { key: 'foo-b', name: 'foo-b' },
          ],
          stale: false,
          type: 'test',
        },
      },
      { key: 'bar', name: 'bar' },
    ],
    stale: false,
    type: 'test',
  });

  act(
    () =>
      navigation.current &&
      navigation.current.navigate('bar', {
        screen: 'bar-b',
        params: { test: 42 },
        initial: false,
      })
  );

  expect(second).toMatchInlineSnapshot(`"[bar-b, {\\"test\\":42}]"`);

  expect(navigation.current?.getRootState()).toEqual({
    index: 2,
    key: '4',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: '6',
        name: 'bar',
        params: { initial: false, params: { test: 42 }, screen: 'bar-b' },
        state: {
          index: 2,
          key: '7',
          routeNames: ['bar-a', 'bar-b'],
          routes: [
            {
              key: 'bar-a',
              name: 'bar-a',
              params: { lol: 'why' },
            },
            {
              key: 'bar-b',
              name: 'bar-b',
              params: { some: 'stuff' },
            },
            { key: '8', name: 'bar-b', params: { test: 42 } },
          ],
          stale: false,
          type: 'test',
        },
      },
    ],
    stale: false,
    type: 'test',
  });

  const third = render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        index: 1,
        routes: [
          { name: 'foo' },
          {
            name: 'bar',
            params: { initial: false, params: { test: 42 }, screen: 'bar-b' },
            state: {
              index: 1,
              key: '7',
              routes: [
                {
                  name: 'bar-a',
                  params: { lol: 'why' },
                },
                {
                  name: 'bar-b',
                  params: { some: 'stuff' },
                },
              ],
              type: 'test',
            },
          },
        ],
        type: 'test',
      }}
    >
      <TestNavigator>
        <Screen name="foo" component={TestComponent} />
        <Screen name="bar">
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen
                name="bar-a"
                component={TestComponent}
                initialParams={{ lol: 'why' }}
              />
              <Screen
                name="bar-b"
                component={TestComponent}
                initialParams={{ some: 'stuff' }}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(third).toMatchInlineSnapshot(`"[bar-b, {\\"some\\":\\"stuff\\"}]"`);

  expect(navigation.current?.getRootState()).toEqual({
    index: 1,
    key: '11',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo-9', name: 'foo' },
      {
        key: 'bar-10',
        name: 'bar',
        params: { initial: false, params: { test: 42 }, screen: 'bar-b' },
        state: {
          index: 1,
          key: '14',
          routeNames: ['bar-a', 'bar-b'],
          routes: [
            {
              key: 'bar-a-12',
              name: 'bar-a',
              params: { lol: 'why' },
            },
            {
              key: 'bar-b-13',
              name: 'bar-b',
              params: { some: 'stuff' },
            },
          ],
          stale: false,
          type: 'test',
        },
      },
    ],
    stale: false,
    type: 'test',
  });
});

it('gives access to internal state', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  let state: NavigationState | undefined;

  const Test = () => {
    const navigation = useNavigation();
    state = navigation.dangerouslyGetState();
    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator initialRouteName="bar">
        <Screen name="bar" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root).update(root);

  expect(state).toEqual({
    index: 0,
    key: '0',
    routeNames: ['bar'],
    routes: [{ key: 'bar', name: 'bar' }],
    stale: false,
    type: 'test',
  });
});

it('preserves order of screens in state with non-numeric names', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const navigation = React.createRef<NavigationContainerRef>();

  const root = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
        <Screen name="bar" component={jest.fn()} />
        <Screen name="baz" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root);

  expect(navigation.current?.getRootState().routeNames).toEqual([
    'foo',
    'bar',
    'baz',
  ]);
});

it('preserves order of screens in state with numeric names', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const navigation = React.createRef<NavigationContainerRef>();

  const root = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="4" component={jest.fn()} />
        <Screen name="7" component={jest.fn()} />
        <Screen name="1" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root);

  expect(navigation.current?.getRootState().routeNames).toEqual([
    '4',
    '7',
    '1',
  ]);
});

it("throws if navigator doesn't have any screens", () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator />
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "Couldn't find any screens for the navigator. Have you defined any screens as its children?"
  );
});

it('throws if navigator is not inside a container', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <TestNavigator>
      <Screen name="foo" component={jest.fn()} />
    </TestNavigator>
  );

  expect(() => render(element).update(element)).toThrowError(
    "Couldn't register the navigator. Have you wrapped your app with 'NavigationContainer'?"
  );
});

it('throws if multiple navigators rendered under one container', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
      </TestNavigator>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    'Another navigator is already registered for this container'
  );
});

it('throws when Screen is not the direct children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const Bar = () => null;

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
        <Bar />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "A navigator can only contain 'Screen' components as its direct children (found 'Bar')"
  );
});

it('throws when a React Element is not the direct children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
        Hello world
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "A navigator can only contain 'Screen' components as its direct children (found 'Hello world')"
  );
});

// eslint-disable-next-line jest/expect-expect
it("doesn't throw when direct children is Screen or empty element", () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
        {null}
        {undefined}
        {false}
        {true}
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

it('throws when multiple screens with same name are defined', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()} />
        <Screen name="bar" component={jest.fn()} />
        <Screen name="foo" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named 'foo')"
  );
});

it('switches rendered navigators', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator key="a">
        <Screen name="foo" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() =>
    root.update(
      <BaseNavigationContainer>
        <TestNavigator key="b">
          <Screen name="foo" component={jest.fn()} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrowError(
    'Another navigator is already registered for this container.'
  );
});

it('throws if no name is passed to Screen', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name={undefined as any} component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    'Got an invalid name (undefined) for the screen. It must be a non-empty string.'
  );
});

it('throws if invalid name is passed to Screen', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name={[] as any} component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    'Got an invalid name ([]) for the screen. It must be a non-empty string.'
  );
});

it('throws if both children and component are passed', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()}>
          {jest.fn()}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "Got both 'component' and 'children' props for the screen 'foo'. You must pass only one of them."
  );
});

it('throws descriptive error for undefined screen component', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={undefined as any} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "Couldn't find a 'component' or 'children' prop for the screen 'foo'"
  );
});

it('throws descriptive error for invalid screen component', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={{} as any} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "Got an invalid value for 'component' prop for the screen 'foo'. It must be a valid React Component."
  );
});

it('throws descriptive error for invalid children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo">{[] as any}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrowError(
    "Got an invalid value for 'children' prop for the screen 'foo'. It must be a function returning a React Element."
  );
});

it("doesn't throw if children is null", () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={jest.fn()}>
          {null as any}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).not.toThrowError();
});

it('returns currently focused route with getCurrentRoute', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = () => null;

  const navigation = React.createRef<NavigationContainerRef>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen
                name="bar-a"
                component={TestScreen}
                options={{ sample: 'data' }}
              />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.current?.getCurrentRoute()).toEqual({
    key: 'bar-a',
    name: 'bar-a',
  });
});

it("returns focused screen's options with getCurrentOptions when focused screen is rendered", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = () => null;

  const navigation = React.createRef<NavigationContainerRef>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator
              initialRouteName="bar-a"
              screenOptions={() => ({ sample2: 'data' })}
            >
              <Screen
                name="bar-a"
                component={TestScreen}
                options={{ sample: 'data' }}
              />
              <Screen
                name="bar-b"
                component={TestScreen}
                options={{ sample3: 'data' }}
              />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.current?.getCurrentOptions()).toEqual({
    sample: 'data',
    sample2: 'data',
  });

  act(() => navigation.current?.navigate('bar-b'));

  expect(navigation.current?.getCurrentOptions()).toEqual({
    sample2: 'data',
    sample3: 'data',
  });
});

it("returns focused screen's options with getCurrentOptions when all screens are rendered", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return <>{state.routes.map((route) => descriptors[route.key].render())}</>;
  };

  const TestScreen = () => null;

  const navigation = React.createRef<NavigationContainerRef>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator
              initialRouteName="bar-a"
              screenOptions={() => ({ sample2: 'data' })}
            >
              <Screen
                name="bar-a"
                component={TestScreen}
                options={{ sample: 'data' }}
              />
              <Screen
                name="bar-b"
                component={TestScreen}
                options={{ sample3: 'data' }}
              />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.current?.getCurrentOptions()).toEqual({
    sample: 'data',
    sample2: 'data',
  });

  act(() => navigation.current?.navigate('bar-b'));

  expect(navigation.current?.getCurrentOptions()).toEqual({
    sample2: 'data',
    sample3: 'data',
  });
});

it('does not throw if while getting current options with no options defined', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = () => null;

  const navigation = React.createRef<NavigationContainerRef>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen
                name="bar-b"
                component={TestScreen}
                options={{ wrongKey: true }}
              />
              <Screen name="bar-a" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.current?.getCurrentOptions()).toEqual({});
});

it('does not throw if while getting current options with empty container', () => {
  const navigation = React.createRef<NavigationContainerRef>();

  // @ts-ignore
  const container = <BaseNavigationContainer ref={navigation} />;

  render(container).update(container);

  expect(navigation.current?.getCurrentOptions()).toEqual(undefined);
});
