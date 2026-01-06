"use client";

import React, { useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import ScreenFrame from './ScreenFrame';
import { ProjectType, ScreenConfig } from '@/type/types';
import { Loader2Icon, Minus, MousePointer2Icon, Plus, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type Props = {
    projectDetail: ProjectType | undefined;
    screenConfig: ScreenConfig[];
    loading?: boolean;
};

// Internal component to handle zoom controls
const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    return (
        <div className="absolute p-2 px-3 bg-white/90 backdrop-blur-sm shadow-xl flex gap-2 rounded-full bottom-10 left-1/2 -translate-x-1/2 z-30 border border-gray-200">
            <Button variant='ghost' size='icon' className="rounded-full" onClick={() => zoomIn()}>
                <Plus className="w-4 h-4" />
            </Button>
            <Button variant='ghost' size='icon' className="rounded-full" onClick={() => zoomOut()}>
                <Minus className="w-4 h-4" />
            </Button>
            <Button variant='ghost' size='icon' className="rounded-full" onClick={() => resetTransform()}>
                <RefreshCw className="w-4 h-4" />
            </Button>
        </div>
    );
};

const Canvas = ({ projectDetail, screenConfig, loading }: Props) => {
    // This state controls whether the background canvas is allowed to pan
    const [panningEnabled, setPanningEnabled] = useState(true);

    const isMobile = projectDetail?.device === "mobile";
    const SCREEN_WIDTH = isMobile ? 400 : 1024;
    const SCREEN_HEIGHT = 800;
    const GAP = isMobile ? 50 : 100;

    return (
        <div 
            className='w-full h-[calc(100vh-65px)] bg-gray-50 overflow-hidden relative border-t'
            style={{
                backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
                backgroundSize: "30px 30px"
            }}
        >
            {/* AI Initializing State */}
            {loading && screenConfig.length === 0 && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                    <Loader2Icon className="animate-spin text-blue-600 w-12 h-12 mb-4" />
                    <p className="text-gray-600 font-medium animate-pulse text-sm">Initializing Canvas...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && screenConfig.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <MousePointer2Icon className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No screens to display yet.</p>
                </div>
            )}

            <TransformWrapper
                initialScale={0.6}
                minScale={0.1}
                maxScale={2}
                centerOnInit={true}
                limitToBounds={false}
                disabled={!panningEnabled} // Completely disable zoom/pan when dragging a frame
                doubleClick={{ disabled: true }} // Prevents zoom-resetting when clicking buttons inside screens
                panning={{ disabled: !panningEnabled }}
                wheel={{ step: 0.05 }}
            >
                {() => (
                    <>
                        <Controls />
                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{ 
                                padding: '400px', // Large padding allows for dragging far beyond edges
                                display: 'flex', 
                                alignItems: 'flex-start' 
                            }}
                        >
                            <div className="flex" style={{ gap: `${GAP}px` }}>
                                {screenConfig.map((screen, index) => (
                                    <div key={screen.id || index}>
                                        {screen?.code ? (
                                            <ScreenFrame 
                                                // Unique position for each screen
                                                x={index * (SCREEN_WIDTH + GAP)} 
                                                y={0} 
                                                width={SCREEN_WIDTH} 
                                                height={SCREEN_HEIGHT}
                                                setPanningEnabled={setPanningEnabled} 
                                                htmlCode={screen.code}
                                                projectDetail={projectDetail}
                                                screenName={screen.screenName}
                                                screen={screen}
                                            />
                                        ) : (
                                            /* Skeleton Loader while AI generates individual code */
                                            <div 
                                                className='bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-gray-100 animate-pulse'
                                                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Loader2Icon className="w-4 h-4 animate-spin text-blue-400" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Generating UI...</span>
                                                </div>
                                                <Skeleton className='w-full h-12 bg-gray-100 rounded-lg' />
                                                <Skeleton className='w-3/4 h-32 bg-gray-50 rounded-lg' />
                                                <Skeleton className='w-full h-10 bg-gray-50 rounded-lg' />
                                                <Skeleton className='w-1/2 h-10 bg-gray-50 rounded-lg' />
                                                <div className="mt-auto flex gap-2">
                                                    <Skeleton className='w-full h-12 bg-gray-100 rounded-lg' />
                                                    <Skeleton className='w-full h-12 bg-gray-100 rounded-lg' />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            <div className="absolute bottom-4 left-4 bg-white/80 p-2 px-3 rounded-full shadow-sm border text-[10px] text-gray-500 uppercase tracking-widest font-semibold pointer-events-none">
                Scroll to Zoom • Drag to Pan
            </div>
        </div>
    );
};

export default Canvas;