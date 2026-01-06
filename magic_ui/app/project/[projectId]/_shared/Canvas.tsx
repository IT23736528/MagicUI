"use client";

import React, { useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import ScreenFrame from './ScreenFrame';
import { ProjectType, ScreenConfig } from '@/type/types';
import { Loader2Icon, Minus, MousePointer2Icon, Plus, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import axios from 'axios';

type Props = {
    projectDetail: ProjectType | undefined;
    screenConfig: ScreenConfig[];
    loading?: boolean;
    // ✅ Prop name changed to match page.tsx
    screenshotTrigger: boolean;
    onScreenshotComplete: () => void;
};

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

const Canvas = ({
    projectDetail,
    screenConfig,
    loading,
    screenshotTrigger,
    onScreenshotComplete
}: Props) => {
    const [panningEnabled, setPanningEnabled] = useState(true);
    // ✅ Use a map to store stable RefObjects for each screen
    const iframeRefs = useRef<Map<string | number, React.MutableRefObject<HTMLIFrameElement | null>>>(new Map());

    const isMobile = projectDetail?.device === "mobile";
    const SCREEN_WIDTH = isMobile ? 400 : 1024;
    const SCREEN_HEIGHT = 800;
    const GAP = isMobile ? 50 : 100;

    // ✅ Effect listens for the trigger passed from the parent
    useEffect(() => {
        if (screenshotTrigger) {
            onTakeScreenshot();
        }
    }, [screenshotTrigger]);

    // Helper to get or create a stable RefObject for a screen
    const getIframeRef = (screenId: string | number) => {
        if (!iframeRefs.current.has(screenId)) {
            iframeRefs.current.set(screenId, React.createRef() as React.MutableRefObject<HTMLIFrameElement | null>);
        }
        return iframeRefs.current.get(screenId)!;
    };

    const captureOneIframe = async (iframe: HTMLIFrameElement) => {
        try {
            const doc = iframe.contentDocument;
            if (!doc) return null;

            // Give extra time for Tailwind/Iconify to render inside the iframe
            await new Promise((r) => setTimeout(r, 600));

            const canvas = await html2canvas(doc.body, {
                backgroundColor: null,
                useCORS: true,
                scale: 2, // High resolution
                width: doc.body.scrollWidth,
                height: doc.body.scrollHeight,
            });
            return canvas;
        } catch (error) {
            console.error("Iframe capture error:", error);
            return null;
        }
    };

    const onTakeScreenshot = async () => {
        // Filter out null refs and get actual elements from the RefObjects
        const activeIframes: HTMLIFrameElement[] = [];
        iframeRefs.current.forEach((ref) => {
            if (ref.current) activeIframes.push(ref.current);
        });

        if (activeIframes.length === 0) {
            toast.error("No active screens found to capture.");
            onScreenshotComplete();
            return;
        }

        const toastId = toast.loading("Generating project export...");

        try {
            const shotCanvases: HTMLCanvasElement[] = [];
            for (const iframe of activeIframes) {
                const c = await captureOneIframe(iframe);
                if (c) {
                    shotCanvases.push(c);
                } else {
                    console.warn(`Skipping screen ${iframe.title} due to capture error.`);
                }
            }

            if (shotCanvases.length === 0) {
                toast.error("Failed to capture any screens completely.");
                onScreenshotComplete();
                return;
            }

            // Stitching Logic
            const headerH = 40;
            const totalWidth = (SCREEN_WIDTH * shotCanvases.length) + (GAP * (shotCanvases.length - 1));

            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = totalWidth;
            finalCanvas.height = SCREEN_HEIGHT + headerH;
            const ctx = finalCanvas.getContext("2d");

            if (ctx) {
                // Background Fill (Optional)
                ctx.fillStyle = "#f8fafc"; // Slate-50 background color
                ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                shotCanvases.forEach((canvas, i) => {
                    const xPos = i * (SCREEN_WIDTH + GAP);
                    ctx.drawImage(canvas, xPos, headerH, SCREEN_WIDTH, SCREEN_HEIGHT);
                });
            }

            const base64Url = finalCanvas.toDataURL("image/png");

            // 1. Update DB
            await updateProjectWithScreenShot(base64Url);

            // 2. Trigger Download
            const link = document.createElement("a");
            link.href = base64Url;
            link.download = `${projectDetail?.projectName || 'my-project'}-preview.png`;
            link.click();

            toast.success("Project exported!", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Export failed.", { id: toastId });
        } finally {
            // ✅ CRITICAL: Reset the trigger in page.tsx so it can be clicked again
            onScreenshotComplete();
        }
    };

    const updateProjectWithScreenShot = async (base64Url: string) => {
        try {
            await axios.put('/api/project', {
                screnShot: base64Url,
                projectId: projectDetail?.projectId,
            });
        } catch (err) {
            console.error("DB Update failed", err);
        }
    };

    return (
        <div
            className='w-full h-[calc(100vh-65px)] bg-gray-50 overflow-hidden relative border-t'
            style={{
                backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
                backgroundSize: "30px 30px"
            }}
        >
            {loading && screenConfig.length === 0 && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                    <Loader2Icon className="animate-spin text-blue-600 w-12 h-12 mb-4" />
                    <p className="text-gray-600 font-medium text-sm">Loading Workspace...</p>
                </div>
            )}

            <TransformWrapper
                initialScale={0.6}
                minScale={0.1}
                maxScale={2}
                centerOnInit={true}
                limitToBounds={false}
                disabled={!panningEnabled}
                panning={{ disabled: !panningEnabled }}
                doubleClick={{ disabled: true }}
            >
                {() => (
                    <>
                        <Controls />
                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{
                                padding: '400px',
                                display: 'flex',
                                alignItems: 'flex-start'
                            }}
                        >
                            <div className="flex" style={{ gap: `${GAP}px` }}>
                                {screenConfig.map((screen, index) => (
                                    <div key={screen.id || index}>
                                        {screen?.code ? (
                                            <ScreenFrame
                                                x={index * (SCREEN_WIDTH + GAP)}
                                                y={0}
                                                width={SCREEN_WIDTH}
                                                height={SCREEN_HEIGHT}
                                                setPanningEnabled={setPanningEnabled}
                                                htmlCode={screen.code}
                                                projectDetail={projectDetail}
                                                screenName={screen.screenName}
                                                screen={screen}
                                                // ✅ Pass a clean RefObject
                                                iframeRef={getIframeRef(screen.screenId || index)}
                                            />
                                        ) : (
                                            <div
                                                className='bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-gray-100 animate-pulse'
                                                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Loader2Icon className="w-4 h-4 animate-spin text-blue-400" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Coding...</span>
                                                </div>
                                                <Skeleton className='w-full h-12 bg-gray-100 rounded-lg' />
                                                <Skeleton className='w-3/4 h-32 bg-gray-50 rounded-lg' />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            <div className="absolute bottom-4 left-4 bg-white/80 p-2 px-3 rounded-full shadow-sm border text-[10px] text-gray-500 uppercase tracking-widest font-bold pointer-events-none">
                Scroll to Zoom • Drag to Pan
            </div>
        </div>
    );
};

export default Canvas;