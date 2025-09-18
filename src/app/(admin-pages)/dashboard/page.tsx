'use client'
import React from 'react'
import { signOut } from "next-auth/react";
import { Button } from '@/components/ui/button';


const Dashboard = () => {
    const handleLogout = ()=>{
        signOut({ callbackUrl: "/sign-in" });
    }
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      This is the admin page
      <Button onClick={handleLogout} >Logout</Button>
    </div>
  )
}

export default Dashboard
