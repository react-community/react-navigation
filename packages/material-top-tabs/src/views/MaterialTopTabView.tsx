import * as React from 'react';
import { TabView, SceneRendererProps } from 'react-native-tab-view';
import {
  NavigationHelpersContext,
  TabNavigationState,
  TabActions,
  ParamListBase,
  Route,
  useTheme,
} from '@react-navigation/native';

import MaterialTopTabBar from './MaterialTopTabBar';
import type {
  MaterialTopTabDescriptorMap,
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigationHelpers,
  MaterialTopTabBarProps,
} from '../types';

type Props = MaterialTopTabNavigationConfig & {
  state: TabNavigationState<ParamListBase>;
  navigation: MaterialTopTabNavigationHelpers;
  descriptors: MaterialTopTabDescriptorMap;
};

export default function MaterialTopTabView({
  tabBar = (props: MaterialTopTabBarProps) => <MaterialTopTabBar {...props} />,
  state,
  navigation,
  descriptors,
  sceneContainerStyle,
  onIndexChange,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const renderTabBar = (props: SceneRendererProps) => {
    return tabBar({
      ...props,
      state: state,
      navigation: navigation,
      descriptors: descriptors,
    });
  };

  return (
    <NavigationHelpersContext.Provider value={navigation}>
      <TabView<Route<string>>
        {...rest}
        onIndexChange={(index) => {
          navigation.dispatch({
            ...TabActions.jumpTo(state.routes[index].name),
            target: state.key,
          });
          onIndexChange?.(index);
        }}
        renderScene={({ route }) => descriptors[route.key].render()}
        navigationState={state}
        renderTabBar={renderTabBar}
        renderLazyPlaceholder={({ route }) =>
          descriptors[route.key].options.lazyPlaceholder?.() ?? null
        }
        lazy={({ route }) => descriptors[route.key].options.lazy === true}
        onSwipeStart={() => navigation.emit({ type: 'swipeStart' })}
        onSwipeEnd={() => navigation.emit({ type: 'swipeEnd' })}
        sceneContainerStyle={[
          { backgroundColor: colors.background },
          sceneContainerStyle,
        ]}
      />
    </NavigationHelpersContext.Provider>
  );
}
