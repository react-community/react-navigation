/* @flow */

import * as React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Platform,
  Keyboard,
} from 'react-native';
import TabBarIcon from './TabBarIcon';
import SafeAreaView from '../SafeAreaView';
import withOrientation from '../withOrientation';

import type {
  NavigationRoute,
  NavigationState,
  NavigationScreenProp,
  ViewStyleProp,
  TextStyleProp,
} from '../../TypeDefinition';

import type { TabScene } from './TabView';

type Props = {
  activeTintColor: string,
  activeBackgroundColor: string,
  inactiveTintColor: string,
  inactiveBackgroundColor: string,
  showLabel: boolean,
  showIcon: boolean,
  allowFontScaling: boolean,
  position: Animated.Value,
  navigation: NavigationScreenProp<NavigationState>,
  jumpToIndex: (index: number) => void,
  getLabel: (scene: TabScene) => ?(React.Node | string),
  getOnPress: (
    scene: TabScene
  ) => (scene: TabScene, jumpToIndex: (index: number) => void) => void,
  getTestIDProps: (scene: TabScene) => (scene: TabScene) => any,
  renderIcon: (scene: TabScene) => React.Node,
  style?: ViewStyleProp,
  backgroundColor?: string,
  labelStyle?: TextStyleProp,
  tabStyle?: ViewStyleProp,
  showIcon?: boolean,
  isLandscape: boolean,
};

type State = {
  isVisible: boolean,
};

const majorVersion = parseInt(Platform.Version, 10);
const isIos = Platform.OS === 'ios';
const useHorizontalTabs = majorVersion >= 11 && isIos;

class TabBarBottom extends React.PureComponent<Props, State> {
  // See https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/UIKitUICatalog/UITabBar.html
  static defaultProps = {
    activeTintColor: '#3478f6', // Default active tint color in iOS 10
    activeBackgroundColor: 'transparent',
    inactiveTintColor: '#929292', // Default inactive tint color in iOS 10
    inactiveBackgroundColor: 'transparent',
    showLabel: true,
    showIcon: true,
    allowFontScaling: true,
  };

  props: Props;

  state: State = {
    isVisible: true,
  };

  _keyboardDidShowSub = undefined;
  _keyboardDidHideSub = undefined;

  componentWillMount() {
    this._keyboardDidShowSub = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow
    );
    this._keyboardDidHideSub = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide
    );
  }

  componentWillUnmount() {
    this._keyboardDidShowSub !== undefined && this._keyboardDidShowSub.remove();
    this._keyboardDidHideSub !== undefined && this._keyboardDidHideSub.remove();
  }

  _keyboardDidShow = () => {
    this.setState({
      isVisible: false,
    });
  };

  _keyboardDidHide = () => {
    this.setState({
      isVisible: true,
    });
  };

  _renderLabel = (scene: TabScene) => {
    const {
      position,
      navigation,
      activeTintColor,
      inactiveTintColor,
      labelStyle,
      showLabel,
      showIcon,
      isLandscape,
      allowFontScaling,
    } = this.props;
    if (showLabel === false) {
      return null;
    }
    const { index } = scene;
    const { routes } = navigation.state;
    // Prepend '-1', so there are always at least 2 items in inputRange
    const inputRange = [-1, ...routes.map((x: *, i: number) => i)];
    const outputRange = inputRange.map(
      (inputIndex: number) =>
        inputIndex === index ? activeTintColor : inactiveTintColor
    );
    const color = position.interpolate({
      inputRange,
      outputRange: (outputRange: Array<string>),
    });

    const tintColor = scene.focused ? activeTintColor : inactiveTintColor;
    const label = this.props.getLabel({ ...scene, tintColor });
    let marginLeft = 0;
    if (isLandscape && showIcon && useHorizontalTabs) {
      marginLeft = LABEL_LEFT_MARGIN;
    }
    let marginTop = 0;
    if (!isLandscape && showIcon && useHorizontalTabs) {
      marginTop = LABEL_TOP_MARGIN;
    }

    if (typeof label === 'string') {
      return (
        <Animated.Text
          style={[styles.label, { color, marginLeft, marginTop }, labelStyle]}
          allowFontScaling={allowFontScaling}
        >
          {label}
        </Animated.Text>
      );
    }

    if (typeof label === 'function') {
      return label({ ...scene, tintColor });
    }

    return label;
  };

  _renderIcon = (scene: TabScene) => {
    const {
      position,
      navigation,
      activeTintColor,
      inactiveTintColor,
      renderIcon,
      showIcon,
      showLabel,
    } = this.props;
    if (showIcon === false) {
      return null;
    }
    return (
      <TabBarIcon
        position={position}
        navigation={navigation}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        renderIcon={renderIcon}
        scene={scene}
        style={showLabel && useHorizontalTabs ? {} : styles.icon}
      />
    );
  };

  _renderTestIDProps = (scene: TabScene) => {
    const testIDProps =
      this.props.getTestIDProps && this.props.getTestIDProps(scene);
    return testIDProps;
  };

  render() {
    const {
      position,
      navigation,
      jumpToIndex,
      getOnPress,
      getTestIDProps,
      activeBackgroundColor,
      inactiveBackgroundColor,
      style,
      tabStyle,
      backgroundColor = '#F7F7F7', // Default background color in iOS 10
      isLandscape,
    } = this.props;
    const { routes } = navigation.state;
    // Prepend '-1', so there are always at least 2 items in inputRange
    const inputRange = [-1, ...routes.map((x: *, i: number) => i)];

    const tabBarStyle = [
      styles.tabBar,
      isLandscape && useHorizontalTabs
        ? styles.tabBarLandscape
        : styles.tabBarPortrait,
      style,
    ];

    return this.state.isVisible ? (
      <SafeAreaView
        style={[styles.tabBarContainer, { backgroundColor }]}
        forceInset={{ bottom: 'always' }}
      >
        <Animated.View style={tabBarStyle}>
          {routes.map((route: NavigationRoute, index: number) => {
            const focused = index === navigation.state.index;
            const scene = { route, index, focused };
            const onPress = getOnPress(scene);
            const outputRange = inputRange.map(
              (inputIndex: number) =>
                inputIndex === index
                  ? activeBackgroundColor
                  : inactiveBackgroundColor
            );
            const backgroundColor = position.interpolate({
              inputRange,
              outputRange: (outputRange: Array<string>),
            });

            const justifyContent = this.props.showIcon ? 'flex-end' : 'center';
            const extraProps = this._renderTestIDProps(scene) || {};
            const { testID, accessibilityLabel } = extraProps;

            return (
              <TouchableWithoutFeedback
                key={route.key}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                onPress={() =>
                  onPress ? onPress(scene, jumpToIndex) : jumpToIndex(index)}
              >
                <Animated.View
                  style={[
                    styles.tab,
                    isLandscape && useHorizontalTabs && styles.tabLandscape,
                    !isLandscape && useHorizontalTabs && styles.tabPortrait,
                    { backgroundColor },
                    tabStyle,
                  ]}
                >
                  {this._renderIcon(scene)}
                  {this._renderLabel(scene)}
                </Animated.View>
              </TouchableWithoutFeedback>
            );
          })}
        </Animated.View>
      </SafeAreaView>
    ) : null;
  }
}

const LABEL_LEFT_MARGIN = 20;
const LABEL_TOP_MARGIN = 15;
const styles = StyleSheet.create({
  tabBarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, .3)',
  },
  tabBar: {
    flexDirection: 'row',
  },
  tabBarLandscape: {
    height: 29,
  },
  tabBarPortrait: {
    height: 49,
  },
  tab: {
    flex: 1,
    alignItems: isIos ? 'center' : 'stretch',
    justifyContent: 'flex-end',
  },
  tabPortrait: {
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  tabLandscape: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  icon: {
    flexGrow: 1,
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 1.5,
    backgroundColor: 'transparent',
  },
});

export default withOrientation(TabBarBottom);
