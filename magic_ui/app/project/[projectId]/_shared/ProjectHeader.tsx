import React from 'react'
import Image from 'next/image';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProjectHeader = () => {
  return (
    <div className='flex items-center justify-between p-3 shadow'>
        <div className="flex gap-2 items-center">
                  <Image src={'/logo.png'} alt="Magic UI Logo" width={40} height={40} />
                  <h2 className="text-xl font-semibold"> <span className='text-primary'>Magic</span>UI</h2>
              </div>
        <Button> <Save/> Save</Button>
    </div>
  )
}

export default ProjectHeader
