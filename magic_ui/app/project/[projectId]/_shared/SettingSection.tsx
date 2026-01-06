"use client";
import React, { useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, Share, Sparkles } from "lucide-react";
import { THEME_NAME_LIST, THEMES, ThemeKey } from "@/data/Themes";
import { ProjectType } from "@/type/types";
import { SettingContext } from "@/context/SettingContext";

type Props = {
  projectDetail?: ProjectType;
};

const SettingSection = ({ projectDetail }: Props) => {
  const [projectName, setProjectName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("AURORA_INK");
  const [userNewScreenInput, setUserNewScreenInput] = useState("");
  
  // Use context to sync global settings
  const { settingsDetail, setSettingsDetail } = useContext<any>(SettingContext);

  // ✅ Sync local state with project data when it loads
  useEffect(() => {
    if (projectDetail) {
      setProjectName(projectDetail.projectName || "");
      setSelectedTheme(projectDetail.theme || "AURORA_INK");
      setSettingsDetail(projectDetail);
    }
  }, [projectDetail, setSettingsDetail]);

  // ✅ Fixed syntax: Added missing closing brace and updated context
  const onThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    setSettingsDetail((prev: any) => ({
      ...prev,
      theme: theme
    }));
  };

  return (
    <div className="w-[300px] bg-gray-100 h-[calc(100vh-65px)] p-4 border-r overflow-y-auto">
      <h2 className="font-bold text-xl mb-4">Settings</h2>

      {/* Project Name Section */}
      <div className="mt-5">
        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">
          Project Name
        </label>
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => {setProjectName(e.target.value)
            setSettingsDetail((prev: any) => ({
              ...prev,
               projectName: projectName
            }));
          }
          }
          className="bg-white"
        />
      </div>

      {/* Generate Screen Section */}
      <div className="mt-8">
        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">
          Generate New Screen
        </label>
        <Textarea
          placeholder="Enter prompt to generate a screen using AI"
          value={userNewScreenInput}
          onChange={(e) => setUserNewScreenInput(e.target.value)}
          className="bg-white min-h-[100px]"
        />
        <Button size="sm" className="mt-3 w-full bg-blue-600 hover:bg-blue-700">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate With AI
        </Button>
      </div>

      {/* Themes Selection Section */}
      <div className="mt-8">
        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
          Themes
        </label>
        <div className="h-[250px] overflow-y-auto pr-2 space-y-2">
          {THEME_NAME_LIST.map((theme) => (
            <div
              key={theme}
              className={`p-3 border rounded-xl cursor-pointer transition-all hover:border-blue-400 bg-white ${
                theme === selectedTheme
                  ? "border-blue-600 ring-1 ring-blue-600"
                  : "border-gray-200"
              }`}
              onClick={() => onThemeSelect(theme)}
            >
              <h2 className="text-sm font-medium mb-2 uppercase tracking-tight text-gray-700">
                {theme.replace("_", " ")}
              </h2>
              <div className="flex gap-2">
                <div
                  className="h-5 w-5 rounded-full border border-black/5"
                  style={{ background: THEMES[theme as ThemeKey].primary }}
                  title="Primary"
                />
                <div
                  className="h-5 w-5 rounded-full border border-black/5"
                  style={{ background: THEMES[theme as ThemeKey].accent }}
                  title="Accent"
                />
                <div
                  className="h-5 w-5 rounded-full border border-black/5"
                  style={{ background: THEMES[theme as ThemeKey].background }}
                  title="Background"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extras Section */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
          Actions
        </label>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" className="justify-start">
            <Camera className="mr-2 h-4 w-4" />
            Export Screenshot
          </Button>
          <Button size="sm" variant="outline" className="justify-start">
            <Share className="mr-2 h-4 w-4" />
            Share Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingSection;