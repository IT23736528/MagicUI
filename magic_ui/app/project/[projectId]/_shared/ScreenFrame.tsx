"use client";

import { SettingContext } from '@/context/SettingContext';
import { THEMES, themeToCssVars, ThemeKey } from '@/data/Themes';
import { ProjectType, ScreenConfig } from '@/type/types';
import { GripVertical, Monitor, Smartphone } from 'lucide-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from "react-rnd";
import ScreenHandler from './ScreenHandler';
import { HtmlWrapper } from '@/data/constant';

type Props = {
    x: number;
    y: number;
    setPanningEnabled: (enabled: boolean) => void;
    width: number;
    height: number;
    htmlCode: string | undefined;
    projectDetail: ProjectType | undefined;
    screenName?: string;
    screen:ScreenConfig | undefined;
}

const ScreenFrame = ({ 
    x, 
    y, 
    setPanningEnabled, 
    width, 
    height, 
    htmlCode, 
    projectDetail, 
    screenName,
    screen
}: Props) => {
    // ✅ 1. Move useContext to the top level (Hook rule)
    const { settingsDetail } = useContext(SettingContext);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [size, setSize] = useState({ width, height });

    

    // Resolve the theme safely
    const theme = useMemo(() => {
        const selectedTheme = settingsDetail?.theme ?? projectDetail?.theme;
        return THEMES[selectedTheme as ThemeKey] || THEMES.AURORA_INK;
    }, [settingsDetail?.theme, projectDetail?.theme]);

    const html= HtmlWrapper(theme,htmlCode as string);

    // Update size when props change
    useEffect(() => {
        setSize({ width, height });
    }, [width, height]);

    // Prepare the HTML content for the iframe
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
                    padding: 20px;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                ::-webkit-scrollbar { display: none; }
            </style>
        </head>
        <body>
            ${htmlCode ?? '<div class="p-10 text-center opacity-50">Generating code...</div>'}
        </body>
        </html>
    `, [htmlCode, theme]);

    // Measure iframe content height to adjust the frame
    const measureIframeHeight = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        try {
            const doc = iframe.contentDocument;
            if (!doc) return;

            const headerH = 60; // Total height of our custom drag bar/padding
            const body = doc.body;
            const htmlEl = doc.documentElement;

            const contentH = Math.max(
                body?.scrollHeight ?? 0,
                htmlEl?.scrollHeight ?? 0,
                body?.offsetHeight ?? 0
            );

            // Clamp the height between 200px and 2000px
            const nextHeight = Math.min(Math.max(contentH + headerH, 200), 2000);

            setSize((s) => (Math.abs(s.height - nextHeight) > 5 ? { ...s, height: nextHeight } : s));
        } catch (e) {
            // Origin security might block access
        }
    }, []);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const onLoad = () => {
            measureIframeHeight();
            const doc = iframe.contentDocument;
            if (!doc) return;

            // Watch for dynamic content changes (Tailwind injections, etc.)
            const observer = new MutationObserver(measureIframeHeight);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true,
                attributes: true
            });

            return () => observer.disconnect();
        };

        iframe.addEventListener("load", onLoad);
        return () => iframe.removeEventListener("load", onLoad);
    }, [measureIframeHeight, htmlCode]);

    return (
        <Rnd
            size={size}
            position={{ x, y }} // Use controlled position or default
            dragHandleClassName='drag-handle'
            enableResizing={{
                bottomRight: true,
                bottomLeft: true,
                right: true,
                left: true
            }}
            onDragStart={() => setPanningEnabled(false)}
            onDragStop={() => setPanningEnabled(true)}
            onResizeStart={() => setPanningEnabled(false)}
            onResizeStop={(_, __, ref) => {
                setPanningEnabled(true);
                setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
            }}
            className="z-10"
        >
            <div className='flex flex-col h-full shadow-2xl rounded-xl border bg-white overflow-hidden'>
                
                {/* Header / Drag Handle */}
                <div className='drag-handle flex justify-between items-center bg-zinc-100 border-b p-3 cursor-move select-none'>
                    <div className='flex items-center gap-2'>
                        
                        <ScreenHandler screen={screen} theme={theme}/>
                        
                    </div>
                    <div className='flex gap-2 items-center'>
                       {projectDetail?.device === 'mobile' ? <Smartphone className='h-3 w-3 text-zinc-400'/> : <Monitor className='h-3 w-3 text-zinc-400'/>}
                    </div>
                </div>

                {/* Iframe Preview */}
                <div className='flex-1 relative bg-white'>
                    <iframe 
                        ref={iframeRef}
                        title={screenName}
                        className='w-full h-full border-none'
                        sandbox='allow-same-origin allow-scripts'
                        srcDoc={srcDoc}
                    />
                    
                    {/* Interaction Guard: Disables panning when hovering the content */}
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