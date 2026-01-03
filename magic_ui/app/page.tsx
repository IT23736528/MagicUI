import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <h2>
        Sub
      </h2>
      <Button>Sub</Button>
      <UserButton/>
    </div>
  );
}
