import { GripVertical } from 'lucide-react';
import React from 'react'
import { Rnd } from "react-rnd";

type Props = {
    x: number,
    y: number,
    setPannigEnabled: (enabled:boolean)=>void,
    width: number,
    height: number,
}

const ScreenFrame = ({x,y,setPannigEnabled,width,height}: Props) => {
  return (
    <Rnd
    default={{
        x,
        y,
        width: width,
        height: height
    }}
    dragHandleClassName='drag-handle'
    enableResizing={{
        bottomRight: true,
        bottomLeft: true,
        
    }}

    onDragStart={()=>setPannigEnabled(false)}
    onDragStop={()=> setPannigEnabled(true)}
    onResizeStart={()=> setPannigEnabled(false)}
    onResizeStop={()=> setPannigEnabled(true)}
    >
        <div className='drag-handle flex gap-2 items-center cursor-move bg-gray-100 p-2 '>
             <GripVertical className='text-gray-500 h-4 w-4'/>Drag Here
        </div>
        <div className='bg-white p-5'>
            <h2>Example</h2>
        </div>
    </Rnd>
  )
}

export default ScreenFrame