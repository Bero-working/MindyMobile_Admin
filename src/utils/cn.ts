import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import tokens from '@/components/ui/tokens.json';

const merge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: Object.keys(tokens.spacing),
      borderRadius: Object.keys(tokens.radius),
    },
    classGroups: {
      leading: [{ leading: Object.keys(tokens.lineHeight) }],
      'font-size': [{ text: Object.keys(tokens.fontSize) }],
      'font-family': [
        { font: Object.keys(tokens.fontFamily).map((key) => `bvp-${key}`) },
      ],
    },
  },
});
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
