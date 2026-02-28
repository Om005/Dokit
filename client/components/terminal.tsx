"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
    wsUrl: string;
}

type ConnectionStatus = "connecting" | "connected" | "failed";

function TerminalCore({ wsUrl, forceRemount }: TerminalProps & { forceRemount: () => void }) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    const xtermRef = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    const manualRetryRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        let isDestroyed = false;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
                cursor: "#ffffff",
            },
            convertEol: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(terminalRef.current);

        setTimeout(() => {
            fitAddon.fit();
            term.focus();
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        let retryCount = 0;
        const MAX_RETRIES = 20;
        let retryTimeout: ReturnType<typeof setTimeout>;

        const onDataDisposable = term.onData((data) => {
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send("0" + data);
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                sendResize(ws, term.cols, term.rows);
            }
        });
        resizeObserver.observe(terminalRef.current!);

        const onResizeDisposable = term.onResize(({ cols, rows }) => {
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                sendResize(ws, cols, rows);
            }
        });

        const connectWS = () => {
            if (isDestroyed) return;

            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.onopen = null;
                wsRef.current.onmessage = null;

                if (
                    wsRef.current.readyState === WebSocket.CONNECTING ||
                    wsRef.current.readyState === WebSocket.OPEN
                ) {
                    wsRef.current.close();
                }
                wsRef.current = null;
            }

            const ws = new WebSocket(wsUrl, ["tty"]);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                if (isDestroyed) {
                    ws.close();
                    return;
                }

                retryCount = 0;
                setStatus("connected");

                ws.send(
                    JSON.stringify({
                        AuthToken: "",
                        columns: term.cols,
                        rows: term.rows,
                    })
                );
            };

            ws.onmessage = (event) => {
                if (isDestroyed) return;

                if (typeof event.data === "string") {
                    const type = event.data.charAt(0);
                    if (type === "0") term.write(event.data.slice(1));
                    return;
                }

                if (event.data instanceof ArrayBuffer) {
                    const bytes = new Uint8Array(event.data);
                    const type = String.fromCharCode(bytes[0]);
                    if (type === "0") term.write(new TextDecoder().decode(bytes.slice(1)));
                }
            };

            const handleFailure = () => {
                if (isDestroyed) return;

                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    setStatus("connecting");

                    let backoffTime = 500;
                    if (retryCount > 5) {
                        backoffTime = Math.min(1000 * Math.pow(1.5, retryCount - 6), 5000);
                    }

                    clearTimeout(retryTimeout);
                    retryTimeout = setTimeout(connectWS, backoffTime);
                } else {
                    setStatus("failed");
                }
            };

            ws.onclose = handleFailure;
            ws.onerror = handleFailure;
        };

        manualRetryRef.current = () => {
            setStatus("connecting");
            retryCount = 0;
            connectWS();
        };

        const wsTimeout = setTimeout(connectWS, 500);

        return () => {
            isDestroyed = true;
            clearTimeout(wsTimeout);
            clearTimeout(retryTimeout);

            onDataDisposable.dispose();
            onResizeDisposable.dispose();
            resizeObserver.disconnect();

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            term.dispose();
        };
    }, [wsUrl]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px" }}>
            <style>
                {`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .terminal-spinner {
                        border: 3px solid rgba(255, 255, 255, 0.1);
                        border-top: 3px solid #d4d4d4;
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        animation: spin 1s linear infinite;
                        margin-bottom: 16px;
                    }
                `}
            </style>

            {status !== "connected" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "#1e1e1e",
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#d4d4d4",
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                        fontSize: "14px",
                    }}
                >
                    {status === "connecting" ? (
                        <>
                            <div className="terminal-spinner" />
                            <p>Hold on tight, connecting to container...</p>
                        </>
                    ) : (
                        <>
                            <div
                                style={{ color: "#f44336", marginBottom: "16px", fontSize: "24px" }}
                            >
                                ⚠️
                            </div>
                            <p style={{ marginBottom: "20px" }}>
                                Connection failed after multiple attempts.
                            </p>
                            <button
                                onClick={forceRemount}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#333333",
                                    color: "#ffffff",
                                    border: "1px solid #555555",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "background-color 0.2s",
                                }}
                                onMouseOver={(e) =>
                                    (e.currentTarget.style.backgroundColor = "#444444")
                                }
                                onMouseOut={(e) =>
                                    (e.currentTarget.style.backgroundColor = "#333333")
                                }
                            >
                                Retry Connection
                            </button>
                        </>
                    )}
                </div>
            )}

            <div
                ref={terminalRef}
                onClick={() => xtermRef.current?.focus()}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#1e1e1e",
                    padding: "4px",
                }}
            />
        </div>
    );
}

function sendResize(ws: WebSocket, cols: number, rows: number) {
    ws.send("1" + JSON.stringify({ columns: cols, rows: rows }));
}

export default function TerminalComponent(props: TerminalProps) {
    const [remountKey, setRemountKey] = useState(0);

    return (
        <TerminalCore
            {...props}
            key={remountKey}
            forceRemount={() => setRemountKey((prev) => prev + 1)}
        />
    );
}
