import { useEffect, useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Pattern,
  Polyline,
  Rect,
  Text as SvgText,
  TSpan,
  Image as SvgImage,
} from 'react-native-svg';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
import type { Shape } from './schema';
import { useWhiteboardService } from './WhiteboardProvider';

function BoardImage({ shape, boardId }: { shape: Shape; boardId: string }) {
  const api = useWhiteboardService();
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const value = await api.asset(boardId, shape.assetId!);
        if (!active) return;
        setUrl(value.url);
        timer = setTimeout(
          load,
          Math.max(1000, Date.parse(value.expiresAt) - Date.now() - 5000)
        );
      } catch {
        if (active) setUrl(undefined);
      }
    };
    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, boardId, shape.assetId]);
  return url ? (
    <SvgImage
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      href={{ uri: url }}
      preserveAspectRatio="xMidYMid meet"
    />
  ) : (
    <Rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill="#E9EFED"
      stroke="#ADBEB5"
    />
  );
}

export type Tool =
  | 'pen'
  | 'hand'
  | 'select'
  | 'eraser'
  | 'sticky'
  | 'rectangle'
  | 'ellipse'
  | 'text';
export type Viewport = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };
const bound = (n: number) => Math.max(-90000, Math.min(90000, n));
const lines = (text: string, columns: number) =>
  text.split('\n').flatMap((line) => {
    const chars = Array.from(line);
    if (!chars.length) return [''];
    const result: string[] = [];
    while (chars.length) result.push(chars.splice(0, columns).join(''));
    return result;
  });
export function RenderShape({
  shape,
  boardId,
}: {
  shape: Shape;
  boardId?: string | undefined;
}) {
  const { x, y, width, height, color } = shape;
  if (shape.type === 'image' && boardId)
    return (
      <BoardImage
        shape={shape}
        boardId={boardId}
      />
    );
  if (shape.type === 'code') {
    const font = shape.fontSize ?? 14;
    const rows = (shape.text ?? '')
      .split('\n')
      .slice(0, Math.max(1, Math.floor((height - 48) / (font * 1.55))));
    return (
      <G>
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={10}
          fill="#18232D"
        />
        <SvgText
          x={x + 14}
          y={y + 21}
          fontSize={12}
          fill="#A6B8CA"
        >
          {shape.language === 'java21' ? 'Java' : 'JavaScript'}
        </SvgText>
        {rows.map((line, i) => (
          <SvgText
            key={i}
            x={x + 14}
            y={y + 48 + i * font * 1.55}
            fontSize={font}
            fontFamily="monospace"
            fill="#D9E8F4"
          >
            {line.slice(
              0,
              Math.max(1, Math.floor((width - 28) / (font * 0.65)))
            )}
          </SvgText>
        ))}
      </G>
    );
  }
  if (shape.type === 'stroke')
    return (
      <Polyline
        transform={`translate(${x} ${y})`}
        points={shape.points?.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={shape.strokeWidth ?? 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  if (shape.type === 'rectangle')
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={color}
        strokeWidth={shape.strokeWidth ?? 3}
        fill={shape.fill ?? 'transparent'}
        rx={3}
      />
    );
  if (shape.type === 'ellipse')
    return (
      <Ellipse
        cx={x + width / 2}
        cy={y + height / 2}
        rx={width / 2}
        ry={height / 2}
        stroke={color}
        strokeWidth={shape.strokeWidth ?? 3}
        fill={shape.fill ?? 'transparent'}
      />
    );
  const sticky = shape.type === 'sticky';
  const fontSize = sticky ? 16 : (shape.fontSize ?? 20);
  const content = shape.type === 'image' ? '[Image]' : (shape.text ?? '');
  const textLines = lines(
    content,
    Math.max(1, Math.floor((width - 24) / (fontSize * 0.6)))
  ).slice(0, Math.max(1, Math.floor((height - 24) / (fontSize * 1.4))));
  return (
    <G>
      {(sticky || shape.type === 'image') && (
        <Rect
          x={x}
          y={y + 3}
          width={width}
          height={height}
          rx={sticky ? 3 : 8}
          fill="#142E28"
          opacity={0.08}
        />
      )}
      {(sticky || shape.type === 'image') && (
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={sticky ? 3 : 8}
          fill={sticky ? color : '#E9EFED'}
        />
      )}
      <SvgText
        x={x + 12}
        y={y + fontSize + 12}
        fontSize={fontSize}
        fill={sticky ? '#243C35' : color}
      >
        {textLines.map((line, i) => (
          <TSpan
            key={i}
            x={x + 12}
            dy={i ? fontSize * 1.4 : 0}
          >
            {line || ' '}
          </TSpan>
        ))}
      </SvgText>
    </G>
  );
}

export function BoardCanvas({
  boardId,
  shapes,
  editable,
  tool,
  color,
  viewport,
  onViewport,
  onAdd,
  onMove,
  onDelete,
  onText,
  onLayout,
}: {
  boardId: string;
  shapes: Shape[];
  editable: boolean;
  tool: Tool;
  color: string;
  viewport: Viewport;
  onViewport: (v: Viewport) => void;
  onAdd: (shape: Shape) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onText: (point: Point, type: 'sticky' | 'text') => void;
  onLayout?: (width: number, height: number) => void;
}) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [preview, setPreview] = useState<Shape>();
  const [selected, setSelected] = useState<string>();
  const drag = useRef<
    | {
        start: Point;
        screen: Point;
        view: Viewport;
        shape?: Shape;
      }
    | undefined
  >(undefined);
  const world = (e: GestureResponderEvent) => ({
    x: bound(viewport.x + e.nativeEvent.locationX / viewport.zoom),
    y: bound(viewport.y + e.nativeEvent.locationY / viewport.zoom),
  });
  const hit = (p: Point) =>
    [...shapes]
      .reverse()
      .find(
        (s) =>
          p.x >= s.x - 8 &&
          p.x <= s.x + s.width + 8 &&
          p.y >= s.y - 8 &&
          p.y <= s.y + s.height + 8
      );
  const begin = (e: GestureResponderEvent) => {
    const p = world(e);
    drag.current = {
      start: p,
      screen: { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY },
      view: viewport,
    };
    if (!editable || tool === 'hand') return;
    if (tool === 'sticky' || tool === 'text') {
      onText(p, tool);
      return;
    }
    const target = hit(p);
    if (tool === 'eraser') {
      if (target) onDelete(target.id);
      return;
    }
    if (tool === 'select') {
      setSelected(target?.id);
      if (target) drag.current.shape = target;
      return;
    }
    setPreview({
      id: newIntentKey(),
      type: tool === 'pen' ? 'stroke' : tool,
      x: p.x,
      y: p.y,
      width: 1,
      height: 1,
      color,
      strokeWidth: 3,
      ...(tool === 'pen'
        ? { points: [0, 0, 0.1, 0.1] }
        : { fill: 'transparent' }),
    });
  };
  const move = (e: GestureResponderEvent) => {
    const current = drag.current;
    if (!current) return;
    if (!editable || tool === 'hand') {
      onViewport({
        ...viewport,
        x: bound(
          current.view.x -
            (e.nativeEvent.locationX - current.screen.x) / viewport.zoom
        ),
        y: bound(
          current.view.y -
            (e.nativeEvent.locationY - current.screen.y) / viewport.zoom
        ),
      });
      return;
    }
    const p = world(e);
    if (tool === 'select' && current.shape) {
      const s = current.shape,
        x = bound(s.x + p.x - current.start.x),
        y = bound(s.y + p.y - current.start.y);
      setPreview({ ...s, x, y });
      return;
    }
    setPreview((previous) => {
      if (!previous) return previous;
      if (previous.type === 'stroke') {
        const points = [
          ...(previous.points ?? []).map(
            (n, i) => n + (i % 2 ? previous.y : previous.x)
          ),
          p.x,
          p.y,
        ].slice(0, 20000);
        const xs = points.filter((_, i) => !(i % 2)),
          ys = points.filter((_, i) => i % 2);
        const x = Math.min(...xs),
          y = Math.min(...ys);
        return {
          ...previous,
          points: points.map((n, i) => n - (i % 2 ? y : x)),
          x,
          y,
          width: Math.max(1, Math.min(10000, Math.max(...xs) - x)),
          height: Math.max(1, Math.min(10000, Math.max(...ys) - y)),
        };
      }
      return {
        ...previous,
        x: Math.min(current.start.x, p.x),
        y: Math.min(current.start.y, p.y),
        width: Math.max(1, Math.min(10000, Math.abs(p.x - current.start.x))),
        height: Math.max(1, Math.min(10000, Math.abs(p.y - current.start.y))),
      };
    });
  };
  const finish = () => {
    if (preview && editable) {
      if (tool === 'select') onMove(preview.id, preview.x, preview.y);
      else onAdd(preview);
    }
    drag.current = undefined;
    setPreview(undefined);
  };
  const selection = shapes.find((s) => s.id === selected);
  return (
    <View
      testID="whiteboard-canvas"
      className="flex-1 overflow-hidden rounded-radius-22 bg-white"
      accessibilityLabel="Whiteboard canvas"
      onLayout={({ nativeEvent: { layout } }) => {
        setSize(layout);
        onLayout?.(layout.width, layout.height);
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={begin}
      onResponderMove={move}
      onResponderRelease={finish}
      onResponderTerminationRequest={() => false}
      onResponderTerminate={() => {
        drag.current = undefined;
        setPreview(undefined);
      }}
    >
      <Svg
        width={size.width}
        height={size.height}
        viewBox={`${viewport.x} ${viewport.y} ${size.width / viewport.zoom} ${size.height / viewport.zoom}`}
        pointerEvents="none"
      >
        <Defs>
          <Pattern
            id="board-dots"
            width={24}
            height={24}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={1}
              cy={1}
              r={0.9}
              fill="#D3DED8"
            />
          </Pattern>
        </Defs>
        <Rect
          x={viewport.x}
          y={viewport.y}
          width={size.width / viewport.zoom}
          height={size.height / viewport.zoom}
          fill="url(#board-dots)"
        />
        {shapes
          .filter((s) => s.id !== preview?.id)
          .map((shape) => (
            <RenderShape
              boardId={boardId}
              key={shape.id}
              shape={shape}
            />
          ))}
        {preview && (
          <RenderShape
            boardId={boardId}
            shape={preview}
          />
        )}
        {tool === 'select' && selection && !preview && (
          <Rect
            x={selection.x - 5}
            y={selection.y - 5}
            width={selection.width + 10}
            height={selection.height + 10}
            fill="none"
            stroke="#0B8875"
            strokeWidth={2 / viewport.zoom}
            strokeDasharray="5,4"
          />
        )}
      </Svg>
    </View>
  );
}
