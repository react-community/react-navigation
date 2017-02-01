/* @flow */

import React, { PropTypes } from 'react';
import {
  I18nManager,
  Image,
  Text,
  Platform,
  StyleSheet,
} from 'react-native';

import TouchableItem from './TouchableItem';

type Props = {
  onPress: Function,
  title?: string,
  tintColor?: string;
};

const HeaderBackButton = ({ onPress, title, tintColor }: Props) => (
  <TouchableItem
    delayPressIn={0}
    onPress={onPress}
    style={styles.container}
    borderless
  >
    <Image
      style={styles.button}
      source={require('./assets/back-icon.png')}
      tintColor={tintColor}
    />
    {Platform.OS === 'ios' && title && (
      <Text style={{ color: tintColor }}>
        {title}
      </Text>
    )}
  </TouchableItem>
);

HeaderBackButton.propTypes = {
  onPress: PropTypes.func.isRequired,
  tintColor: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button: {
    height: 24,
    width: 24,
    margin: Platform.OS === 'ios' ? 10 : 16,
    resizeMode: 'contain',
    transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
  },
});

export default HeaderBackButton;
