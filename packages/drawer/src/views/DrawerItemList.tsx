import {
  CommonActions,
  DrawerActions,
  DrawerNavigationState,
  ParamListBase,
  useLinkBuilder,
} from '@react-navigation/native';
import * as React from 'react';

import type { DrawerDescriptorMap, DrawerNavigationHelpers } from '../types';
import DrawerItem from './DrawerItem';

type Props = {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

/**
 * Component that renders the navigation list in the drawer.
 */
export default function DrawerItemList({
  state,
  navigation,
  descriptors,
}: Props) {
  const buildLink = useLinkBuilder();

  return state.routes.map((route, i) => {
    const focused = i === state.index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'drawerPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.dispatch({
          ...(focused
            ? DrawerActions.closeDrawer()
            : CommonActions.navigate(route.name)),
          target: state.key,
        });
      }
    };

    const {
      title,
      drawerLabel,
      drawerIcon,
      drawerActiveTintColor,
      drawerInactiveTintColor,
      drawerActiveBackgroundColor,
      drawerInactiveBackgroundColor,
      drawerLabelStyle,
      drawerItemStyle,
    } = descriptors[route.key].options;

    return (
      <DrawerItem
        key={route.key}
        label={
          drawerLabel !== undefined
            ? drawerLabel
            : title !== undefined
            ? title
            : route.name
        }
        icon={drawerIcon}
        focused={focused}
        activeTintColor={drawerActiveTintColor}
        inactiveTintColor={drawerInactiveTintColor}
        activeBackgroundColor={drawerActiveBackgroundColor}
        inactiveBackgroundColor={drawerInactiveBackgroundColor}
        labelStyle={drawerLabelStyle}
        style={drawerItemStyle}
        to={buildLink(route.name, route.params)}
        onPress={onPress}
      />
    );
  }) as React.ReactNode as React.ReactElement;
}
