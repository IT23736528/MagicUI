"use client";

import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Loader2Icon } from 'lucide-react';

// Shared Components
import ProjectHeader from './_shared/ProjectHeader';
import SettingSection from './_shared/SettingSection';
import Canvas from './_shared/Canvas';

// Contexts
import { SettingContext } from '@/context/SettingContext';
import { RefreshDataContext } from '@/context/RefreshDataContext';

// Types
import { ScreenConfig, ProjectType } from '@/type/types';

export default function ProjectCanvasPlayground() {
  const { projectId } = useParams();
  
  // State Management
  const [projectDetail, setProjectDetail] = useState<ProjectType>();
  const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>("Loading");

  // Context Hooks
  const { setSettingsDetail } = useContext<any>(SettingContext);
  const { refreshData } = useContext<any>(RefreshDataContext);

  // Track generation to prevent infinite loops and handle resets
  const hasStartedGeneration = useRef(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    if (projectId) {
      GetProjectDetail();
    }
  }, [projectId]);

  // 2. Handle Manual Refresh/Data Update
  useEffect(() => {
    if (refreshData?.method === 'screenConfig') {
      // Reset the generation lock so new changes can trigger UI generation if needed
      hasStartedGeneration.current = false;
      GetProjectDetail();
    }
  }, [refreshData]);

  const GetProjectDetail = async () => {
    setLoading(true);
    setLoadingMsg("Loading Project Details...");
    try {
      const result = await axios.get(`/api/project?projectId=${projectId}`);
      const data = result?.data;
      
      setProjectDetail(data?.projectDetail);
      setScreenConfig(data?.screenConfig || []);
      
      // Sync global settings context
      if (data?.projectDetail) {
        setSettingsDetail(data.projectDetail);
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Logic to decide when to trigger AI Generation
  useEffect(() => {
    // Only proceed if project meta is loaded and we aren't already generating
    if (!projectDetail || hasStartedGeneration.current) return;

    if (screenConfig.length === 0) {
      hasStartedGeneration.current = true;
      generateScreenConfig();
    } else {
      const needsCode = screenConfig.some(screen => !screen.code);
      if (needsCode) {
        hasStartedGeneration.current = true;
        GenerateScreenUIUX();
      }
    }
  }, [projectDetail, screenConfig.length]); 

  const generateScreenConfig = async () => {
    setLoading(true);
    setLoadingMsg("Generating Screen Config...");
    try {
      await axios.post('/api/generate-config', {
        projectId: projectId,
        deviceType: projectDetail?.device,
        userInput: projectDetail?.userInput,
      });
      
      // Reset lock and refetch to transition to UI generation phase
      hasStartedGeneration.current = false; 
      await GetProjectDetail();
    } catch (error) {
      console.error('Config Generation Error:', error);
      hasStartedGeneration.current = false; 
    } finally {
      setLoading(false);
    }
  };

  const GenerateScreenUIUX = async () => {
    setLoading(true);
    try {
      // Iterate through missing code screens
      for (let index = 0; index < screenConfig.length; index++) {
        const screen = screenConfig[index];
        if (screen?.code) continue;

        setLoadingMsg(`Generating Screen ${index + 1} of ${screenConfig.length}`);
        
        const result = await axios.post('/api/generate-screen-ui', {
          projectId,
          screenId: screen.screenId,
          screenName: screen.screenName,
          purpose: screen.purpose || '',
          screenDescription: screen.screenDescription || '',
          projectVisualDescription: projectDetail?.userInput || ''
        });

        const newCode = result.data.code || result.data.data?.code;

        // Functional update to local state so Canvas updates screen-by-screen
        setScreenConfig(prev => prev.map((item, i) => 
          i === index ? { ...item, code: newCode } : item
        ));
      }
    } catch (error) {
      console.error("Error generating screen UI/UX:", error);
      hasStartedGeneration.current = false; 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ProjectHeader />
      <div className="flex gap-5 h-[calc(100vh-65px)] overflow-hidden">
        {/* Progress Overlay */}
        {loading && (
          <div className='p-3 fixed bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl left-1/2 top-24 transform -translate-x-1/2 z-[100] shadow-lg'>
            <h2 className='flex gap-2 items-center text-blue-600 font-medium'>
              <Loader2Icon className='animate-spin' /> {loadingMsg}
            </h2>
          </div>
        )}

        <SettingSection 
          projectDetail={projectDetail}
          screenDescription={screenConfig[0]?.screenDescription}
        />
        
        <main className="flex-1 relative">
           <Canvas projectDetail={projectDetail} screenConfig={screenConfig} />
        </main>
      </div>
    </div>
  );
}