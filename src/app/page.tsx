"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useDebounce } from "@uidotdev/usehooks"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink, ImageIcon, Loader2, Lightbulb, Sparkles, Download, Copy } from "lucide-react"

import Spinner from "@/components/spinner"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PromptTemplates } from "@/components/prompt-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

type ImageResponse = {
  b64_json: string
  timings: { inference: number }
}

// Default settings values
const defaultSettings = {
  aspectRatio: "1:1",
  quality: "standard",
  styleStrength: 75,
  model: "standard",
  guidanceScale: 7,
  steps: 30,
}

type Settings = typeof defaultSettings

export default function Home() {
  const [userAPIKey, setUserAPIKey] = useState("")
  const [prompt, setPrompt] = useState("")
  const [iterativeMode, setIterativeMode] = useState(false)
  const debouncedPrompt = useDebounce(prompt, 300)
  const [generations, setGenerations] = useState<
    {
      prompt: string
      image: ImageResponse
    }[]
  >([])
  const [activeIndex, setActiveIndex] = useState<number>()
  const [showTemplates, setShowTemplates] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [pendingSettings, setPendingSettings] = useState<Settings>(defaultSettings)
  const [settingsChanged, setSettingsChanged] = useState(false)

  const {
    data: image,
    isFetching,
    error,
    refetch,
  } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt, userAPIKey, iterativeMode, settings],
    queryFn: async () => {
      const res = await fetch("/api/generateImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          userAPIKey,
          iterativeMode,
          // Include settings in the API request
          aspectRatio: settings.aspectRatio,
          quality: settings.quality,
          styleStrength: settings.styleStrength,
          model: settings.model,
          guidanceScale: settings.guidanceScale,
          steps: settings.steps,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      return (await res.json()) as ImageResponse
    },
    enabled: !!debouncedPrompt.trim(),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })

  const isDebouncing = prompt !== debouncedPrompt

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => [...images, { prompt, image }])
      setActiveIndex(generations.length)
    }
  }, [generations, image, prompt])

  // Check if settings have changed
  useEffect(() => {
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(pendingSettings)
    setSettingsChanged(hasChanged)
  }, [settings, pendingSettings])

  const activeImage = activeIndex !== undefined ? generations[activeIndex]?.image : undefined

  const handleTemplateSelect = (template: string) => {
    setPrompt(template.replace("[subject]", ""))
    setShowTemplates(false)
  }

  // Settings handlers
  const handleSettingChange = (key: keyof Settings, value: any) => {
    setPendingSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const applySettings = () => {
    setSettings(pendingSettings)
    toast({
      title: "Settings applied",
      description: "Your new settings will be used for future generations",
    })

    // If there's already a prompt, regenerate the image with new settings
    if (debouncedPrompt.trim()) {
      refetch()
    }
  }

  const resetSettings = () => {
    setPendingSettings(defaultSettings)
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults",
    })
  }

  // Image action handlers
  const handleDownload = () => {
    if (!activeImage) return

    const link = document.createElement("a")
    link.href = `data:image/png;base64,${activeImage.b64_json}`
    link.download = `keystroke-imagen-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Image downloaded",
      description: "The image has been saved to your device",
    })
  }

  const handleCopy = async () => {
    if (!activeImage) return

    try {
      const blob = await fetch(`data:image/png;base64,${activeImage.b64_json}`).then((r) => r.blob())
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])

      toast({
        title: "Image copied",
        description: "The image has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Your browser may not support this feature",
        variant: "destructive",
      })
    }
  }

  const handleClearHistory = () => {
    setGenerations([])
    setActiveIndex(undefined)

    toast({
      title: "History cleared",
      description: "All generated images have been removed",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="mb-6 sm:mb-12">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                KeyStrokeImagen
              </span>
            </h1>

            <div className="w-full max-w-xs">
              <label className="mb-1 block text-xs text-gray-400">
                [Optional] Add your{" "}
                <Button variant="link" className="h-auto p-0 text-xs text-blue-400 hover:text-blue-300" asChild>
                  <a
                    href="https://api.together.xyz/settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    Together API Key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </label>
              <Input
                placeholder="API Key"
                type="password"
                value={userAPIKey}
                onChange={(e) => setUserAPIKey(e.target.value)}
                className="border-gray-700 bg-gray-800 text-gray-200 placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <p className="mt-2 text-center text-sm text-gray-400 sm:mt-4 sm:text-left sm:text-base">
            Generate stunning images in real-time as you type your prompt
          </p>
        </header>

        {/* Main content */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1fr,1.5fr] xl:grid-cols-[1fr,2fr]">
          {/* Form Section */}
          <div className="order-2 lg:order-1">
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="space-y-4">
                <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
                  <CardContent className="p-4 sm:p-6">
                    <form className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label htmlFor="prompt" className="block text-sm font-medium">
                            Image Description
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-purple-400"
                            onClick={() => setShowTemplates(!showTemplates)}
                          >
                            <Lightbulb className="h-3 w-3" />
                            <span className="hidden sm:inline">{showTemplates ? "Hide" : "Show"} Templates</span>
                            <span className="sm:hidden">Templates</span>
                          </Button>
                        </div>

                        {showTemplates && (
                          <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                            <PromptTemplates onSelectTemplate={handleTemplateSelect} />
                          </div>
                        )}

                        <div className="relative">
                          <Textarea
                            id="prompt"
                            rows={6}
                            spellCheck={false}
                            placeholder="Describe your image in detail..."
                            required
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="resize-none border-gray-700 bg-gray-800 text-gray-200 placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                          />
                          {(isFetching || isDebouncing) && (
                            <div className="absolute bottom-3 right-3">
                              <Spinner className="h-5 w-5 text-purple-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <label
                          htmlFor="iterative-mode"
                          className="flex cursor-pointer items-center gap-2 text-sm"
                          title="Use earlier images as references for consistency"
                        >
                          <span>Consistency mode</span>
                          <Switch
                            id="iterative-mode"
                            checked={iterativeMode}
                            onCheckedChange={setIterativeMode}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </label>

                        {activeImage && (
                          <Badge variant="outline" className="w-fit text-xs text-gray-400">
                            Generated in {activeImage.timings.inference.toFixed(2)}s
                          </Badge>
                        )}
                      </div>
                    </form>
                  </CardContent>
                  {error && (
                    <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-300">
                      <p className="font-medium">Error generating image:</p>
                      <p className="mt-1">{(error as Error).message}</p>
                    </div>
                  )}
                </Card>

                {/* Instructions */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 text-sm text-gray-400">
                  <h3 className="mb-2 font-medium text-gray-300">Tips:</h3>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Be specific about what you want to see</li>
                    <li>Include details about style, lighting, and composition</li>
                    <li>Try different prompts to explore various results</li>
                    <li>Enable consistency mode to maintain style across generations</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-sm font-medium">Image Settings</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs text-gray-400">Aspect Ratio</label>
                              <select
                                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200"
                                value={pendingSettings.aspectRatio}
                                onChange={(e) => handleSettingChange("aspectRatio", e.target.value)}
                              >
                                <option value="1:1">Square (1:1)</option>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                                <option value="4:3">Standard (4:3)</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-400">Quality</label>
                              <select
                                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200"
                                value={pendingSettings.quality}
                                onChange={(e) => handleSettingChange("quality", e.target.value)}
                              >
                                <option value="standard">Standard</option>
                                <option value="high">High</option>
                                <option value="max">Maximum</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-gray-400">Style Strength</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={pendingSettings.styleStrength}
                              onChange={(e) => handleSettingChange("styleStrength", Number.parseInt(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Subtle</span>
                              <span>Strong</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="mb-2 text-sm font-medium">Advanced Settings</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs text-gray-400">Model</label>
                            <select
                              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200"
                              value={pendingSettings.model}
                              onChange={(e) => handleSettingChange("model", e.target.value)}
                            >
                              <option value="standard">Standard (Default)</option>
                              <option value="creative">Creative</option>
                              <option value="realistic">Realistic</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs text-gray-400">Guidance Scale</label>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={pendingSettings.guidanceScale}
                                onChange={(e) => handleSettingChange("guidanceScale", Number.parseInt(e.target.value))}
                                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-400">Steps</label>
                              <input
                                type="number"
                                min="10"
                                max="150"
                                value={pendingSettings.steps}
                                onChange={(e) => handleSettingChange("steps", Number.parseInt(e.target.value))}
                                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          variant="outline"
                          className="border-gray-700 bg-gray-800 text-gray-200 sm:mr-2"
                          onClick={resetSettings}
                        >
                          Reset to Defaults
                        </Button>
                        <Button
                          className="bg-purple-600 text-white hover:bg-purple-700"
                          onClick={applySettings}
                          disabled={!settingsChanged}
                        >
                          Apply Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Image Display Area */}
          <div className="order-1 flex flex-col lg:order-2">
            <div className="flex-1 rounded-lg border border-gray-800 bg-gray-900/30 p-4">
              {!activeImage || !prompt ? (
                <div className="flex h-[250px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 p-4 text-center sm:h-[350px] sm:p-6 md:h-[400px]">
                  <div className="mb-4 rounded-full bg-gray-800/50 p-4">
                    <ImageIcon className="h-8 w-8 text-gray-500 sm:h-10 sm:w-10" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300 sm:text-xl">Start typing to generate images</h3>
                  <p className="mt-2 max-w-md text-xs text-gray-400 sm:text-sm">
                    Your images will appear here as you type. The more detailed your description, the better the
                    results.
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="relative flex-1 overflow-hidden rounded-lg bg-gray-800/50">
                    <div className="aspect-square w-full overflow-hidden sm:aspect-auto sm:h-[350px] md:h-[400px]">
                      <Image
                        width={1024}
                        height={768}
                        src={`data:image/png;base64,${activeImage.b64_json}`}
                        alt={generations[activeIndex!]?.prompt || "Generated image"}
                        className={`h-full w-full object-contain ${isFetching ? "animate-pulse" : ""}`}
                        priority
                      />
                    </div>
                    {isFetching && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500 sm:h-10 sm:w-10" />
                      </div>
                    )}
                  </div>

                  {activeImage && (
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800 text-gray-200"
                        onClick={handleDownload}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800 text-gray-200"
                        onClick={handleCopy}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        <span className="hidden sm:inline">Copy</span>
                      </Button>
                      <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                        <Sparkles className="mr-1 h-3 w-3" />
                        <span className="hidden sm:inline">Enhance</span>
                      </Button>
                    </div>
                  )}

                  {generations.length > 0 && (
                    <>
                      <Separator className="my-4 bg-gray-800" />
                      <div className="mt-2">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-400">History ({generations.length})</h3>
                          {generations.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-gray-400"
                              onClick={handleClearHistory}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                        <div className="flex max-w-full gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-700">
                          <div className="flex min-w-0 gap-3 pb-1">
                            {generations.map((generatedImage, i) => (
                              <button
                                key={i}
                                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition hover:opacity-100 sm:h-20 sm:w-20 ${
                                  activeIndex === i
                                    ? "border-purple-500 opacity-100"
                                    : "border-transparent opacity-60 hover:border-gray-700"
                                }`}
                                onClick={() => setActiveIndex(i)}
                              >
                                <Image
                                  width={80}
                                  height={80}
                                  src={`data:image/png;base64,${generatedImage.image.b64_json}`}
                                  alt={`Generated image ${i + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

