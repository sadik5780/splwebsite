// Simple URL utilities for hash-based routing

export const useLocation = () => {
    return {
        hash: window.location.hash,
        pathname: window.location.hash.split('?')[0].slice(1) || 'slider',
        search: window.location.hash.split('?')[1] ? '?' + window.location.hash.split('?')[1] : '',
    };
};
