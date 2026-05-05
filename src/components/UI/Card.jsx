import React from 'react';
import classNames from 'classnames';

const Card = ({ children, className, title, action, ...props }) => {
    return (
        <div className={classNames('glass-card', className)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }} {...props}>
            {(title || action) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
