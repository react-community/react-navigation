import * as React from 'react';
import { render } from 'react-native-testing-library';
import { Router, NavigationState } from '@react-navigation/routers';
import useNavigationBuilder from '../useNavigationBuilder';
import BaseNavigationContainer from '../BaseNavigationContainer';
import Screen from '../Screen';
import MockRouter, {
  MockActions,
  MockRouterKey,
} from './__fixtures__/MockRouter';

beforeEach(() => (MockRouterKey.current = 0));

it("lets parent handle the action if child didn't", () => {
  function CurrentRouter() {
    const CurrentMockRouter = MockRouter();
    const ParentRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ParentRouter;
  }
  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(CurrentRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <ParentNavigator initialRouteName="baz">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux" component={TestScreen} />
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 2,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'foo', name: 'foo' },
    ],
  });
});

it("lets children handle the action if parent didn't", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter() {
    const CurrentMockRouter = MockRouter();
    const ChildRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }
        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentChildRouter,
      props
    );

    return descriptors[state.routes[state.index].key].render();
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentParentRouter,
      props
    );

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const initialState = {
    index: 1,
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          index: 0,
          key: '4',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  };

  const element = (
    <BaseNavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toBeCalledTimes(1);
  expect(onStateChange).lastCalledWith({
    stale: false,
    type: 'test',
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          type: 'test',
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'lex', name: 'lex' },
            { key: 'qux', name: 'qux' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  });
});

it("action doesn't bubble if target is specified", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter() {
    const CurrentMockRouter = MockRouter();
    const ChildRouter: Router<
      NavigationState,
      MockActions | { type: 'REVERSE' }
    > = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentChildRouter,
      props
    );

    return descriptors[state.routes[state.index].key].render();
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(
      CurrentParentRouter,
      props
    );

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE', target: '0' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).not.toBeCalled();
});

it('logs error if no navigator handled the action', () => {
  const TestRouter = MockRouter;

  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder(TestRouter, props);

    return (
      <React.Fragment>
        {state.routes.map((route) => descriptors[route.key].render())}
      </React.Fragment>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UNKNOWN' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          index: 0,
          key: '4',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  };

  const element = (
    <BaseNavigationContainer initialState={initialState}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const spy = jest.spyOn(console, 'error').mockImplementation();

  render(element).update(element);

  expect(spy.mock.calls[0][0]).toMatch(
    "The action 'UNKNOWN' was not handled by any navigator."
  );

  spy.mockRestore();
});
