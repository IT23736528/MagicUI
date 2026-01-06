"use client";

import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ScreenFrame from './ScreenFrame';
import { ProjectType, ScreenConfig } from '@/type/types';
import { Loader2Icon, MousePointer2Icon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
    projectDetail: ProjectType | undefined;
    screenConfig: ScreenConfig[];
    loading?: boolean;
};

const Canvas = ({ projectDetail, screenConfig, loading }: Props) => {
    // panningEnabled state allows us to disable canvas movement 
    // when the user is interacting with buttons/inputs inside a ScreenFrame
    const [panningEnabled, setPanningEnabled] = useState(true);

    const isMobile = projectDetail?.device === "mobile";

    // Standardized dimensions: Mobile screens are narrow, Web screens are wide.
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
            {/* 1. Loading State: Shown when the AI is first generating the config */}
            {loading && screenConfig.length === 0 && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                    <Loader2Icon className="animate-spin text-blue-600 w-12 h-12 mb-4" />
                    <p className="text-gray-600 font-medium animate-pulse">Initializing Canvas...</p>
                </div>
            )}

            {/* 2. Empty State: Shown if no project is loaded or generated */}
            {!loading && screenConfig.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <MousePointer2Icon className="w-12 h-12 mb-2 opacity-20" />
                    <p>No screens to display yet.</p>
                </div>
            )}

            {/* 3. The Interactive Zoom/Pan Layer */}
            <TransformWrapper
                initialScale={0.6}
                minScale={0.1}
                maxScale={2}
                centerOnInit={true}
                limitToBounds={false}
                doubleClick={{ disabled: true }} // Disabled to allow clicks inside screens
                panning={{ disabled: !panningEnabled, velocityDisabled: true }}
                wheel={{ step: 0.05 }}
            >
                <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ 
                        padding: '200px', // Extra padding allows user to pan far beyond the edges
                        display: 'flex',
                        alignItems: 'flex-start'
                    }}
                >
                    <div className="flex" style={{ gap: `${GAP}px` }}>
                        {screenConfig.map((screen, index) => (
                            <div>
                                {screen?.code? <ScreenFrame 
                                key={screen.id || index}
                                x={index * (SCREEN_WIDTH + GAP)} 
                                y={0} 
                                width={SCREEN_WIDTH} 
                                height={SCREEN_HEIGHT}
                                setPanningEnabled={setPanningEnabled} 
                                htmlCode={screen?.code}
                                projectDetail={projectDetail}
                                screenName={screen?.screenName}
                            /> :
                                <div className='bg-white rounded-2xl p-5 gap-4 flex flex-col'
                                style={{
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_HEIGHT
                                }}>

                                    <Skeleton className='w-full rounded-lg h-10 bg-gray-200' />
                                    <Skeleton className='w-[50%] rounded-lg h-20 bg-gray-200' />
                                    <Skeleton className='w-[70%] rounded-lg h-30 bg-gray-200' />
                                    <Skeleton className='w-[30%] rounded-lg h-10 bg-gray-200' />
                                    <Skeleton className='w-full rounded-lg h-10 bg-gray-200' />
                                    <Skeleton className='w-[50%] rounded-lg h-20 bg-gray-200' />
                                    <Skeleton className='w-[70%] rounded-lg h-30 bg-gray-200' />
                                    <Skeleton className='w-[30%] rounded-lg h-10 bg-gray-200' />

                                </div>}
                            </div>
                            
                        ))}
                    </div>
                </TransformComponent>
            </TransformWrapper>

            {/* 4. Canvas Legend (Optional Helper) */}
            <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded-md shadow-sm border text-[10px] text-gray-500 uppercase tracking-widest">
                Scroll to Zoom • Drag to Pan
            </div>
        </div>
    );
};

export default Canvas;