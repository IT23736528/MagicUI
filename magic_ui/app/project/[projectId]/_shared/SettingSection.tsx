"use client";
import React, { useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, Loader2Icon, Share, Sparkles } from "lucide-react";
import { THEME_NAME_LIST, THEMES, ThemeKey } from "@/data/Themes";
import { ProjectType } from "@/type/types";
import { SettingContext } from "@/context/SettingContext";
import axios from "axios";
import { RefreshDataContext } from "@/context/RefreshDataContext";
import { toast } from "sonner"; // Added for better feedback

type Props = {
  projectDetail?: ProjectType;
  screenDescription?: string;
};

const SettingSection = ({ projectDetail, screenDescription }: Props) => {
  const [projectName, setProjectName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("AURORA_INK");
  const [userNewScreenInput, setUserNewScreenInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Destructure properly from context
  const { setRefreshData } = useContext<any>(RefreshDataContext);
  const { setSettingsDetail } = useContext<any>(SettingContext);

  // Sync local state when projectDetail loads
  useEffect(() => {
    if (projectDetail) {
      setProjectName(projectDetail.projectName || "");
      setSelectedTheme(projectDetail.theme || "AURORA_INK");
      setSettingsDetail(projectDetail);
    }
  }, [projectDetail, setSettingsDetail]);

  const onThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    setSettingsDetail((prev: any) => ({
      ...prev,
      theme: theme
    }));
  };

  const GenerateNewScreen = async () => {
    if (!userNewScreenInput.trim()) {
      toast.error("Please enter a prompt for the new screen");
      return;
    }

    try {
      setLoading(true);
      // Passing userNewScreenInput as the userInput for the AI
      const result = await axios.post('/api/generate-config', {
        projectId: projectDetail?.projectId,
        projectName: projectName,
        deviceType: projectDetail?.device,
        theme: selectedTheme,
        userInput: userNewScreenInput, // Make sure to pass the new prompt!
        oldScreenDescription: screenDescription,
      });

      toast.success("New screen generated!");
      setUserNewScreenInput(""); // Clear input on success
      setRefreshData({ method: 'screenConfig', date: Date.now() });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate screen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[300px] bg-gray-100 h-[calc(100vh-65px)] p-4 border-r overflow-y-auto relative">
      <h2 className="font-bold text-xl mb-4">Settings</h2>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-center">
          <div className="bg-white p-4 rounded-xl shadow-lg border flex flex-col items-center gap-2">
            <Loader2Icon className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Generating Config...</p>
          </div>
        </div>
      )}

      {/* Project Name Section */}
      <div className="mt-5">
        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">
          Project Name
        </label>
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => {
            const newValue = e.target.value;
            setProjectName(newValue);
            // ✅ Fix: Use newValue directly instead of the state variable 'projectName'
            setSettingsDetail((prev: any) => ({
              ...prev,
              projectName: newValue
            }));
          }}
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
        <Button 
          size="sm" 
          disabled={loading}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700" 
          onClick={GenerateNewScreen}
        >
          {loading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate With AI
        </Button>
      </div>

      {/* Themes Selection Section */}
      <div className="mt-8">
        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
          Themes
        </label>
        <div className="h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {THEME_NAME_LIST.map((theme) => (
            <div
              key={theme}
              className={`p-3 border rounded-xl cursor-pointer transition-all hover:border-blue-400 bg-white ${
                theme === selectedTheme
                  ? "border-blue-600 ring-1 ring-blue-600 shadow-sm"
                  : "border-gray-200"
              }`}
              onClick={() => onThemeSelect(theme)}
            >
              <h2 className="text-xs font-bold mb-2 uppercase tracking-tight text-gray-700">
                {theme.replace("_", " ")}
              </h2>
              <div className="flex gap-2">
                <div className="h-5 w-5 rounded-full border border-black/5" style={{ background: THEMES[theme as ThemeKey].primary }} />
                <div className="h-5 w-5 rounded-full border border-black/5" style={{ background: THEMES[theme as ThemeKey].accent }} />
                <div className="h-5 w-5 rounded-full border border-black/5" style={{ background: THEMES[theme as ThemeKey].background }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extras Section */}
      <div className="mt-8 pt-4 border-t border-gray-200 mb-10">
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