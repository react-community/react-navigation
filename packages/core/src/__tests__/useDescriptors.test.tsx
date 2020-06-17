import * as React from 'react';
import { render, act } from 'react-native-testing-library';
import { NavigationState, Router } from '@react-navigation/routers';
import useNavigationBuilder from '../useNavigationBuilder';
import BaseNavigationContainer from '../BaseNavigationContainer';
import Screen from '../Screen';
import MockRouter, {
  MockActions,
  MockRouterKey,
} from './__fixtures__/MockRouter';

jest.useFakeTimers();

beforeEach(() => (MockRouterKey.current = 0));

it('sets options with options prop as an object', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <main>
        <h1>{options.title}</h1>
        <div>{render()}</div>
      </main>
    );
  };

  const TestScreen = (): any => 'Test screen';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen
          name="foo"
          component={TestScreen}
          options={{ title: 'Hello world' }}
        />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
                    <main>
                      <h1>
                        Hello world
                      </h1>
                      <div>
                        Test screen
                      </div>
                    </main>
          `);
});

it('sets options with options prop as a fuction', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <main>
        <h1>{options.title}</h1>
        <div>{render()}</div>
      </main>
    );
  };

  const TestScreen = (): any => 'Test screen';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen
          name="foo"
          component={TestScreen}
          options={({ route }: any) => ({ title: route.params.author })}
          initialParams={{ author: 'Jane' }}
        />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
                    <main>
                      <h1>
                        Jane
                      </h1>
                      <div>
                        Test screen
                      </div>
                    </main>
          `);
});

it('sets options with screenOptions prop as an object', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);

    return (
      <>
        {state.routes.map((route) => {
          const { render, options } = descriptors[route.key];

          return (
            <main key={route.key}>
              <h1>{options.title}</h1>
              <div>{render()}</div>
            </main>
          );
        })}
      </>
    );
  };

  const TestScreenA = (): any => 'Test screen A';

  const TestScreenB = (): any => 'Test screen B';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator screenOptions={{ title: 'Hello world' }}>
        <Screen name="foo" component={TestScreenA} />
        <Screen name="bar" component={TestScreenB} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
        Array [
          <main>
            <h1>
              Hello world
            </h1>
            <div>
              Test screen A
            </div>
          </main>,
          <main>
            <h1>
              Hello world
            </h1>
            <div>
              Test screen B
            </div>
          </main>,
        ]
    `);
});

it('sets options with screenOptions prop as a fuction', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);

    return (
      <>
        {state.routes.map((route) => {
          const { render, options } = descriptors[route.key];

          return (
            <main key={route.key}>
              <h1>{options.title}</h1>
              <div>{render()}</div>
            </main>
          );
        })}
      </>
    );
  };

  const TestScreenA = (): any => 'Test screen A';

  const TestScreenB = (): any => 'Test screen B';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator
        screenOptions={({ route }: any) => ({
          title: `${route.name}: ${route.params.author || route.params.fruit}`,
        })}
      >
        <Screen
          name="foo"
          component={TestScreenA}
          initialParams={{ author: 'Jane' }}
        />
        <Screen
          name="bar"
          component={TestScreenB}
          initialParams={{ fruit: 'Apple' }}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    Array [
      <main>
        <h1>
          foo: Jane
        </h1>
        <div>
          Test screen A
        </div>
      </main>,
      <main>
        <h1>
          bar: Apple
        </h1>
        <div>
          Test screen B
        </div>
      </main>,
    ]
  `);
});

it('sets initial options with setOptions', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      {
        title?: string;
        color?: string;
      },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <main>
        <h1 color={options.color}>{options.title}</h1>
        <div>{render()}</div>
      </main>
    );
  };

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      navigation.setOptions({
        title: 'Hello world',
      });
    });

    return 'Test screen';
  };

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" options={{ color: 'blue' }}>
          {(props) => <TestScreen {...props} />}
        </Screen>
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
                <main>
                  <h1
                    color="blue"
                  >
                    Hello world
                  </h1>
                  <div>
                    Test screen
                  </div>
                </main>
        `);
});

it('updates options with setOptions', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <main>
        <h1 color={options.color}>{options.title}</h1>
        <p>{options.description}</p>
        <caption>{options.author}</caption>
        <div>{render()}</div>
      </main>
    );
  };

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      navigation.setOptions({
        title: 'Hello world',
        description: 'Something here',
      });

      const timer = setTimeout(() =>
        navigation.setOptions({
          title: 'Hello again',
          author: 'Jane',
        })
      );

      return () => clearTimeout(timer);
    });

    return 'Test screen';
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" options={{ color: 'blue' }}>
          {(props) => <TestScreen {...props} />}
        </Screen>
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = render(element);

  act(() => jest.runAllTimers());

  root.update(element);

  expect(root).toMatchInlineSnapshot(`
            <main>
              <h1
                color="blue"
              >
                Hello again
              </h1>
              <p>
                Something here
              </p>
              <caption>
                Jane
              </caption>
              <div>
                Test screen
              </div>
            </main>
      `);
});

it("returns correct value for canGoBack when it's not overridden", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <main>
        <h1>{options.title}</h1>
        <div>{render()}</div>
      </main>
    );
  };

  let result = true;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen
          name="foo"
          component={TestScreen}
          options={{ title: 'Hello world' }}
        />
        <Screen name="bar" component={jest.fn()} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root).update(root);

  expect(result).toEqual(false);
});

it(`returns false for canGoBack when current router doesn't handle GO_BACK`, () => {
  function TestRouter() {
    const CurrentMockRouter = MockRouter();
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return null;
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any
    >(TestRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  let result = false;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="baz" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root).update(root);

  expect(result).toBe(false);
});

it('returns true for canGoBack when current router handles GO_BACK', () => {
  function ParentRouter() {
    const CurrentMockRouter = MockRouter();
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return state;
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ParentNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(ParentRouter, props);
    return descriptors[state.routes[state.index].key].render();
  };

  const ChildNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  let result = false;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <ParentNavigator>
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

  render(root).update(root);

  expect(result).toBe(true);
});

it('returns true for canGoBack when parent router handles GO_BACK', () => {
  function OverrodeRouter() {
    const CurrentMockRouter = MockRouter();
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return state;
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const OverrodeNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(OverrodeRouter, props);
    return descriptors[state.routes[state.index].key].render();
  };

  const TestNavigator = (props: any) => {
    const { state, descriptors } = useNavigationBuilder<
      NavigationState,
      any,
      { title?: string },
      any
    >(MockRouter, props);

    return descriptors[state.routes[state.index].key].render();
  };

  let result = true;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="qux">
          {() => (
            <OverrodeNavigator>
              <Screen name="qux">{() => null}</Screen>
            </OverrodeNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root).update(root);

  expect(result).toBe(false);
});
