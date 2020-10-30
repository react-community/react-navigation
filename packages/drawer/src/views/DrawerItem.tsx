import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
  TouchableWithoutFeedbackProps,
} from 'react-native';
import { Link, useTheme } from '@react-navigation/native';
import Color from 'color';
import TouchableItem from './TouchableItem';

type Props = {
  /**
   * The label text of the item.
   */
  label:
    | string
    | ((props: { focused: boolean; color: string }) => React.ReactNode);
  /**
   * Icon to display for the `DrawerItem`.
   */
  icon?: (props: {
    focused: boolean;
    size: number;
    color: string;
  }) => React.ReactNode;
  /**
   * URL to use for the link to the tab.
   */
  to?: string;
  /**
   * Whether to highlight the drawer item as active.
   */
  focused?: boolean;
  /**
   * Function to execute on press.
   */
  onPress: () => void;
  /**
   * Color for the icon and label when the item is active.
   */
  activeTintColor?: string;
  /**
   * Color for the icon and label when the item is inactive.
   */
  inactiveTintColor?: string;
  /**
   * Background color for item when its active.
   */
  activeBackgroundColor?: string;
  /**
   * Background color for item when its inactive.
   */
  inactiveBackgroundColor?: string;
  /**
   * Style object for the label wrapper View.
   */
  labelContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style object for the label element.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Style object for the wrapper element.
   */
  style?: StyleProp<ViewStyle>;
};

const Touchable = ({
  children,
  style,
  onPress,
  to,
  accessibilityRole,
  delayPressIn,
  ...rest
}: TouchableWithoutFeedbackProps & {
  to?: string;
  children: React.ReactNode;
  onPress?: () => void;
}) => {
  if (Platform.OS === 'web' && to) {
    // React Native Web doesn't forward `onClick` if we use `TouchableWithoutFeedback`.
    // We need to use `onClick` to be able to prevent default browser handling of links.
    return (
      <Link
        {...rest}
        to={to}
        style={[styles.button, style]}
        onPress={(e: any) => {
          if (
            !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && // ignore clicks with modifier keys
            (e.button == null || e.button === 0) // ignore everything but left clicks
          ) {
            e.preventDefault();
            onPress?.(e);
          }
        }}
      >
        {children}
      </Link>
    );
  } else {
    return (
      <TouchableItem
        {...rest}
        accessibilityRole={accessibilityRole}
        delayPressIn={delayPressIn}
        onPress={onPress}
      >
        <View style={style}>{children}</View>
      </TouchableItem>
    );
  }
};

/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
export default function DrawerItem(props: Props) {
  const { colors } = useTheme();

  const {
    icon,
    label,
    labelContainerStyle,
    labelStyle,
    to,
    focused = false,
    activeTintColor = colors.primary,
    inactiveTintColor = Color(colors.text).alpha(0.68).rgb().string(),
    activeBackgroundColor = Color(activeTintColor).alpha(0.12).rgb().string(),
    inactiveBackgroundColor = 'transparent',
    style,
    onPress,
    ...rest
  } = props;

  const { borderRadius = 4 } = StyleSheet.flatten(style || {});
  const color = focused ? activeTintColor : inactiveTintColor;
  const backgroundColor = focused
    ? activeBackgroundColor
    : inactiveBackgroundColor;

  const iconNode = icon ? icon({ size: 24, focused, color }) : null;

  return (
    <View
      collapsable={false}
      {...rest}
      style={[styles.container, { borderRadius, backgroundColor }, style]}
    >
      <Touchable
        delayPressIn={0}
        onPress={onPress}
        style={[styles.wrapper, { borderRadius }]}
        accessibilityTraits={focused ? ['button', 'selected'] : 'button'}
        accessibilityComponentType="button"
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        // @ts-expect-error: keep for compatibility with older React Native versions
        accessibilityStates={focused ? ['selected'] : []}
        to={to}
      >
        <React.Fragment>
          {iconNode}
          <View
            style={[
              styles.label,
              { marginLeft: iconNode ? 32 : 0, marginVertical: 5 },
              labelContainerStyle,
            ]}
          >
            {typeof label === 'string' ? (
              <Text
                numberOfLines={1}
                style={[
                  {
                    color,
                    fontWeight: '500',
                  },
                  labelStyle,
                ]}
              >
                {label}
              </Text>
            ) : (
              label({ color, focused })
            )}
          </View>
        </React.Fragment>
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 4,
    overflow: 'hidden',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  label: {
    marginRight: 32,
    flex: 1,
  },
  button: {
    display: 'flex',
  },
});
