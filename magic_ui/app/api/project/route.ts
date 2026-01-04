import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { ProjectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";



export async function POST(req: NextRequest){
    const {userInput, device} = await req.json();
    const user = await currentUser();
    const projectId = crypto.randomUUID();

    const result= await db.insert(ProjectTable).values({
        projectId: projectId,
        userId: user?.primaryEmailAddress?.emailAddress as string,
        device: device,
        userInput: userInput,
        
    }).returning();

    return NextResponse.json(result[0]);
}