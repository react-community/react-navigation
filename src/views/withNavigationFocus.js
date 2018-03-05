import React from 'react';
import propTypes from 'prop-types';
import hoistStatics from 'hoist-non-react-statics';
import invariant from '../utils/invariant';
import { NavigationConsumer } from './NavigationContext';

export default function withNavigationFocus(Component) {
  class ComponentWithNavigationFocus extends React.Component {
    static displayName = `withNavigationFocus(${Component.displayName ||
      Component.name})`;

    constructor(props, context) {
      super();

      this.state = {
        isFocused: props.navigation ? props.navigation.isFocused() : false,
      };
    }

    componentDidMount() {
      const navigation = this.getNavigation();

      this.setState({
        isFocused: navigation.isFocused(),
      });

      this.subscriptions = [
        navigation.addListener('didFocus', () =>
          this.setState({ isFocused: true })
        ),
        navigation.addListener('willBlur', () =>
          this.setState({ isFocused: false })
        ),
      ];
    }

    componentWillUnmount() {
      this.subscriptions.forEach(sub => sub.remove());
    }

    getNavigation = (props = this.props) => {
      const navigation = props.navigation || this.navigation;
      invariant(
        !!navigation,
        'withNavigationFocus can only be used on a view hierarchy of a navigator. The wrapped component is unable to get access to navigation from props or context.'
      );
      return navigation;
    };

    render() {
      return (
        <NavigationConsumer>
          {navigation => {
            this.navigation = navigation;
            return (
              <Component
                {...this.props}
                isFocused={this.state.isFocused}
                ref={this.props.onRef}
              />
            );
          }}
        </NavigationConsumer>
      );
    }
  }

  return hoistStatics(ComponentWithNavigationFocus, Component);
}
