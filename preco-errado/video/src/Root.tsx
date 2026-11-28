import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {Capa} from './Capa';
import yt from './data/youtube.json';
import tt from './data/tiktok.json';

export const Root: React.FC = () => (
  <>
    <Composition id="youtube" component={Video} width={1080} height={1920} fps={30}
      durationInFrames={yt.frames} defaultProps={{data: yt as any}} />
    <Composition id="tiktok" component={Video} width={1080} height={1920} fps={30}
      durationInFrames={tt.frames} defaultProps={{data: tt as any}} />
    <Composition id="capa-a" component={Capa} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{v: 'A' as const}} />
    <Composition id="capa-b" component={Capa} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{v: 'B' as const}} />
  </>
);
