import * as React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import canUseDOM from '../../utils/canUseDOM';

type Props = ViewProps & {
  enabled: boolean;
  layout: { width: number; height: number };
  children: React.ReactNode;
};

// This component will render a page which overflows the screen
// if the container fills the body by comparing the size
// This lets the document.body handle scrolling of the content
// It's necessary for mobile browsers to be able to hide address bar on scroll
export default React.forwardRef<View, Props>(function CardSheet(
  { enabled, layout, style, ...rest },
  ref
) {
  const [fill, setFill] = React.useState(false);

  React.useEffect(() => {
    if (!canUseDOM) {
      // Only run when DOM is available
      return;
    }

    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    setFill(width === layout.width && height === layout.height);
  }, [layout.height, layout.width]);

  return (
    <View
      {...rest}
      ref={ref}
      style={[enabled && fill ? styles.page : styles.card, style]}
    />
  );
});

const styles = StyleSheet.create({
  page: {
    minHeight: '100%',
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
});
