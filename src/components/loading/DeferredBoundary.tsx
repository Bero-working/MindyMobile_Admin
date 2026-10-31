import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui/primitives';

export class DeferredBoundary extends Component<
  { children: ReactNode; onRetry: () => void; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <View
          accessibilityRole="alert"
          className="absolute inset-0 bg-mdy-bg justify-center"
        >
          <Text>{'Không tải được nội dung.'}</Text>
          <Button onPress={this.props.onRetry}>{String('Thử lại')}</Button>
          <Button onPress={this.props.onClose}>{String('Đóng')}</Button>
        </View>
      );
    }
    return this.props.children;
  }
}
