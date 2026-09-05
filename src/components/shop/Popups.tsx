'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CustomBouquetPopup } from './CustomBouquetPopup';
import { VideoPopup } from './VideoPopup';

export function Popups() {
  const pathname = usePathname();
  const showVideoPopup = pathname !== '/kancelare';
  const [videoClosed, setVideoClosed] = useState(false);

  return (
    <>
      {showVideoPopup && <VideoPopup onClose={() => setVideoClosed(true)} />}
      {(videoClosed || !showVideoPopup) && <CustomBouquetPopup />}
    </>
  );
}
