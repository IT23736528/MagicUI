"use client"
import axios from 'axios';
import { useEffect } from 'react';
import React from 'react'

function provider({children}:any) {

    useEffect(()=> {
        CreateNewUser();
    }, [])
 
    const CreateNewUser=async ()=> {
        const result=await axios.post('/api/user',{});

        console.log("User created or fetched:", result.data);
    }
  return (
    <div>{children}</div>
  )
}

export default provider