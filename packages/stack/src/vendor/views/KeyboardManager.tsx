import * as React from 'react';
import { TextInput, Keyboard } from 'react-native';

type Props = {
  enabled: boolean;
  children: (props: {
    onPageChangeStart: () => void;
    onPageChangeConfirm: (closing: Boolean) => void;
    onPageChangeCancel: () => void;
  }) => React.ReactNode;
};

export default class KeyboardManager extends React.Component<Props> {
  componentWillUnmount() {
    this.clearKeyboardTimeout();
  }

  // Numeric id of the previously focused text input
  // When a gesture didn't change the tab, we can restore the focused input with this
  private previouslyFocusedTextInput: any | null = null;
  private startTimestamp: number = 0;
  private keyboardTimeout: any;

  private clearKeyboardTimeout = () => {
    if (this.keyboardTimeout !== undefined) {
      clearTimeout(this.keyboardTimeout);
      this.keyboardTimeout = undefined;
    }
  };

  private handlePageChangeStart = () => {
    if (!this.props.enabled) {
      return;
    }

    this.clearKeyboardTimeout();

    const input: any = TextInput.State.currentlyFocusedInput
      ? TextInput.State.currentlyFocusedInput()
      : TextInput.State.currentlyFocusedField();

    // When a page change begins, blur the currently focused input
    TextInput.State.blurTextInput(input);

    // Store the id of this input so we can refocus it if change was cancelled
    this.previouslyFocusedTextInput = input;

    // Store timestamp for touch start
    this.startTimestamp = Date.now();
  };

  private handlePageChangeConfirm = (closing: Boolean) => {
    if (!this.props.enabled) {
      return;
    }

    this.clearKeyboardTimeout();

    const input = this.previouslyFocusedTextInput;

    if (closing && input) {
      TextInput.State.blurTextInput(input);
    } else {
      Keyboard.dismiss();
    }

    // Cleanup the ID on successful page change
    this.previouslyFocusedTextInput = null;
  };

  private handlePageChangeCancel = () => {
    if (!this.props.enabled) {
      return;
    }

    this.clearKeyboardTimeout();

    // The page didn't change, we should restore the focus of text input
    const input = this.previouslyFocusedTextInput;

    if (input) {
      // If the interaction was super short we should make sure keyboard won't hide again.

      // Too fast input refocus will result only in keyboard flashing on screen and hiding right away.
      // During first ~100ms keyboard will be dismissed no matter what,
      // so we have to make sure it won't interrupt input refocus logic.
      // That's why when the interaction is shorter than 100ms we add delay so it won't hide once again.
      // Subtracting timestamps makes us sure the delay is executed only when needed.
      if (Date.now() - this.startTimestamp < 100) {
        this.keyboardTimeout = setTimeout(() => {
          TextInput.State.focusTextInput(input);
          this.previouslyFocusedTextInput = null;
        }, 100);
      } else {
        TextInput.State.focusTextInput(input);
        this.previouslyFocusedTextInput = null;
      }
    }
  };

  render() {
    return this.props.children({
      onPageChangeStart: this.handlePageChangeStart,
      onPageChangeConfirm: this.handlePageChangeConfirm,
      onPageChangeCancel: this.handlePageChangeCancel,
    });
  }
}
