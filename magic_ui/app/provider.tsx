"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import axios from 'axios';
import { set } from 'date-fns';
import { useEffect , useState } from 'react';

import React from 'react'


function provider({children}:any) {

    const [userDetail,setUserDetail]=useState()
    useEffect(()=> {
        CreateNewUser();
    }, [])
 
    const CreateNewUser=async ()=> {
        const result=await axios.post('/api/user',{});

        console.log("User created or fetched:", result.data);
        setUserDetail(result?.data);
    }
  return (
    <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
    <div>{children}</div>
    </UserDetailContext.Provider>
  )
}

export default provider