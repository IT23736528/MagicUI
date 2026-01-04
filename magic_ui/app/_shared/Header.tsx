"use client"

import React from 'react'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SignInButton, useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

const Header = () => {
  const {user}=useUser();
  return (
    <div className='flex items-center justify-between'>
      <div className="flex gap-2 items-center">
          <Image src={'/logo.png'} alt="Magic UI Logo" width={40} height={40} />
          <h2 className="text-xl font-semibold"> <span className='text-primary'>Magic</span>UI</h2>
      </div>

      <ul className="flex gap-10 items-center text-lg">
        <li className="cursor-pointer transition-colors hover:text-primary">Home</li>
        <li className="cursor-pointer transition-colors hover:text-primary">Pricing</li>
      </ul>
      {!user? 
      <SignInButton mode='modal'>
      <Button>Get Started</Button>
      </SignInButton> : 
      <UserButton/>
      } 
    </div>
  )
}

export default Header
