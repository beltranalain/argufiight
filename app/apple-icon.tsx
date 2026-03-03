import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#d4f050',
          borderRadius: 40,
          fontSize: 100,
          fontWeight: 700,
          color: '#0c0c0c',
          letterSpacing: '-4px',
        }}
      >
        AF
      </div>
    ),
    { ...size }
  );
}
