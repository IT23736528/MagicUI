"use client"
import React, { useState } from 'react'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Camera, Share, Sparkles } from 'lucide-react';
import { THEME_NAME_LIST, THEMES } from '@/components/ui/data/Themes';

const SettingSection = () => {

    const [selectedTheme,setSelectedTheme]=useState<string>('AURORA_INK');

    const [projectName,setProjectName]=useState<string>('');
    
    const [userNewScreenInput,setUserNewScreenInput]=useState<string>('');

  return (
    <div className='w-[300px] bg-gray-100 h-[90vh]'>
        <h2 className='font-medium text-lg'>
            Settings
        </h2>

        <div className='mt-5'>
            <h2 className='text-sm mb-1'>Project Name</h2>
            <Input placeholder='Project Name'
            onChange={(event) =>setProjectName(event.target.value)}
            />
        </div>

        <div className='mt-5'>
            <h2 className='text-sm mb-1'>Generate New Screen</h2>
            <Textarea placeholder='Enter Prompt to Generate screen using AI'
            onChange={(event)=>setUserNewScreenInput(event.target.value)}
            />
            <Button size={'sm'} className='mt-2 w-full'> <Sparkles /> Generate With AI</Button>
        </div>



        <div className='mt-5'>
            <h2 className='text-sm mb-1'>Themes</h2>
            <div className='h-[200px] overflow-auto'>
                <div>
                    {THEME_NAME_LIST.map((theme,index)=>(
                        <div key={index} className={`p-3 border rounded-xl mb-2
                            ${theme===selectedTheme&&'border-primary bg-primary/20'}
                            `}
                         onClick={()=> setSelectedTheme(theme)}>
                            <h2>{theme}</h2>
                            <div className='flex gap-2'>
                                <div className={`h-4 w-4 rounded-full`} style={{background:THEMES[theme].primary}} />
                                <div className={`h-4 w-4 rounded-full`} style={{background:THEMES[theme].secondary}} />
                                <div className={`h-4 w-4 rounded-full`} style={{background:THEMES[theme].accent}} />
                                <div className={`h-4 w-4 rounded-full`} style={{background:THEMES[theme].background}} />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
            
        </div>

        <div className='mt-5'>
            <h2 className='text-sm mb-1'>Extras</h2>
            <div className='flex gap-3'>

                <Button size={'sm'} variant={'outline'} className='mt-2 '> <Camera /> Screenshot</Button>
                <Button size={'sm'} variant={'outline'} className='mt-2 '> <Share /> Share</Button>
            </div>
        </div>
        
    </div>
  )
}

export default SettingSection
