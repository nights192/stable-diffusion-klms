import { useRef, useState, useEffect } from 'react';

type InitSocketDelegate = (address: string, onMessage: (ws: WebSocket, event: MessageEvent) => void, initReconnect: number) => void;
type OnMessageDelegate = (ws: WebSocket, event: MessageEvent) => void

// Specifies the rate by which reconnection is spaced out on successive failures.
function reconnectGrowth(x: number) {
    return x * 1.5;
}

// Schedules an attempt to reconnect with a websocket.
// Leveraging ref object to ensure continuity of reference to our
// active socket object.
function reconnect(
    ws: React.MutableRefObject<WebSocket | null>, address: string, onMessage: OnMessageDelegate,
    initSocket: InitSocketDelegate, oldWait: number, newWait: number
) {
    setTimeout(() => {
        if (ws.current !== null) {
            const socket = ws.current;
            console.log(socket.readyState);

            if (socket.readyState !== WebSocket.CONNECTING &&
                    socket.readyState !== WebSocket.OPEN)

                initSocket(address, onMessage, newWait);
        }
    }, oldWait);
}

export default function useSocket(address: string, onOpen: (ws: WebSocket, event: Event) => void, onMessage: (ws: WebSocket, event: MessageEvent) => void) {
    const [connected, setConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        //  We perform this operation as a destructive function so as to allow the socket to re-assign itself
        // in the case of failure.
        function initSocket(address: string, onMessage: (ws: WebSocket, event: MessageEvent) => void, initReconnect: number = 1000,) {
            ws.current = new WebSocket(address);

            function onOpenInternal(this: WebSocket, event: Event) {
                setConnected(true);
                onOpen(this, event);

                console.log("Reconnected!");

                this.onclose = () => {
                    setConnected(false);

                    if (ws.current !== null)
                        reconnect(ws, address, onMessage, initSocket, 1000, reconnectGrowth(1000));
                }
            }

            function onMessageInternal(this: WebSocket, event: MessageEvent) {
                onMessage(this, event);
            }

            ws.current.onopen = onOpenInternal;
            ws.current.onmessage = onMessageInternal;

            ws.current.onclose = () => {
                console.log("Disconnected!");

                setConnected(false);

                if (ws.current !== null)
                    reconnect(ws, address, onMessage, initSocket, initReconnect, reconnectGrowth(initReconnect));
            };
        }

        const focusEvent = () => {
            if (ws.current !== null)
                reconnect(ws, address, onMessage, initSocket, 1000, reconnectGrowth(1000));
        };

        if (ws.current === null) initSocket(address, onMessage);
        window.addEventListener("focus", focusEvent);

        return () => window.removeEventListener("focus", focusEvent);
    });

    return [ws, connected];
}