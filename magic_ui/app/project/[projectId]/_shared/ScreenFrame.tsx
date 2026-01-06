"use client";

import { SettingContext } from '@/context/SettingContext';
import { THEMES, themeToCssVars, ThemeKey } from '@/data/Themes';
import { ProjectType, ScreenConfig } from '@/type/types';
import { Monitor, Smartphone } from 'lucide-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from "react-rnd";
import ScreenHandler from './ScreenHandler';

type Props = {
    x: number;
    y: number;
    setPanningEnabled: (enabled: boolean) => void;
    width: number;
    height: number;
    htmlCode: string | undefined;
    projectDetail: ProjectType | undefined;
    screenName?: string;
    screen: ScreenConfig | undefined;
    iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
}

const ScreenFrame = ({
    x, y, setPanningEnabled, width, height, htmlCode, projectDetail, screenName, screen, iframeRef
}: Props) => {
    const { settingsDetail } = useContext(SettingContext);

    // ✅ 1. Use local state for both size AND position
    const [size, setSize] = useState({ width, height });
    const [pos, setPos] = useState({ x, y });

    // ✅ 2. Sync with parent props ONLY when they change (initial load)
    useEffect(() => {
        setPos({ x, y });
    }, [x, y]);

    useEffect(() => {
        setSize({ width, height });
    }, [width, height]);

    const theme = useMemo(() => {
        const selectedTheme = settingsDetail?.theme ?? projectDetail?.theme;
        return THEMES[selectedTheme as ThemeKey] || THEMES.AURORA_INK;
    }, [settingsDetail?.theme, projectDetail?.theme]);

    const srcDoc = useMemo(() => `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <script>
                // ✅ Robust CORS Injection with MutationObserver
                // This ensures images generated dynamically or via innerHTML also get the attribute immediately
                (function() {
                    const setCrossOrigin = (img) => {
                        if (img.tagName === 'IMG' && img.src.startsWith('http') && !img.hasAttribute('crossorigin')) {
                            img.setAttribute('crossOrigin', 'anonymous');
                            // Force reload image if it already started loading without CORS
                            if (img.complete || img.naturalWidth > 0) {
                                img.src = img.src; 
                            }
                        }
                    };

                    // 1. Observe all new nodes
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1) { // ELEMENT_NODE
                                    if (node.tagName === 'IMG') {
                                        setCrossOrigin(node);
                                    } else {
                                        // Check children if a container was added
                                        node.querySelectorAll('img').forEach(setCrossOrigin);
                                    }
                                }
                            });
                        });
                    });

                    observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true
                    });

                    // 2. Handle existing images (in case of race)
                    document.addEventListener("DOMContentLoaded", () => {
                       document.querySelectorAll('img').forEach(setCrossOrigin);
                    });
                })();
            </script>
            <style>
                ${themeToCssVars(theme)}
                body {
                    background-color: var(--background);
                    color: var(--foreground);
                    font-family: sans-serif;
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                ::-webkit-scrollbar { display: none; }
            </style>
        </head>
        <body>
            ${htmlCode ?? '<div class="p-10 text-center opacity-50 text-[var(--foreground)]">Generating code...</div>'}
        </body>
        </html>
    `, [htmlCode, theme]);

    const measureIframeHeight = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentDocument) return;
        try {
            const body = iframe.contentDocument.body;
            const htmlEl = iframe.contentDocument.documentElement;
            const contentH = Math.max(body.scrollHeight, htmlEl.scrollHeight, body.offsetHeight);
            const nextHeight = Math.min(Math.max(contentH + 60, 200), 2000);
            setSize(s => Math.abs(s.height - nextHeight) > 5 ? { ...s, height: nextHeight } : s);
        } catch (e) { }
    }, [iframeRef]);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const onLoad = () => {
            measureIframeHeight();
            const observer = new MutationObserver(measureIframeHeight);
            observer.observe(iframe.contentDocument!.documentElement, { childList: true, subtree: true, attributes: true });
            return () => observer.disconnect();
        };
        iframe.addEventListener("load", onLoad);
        return () => iframe.removeEventListener("load", onLoad);
    }, [measureIframeHeight, htmlCode, iframeRef]); // Added iframeRef dependency

    return (
        <Rnd
            size={size}
            position={pos}
            dragHandleClassName='drag-handle'
            enableResizing={{
                bottomRight: true,
                bottomLeft: true,
                right: true,
                left: true,
                top: false,
                topLeft: false,
                topRight: false,
                bottom: true
            }}
            onDragStart={() => setPanningEnabled(false)}
            onResizeStart={() => setPanningEnabled(false)}

            onDragStop={(e, d) => {
                setPos({ x: d.x, y: d.y });
                setPanningEnabled(true);
            }}

            onResizeStop={(e, direction, ref, delta, position) => {
                setPanningEnabled(true);
                setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
                setPos(position);
            }}
            className="z-10"
        >
            <div className='flex flex-col h-full shadow-2xl rounded-xl border bg-white overflow-hidden'>
                <div className='drag-handle flex justify-between items-center bg-zinc-100 border-b p-3 cursor-move select-none'>
                    <div className='flex items-center gap-2'>
                        <ScreenHandler
                            screen={screen}
                            theme={theme}
                            iframeRef={iframeRef}
                            projectId={projectDetail?.projectId}
                        />
                    </div>
                    <div className='flex gap-2 items-center'>
                        {projectDetail?.device === 'mobile' ? <Smartphone className='h-3 w-3 text-zinc-400' /> : <Monitor className='h-3 w-3 text-zinc-400' />}
                    </div>
                </div>

                <div className='flex-1 relative bg-white'>
                    <iframe
                        ref={iframeRef}
                        title={screenName}
                        className='w-full h-full border-none'
                        sandbox='allow-same-origin allow-scripts'
                        srcDoc={srcDoc}
                    />

                    {/* Interaction Guard */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        onMouseEnter={() => setPanningEnabled(false)}
                        onMouseLeave={() => setPanningEnabled(true)}
                    />
                </div>
            </div>
        </Rnd>
    );
};

export default ScreenFrame;