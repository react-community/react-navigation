import * as React from 'react';
import { render, act } from 'react-native-testing-library';
import useEventEmitter from '../useEventEmitter';
import useNavigationCache from '../useNavigationCache';
import useNavigationBuilder from '../useNavigationBuilder';
import BaseNavigationContainer from '../BaseNavigationContainer';
import Screen from '../Screen';
import MockRouter, { MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => (MockRouterKey.current = 0));

it('preserves reference for navigation objects', () => {
  expect.assertions(2);

  const state = {
    type: 'tab',
    stale: false as const,
    index: 1,
    key: 'State',
    routeNames: ['Foo', 'Bar'],
    routes: [
      { key: 'Foo', name: 'Foo' },
      { key: 'Bar', name: 'Bar' },
    ],
  };

  const getState = () => state;
  const navigation = {} as any;
  const setOptions = (() => {}) as any;
  const router = MockRouter();

  const Test = () => {
    const previous = React.useRef<any>();

    const emitter = useEventEmitter();
    const navigations = useNavigationCache({
      state,
      getState,
      navigation,
      setOptions,
      router,
      emitter,
    });

    if (previous.current) {
      Object.keys(navigations).forEach((key) => {
        expect(navigations[key]).toBe(previous.current[key]);
      });
    }

    React.useEffect(() => {
      previous.current = navigations;
    });

    return null;
  };

  const root = render(<Test />);

  root.update(<Test />);
});

it('returns correct value for isFocused', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return state.routes.map((route) => descriptors[route.key].render());
  };

  let navigation: any;

  const Test = (props: any) => {
    navigation = props.navigation;

    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(false);

  act(() => navigation.navigate('second'));

  expect(navigation.isFocused()).toBe(true);

  act(() => navigation.navigate('third'));

  expect(navigation.isFocused()).toBe(false);

  act(() => navigation.navigate('second'));

  expect(navigation.isFocused()).toBe(true);
});

it('returns correct value for isFocused after changing screens', () => {
  const TestRouter = (): ReturnType<typeof MockRouter> => {
    const router = MockRouter();

    return {
      ...router,

      getStateForRouteNamesChange(state, { routeNames }) {
        const routes = routeNames.map(
          (name) =>
            state.routes.find((r) => r.name === name) || {
              name,
              key: name,
            }
        );

        return {
          ...state,
          routeNames,
          routes,
          index: routes.length - 1,
        };
      },
    };
  };

  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(TestRouter, props);

    return state.routes.map((route) => descriptors[route.key].render());
  };

  let navigation: any;

  const Test = (props: any) => {
    navigation = props.navigation;

    return null;
  };

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(false);

  root.update(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
        <Screen name="second" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(true);

  root.update(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
        <Screen name="fourth">{() => null}</Screen>
        <Screen name="second" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(true);

  root.update(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="fourth">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(false);
});
