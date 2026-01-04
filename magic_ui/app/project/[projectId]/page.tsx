"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ProjectHeader from './_shared/ProjectHeader'
import SettingSection from './_shared/SettingSection'
import axios from 'axios'
import { set } from 'date-fns'
import { Loader2Icon } from 'lucide-react'
import { ScreenConfig, ProjectType } from '@/type/types'

const ProjectCanvasPlayground = () => {
  
  

  const {projectId} = useParams();
  const [projectDetail, setProjectDetail] = useState<ProjectType>();
  const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>("Loading");

  useEffect(()=> {
    projectId&&GetProjectDetail();
  }, [projectId])
  const GetProjectDetail= async()=> {
    setLoading(true);
    setLoadingMsg("Loading Project Details...");
    const result = await axios.get('/api/project?projectId=' + projectId);
    console.log(result.data);
    setProjectDetail(result?.data?.projectDetail);
    setScreenConfig(result?.data?.screenConfig);
    /*if(result.data?.screenConfig.length === 0) {
        generateScreenConfig();
    } */
    setLoading(false);
  }

  useEffect(()=> {
    if(projectDetail&&screenConfig&&screenConfig.length === 0){
        console.log("Project Detail and Screen Config Loaded");
        generateScreenConfig();
    }
  },[projectDetail&&screenConfig])

  const generateScreenConfig= async()=> {
    setLoading(true);
    setLoadingMsg("Generating Screen Config...");
    const result = await axios.post('/api/generate-config', {
        projectId: projectId,
        deviceType: projectDetail?.device,
        userInput: projectDetail?.userInput,
  });

  console.log("Generated Screen Config:", result.data);
    setLoading(false);
  }

  return (
    <div>
      <ProjectHeader />

      
      <div className="flex">
        {loading && <div className='p-3 absolute bg-blue-300/20 border border-blue-400 border rounded-xl left-1/2 top-20'>
            <h2 className='flex gap-2 items-center'> <Loader2Icon className='animated-spin'/> {loadingMsg}</h2>
        </div>}

        <SettingSection />
        <div className="flex-1 p-4">
          
          {/* Project content goes here */}
        </div>
      </div>
    </div>
  )
}

export default ProjectCanvasPlayground
