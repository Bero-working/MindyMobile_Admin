import tokens from './tokens.json';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import localStore from '@/services/storage/localStore.service';

export const light = tokens.light;
export type Palette = { [K in keyof typeof light]: string };
const dark: Palette = tokens.dark;
export type ThemeChoice = 'system' | 'light' | 'dark';
const ThemeContext = createContext({
  colors: light as Palette,
  choice: 'system' as ThemeChoice,
  isDark: false,
  setChoice: (_value: ThemeChoice) => {},
  variables: vars({}),
});
export const MindyThemeProvider = ({ children }: PropsWithChildren) => {
  const system = useColorScheme();
  const [choice, setTheme] = useState<ThemeChoice>(() => {
    const stored = localStore.getTheme();
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  });
  const isDark =
    choice === 'dark' || (choice === 'system' && system === 'dark');
  const colors = isDark ? dark : light;
  const variables = useMemo(
    () =>
      vars(
        Object.fromEntries(
          Object.entries(colors).map(([key, value]) => [`--mdy-${key}`, value])
        )
      ),
    [colors]
  );
  const setChoice = (value: ThemeChoice) => {
    setTheme(value);
    try {
      localStore.setTheme(value);
    } catch {
      /* Device preference remains applied in memory. */
    }
  };
  return (
    <ThemeContext.Provider
      value={{ colors, choice, isDark, setChoice, variables }}
    >
      <View
        className="flex-1"
        style={variables}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
};
export const useMindyTheme = () => useContext(ThemeContext);
