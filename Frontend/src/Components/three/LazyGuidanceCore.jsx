import React, { Suspense } from 'react';

const GuidanceCore = React.lazy(() => import('./GuidanceCore.jsx'));

export default function LazyGuidanceCore({ size = 400, className = '', style = {} }) {
  return (
    <Suspense
      fallback={
        <div
          className={className}
          style={{ width: size, height: size, ...style }}
          aria-hidden="true"
        />
      }
    >
      <GuidanceCore size={size} className={className} style={style} />
    </Suspense>
  );
}
