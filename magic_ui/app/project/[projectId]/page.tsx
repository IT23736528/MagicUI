"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import ProjectHeader from './_shared/ProjectHeader';
import SettingSection from './_shared/SettingSection';
import axios from 'axios';
import { Loader2Icon } from 'lucide-react';
import { ScreenConfig, ProjectType } from '@/type/types';

export default function ProjectCanvasPlayground() {
  const { projectId } = useParams();
  const [projectDetail, setProjectDetail] = useState<ProjectType>();
  const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>("Loading");

  // Track if we have already started the generation process to prevent loops
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
    if (!projectDetail || hasStartedGeneration.current) return;

    if (screenConfig.length === 0) {
      hasStartedGeneration.current = true;
      generateScreenConfig();
    } else {
      // Check if any screens actually need code before starting
      const needsCode = screenConfig.some(screen => !screen.code);
      if (needsCode) {
        hasStartedGeneration.current = true;
        GenerateScreenUIUX();
      }
    }
    // We removed screenConfig from dependencies to stop the loop
  }, [projectDetail]); 

  const generateScreenConfig = async () => {
    setLoading(true);
    setLoadingMsg("Generating Screen Config...");
    try {
      await axios.post('/api/generate-config', {
        projectId: projectId,
        deviceType: projectDetail?.device,
        userInput: projectDetail?.userInput,
      });
      // After config is created, reset ref and fetch details to trigger UI generation
      hasStartedGeneration.current = false; 
      await GetProjectDetail();
    } catch (error) {
      console.error('Config Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const GenerateScreenUIUX = async () => {
    setLoading(true);
    try {
      for (let index = 0; index < screenConfig.length; index++) {
        const screen = screenConfig[index];
        if (screen?.code) continue;

        setLoadingMsg(`Generating Screen ${index + 1} of ${screenConfig.length}`);
        
        await axios.post('/api/generate-screen-ui', {
          projectId,
          screenId: screen.screenId,
          screenName: screen.screenName,
          purpose: screen.purpose || '',
          screenDescription: screen.screenDescription || '',
          projectVisualDescription: projectDetail?.userInput || ''
        });
      }
      // Finally, fetch the updated details once everything is done
      await GetProjectDetail();
    } catch (error) {
      console.error("Error generating screen UI/UX:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectHeader />
      <div className="flex">
        {loading && (
          <div className='p-3 absolute bg-blue-300/20 border border-blue-400 rounded-xl left-1/2 top-20 transform -translate-x-1/2 z-50'>
            <h2 className='flex gap-2 items-center'>
              <Loader2Icon className='animate-spin' /> {loadingMsg}
            </h2>
          </div>
        )}
        <SettingSection projectDetail={projectDetail} />
        <div className="flex-1 p-4">
          <div className="text-gray-500">
            {screenConfig.length > 0 ? (
              <p>Found {screenConfig.length} screen(s)</p>
            ) : (
              <p>No screens configured yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}