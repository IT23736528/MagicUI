"use client"
import { RefreshDataContext } from '@/context/RefreshDataContext';
import { SettingContext } from '@/context/SettingContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import axios from 'axios';
import { set } from 'date-fns';
import { useEffect , useState } from 'react';

import React from 'react'


function provider({children}:any) {

    const [userDetail,setUserDetail]=useState();

    const [settingsDetail,setSettingsDetail]=useState();

    const [refreshData,setRefreshData]=useState();

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
      <SettingContext.Provider value={{
        settingsDetail,setSettingsDetail
      }}>
        <RefreshDataContext.Provider value={{refreshData,setRefreshData}}>
          <div>{children}</div>
        </RefreshDataContext.Provider>
      </SettingContext.Provider>
    </UserDetailContext.Provider>
  )
}

export default provider