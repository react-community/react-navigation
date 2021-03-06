import { Platform } from 'react-native';

const canUseDOM =
  Platform.OS === 'web' &&
  Boolean(typeof document !== 'undefined' && document.body);

export default canUseDOM;
