import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, TextInput } from 'react-native';

const KEYBOARD_CLEARANCE = 20;

export function useKeyboardAwareFormScroll(scrollRef: RefObject<ScrollView | null>, safeAreaBottom: number) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollY = useRef(0);
  const keyboardTop = useRef(Dimensions.get('window').height);
  const focusedInput = useRef<TextInput | null>(null);
  const scrollBeforeFocus = useRef(0);
  const adjustedForKeyboard = useRef(false);

  const scrollFocusedInputIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      focusedInput.current?.measureInWindow((_x, y, _width, height) => {
        const overlap = y + height + KEYBOARD_CLEARANCE - keyboardTop.current;
        if (overlap > 0) {
          adjustedForKeyboard.current = true;
          scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + overlap), animated: true });
        }
      });
    });
  }, [scrollRef]);

  useEffect(() => {
    const onKeyboardFrame = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(Math.max(0, windowHeight - event.endCoordinates.screenY));
      if (focusedInput.current) {
        setTimeout(scrollFocusedInputIntoView, Platform.OS === 'ios' ? 80 : 180);
      }
    };
    const onKeyboardHide = () => {
      keyboardTop.current = Dimensions.get('window').height;
      setKeyboardHeight(0);
      if (adjustedForKeyboard.current) {
        scrollRef.current?.scrollTo({ y: scrollBeforeFocus.current, animated: true });
      }
      adjustedForKeyboard.current = false;
      focusedInput.current = null;
    };
    const frameEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const frameSubscription = Keyboard.addListener(frameEvent, onKeyboardFrame);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardHide);
    return () => {
      frameSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollFocusedInputIntoView]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  };

  const onInputFocus = (input: TextInput | null) => {
    focusedInput.current = input;
    scrollBeforeFocus.current = scrollY.current;
    adjustedForKeyboard.current = false;
    setTimeout(scrollFocusedInputIntoView, 80);
    setTimeout(scrollFocusedInputIntoView, 320);
  };

  const onInputBlur = () => {
    focusedInput.current = null;
  };

  return {
    bottomPadding: keyboardHeight + safeAreaBottom + 24,
    onInputBlur,
    onInputFocus,
    onScroll,
    scrollFocusedInputIntoView,
  };
}

export function useFocusedInputScroll(
  scrollRef: RefObject<ScrollView | null>,
  inputRef: RefObject<TextInput | null>,
  safeAreaBottom: number,
) {
  const keyboardScroll = useKeyboardAwareFormScroll(scrollRef, safeAreaBottom);
  return {
    ...keyboardScroll,
    onInputFocus: () => keyboardScroll.onInputFocus(inputRef.current),
  };
}
