'use client';

import React from 'react';
import styles from './StarBorder.module.css';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
    /** Defaults to your theme accent */
    color?: string;
    speed?: React.CSSProperties['animationDuration'];
    thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'div'>({
                                                             as,
                                                             className = '',
                                                             color = 'var(--accent)',
                                                             speed = '6s',
                                                             thickness = 1,
                                                             children,
                                                             ...rest
                                                         }: StarBorderProps<T>) => {
    const Component = as || 'div';

    return (
        <Component
            {...(rest as any)}
            className={`${styles.container} ${className}`}
            style={{
                padding: `${thickness}px`,
                ...(rest as any).style,
            }}
        >
            <div
                className={styles.borderGradientBottom}
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 12%)`,
                    animationDuration: speed,
                }}
            />
            <div
                className={styles.borderGradientTop}
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 12%)`,
                    animationDuration: speed,
                }}
            />
            <div className={styles.inner}>{children}</div>
        </Component>
    );
};

export default StarBorder;
