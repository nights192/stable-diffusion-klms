import { useRef, useState, useEffect } from 'react';

// Specifies the rate by which reconnection is spaced out on successive failures.
function reconnectGrowth(x: number) {
    return x * 1.5;
}

export default function useSocket(address: string, onOpen: (ws: WebSocket, event: Event) => void, onMessage: (ws: WebSocket, event: MessageEvent) => void) {
    const [connected, setConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        //  We perform this operation as a destructive function so as to allow the socket to re-assign itself
        // in the case of failure.
        function initSocket(address: string, onMessage: (ws: WebSocket, event: MessageEvent) => void, initReconnect: number = 1000, ) {
            ws.current = new WebSocket(address);

            function onOpenInternal(this: WebSocket, event: Event) {
                setConnected(true);
                onOpen(this, event);

                this.onclose = () => {
                    setConnected(false);

                    setTimeout(() => initSocket(address, onMessage, 1000), 1000);
                }
            }

            function onMessageInternal(this: WebSocket, event: MessageEvent) {
                onMessage(this, event);
            }

            ws.current.onopen = onOpenInternal;

            ws.current.onmessage = onMessageInternal;

            ws.current.onclose = () => {
                setConnected(false);

                setTimeout(() => initSocket(address, onMessage, reconnectGrowth(initReconnect)), initReconnect);
            };
        }

        if (ws.current === null) initSocket(address, onMessage);
    });

    return [ws, connected];
}