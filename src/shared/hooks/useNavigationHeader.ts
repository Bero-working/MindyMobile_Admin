import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useCallback, useMemo } from 'react';
import { Text } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { IconButton, useTheme } from '@sohantalukder/rn-kit';
import type { NavigationProp } from '@/navigation/types';

const fontWeight = {
  medium: '500',
  semibold: '600',
} as const;

// Utility function to sanitize text and prevent character encoding issues
const sanitizeText = (text: string): string => {
  if (!text) return '';
  // Remove any non-printable characters and normalize text
  return (
    text
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\uFEFF/g, '') // Remove BOM
      .trim()
  );
};

type NavigationHeaderProps = {
  headerTitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  title?: string;
  headerTitleAlign?: 'left' | 'center';
  backgroundColor?: string;
  handleBack?: () => void;
  /** Callback function that will be called when the title is pressed */
  onTitlePress?: () => void;
  leftIconColor?: string;
};

const useNavigationHeader = ({
  headerTitle,
  headerRight,
  title,
  headerTitleAlign = 'left',
  backgroundColor,
  handleBack,
  onTitlePress,
  leftIconColor,
}: NavigationHeaderProps) => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typographies } = useTheme();

  // Memoize handlers to prevent recreation
  const handleGoBack = useCallback(() => {
    if (handleBack) {
      handleBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, handleBack]);

  const headerLeft = useCallback(() => {
    return React.createElement(IconButton, {
      size: 'medium',
      icon: 'leftArrow',
      onPress: handleGoBack,
      iconColor: leftIconColor ?? colors.text,
    });
  }, [handleGoBack, leftIconColor, colors.text]);

  const headerBackgroundColor = useMemo(() => {
    if (backgroundColor) {
      return backgroundColor;
    }
    return colors.background;
  }, [backgroundColor, colors.background]);

  // Title press handler
  const handleTitlePress = useCallback(() => {
    if (onTitlePress) {
      onTitlePress();
    }
  }, [onTitlePress]);

  const headerTitleComponent = useCallback(() => {
    if (headerTitle) {
      return headerTitle;
    }
    if (title && onTitlePress) {
      const sanitizedTitle = sanitizeText(title);
      return React.createElement(
        Text,
        {
          onPress: handleTitlePress,
          numberOfLines: 1,
          ellipsizeMode: 'tail',
          style: {
            ...typographies.heading3,
            fontWeight: fontWeight.semibold,
            textAlign: headerTitleAlign === 'center' ? 'center' : 'left',
            fontFamily: 'Onest-SemiBold',
          },
        },
        sanitizedTitle
      );
    }
    if (title) {
      const sanitizedTitle = sanitizeText(title);
      return React.createElement(
        Text,
        {
          numberOfLines: 1,
          ellipsizeMode: 'tail',
          style: {
            ...typographies.heading3,
            fontWeight: fontWeight.semibold,
            textAlign: headerTitleAlign === 'center' ? 'center' : 'left',
            fontFamily: 'Onest-SemiBold',
          },
        },
        sanitizedTitle
      );
    }
    return null;
  }, [
    headerTitle,
    title,
    onTitlePress,
    handleTitlePress,
    typographies.heading3,
    headerTitleAlign,
  ]);
  const headerRightComponent = useCallback(() => headerRight, [headerRight]);

  // Memoize navigation options to prevent recreation
  const navigationOptions = useMemo(
    (): NativeStackNavigationOptions => ({
      headerShown: true,
      headerShadowVisible: false,
      headerTitleStyle: {
        fontFamily: 'Onest-SemiBold',
        fontWeight: fontWeight.semibold,
        fontSize: typographies.heading3.fontSize,
        color: typographies.heading3.color,
      },
      headerBackButtonDisplayMode: 'minimal',
      headerTitleAlign: headerTitleAlign || (title ? 'center' : 'left'),
      headerStyle: {
        backgroundColor: headerBackgroundColor,
      },
      headerLeft,
      headerTitle: headerTitleComponent,
      headerRight: headerRightComponent,
    }),
    [
      typographies.heading3,
      headerTitleAlign,
      title,
      headerLeft,
      headerTitleComponent,
      headerRightComponent,
      headerBackgroundColor,
    ]
  );

  useLayoutEffect(() => {
    navigation.setOptions(navigationOptions);
  }, [navigation, navigationOptions]);
};

export { useNavigationHeader };
