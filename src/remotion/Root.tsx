import { Composition } from 'remotion';
import { PromoVideo } from './PromoVideo';

export const RemotionRoot = () => {
    return (
        <Composition
            id="PromoVideo"
            component={PromoVideo}
            durationInFrames={450} // 15 seconds at 30fps
            fps={30}
            width={1080}
            height={1080}
        />
    );
};
