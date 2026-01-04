"use client"
import React, { useState, useEffect } from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Loader, Send } from "lucide-react"

import { MorphingText } from "@/components/ui/morphing-text"
import { index } from 'drizzle-orm/gel-core'
import { suggestions } from '@/data/constant'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { se } from 'date-fns/locale'

const texts = [
  "Introducing",
  "MagicUI",
  "UIUX Generator",
  
]

const Hero = () => {

    const [userInput, setUserInput] = useState<string>("");

    const [device,setDevice]=useState<string>("website");
    const {user}=useUser();
    const router=useRouter();
    const [loading,setLoading]=useState<boolean>(false);
    
    const onCreateProject=async()=>{
        if(!user){
            router.push('/sign-in');
            return;
        }
    //create new project
    if(!userInput){
        return;
    }
    setLoading(true);

    const projectId = crypto.randomUUID();
    const result = await axios.post('/api/project', {
        userInput: userInput,
        device: device,
        projectId: projectId,
    }
    )

    console.log(result.data);
    setLoading(false);

    //navigate to project page
    router.push('/project/' + result.data.projectId);
    }

    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

  return (
    <div className='p-8 md:px-20 lg:px-40 xl:px-50 mt-20'>
        <div className='flex mb-5'>
            <MorphingText texts={texts} className="text-5xl font-semibold text-blue-500" />
        </div>
        
        
        <h2 className='text-5xl font-bold text-center'>Design High Quality <span className='text-primary'> Website and Mobile App </span>Designs</h2>
        <p className='text-center text-gray-600 text-lg mt-3'>Imagine your idea and type it and we will do the rest</p>
        <div className="flex mt-5 w-full gap-6 items-center justify-center ">
      <InputGroup className='max-w-xl bg-white z-10 rounded-2xl'>
        <InputGroupTextarea
          data-slot="input-group-control"
          className="flex field-sizing-content min-h-25 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
          placeholder="Enter your design idea here..."
          value={userInput}
          onChange={(event) => setUserInput(event.target?.value)}
        />
        <InputGroupAddon align="block-end">

            {mounted && (
            <Select defaultValue='website' onValueChange={(value) => setDevice(value as 'mobile' | 'website')}>
                <SelectTrigger className="w-45">
        <SelectValue placeholder="Type" />
                </SelectTrigger>    
                <SelectContent>
                    
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="mobile">MobileApp</SelectItem>
                </SelectContent>
            </Select>
            )}
          <InputGroupButton className="ml-auto" 
          disabled={loading}
          size="sm" variant="default" onClick={()=> onCreateProject()}>
            {loading?<Loader className="animate-spin"/>: <Send/>}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
    <div className='flex gap-5 mt-4'>
        {suggestions.map((suggestion,index)=>(
            <div key={index} className='p-2 border rounded-2xl flex flex-col items-center bg-white z-10 cursor-pointer'
            onClick={()=> setUserInput(suggestion?.description)}
            >
                <h2 className='text-lg'>{suggestion?.icon}</h2>
                <h2 className='text-center line-clamp-2 text-sm'>{suggestion?.name}</h2>
            </div>
        ))}
    </div>
    </div>
  )
}

export default Hero