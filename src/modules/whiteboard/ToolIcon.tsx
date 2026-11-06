import Svg, { Path } from 'react-native-svg';
import type { Tool } from './Canvas';

const paths: Record<Tool, string> = {
  pen: 'm15 4 5 5 M4 15 15.5 3.5a2.1 2.1 0 0 1 3 0l2 2a2.1 2.1 0 0 1 0 3L9 20l-6 1 1-6Z M4 15l5 5',
  hand: 'M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7h-2c-2 0-3.5-1-4.5-2.5L3 13a1.6 1.6 0 0 1 2.5-2L8 14v-2Z',
  select: 'M5 3v17l4.5-5 3.5 7 3-1.5-3.5-7H20L5 3Z',
  sticky:
    'M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10l6-6V5a2 2 0 0 0-2-2h-5Z M15 21v-6h6 M7 8h10 M7 12h6',
  rectangle:
    'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  ellipse: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  text: 'M4 7V4h16v3 M12 4v17 M8 21h8',
  eraser:
    'm9 19-5-5a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-7 7H9Z M8 7l9 9 M12 21h9',
};

export function ToolIcon({ tool, color }: { tool: Tool; color: string }) {
  return (
    <Svg
      width={29}
      height={29}
      viewBox="0 0 24 24"
      accessible={false}
    >
      <Path
        d={paths[tool]}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
