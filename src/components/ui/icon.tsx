import Svg, { Path } from 'react-native-svg';
import { useMindyTheme } from './theme';
import symbols from './symbols.json';
import filledSymbols from './symbols-filled.json';

export type IconName = keyof typeof symbols;
export function Icon({
  name,
  size = 24,
  color,
  filled = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const { colors } = useMindyTheme();
  const symbol =
    filled &&
    (name === 'light_mode' || name === 'dark_mode' || name === 'contrast')
      ? filledSymbols[name]
      : symbols[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox={symbol.viewBox}
      accessible={false}
    >
      <Path
        d={symbol.path}
        fill={color ?? colors.secondary}
      />
    </Svg>
  );
}
