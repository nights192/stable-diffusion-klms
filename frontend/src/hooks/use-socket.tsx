import { useRef, useState, useEffect } from 'react';

// TODO: Implement increasing reconnect delays.
export default function useSocket(address: string, onOpen: (ws: WebSocket, event: Event) => void, onMessage: (ws: WebSocket, event: MessageEvent) => void) {
    const [connected, setConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        //  We perform this operation as a destructive function so as to allow the socket to re-assign itself
        // in the case of failure.
        function initSocket(address: string, onMessage: (ws: WebSocket, event: MessageEvent) => void,  ) {
            ws.current = new WebSocket(address);

            function onOpenInternal(this: WebSocket, event: Event) {
                setConnected(true);

                onOpen(this, event);
            }

            function onMessageInternal(this: WebSocket, event: MessageEvent) {
                onMessage(this, event);
            }

            ws.current.onopen = onOpenInternal;
            ws.current.onmessage = onMessageInternal;

            ws.current.onerror = () => {
                setConnected(false);

                setTimeout(() => initSocket(address, onMessage), 1000);
            }

            ws.current.onclose = () => {
                setConnected(false);

                setTimeout(() => initSocket(address, onMessage), 5000);
            }
        }

        if (ws.current === null) initSocket(address, onMessage);
    });

    return [ws, connected];
}