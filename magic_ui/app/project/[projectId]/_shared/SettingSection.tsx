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
import { toast } from "sonner";

type Props = {
  projectDetail?: ProjectType;
  screenDescription?: string;
  takeScreenshot: () => void; // ✅ Fixed typo and type
};

const SettingSection = ({ projectDetail, screenDescription, takeScreenshot }: Props) => {
  const [projectName, setProjectName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("AURORA_INK");
  const [userNewScreenInput, setUserNewScreenInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { setRefreshData } = useContext<any>(RefreshDataContext);
  const { setSettingsDetail } = useContext<any>(SettingContext);

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
      const result = await axios.post('/api/generate-config', {
        projectId: projectDetail?.projectId,
        // ✅ Use local state 'projectName' and 'selectedTheme' 
        // to ensure AI knows about the latest changes made in the UI
        projectName: projectName, 
        deviceType: projectDetail?.device,
        theme: selectedTheme, 
        userInput: userNewScreenInput,
        oldScreenDescription: screenDescription,
      });

      toast.success("New screen generated!");
      setUserNewScreenInput(""); 
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
      <h2 className="font-bold text-xl mb-4 text-slate-800">Settings</h2>

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-center">
          <div className="bg-white p-5 rounded-xl shadow-2xl border border-blue-100 flex flex-col items-center gap-3">
            <Loader2Icon className="animate-spin text-blue-600 w-8 h-8" />
            <p className="text-sm font-semibold text-slate-700">Generating Screens...</p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block tracking-wider">
          Project Name
        </label>
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => {
            const newValue = e.target.value;
            setProjectName(newValue);
            setSettingsDetail((prev: any) => ({
              ...prev,
              projectName: newValue
            }));
          }}
          className="bg-white border-slate-200 focus:ring-blue-500"
        />
      </div>

      <div className="mt-8">
        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block tracking-wider">
          Generate New Screen
        </label>
        <Textarea
          placeholder="Describe a new screen (e.g., 'A settings page with dark mode toggle')"
          value={userNewScreenInput}
          onChange={(e) => setUserNewScreenInput(e.target.value)}
          className="bg-white min-h-[120px] border-slate-200 focus:ring-blue-500"
        />
        <Button 
          size="sm" 
          disabled={loading}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95" 
          onClick={GenerateNewScreen}
        >
          {loading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate With AI
        </Button>
      </div>

      <div className="mt-8">
        <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-wider">
          Themes
        </label>
        <div className="h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {THEME_NAME_LIST.map((theme) => (
            <div
              key={theme}
              className={`p-3 border rounded-xl cursor-pointer transition-all bg-white shadow-sm ${
                theme === selectedTheme
                  ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50/30"
                  : "border-slate-200 hover:border-blue-300"
              }`}
              onClick={() => onThemeSelect(theme)}
            >
              <h2 className="text-[11px] font-bold mb-2 uppercase tracking-tight text-slate-600">
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

      <div className="mt-8 pt-4 border-t border-slate-200 mb-10">
        <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-wider">
          Actions
        </label>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" className="justify-start border-slate-200 hover:bg-slate-50" onClick={takeScreenshot}>
            <Camera className="mr-2 h-4 w-4" />
            Export Screenshot
          </Button>
          <Button size="sm" variant="outline" className="justify-start border-slate-200 hover:bg-slate-50">
            <Share className="mr-2 h-4 w-4" />
            Share Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingSection;