export type ToolMode = 'pan' | 'eyedropper';

export type ChannelId = 'gray' | 'red' | 'green' | 'blue' | 'alpha';

export interface ChannelDescriptor {
  id: ChannelId;
  label: string;
}

export interface ChannelState {
  gray: boolean;
  red: boolean;
  green: boolean;
  blue: boolean;
  alpha: boolean;
}

export interface PixelSample {
  x: number;
  y: number;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  lab: {
    l: number;
    a: number;
    b: number;
  };
}
