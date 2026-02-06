import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { Bell, Zap, Code, ShieldCheck } from 'lucide-react';

const Title: React.FC<{ text: string; color?: string }> = ({ text, color = 'white' }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: 'clamp' });

    return (
        <h1 style={{
            color,
            fontSize: 80,
            fontWeight: 'bold',
            opacity,
            transform: `translateY(${y}px)`,
            textAlign: 'center',
            fontFamily: 'system-ui'
        }}>
            {text}
        </h1>
    );
};

const Subtitle: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <p style={{
            color: '#9ca3af',
            fontSize: 40,
            opacity,
            textAlign: 'center',
            marginTop: 20,
            fontFamily: 'system-ui'
        }}>
            {text}
        </p>
    );
};

const Notification: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const springConfig = { damping: 12 };
    const translateY = spring({
        frame,
        fps,
        from: -200,
        to: 0,
        config: springConfig
    });

    return (
        <div style={{
            transform: `translateY(${translateY}px)`,
            width: 800,
            backgroundColor: '#1a1a1a',
            borderRadius: 24,
            padding: 30,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
            <div style={{
                backgroundColor: '#ffa116',
                padding: 15,
                borderRadius: 12
            }}>
                <Bell size={40} color="black" />
            </div>
            <div>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Daily Challenge: Array</div>
                <div style={{ color: '#9ca3af', fontSize: 20 }}>Today's Challenge: Two Sum. You've got this!</div>
            </div>
        </div>
    );
};

export const PromoVideo: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Background Glows */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '50%',
                height: '50%',
                backgroundColor: 'rgba(124, 45, 18, 0.2)',
                filter: 'blur(120px)',
                borderRadius: '50%'
            }} />

            <Sequence durationInFrames={fps * 3}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        backgroundColor: '#ffa116',
                        padding: 20,
                        borderRadius: 20,
                        marginBottom: 30,
                        transform: `scale(${spring({ frame, fps, from: 0, to: 1 })})`
                    }}>
                        <Bell size={80} color="black" />
                    </div>
                    <Title text="LeetNtfy" color="#ffa116" />
                    <Subtitle text="Consistency on Autopilot" />
                </div>
            </Sequence>

            <Sequence from={fps * 3} durationInFrames={fps * 7}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60 }}>
                    <Title text="Get Personalized Challenges" />
                    <Notification />
                    <Subtitle text="Straight to your phone via ntfy.sh" />
                </div>
            </Sequence>

            <Sequence from={fps * 10}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
                    <div style={{ display: 'flex', gap: 30, marginBottom: 20 }}>
                        <div style={{ textAlign: 'center' }}>
                            <Zap size={60} color="#ffa116" />
                            <div style={{ color: 'white', marginTop: 10, fontSize: 18 }}>ZERO FRICTION</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <ShieldCheck size={60} color="#ffa116" />
                            <div style={{ color: 'white', marginTop: 10, fontSize: 18 }}>NO LOGIN</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Code size={60} color="#ffa116" />
                            <div style={{ color: 'white', marginTop: 10, fontSize: 18 }}>REAL DATA</div>
                        </div>
                    </div>
                    <Title text="Launch Your Streak Today" />
                    <div style={{
                        backgroundColor: '#ffa116',
                        padding: '15px 40px',
                        borderRadius: 15,
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 32,
                        marginTop: 20,
                        transform: `scale(${spring({ frame: frame - fps * 10, fps, from: 0.8, to: 1, config: { damping: 10 } })})`
                    }}>
                        leetntfy.app
                    </div>
                </div>
            </Sequence>
        </AbsoluteFill>
    );
};
