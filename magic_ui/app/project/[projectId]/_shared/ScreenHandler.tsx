"use client";

import { Button } from '@/components/ui/button';
import { ScreenConfig } from '@/type/types';
import { 
    Code2Icon, 
    Copy, 
    Download, 
    GripVertical, 
    Loader2Icon, 
    MoreVertical, 
    Sparkle, 
    SparkleIcon, 
    Trash 
} from 'lucide-react';
import React, { useContext, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from '@/components/ui/textarea';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { toast } from 'sonner';
import { HtmlWrapper } from '@/data/constant';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { RefreshDataContext } from '@/context/RefreshDataContext';

type Props = {
    screen: ScreenConfig | undefined;
    theme: any;
    iframeRef: any;
    projectId: string | undefined;
};

const ScreenHandler = ({ screen, theme, iframeRef, projectId }: Props) => {
    const htmlCode = HtmlWrapper(theme, screen?.code as string);
    const { setRefreshData } = useContext(RefreshDataContext);
    const [editUserInput, setEditUserInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const takeIframeScreenshot = async () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        try {
            const doc = iframe.contentDocument;
            if (!doc) return;
            const body = doc.body;
            await new Promise((res) => requestAnimationFrame(res));
            const canvas = await html2canvas(body, {
                backgroundColor: null,
                useCORS: true,
                scale: window.devicePixelRatio || 1,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `${screen?.screenName || "screen"}.png`;
            link.click();
        } catch (err) {
            console.error("Screenshot failed:", err);
            toast.error("Failed to take screenshot");
        }
    };

    const onDelete = async () => {
        try {
            await axios.delete(`/api/generate-config?projectId=${projectId}&screenId=${screen?.screenId}`);
            toast.success('Screen Deleted Successfully');
            setRefreshData({ method: 'screenConfig', date: Date.now() });
        } catch (error) {
            toast.error("Failed to delete screen");
        }
    };

    const editScreen = async () => {
        // 1. Validation to prevent 400 Bad Request errors
        if (!editUserInput.trim()) {
            toast.error("Please describe the changes you want to make.");
            return;
        }

        setLoading(true);
        toast.info('Regenerating Screen, please wait...');
        try {
            await axios.post('/api/edit-screen', {
                projectId: projectId,
                screenId: screen?.screenId,
                oldCode: screen?.code,
                userInput: editUserInput
            });
            toast.success('Screen Regenerated Successfully');
            setRefreshData({ method: 'screenConfig', date: Date.now() });
            setEditUserInput(""); // Clear input on success
        } catch (error) {
            console.error(error);
            toast.error("Failed to regenerate screen");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex justify-between items-center w-full'>
            <div className='flex items-center gap-2'>
                <GripVertical className='text-zinc-400 h-4 w-4' />
                <h2 className='text-sm font-medium'>{screen?.screenName}</h2>
            </div>

            <div className='flex items-center gap-1'>
                {/* Fix 1: Added asChild to prevent nested <button> */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant='ghost' size='icon'><Code2Icon className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-6xl w-full h-[80vh] flex flex-col'>
                        <DialogHeader>
                            <DialogTitle>HTML + TailwindCSS Code</DialogTitle>
                            <DialogDescription className='flex-1 overflow-hidden flex flex-col pt-4'>
                                <div className='flex-1 overflow-y-auto rounded-md border bg-muted p-4'>
                                    <SyntaxHighlighter 
                                        language="html" 
                                        style={docco}
                                        customStyle={{
                                            margin: 0,
                                            padding: 0,
                                            background: 'transparent',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {htmlCode}
                                    </SyntaxHighlighter>
                                </div>
                                <Button className='mt-4 w-fit' onClick={() => {
                                    navigator.clipboard.writeText(htmlCode);
                                    toast.success('Code Copied to Clipboard!');
                                }}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy Code
                                </Button>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>

                <Button variant='ghost' size='icon' onClick={takeIframeScreenshot}>
                    <Download className="h-4 w-4" />
                </Button>

                {/* Fix 2: Added asChild to prevent nested <button> */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant='ghost' size='icon'>
                            <SparkleIcon className="h-4 w-4 text-blue-500" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className='grid gap-4'>
                            <div className='space-y-2'>
                                <h4 className='font-medium leading-none'>AI Refinement</h4>
                                <p className='text-sm text-muted-foreground'>Describe changes for this specific screen.</p>
                            </div>
                            <Textarea 
                                placeholder='Example: Change the primary color to blue or add a new pricing section.'
                                value={editUserInput}
                                onChange={(e) => setEditUserInput(e.target.value)} 
                            />
                            <Button size='sm' className='w-full' disabled={loading} onClick={editScreen}>
                                {loading ? <Loader2Icon className='animate-spin h-4 w-4 mr-2' /> : <Sparkle className='h-4 w-4 mr-2' />} 
                                Regenerate
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Fix 3: Added asChild to prevent nested <button> */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className='text-destructive' onClick={onDelete}>
                            <Trash className="mr-2 h-4 w-4" /> Delete Screen
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default ScreenHandler;