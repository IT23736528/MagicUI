"use client";

import { THEMES, themeToCssVars, ThemeKey } from '@/data/Themes';
import { ProjectType } from '@/type/types';
import { GripVertical, Monitor, Smartphone } from 'lucide-react';
import React, { useMemo } from 'react';
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

    return (
        <Rnd
            default={{
                x,
                y,
                width: width,
                height: height
            }}
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
            onResizeStop={() => setPanningEnabled(true)}
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