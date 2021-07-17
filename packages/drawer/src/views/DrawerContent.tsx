import * as React from 'react';
import type { ScrollView } from 'react-native';

import type { DrawerContentComponentProps } from '../types';
import DrawerContentScrollView from './DrawerContentScrollView';
import DrawerItemList from './DrawerItemList';

export default React.forwardRef(function DrawerContent(
  { descriptors, state, ...rest }: DrawerContentComponentProps,
  ref?: React.Ref<ScrollView>
) {
  const { drawerContentStyle, drawerContentContainerStyle } =
    descriptors[state.routes[state.index].key].options;

  return (
    <DrawerContentScrollView
      {...rest}
      ref={ref}
      contentContainerStyle={drawerContentContainerStyle}
      style={drawerContentStyle}
    >
      <DrawerItemList descriptors={descriptors} state={state} {...rest} />
    </DrawerContentScrollView>
  );
});
