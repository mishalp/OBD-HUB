"use client"

import { useEffect, useState } from 'react';

export default function ExpressLoader({ children }: { children: React.ReactNode }) {
    const [isServerReady, setIsServerReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 50;

        const checkServer = async () => {
            try {
                // Replace with your Express server's health check route
                const res = await fetch('http://localhost:5000');
                if (res.ok) {
                    setIsServerReady(true);
                } else {
                    throw new Error('Not ready');
                }
            } catch (e) {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkServer, 300); // Retry every 300ms
                } else {
                    setError('Failed to connect to the internal backend service.');
                }
            }
        };

        checkServer();
    }, []);

    if (error) return <div className="error-screen">{error}</div>;
    if (!isServerReady) return <div className="loading-screen">Starting application...</div>;

    return <>{children}</>;
}
