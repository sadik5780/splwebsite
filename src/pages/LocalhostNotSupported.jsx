import React from 'react';

const LocalhostNotSupported = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
            textAlign: 'center'
        }}>
            {/* <h1 style={{ color: '#ff4444', marginBottom: '1rem' }}>Localhost Not Supported</h1> */}
            <h1 style={{ marginBottom: '2rem' }}>
                This application cannot be accessed properly from a local environment.
            </h1>
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #333',
                maxWidth: '600px'
            }}>
                <p style={{ margin: 0, lineHeight: '1.6', color: '#cccccc' }}>
                    Supabase database and Cloudflare R2 image access are disabled in local environments.
                </p>
            </div>
            <p style={{ marginTop: '2rem', color: '#888' }}>
                Please deploy to a live environment to use this application.
            </p>
        </div>
    );
};

export default LocalhostNotSupported;
