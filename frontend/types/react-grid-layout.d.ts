declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    w: number;
    h: number;
    x: number;
    y: number;
    i: string;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    moved?: boolean;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export type Layouts = {[key: string]: Layout[]};

  export interface CoreProps {
    className?: string;
    style?: React.CSSProperties;
    width: number;
    autoSize?: boolean;
    cols?: number;
    draggableCancel?: string;
    draggableHandle?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    layout?: Layout[];
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    maxRows?: number;
    isBounded?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    preventCollision?: boolean;
    useCSSTransforms?: boolean;
    transformScale?: number;
    resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
    allowOverlap?: boolean;
    onLayoutChange?: (layout: Layout[], layouts?: Layouts) => void;
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onDrop?: (layout: Layout[], item: Layout, e: Event) => void;
  }

  export interface ReactGridLayoutProps extends CoreProps {
    children: React.ReactNode;
  }

  export interface ResponsiveProps extends CoreProps {
    breakpoints?: {[key: string]: number};
    breakpoint?: string;
    cols?: {[key: string]: number};
    layouts?: Layouts;
    width: number;
    onBreakpointChange?: (breakpoint: string, cols: number) => void;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    onWidthChange?: (width: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
  }

  export class Responsive extends React.Component<ResponsiveProps> {}
  export class WidthProvider extends React.Component<any> {}
  
  export function withWidthProvider<P>(ComposedComponent: React.ComponentType<P>): React.ComponentType<Omit<P, 'width'>>;

  export default class ReactGridLayout extends React.Component<ReactGridLayoutProps> {}
} 