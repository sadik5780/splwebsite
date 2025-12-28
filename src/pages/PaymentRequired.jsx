import React from 'react';

const PaymentRequired = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000000',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 999999
        }}>
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                maxWidth: '500px'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    color: '#ff3333'
                }}>
                    Access Restricted
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    lineHeight: '1.5',
                    marginBottom: '2rem',
                    color: '#cccccc'
                }}>
                    This application requires activation or payment to continue.
                </p>
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    border: '1px solid #333'
                }}>
                    Contact administrator for access.
                </div>
            </div>
        </div>
    );
};

export default PaymentRequired;
