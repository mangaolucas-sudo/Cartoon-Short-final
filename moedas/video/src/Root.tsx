import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {Personagens} from './Personagens';
import {GanchoPreco} from './GanchoPreco';
import yt from './data/youtube.json';
import tt from './data/tiktok.json';

export const Root: React.FC = () => (
  <>
    <Composition id="youtube" component={Video} width={1080} height={1920} fps={30}
      durationInFrames={yt.frames} defaultProps={{data: yt as any}} />
    <Composition id="tiktok" component={Video} width={1080} height={1920} fps={30}
      durationInFrames={tt.frames} defaultProps={{data: tt as any}} />
    <Composition id="gancho-preco" component={GanchoPreco} width={1080} height={1920} fps={30} durationInFrames={15} />
    <Composition id="personagens" component={Personagens} width={2400} height={1800} fps={30} durationInFrames={1} />
  </>
);
