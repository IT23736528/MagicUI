"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ProjectHeader from './_shared/ProjectHeader'
import SettingSection from './_shared/SettingSection'
import axios from 'axios'
import { set } from 'date-fns'
import { Loader2Icon } from 'lucide-react'

const ProjectCanvasPlayground = () => {
  
  

  const {projectId} = useParams();
  const [projectDetail, setProjectDetail] = useState<ProjectType>();
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
    setProjectDetail(result?.data);
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
