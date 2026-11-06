import * as Y from 'yjs';
import type { Shape } from './schema';
type ShapeValue = string | number | number[] | Y.Text;

export function encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function decode(binary: string): Uint8Array {
  return Uint8Array.from(atob(binary), (c) => c.charCodeAt(0));
}
export const shapesOf = (doc: Y.Doc): Shape[] =>
  [...doc.getMap<Y.Map<ShapeValue>>('shapes').values()].map(
    (shape) => shape.toJSON() as Shape
  );
export function putShape(doc: Y.Doc, shape: Shape) {
  const map = new Y.Map<ShapeValue>();
  for (const [key, value] of Object.entries(shape)) {
    if (key !== 'text' && value !== undefined) map.set(key, value);
  }
  if (['sticky', 'text', 'code'].includes(shape.type)) {
    map.set('text', new Y.Text(shape.text ?? ''));
  }
  doc.getMap<Y.Map<ShapeValue>>('shapes').set(shape.id, map);
}
export function moveShape(doc: Y.Doc, id: string, x: number, y: number) {
  const shape = doc.getMap<Y.Map<ShapeValue>>('shapes').get(id);
  if (!shape) return;
  shape.set('x', x);
  shape.set('y', y);
}
