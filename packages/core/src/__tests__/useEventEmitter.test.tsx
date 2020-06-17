import * as React from 'react';
import { render, act } from 'react-native-testing-library';
import { Router, NavigationState } from '@react-navigation/routers';
import useNavigationBuilder from '../useNavigationBuilder';
import BaseNavigationContainer from '../BaseNavigationContainer';
import Screen from '../Screen';
import MockRouter from './__fixtures__/MockRouter';

it('fires focus and blur events in root navigator', () => {
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return state.routes.map((route) => descriptors[route.key].render());
  });

  const firstFocusCallback = jest.fn();
  const firstBlurCallback = jest.fn();

  const secondFocusCallback = jest.fn();
  const secondBlurCallback = jest.fn();

  const thirdFocusCallback = jest.fn();
  const thirdBlurCallback = jest.fn();

  const fourthFocusCallback = jest.fn();
  const fourthBlurCallback = jest.fn();

  const createComponent = (focusCallback: any, blurCallback: any) => ({
    navigation,
  }: any) => {
    React.useEffect(() => navigation.addListener('focus', focusCallback), [
      navigation,
    ]);

    React.useEffect(() => navigation.addListener('blur', blurCallback), [
      navigation,
    ]);

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen
          name="first"
          component={createComponent(firstFocusCallback, firstBlurCallback)}
        />
        <Screen
          name="second"
          component={createComponent(secondFocusCallback, secondBlurCallback)}
        />
        <Screen
          name="third"
          component={createComponent(thirdFocusCallback, thirdBlurCallback)}
        />
        <Screen
          name="fourth"
          component={createComponent(fourthFocusCallback, fourthBlurCallback)}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstFocusCallback).toBeCalledTimes(1);
  expect(firstBlurCallback).toBeCalledTimes(0);
  expect(secondFocusCallback).toBeCalledTimes(0);
  expect(secondBlurCallback).toBeCalledTimes(0);
  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(thirdBlurCallback).toBeCalledTimes(0);
  expect(fourthFocusCallback).toBeCalledTimes(0);
  expect(fourthBlurCallback).toBeCalledTimes(0);

  act(() => navigation.current.navigate('second'));

  expect(firstBlurCallback).toBeCalledTimes(1);
  expect(secondFocusCallback).toBeCalledTimes(1);

  act(() => navigation.current.navigate('fourth'));

  expect(firstFocusCallback).toBeCalledTimes(1);
  expect(firstBlurCallback).toBeCalledTimes(1);
  expect(secondFocusCallback).toBeCalledTimes(1);
  expect(secondBlurCallback).toBeCalledTimes(1);
  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(thirdBlurCallback).toBeCalledTimes(0);
  expect(fourthFocusCallback).toBeCalledTimes(1);
  expect(fourthBlurCallback).toBeCalledTimes(0);
});

it('fires focus event after blur', () => {
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return state.routes.map((route) => descriptors[route.key].render());
  });

  const callback = jest.fn();

  const Test = ({ route, navigation }: any) => {
    React.useEffect(
      () =>
        navigation.addListener('focus', () => callback(route.name, 'focus')),
      [navigation, route.name]
    );

    React.useEffect(
      () => navigation.addListener('blur', () => callback(route.name, 'blur')),
      [navigation, route.name]
    );

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen name="first" component={Test} />
        <Screen name="second" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback.mock.calls).toEqual([['first', 'focus']]);

  act(() => navigation.current.navigate('second'));

  expect(callback.mock.calls).toEqual([
    ['first', 'focus'],
    ['first', 'blur'],
    ['second', 'focus'],
  ]);

  act(() => navigation.current.navigate('first'));

  expect(callback.mock.calls).toEqual([
    ['first', 'focus'],
    ['first', 'blur'],
    ['second', 'focus'],
    ['second', 'blur'],
    ['first', 'focus'],
  ]);
});

it('fires focus and blur events in nested navigator', () => {
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return state.routes.map((route) => descriptors[route.key].render());
  });

  const firstFocusCallback = jest.fn();
  const firstBlurCallback = jest.fn();

  const secondFocusCallback = jest.fn();
  const secondBlurCallback = jest.fn();

  const thirdFocusCallback = jest.fn();
  const thirdBlurCallback = jest.fn();

  const fourthFocusCallback = jest.fn();
  const fourthBlurCallback = jest.fn();

  const createComponent = (focusCallback: any, blurCallback: any) => ({
    navigation,
  }: any) => {
    React.useEffect(() => navigation.addListener('focus', focusCallback), [
      navigation,
    ]);

    React.useEffect(() => navigation.addListener('blur', blurCallback), [
      navigation,
    ]);

    return null;
  };

  const parent = React.createRef<any>();
  const child = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={parent}>
        <Screen
          name="first"
          component={createComponent(firstFocusCallback, firstBlurCallback)}
        />
        <Screen
          name="second"
          component={createComponent(secondFocusCallback, secondBlurCallback)}
        />
        <Screen name="nested">
          {() => (
            <TestNavigator ref={child}>
              <Screen
                name="third"
                component={createComponent(
                  thirdFocusCallback,
                  thirdBlurCallback
                )}
              />
              <Screen
                name="fourth"
                component={createComponent(
                  fourthFocusCallback,
                  fourthBlurCallback
                )}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(firstFocusCallback).toBeCalledTimes(1);

  act(() => child.current.navigate('fourth'));

  expect(firstFocusCallback).toBeCalledTimes(1);
  expect(fourthFocusCallback).toBeCalledTimes(0);
  expect(thirdFocusCallback).toBeCalledTimes(0);

  act(() => parent.current.navigate('second'));

  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(secondFocusCallback).toBeCalledTimes(1);
  expect(fourthBlurCallback).toBeCalledTimes(0);

  act(() => parent.current.navigate('nested'));

  expect(firstBlurCallback).toBeCalledTimes(1);
  expect(secondBlurCallback).toBeCalledTimes(1);
  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(fourthFocusCallback).toBeCalledTimes(1);

  act(() => parent.current.navigate('third'));

  expect(fourthBlurCallback).toBeCalledTimes(1);
  expect(thirdFocusCallback).toBeCalledTimes(1);

  act(() => parent.current.navigate('first'));

  expect(firstFocusCallback).toBeCalledTimes(2);
  expect(thirdBlurCallback).toBeCalledTimes(1);

  act(() => parent.current.navigate('nested', { screen: 'fourth' }));

  expect(fourthFocusCallback).toBeCalledTimes(2);
  expect(thirdBlurCallback).toBeCalledTimes(1);
  expect(firstBlurCallback).toBeCalledTimes(2);

  act(() => parent.current.navigate('nested', { screen: 'third' }));

  expect(thirdFocusCallback).toBeCalledTimes(2);
  expect(fourthBlurCallback).toBeCalledTimes(2);

  // Make sure nothing else has changed
  expect(firstFocusCallback).toBeCalledTimes(2);
  expect(firstBlurCallback).toBeCalledTimes(2);

  expect(secondFocusCallback).toBeCalledTimes(1);
  expect(secondBlurCallback).toBeCalledTimes(1);

  expect(thirdFocusCallback).toBeCalledTimes(2);
  expect(thirdBlurCallback).toBeCalledTimes(1);

  expect(fourthFocusCallback).toBeCalledTimes(2);
  expect(fourthBlurCallback).toBeCalledTimes(2);
});

it('fires blur event when a route is removed with a delay', async () => {
  const TestRouter = (): Router<NavigationState, any> => {
    const router = MockRouter();

    return {
      ...router,

      getInitialState({
        initialRouteName: _initialRouteName,
        routeNames,
        routeParamList,
      }) {
        const initialRouteName =
          _initialRouteName !== undefined ? _initialRouteName : routeNames[0];

        return {
          stale: false,
          type: 'test',
          key: 'stack',
          index: 0,
          routeNames,
          routes: [
            {
              key: initialRouteName,
              name: initialRouteName,
              params: routeParamList[initialRouteName],
            },
          ],
        };
      },

      getStateForAction(state, action, options) {
        switch (action.type) {
          case 'PUSH':
            return {
              ...state,
              index: state.index + 1,
              routes: [...state.routes, action.payload],
            };
          case 'POP': {
            const routes = state.routes.slice(0, -1);

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

      actionCreators: {
        push(payload) {
          return { type: 'PUSH', payload };
        },

        pop() {
          return { type: 'POP' };
        },
      },
    };
  };

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      TestRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    const [previous, dispatch] = React.useReducer(
      (state: any, action: any) => {
        if (state.routes !== action.routes) {
          return { ...state, ...action };
        }

        return state;
      },
      { routes: state.routes, descriptors }
    );

    React.useEffect(() => {
      dispatch({ routes: state.routes, descriptors });
    }, [descriptors, state.routes]);

    return previous.routes.map((route: any) =>
      previous.descriptors[route.key].render()
    );
  });

  const blurCallback = jest.fn();

  const First = () => null;

  const Second = ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener('blur', blurCallback), [
      navigation,
    ]);

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen name="first" component={First} />
        <Screen name="second" component={Second} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() =>
    navigation.current.push({
      name: 'second',
      key: 'second',
    })
  );

  expect(blurCallback).toBeCalledTimes(0);

  act(() => navigation.current.pop());

  expect(blurCallback).toBeCalledTimes(1);
});

it('fires custom events added with addListener', () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return state.routes.map((route) => descriptors[route.key].render());
  });

  const firstCallback = jest.fn();
  const secondCallback = jest.fn();
  const thirdCallback = jest.fn();

  const createComponent = (callback: any) => ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener(eventName, callback), [
      navigation,
    ]);

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={createComponent(firstCallback)} />
        <Screen name="second" component={createComponent(secondCallback)} />
        <Screen name="third" component={createComponent(thirdCallback)} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(0);

  const target =
    ref.current.state.routes[ref.current.state.routes.length - 1].key;

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target,
      data: 42,
    });
  });

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);
  expect(thirdCallback.mock.calls[0][0].target).toBe(target);
  expect(thirdCallback.mock.calls[0][0].defaultPrevented).toBe(undefined);
  expect(thirdCallback.mock.calls[0][0].preventDefault).toBe(undefined);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback.mock.calls[0][0].target).toBe(undefined);
  expect(secondCallback.mock.calls[0][0].target).toBe(undefined);
  expect(thirdCallback.mock.calls[1][0].target).toBe(undefined);

  expect(firstCallback).toBeCalledTimes(1);
  expect(secondCallback).toBeCalledTimes(1);
  expect(thirdCallback).toBeCalledTimes(2);
});

it("doesn't call same listener multiple times with addListener", () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return state.routes.map((route) => descriptors[route.key].render());
  });

  const callback = jest.fn();

  const Test = ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener(eventName, callback), [
      navigation,
    ]);

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={Test} />
        <Screen name="second" component={Test} />
        <Screen name="third" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback).toBeCalledTimes(0);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(callback).toBeCalledTimes(1);
});

it('fires custom events added with listeners prop', () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation } = useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return null;
  });

  const firstCallback = jest.fn();
  const secondCallback = jest.fn();
  const thirdCallback = jest.fn();

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen
          name="first"
          listeners={{ someSuperCoolEvent: firstCallback }}
          component={jest.fn()}
        />
        <Screen
          name="second"
          listeners={{ someSuperCoolEvent: secondCallback }}
          component={jest.fn()}
        />
        <Screen
          name="third"
          listeners={{ someSuperCoolEvent: thirdCallback }}
          component={jest.fn()}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(0);

  const target =
    ref.current.state.routes[ref.current.state.routes.length - 1].key;

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target,
      data: 42,
    });
  });

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);
  expect(thirdCallback.mock.calls[0][0].target).toBe(target);
  expect(thirdCallback.mock.calls[0][0].defaultPrevented).toBe(undefined);
  expect(thirdCallback.mock.calls[0][0].preventDefault).toBe(undefined);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback.mock.calls[0][0].target).toBe(undefined);

  expect(firstCallback).toBeCalledTimes(1);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(1);
});

it("doesn't call same listener multiple times with listeners", () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation } = useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return null;
  });

  const callback = jest.fn();

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen
          name="first"
          listeners={{ someSuperCoolEvent: callback }}
          component={jest.fn()}
        />
        <Screen
          name="second"
          listeners={{ someSuperCoolEvent: callback }}
          component={jest.fn()}
        />
        <Screen
          name="third"
          listeners={{ someSuperCoolEvent: callback }}
          component={jest.fn()}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback).toBeCalledTimes(0);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(callback).toBeCalledTimes(1);
});

it('fires listeners when callback is provided for listeners prop', () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation } = useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return null;
  });

  const firstCallback = jest.fn();
  const secondCallback = jest.fn();
  const thirdCallback = jest.fn();

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen
          name="first"
          listeners={({ route, navigation }) => ({
            someSuperCoolEvent: (e) => firstCallback(e, route, navigation),
          })}
          component={jest.fn()}
        />
        <Screen
          name="second"
          listeners={({ route, navigation }) => ({
            someSuperCoolEvent: (e) => secondCallback(e, route, navigation),
          })}
          component={jest.fn()}
        />
        <Screen
          name="third"
          listeners={({ route, navigation }) => ({
            someSuperCoolEvent: (e) => thirdCallback(e, route, navigation),
          })}
          component={jest.fn()}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(0);

  const target =
    ref.current.state.routes[ref.current.state.routes.length - 1].key;

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target,
      data: 42,
    });
  });

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);
  expect(thirdCallback.mock.calls[0][0].target).toBe(target);
  expect(thirdCallback.mock.calls[0][0].defaultPrevented).toBe(undefined);
  expect(thirdCallback.mock.calls[0][0].preventDefault).toBe(undefined);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback.mock.calls[0][0].target).toBe(undefined);

  expect(firstCallback).toBeCalledTimes(1);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(1);
});

it('has option to prevent default', () => {
  expect.assertions(5);

  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return state.routes.map((route) => descriptors[route.key].render());
  });

  const callback = (e: any) => {
    expect(e.type).toBe('someSuperCoolEvent');
    expect(e.data).toBe(42);
    expect(e.defaultPrevented).toBe(false);
    expect(e.preventDefault).not.toBe(undefined);

    e.preventDefault();

    expect(e.defaultPrevented).toBe(true);
  };

  const Test = ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener(eventName, callback), [
      navigation,
    ]);

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      data: 42,
      canPreventDefault: true,
    });
  });
});
