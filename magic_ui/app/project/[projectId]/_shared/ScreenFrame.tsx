"use client";

import { THEMES, themeToCssVars, ThemeKey } from '@/data/Themes';
import { ProjectType } from '@/type/types';
import { GripVertical, Monitor, Smartphone } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from "react-rnd";

type Props = {
    x: number;
    y: number;
    setPanningEnabled: (enabled: boolean) => void;
    width: number;
    height: number;
    htmlCode: string | undefined;
    projectDetail: ProjectType | undefined;
    screenName?: string; // Added missing prop
}

const ScreenFrame = ({ 
    x, 
    y, 
    setPanningEnabled, 
    width, 
    height, 
    htmlCode, 
    projectDetail, 
    screenName 
}: Props) => {

    // 1. Resolve the theme safely
    const theme = useMemo(() => {
        const selectedTheme = projectDetail?.theme as ThemeKey;
        return THEMES[selectedTheme] || THEMES.AURORA_INK; // Fallback to default
    }, [projectDetail?.theme]);

    const iframeRef=useRef<HTMLFrameElement | null>(null);

    // 2. Prepare the HTML content for the iframe
    // useMemo prevents flickering/re-reloading the iframe unless code or theme changes
    const srcDoc = useMemo(() => `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                ${themeToCssVars(theme)}
                body {
                    background-color: var(--background);
                    color: var(--foreground);
                    font-family: sans-serif;
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                }
                /* Hide scrollbars for a cleaner preview if desired */
                ::-webkit-scrollbar { display: none; }
            </style>
        </head>
        <body>
            ${htmlCode ?? '<div class="p-10 text-center opacity-50">Generating code...</div>'}
        </body>
        </html>
    `, [htmlCode, theme]);

    const isMobile = projectDetail?.device === 'mobile';

    const [size, setSize] = useState({ width,height });

    useEffect(() => {
        setSize({ width, height });
    }, [width, height]);

    const measureIframeHeight = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        try {
            const doc = iframe.contentDocument;
            if (!doc) return;

            const headerH = 40; // drag bar height
            const htmlEl = doc.documentElement;
            const body = doc.body;

            // ✅ choose the largest plausible height
            const contentH = Math.max(
                htmlEl?.scrollHeight ?? 0,
                body?.scrollHeight ?? 0,
                htmlEl?.offsetHeight ?? 0,
                body?.offsetHeight ?? 0
            );

            // optional min/max clamps
            const next = Math.min(Math.max(contentH + headerH, 160), 2000);

            setSize((s) => (Math.abs(s.height - next) > 2 ? { ...s, height: next } : s));
        } catch {
            // if sandbox/origin blocks access, we can't measure
        }
    }, []);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const onLoad = () => {
            measureIframeHeight();

            // ✅ observe DOM changes inside iframe
            const doc = iframe.contentDocument;
            if (!doc) return;

            const observer = new MutationObserver(() => measureIframeHeight());
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            });

            // ✅ re-check a few times for fonts/images/tailwind async layout
            const t1 = window.setTimeout(measureIframeHeight, 50);
            const t2 = window.setTimeout(measureIframeHeight, 200);
            const t3 = window.setTimeout(measureIframeHeight, 600);

            return () => {
                observer.disconnect();
                window.clearTimeout(t1);
                window.clearTimeout(t2);
                window.clearTimeout(t3);
            };
        };

        iframe.addEventListener("load", onLoad);
        window.addEventListener("resize", measureIframeHeight);

        return () => {
            iframe.removeEventListener("load", onLoad);
            window.removeEventListener("resize", measureIframeHeight);
        };
}, [measureIframeHeight, htmlCode]);


    return (
        <Rnd
            default={{
                x,
                y,
                width: width,
                height: height
            }}
            size={size}
            dragHandleClassName='drag-handle'
            enableResizing={{
                bottomRight: true,
                bottomLeft: true,
                topRight: false,
                topLeft: false,
            }}
            // Disable canvas panning when the user interacts with this component
            onDragStart={() => setPanningEnabled(false)}
            onDragStop={() => setPanningEnabled(true)}
            onResizeStart={() => setPanningEnabled(false)}
            onResizeStop={(_,__,ref,___,position) => {
                setPanningEnabled(true);
                setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
            }}
            className="z-10"
        >
            <div className='flex flex-col h-full shadow-2xl rounded-xl border bg-white overflow-hidden'>
                
                {/* 3. Improved Drag Handle / Header */}
                <div className='drag-handle flex justify-between items-center bg-zinc-100 border-b p-3 cursor-move select-none'>
                    <div className='flex items-center gap-2 p-2 rounded-lg'>
                        <GripVertical className='text-zinc-400 h-4 w-4' />
                        <span className='text-xs font-semibold text-zinc-600 truncate max-w-[150px]'>
                            {screenName || "Untitled Screen"}
                        </span>
                    </div>
                    <div className='flex gap-1'>
                       {isMobile ? <Smartphone className='h-3 w-3 text-zinc-400'/> : <Monitor className='h-3 w-3 text-zinc-400'/>}
                    </div>
                </div>

                {/* 4. The Rendered Preview */}
                <div className='flex-1 relative bg-white'>
                    <iframe 
                        ref={iframeRef}
                        title={screenName}
                        className='w-full h-[calc(100%-40px)] rounded-2xl mt-5'
                        sandbox='allow-same-origin allow-scripts'
                        srcDoc={srcDoc}
                    />
                    
                    {/* Transparent overlay to allow dragging even over the iframe */}
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