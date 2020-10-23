import * as React from 'react';
import { Platform } from 'react-native';
import {
  useNavigationBuilder,
  createNavigatorFactory,
  DefaultNavigatorOptions,
  EventArg,
  StackRouter,
  StackRouterOptions,
  StackNavigationState,
  StackActions,
  ParamListBase,
  TypedNavigator,
} from '@react-navigation/native';
import StackView from '../views/Stack/StackView';
import type {
  StackNavigationConfig,
  StackNavigationOptions,
  StackNavigationEventMap,
} from '../types';

export type Props = DefaultNavigatorOptions<StackNavigationOptions> &
  StackRouterOptions &
  StackNavigationConfig;

export function StackNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}: Props) {
  const defaultOptions = {
    gestureEnabled: Platform.OS === 'ios',
    animationEnabled:
      Platform.OS !== 'web' &&
      Platform.OS !== 'windows' &&
      Platform.OS !== 'macos',
  };

  const { state, descriptors, navigation } = useNavigationBuilder<
    StackNavigationState,
    StackRouterOptions,
    StackNavigationOptions,
    StackNavigationEventMap
  >(StackRouter, {
    initialRouteName,
    children,
    screenOptions:
      typeof screenOptions === 'function'
        ? (...args) => ({
            ...defaultOptions,
            ...screenOptions(...args),
          })
        : {
            ...defaultOptions,
            ...screenOptions,
          },
  });

  React.useEffect(
    () =>
      navigation.addListener?.('tabPress', (e) => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (
            state.index > 0 &&
            isFocused &&
            !(e as EventArg<'tabPress', true>).defaultPrevented
          ) {
            // When user taps on already focused tab and we're inside the tab,
            // reset the stack to replicate native behaviour
            navigation.dispatch({
              ...StackActions.popToTop(),
              target: state.key,
            });
          }
        });
      }),
    [navigation, state.index, state.key]
  );

  return (
    <StackView
      {...rest}
      state={state}
      descriptors={descriptors}
      navigation={navigation}
    />
  );
}

export default createNavigatorFactory<
  StackNavigationState,
  StackNavigationOptions,
  StackNavigationEventMap,
  typeof StackNavigator
>(StackNavigator);

export type TypedStackNavigator<
  ParamList extends ParamListBase
> = TypedNavigator<
  ParamList,
  StackNavigationState,
  StackNavigationOptions,
  StackNavigationEventMap,
  typeof StackNavigator
>;
