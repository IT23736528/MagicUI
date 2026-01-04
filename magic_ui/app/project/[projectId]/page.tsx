"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import ProjectHeader from './_shared/ProjectHeader'
import SettingSection from './_shared/SettingSection'

const ProjectPage = () => {
  const params = useParams()
  const projectId = params.projectId as string

  return (
    <div>
      <ProjectHeader />
      <div className="flex">
        <SettingSection />
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold">Project: {projectId}</h1>
          {/* Project content goes here */}
        </div>
      </div>
    </div>
  )
}

export default ProjectPage
