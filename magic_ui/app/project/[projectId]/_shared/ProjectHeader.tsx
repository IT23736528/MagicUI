import React, { useContext, useState } from 'react'
import Image from 'next/image';
import { Loader2Icon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingContext } from '@/context/SettingContext';
import axios from 'axios';
import { se } from 'date-fns/locale';
import { toast } from 'sonner';

const ProjectHeader = () => {

  const { settingsDetail,setSettingsDetail } = useContext(SettingContext);
  const [loading , setLoading] = useState(false);

  const OnSave=async ()=> {
    try{
      setLoading(true);
    const result = await axios.put('/api/project', {
      theme: settingsDetail?.theme,
      projectId: settingsDetail?.projectId,
      projectName: settingsDetail?.projectName,
    });
    setLoading(false);
    toast.success('Setting Saved!')
    }
    catch(error){
      setLoading(false);
      toast.error('Failed to save settings');
    }
  }
  
  return (
    <div className='flex items-center justify-between p-3 shadow'>
        <div className="flex gap-2 items-center">
                  <Image src={'/logo.png'} alt="Magic UI Logo" width={40} height={40} />
                  <h2 className="text-xl font-semibold"> <span className='text-primary'>Magic</span>UI</h2>
              </div>
        <Button disabled={loading} onClick={OnSave}> {loading?<Loader2Icon className='animate-spin'/>:<Save/>} Save</Button>
    </div>
  )
}

export default ProjectHeader
