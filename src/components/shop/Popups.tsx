'use client';

import { useState } from 'react';
import { CustomBouquetPopup } from './CustomBouquetPopup';
import { VideoPopup } from './VideoPopup';

export function Popups() {
  const [videoClosed, setVideoClosed] = useState(false);

  return (
    <>
      <VideoPopup onClose={() => setVideoClosed(true)} />
      {videoClosed && <CustomBouquetPopup />}
    </>
  );
}
