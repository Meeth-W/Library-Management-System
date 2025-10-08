// src/declarations.d.ts

declare module '@/components/*' {
  import { FC } from 'react';
  const Component: FC<any>;
  export default Component;
}
