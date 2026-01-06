"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import ProjectHeader from './_shared/ProjectHeader';
import SettingSection from './_shared/SettingSection';
import axios from 'axios';
import { Loader2Icon } from 'lucide-react';
import { ScreenConfig, ProjectType } from '@/type/types';
import Canvas from './_shared/Canvas';

export default function ProjectCanvasPlayground() {
  const { projectId } = useParams();
  const [projectDetail, setProjectDetail] = useState<ProjectType>();
  const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>("Loading");

  // Track generation to prevent infinite loops
  const hasStartedGeneration = useRef(false);

  useEffect(() => {
    if (projectId) {
      GetProjectDetail();
    }
  }, [projectId]);

  const GetProjectDetail = async () => {
    setLoading(true);
    setLoadingMsg("Loading Project Details...");
    try {
      const result = await axios.get('/api/project?projectId=' + projectId);
      setProjectDetail(result?.data?.projectDetail);
      setScreenConfig(result?.data?.screenConfig || []);
    } catch (error) {
      console.error("Error fetching project details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logic to decide when to generate
  useEffect(() => {
    // Only proceed if we have details and haven't already locked the generation process
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
    // We only trigger this when projectDetail is loaded or if screens are missing
    // Adding screenConfig.length as a dependency is safer than the whole array
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
      // Allow the effect to run again to start UI generation
      hasStartedGeneration.current = false; 
      await GetProjectDetail();
    } catch (error) {
      console.error('Config Generation Error:', error);
      hasStartedGeneration.current = false; // Reset on error so it can retry
    } finally {
      setLoading(false);
    }
  };

  const GenerateScreenUIUX = async () => {
    setLoading(true);
    try {
      // Loop through the config and generate missing UI
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

        // Update local state immediately so Canvas shows progress
        setScreenConfig(prev => prev.map((item, i) => 
          i === index ? { ...item, code: result.data.code || result.data.data?.code } : item
        ));
      }
    } catch (error) {
      console.error("Error generating screen UI/UX:", error);
      hasStartedGeneration.current = false; // Reset on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectHeader />
      <div className="flex gap-5">
        {loading && (
          <div className='p-3 absolute bg-blue-300/20 border border-blue-400 rounded-xl left-1/2 top-20 transform -translate-x-1/2 z-50'>
            <h2 className='flex gap-2 items-center'>
              <Loader2Icon className='animate-spin' /> {loadingMsg}
            </h2>
          </div>
        )}
        <SettingSection projectDetail={projectDetail} />
        
        <div className="flex-1">
           <Canvas projectDetail={projectDetail} screenConfig={screenConfig} />
        </div>
      </div>
    </div>
  );
}