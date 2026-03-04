"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "next-themes";

interface TerminalProps {
    wsUrl: string;
}

type ConnectionStatus = "connecting" | "connected" | "failed";

const DARK_THEME = {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    cursor: "#ffffff",
    cursorAccent: "#1e1e1e",
    selectionBackground: "#264f78",
    black: "#1e1e1e",
    red: "#f44747",
    green: "#4ec9b0",
    yellow: "#dcdcaa",
    blue: "#569cd6",
    magenta: "#c678dd",
    cyan: "#4ec9b0",
    white: "#d4d4d4",
    brightBlack: "#808080",
    brightRed: "#f44747",
    brightGreen: "#4ec9b0",
    brightYellow: "#dcdcaa",
    brightBlue: "#569cd6",
    brightMagenta: "#c678dd",
    brightCyan: "#4ec9b0",
    brightWhite: "#ffffff",
};

const LIGHT_THEME = {
    background: "#ffffff",
    foreground: "#1e1e1e",
    cursor: "#000000",
    cursorAccent: "#ffffff",
    selectionBackground: "#b5d5ff",
    black: "#000000",
    red: "#cd3131",
    green: "#00bc00",
    yellow: "#949800",
    blue: "#0451a5",
    magenta: "#bc05bc",
    cyan: "#0598bc",
    white: "#555555",
    brightBlack: "#666666",
    brightRed: "#cd3131",
    brightGreen: "#14ce14",
    brightYellow: "#b5ba00",
    brightBlue: "#0451a5",
    brightMagenta: "#bc05bc",
    brightCyan: "#0598bc",
    brightWhite: "#a5a5a5",
};

function TerminalCore({
    wsUrl,
    forceRemount,
    isDark,
}: TerminalProps & { forceRemount: () => void; isDark: boolean }) {
    const xtermTheme = isDark ? DARK_THEME : LIGHT_THEME;
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
            theme: xtermTheme,
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
    }, [wsUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update xterm theme when light/dark mode changes without remounting
    useEffect(() => {
        if (xtermRef.current) {
            xtermRef.current.options.theme = xtermTheme;
        }
    }, [isDark]); // eslint-disable-line react-hooks/exhaustive-deps

    const bg = xtermTheme.background;
    const fg = xtermTheme.foreground;
    const spinnerBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const btnBg = isDark ? "#333333" : "#e5e5e5";
    const btnBgHover = isDark ? "#444444" : "#d4d4d4";
    const btnColor = isDark ? "#ffffff" : "#1e1e1e";
    const btnBorder = isDark ? "#555555" : "#bbbbbb";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px" }}>
            <style>
                {`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .terminal-spinner {
                        border: 3px solid ${spinnerBorder};
                        border-top: 3px solid ${fg};
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
                        backgroundColor: bg,
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: fg,
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
                                    backgroundColor: btnBg,
                                    color: btnColor,
                                    border: `1px solid ${btnBorder}`,
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "background-color 0.2s",
                                }}
                                onMouseOver={(e) =>
                                    (e.currentTarget.style.backgroundColor = btnBgHover)
                                }
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = btnBg)}
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
                    backgroundColor: bg,
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
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";

    return (
        <TerminalCore
            {...props}
            key={remountKey}
            forceRemount={() => setRemountKey((prev) => prev + 1)}
            isDark={isDark}
        />
    );
}
