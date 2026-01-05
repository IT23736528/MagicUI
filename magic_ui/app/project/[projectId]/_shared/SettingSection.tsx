"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, Share, Sparkles } from "lucide-react";
import { THEME_NAME_LIST, THEMES } from "@/data/Themes";
import { ProjectType } from "@/type/types";

type Props = {
  projectDetail?: ProjectType;
};

const SettingSection = ({ projectDetail }: Props) => {
  const [projectName, setProjectName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("AURORA_INK");
  const [userNewScreenInput, setUserNewScreenInput] = useState("");

  // ✅ Fixed: Sync project name when projectDetail changes
  useEffect(() => {
    setProjectName(projectDetail?.projectName || "");
  }, [projectDetail]);

  return (
    <div className="w-[300px] bg-gray-100 h-[90vh] p-4">
      <h2 className="font-medium text-lg">Settings</h2>

      {/* Project Name */}
      <div className="mt-5">
        <h2 className="text-sm mb-1">Project Name</h2>
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* Generate Screen */}
      <div className="mt-5">
        <h2 className="text-sm mb-1">Generate New Screen</h2>
        <Textarea
          placeholder="Enter prompt to generate a screen using AI"
          value={userNewScreenInput}
          onChange={(e) => setUserNewScreenInput(e.target.value)}
        />
        <Button size="sm" className="mt-2 w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate With AI
        </Button>
      </div>

      {/* Themes */}
      <div className="mt-5">
        <h2 className="text-sm mb-1">Themes</h2>
        <div className="h-[200px] overflow-auto">
          {THEME_NAME_LIST.map((theme) => (
            <div
              key={theme}
              className={`p-3 border rounded-xl mb-2 cursor-pointer ${
                theme === selectedTheme
                  ? "border-primary bg-primary/20"
                  : ""
              }`}
              onClick={() => setSelectedTheme(theme)}
            >
              <h2>{theme}</h2>
              <div className="flex gap-2 mt-1">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: THEMES[theme].primary }}
                />
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: THEMES[theme].secondary }}
                />
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: THEMES[theme].accent }}
                />
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: THEMES[theme].background }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extras */}
      <div className="mt-5">
        <h2 className="text-sm mb-1">Extras</h2>
        <div className="flex gap-3">
          <Button size="sm" variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Screenshot
          </Button>
          <Button size="sm" variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingSection;