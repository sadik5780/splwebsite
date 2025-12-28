import React from 'react';

const PaymentRequired = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            backgroundColor: '#202124',
            color: '#bdc1c6',
            fontFamily: 'Segoe UI, Tahoma, sans-serif',
            fontSize: '75%',
            display: 'flex',
            alignItems: 'center',
            paddingTop: '10vh',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: '600px', width: '72px', padding: '0 24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <img src="/images/download.png" alt="" />
                </div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '500',
                    color: '#e8eaed',
                    margin: '0 0 16px 0'
                }}>
                    This site can’t be reached
                </h1>

                <div style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#9aa0a6' }}>
                    <p style={{ margin: '0 0 12px 0' }}>This application is currently unavailable.</p>
                    <p style={{ margin: '0 0 12px 0' }}>Check if there is a typo in the application address.</p>
                    <p style={{ margin: '0 0 12px 0' }}>If everything looks correct, the service may not be active yet.</p>
                </div>

                <div style={{
                    fontSize: '13px',
                    color: '#5f6368',
                    marginTop: '32px',
                    fontFamily: 'Consolas, monospace'
                }}>
                    DNS_PROBE_FINISHED_NXDOMAIN
                </div>

                <div style={{ marginTop: '24px' }}>
                    <button disabled style={{
                        backgroundColor: '#8ab4f8',
                        color: '#202124',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: '0.5',
                        cursor: 'not-allowed'
                    }}>
                        Reload
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentRequired;
