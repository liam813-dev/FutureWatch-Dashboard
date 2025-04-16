declare module 'react-feather' {
  import { FC, SVGAttributes } from 'react';
  
  export interface IconProps extends SVGAttributes<SVGElement> {
    color?: string;
    size?: string | number;
  }
  
  export const ChevronLeft: FC<IconProps>;
  export const ChevronRight: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Bell: FC<IconProps>;
  export const Activity: FC<IconProps>;
  export const TrendingUp: FC<IconProps>;
  export const BarChart2: FC<IconProps>;
  export const PieChart: FC<IconProps>;
  
  // Add other icons as needed
} 