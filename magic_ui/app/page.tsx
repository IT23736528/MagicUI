import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Header from "./_shared/Header";
import Hero from "./_shared/Hero";

export default function Home() {
  return (
    <div className="relative">
      <div className="relative z-50">
        <Header/>
      </div>
      <Hero/>
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] bg-purple-400/20 blur-[120px] rounded-full -z-10"/>

      <div className="absolute -top-20 -right-[200px] h-[500px] w-[500px] bg-pink-400/20 blur-[120px] rounded-full -z-10"/>

      <div className="absolute -bottom-[200px] left-1/8 h-[500px] w-[500px] bg-blue-400/20 blur-[120px] rounded-full -z-10"/>

      <div className="absolute top-[200px] left-1/2 h-[500px] w-[500px] bg-orange-400/20 blur-[120px] rounded-full -z-10"/>
    </div>
  );
}
