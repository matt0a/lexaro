'use client';

import React from 'react';
import styles from './StarBorder.module.css';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    children?: React.ReactNode;

    /** Defaults to your theme accent */
    color?: string;

    /** seconds (number) OR CSS duration string like "16s" / "600ms" */
    speed?: number | React.CSSProperties['animationDuration'];

    thickness?: number;

    /** If false, border animation runs only on hover */
    alwaysAnimate?: boolean;
};

const StarBorderCard = <T extends React.ElementType = 'div'>({
                                                                 as,
                                                                 className = '',
                                                                 color = 'var(--accent)',
                                                                 speed = '6s',
                                                                 thickness = 1,
                                                                 alwaysAnimate = true,
                                                                 children,
                                                                 ...rest
                                                             }: StarBorderProps<T>) => {
    const Component = as || 'div';

    const normalizedSpeed =
        typeof speed === 'number' ? `${speed}s` : speed;

    const [hovered, setHovered] = React.useState(false);
    const shouldAnimate = alwaysAnimate || hovered;

    return (
        <Component
            {...(rest as any)}
            className={`${styles.container} ${className}`}
            onMouseEnter={(e: any) => {
                setHovered(true);
                rest.onMouseEnter?.(e);
            }}
            onMouseLeave={(e: any) => {
                setHovered(false);
                rest.onMouseLeave?.(e);
            }}
            style={{
                padding: `${thickness}px`,
                ...(rest as any).style,
            }}
        >
            <div
                className={styles.borderGradientBottom}
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 12%)`,
                    animationDuration: normalizedSpeed,
                    animationPlayState: shouldAnimate ? 'running' : 'paused',
                }}
            />
            <div
                className={styles.borderGradientTop}
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 12%)`,
                    animationDuration: normalizedSpeed,
                    animationPlayState: shouldAnimate ? 'running' : 'paused',
                }}
            />
            <div className={styles.inner}>{children}</div>
        </Component>
    );
};

export default StarBorderCard;
