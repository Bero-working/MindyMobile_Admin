/* eslint-env jest */
// Compile the real Tailwind config; do not mock className-to-style behavior.
const { setupAllComponents } = require('react-native-css-interop/test');
setupAllComponents();
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const { Platform } = require('react-native');
const { StyleSheet } = require('react-native-css-interop');
const {
  cssToReactNativeRuntime,
} = require('react-native-css-interop/css-to-rn');

let compiled;
beforeAll(async () => {
  process.env.NATIVEWIND_OS = Platform.OS;
  const result = await postcss([
    tailwindcss(require('./tailwind.config')),
  ]).process(fs.readFileSync(path.join(__dirname, 'src/global.css'), 'utf8'), {
    from: path.join(__dirname, 'src/global.css'),
  });
  compiled = cssToReactNativeRuntime(result.css, { inlineRem: 14 });
}, 30000);
beforeEach(() => StyleSheet.registerCompiled(compiled));
