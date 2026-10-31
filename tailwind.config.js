const tokens = require('./src/components/ui/tokens.json');
const pixels = (values) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, `${value}px`])
  );

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mdy: Object.fromEntries(
          Object.keys(tokens.light).map((key) => [key, `var(--mdy-${key})`])
        ),
      },
      spacing: pixels(tokens.spacing),
      borderRadius: pixels(tokens.radius),
      fontFamily: Object.fromEntries(
        Object.entries(tokens.fontFamily).map(([key, value]) => [
          `bvp-${key}`,
          [value],
        ])
      ),
      fontSize: pixels(tokens.fontSize),
      lineHeight: pixels(tokens.lineHeight),
      letterSpacing: pixels(tokens.letterSpacing),
    },
  },
  plugins: [],
};
