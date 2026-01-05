import React, { useState } from 'react'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ScreenFrame from './ScreenFrame';
import { ProjectType, ScreenConfig } from '@/type/types';

type Props = {
    projectDetail: ProjectType | undefined,
    screenConfig: ScreenConfig[],
    loading?: boolean
}

const Canvas = ({projectDetail, screenConfig, loading}: Props) => {

    const [panningEnabled, setPanningEnabled] = useState(true);

    const isMobile = projectDetail?.device === "mobile";

    const SCREEN_WIDTH= isMobile?400:1280;
    const SCREEN_HEIGHT= isMobile?800:800;
    const GAP=isMobile ? 30 : 70;

  return (
    <div className='w-full h-screen bg-gray-100'
        style={{
            backgroundImage:"radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)",
            backgroundSize:"20px 20px"
        }}>
        <TransformWrapper
        initialScale={1}
        initialPositionX={200}
        initialPositionY={100}
        limitToBounds={false}
        wheel={{ step: 0.8}}
        doubleClick={{ disabled: false}}
        panning={{disabled: !panningEnabled}}
        >
            <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%'}}
            
            >
                {screenConfig?.map((screen, index)=> (
                    <ScreenFrame x={index*(SCREEN_WIDTH + GAP)} y={0} 
                    width={SCREEN_WIDTH} height={SCREEN_HEIGHT}
                    key={index} setPannigEnabled={setPanningEnabled}/>
                ))}
                
                

            </TransformComponent>
        </TransformWrapper>
    </div>
  )
}

export default Canvas