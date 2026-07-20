import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, TextInput } from 'react-native';

const KEYBOARD_CLEARANCE = 20;

export function useFocusedInputScroll(
  scrollRef: RefObject<ScrollView | null>,
  inputRef: RefObject<TextInput | null>,
  safeAreaBottom: number,
) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollY = useRef(0);
  const keyboardTop = useRef(Dimensions.get('window').height);
  const inputFocused = useRef(false);

  const scrollFocusedInputIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.measureInWindow((_x, y, _width, height) => {
        const overlap = y + height + KEYBOARD_CLEARANCE - keyboardTop.current;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + overlap), animated: true });
        }
      });
    });
  }, [inputRef, scrollRef]);

  useEffect(() => {
    const onKeyboardFrame = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(Math.max(0, windowHeight - event.endCoordinates.screenY));
      if (inputFocused.current) {
        setTimeout(scrollFocusedInputIntoView, Platform.OS === 'ios' ? 80 : 180);
      }
    };
    const onKeyboardHide = () => {
      keyboardTop.current = Dimensions.get('window').height;
      setKeyboardHeight(0);
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

  const onInputFocus = () => {
    inputFocused.current = true;
    setTimeout(scrollFocusedInputIntoView, 80);
    setTimeout(scrollFocusedInputIntoView, 320);
  };

  const onInputBlur = () => {
    inputFocused.current = false;
  };

  return {
    bottomPadding: keyboardHeight + safeAreaBottom + 24,
    onInputBlur,
    onInputFocus,
    onScroll,
    scrollFocusedInputIntoView,
  };
}
