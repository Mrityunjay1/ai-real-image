"use client"

import type React from "react"

import { useState } from "react"
import { Paintbrush, Camera, Palette, Brush, Mountain, Sparkles, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type PromptTemplate = {
  name: string
  description: string
  template: string
  icon: React.ElementType
  tags: string[]
}

const promptTemplates: PromptTemplate[] = [
  {
    name: "Photorealistic",
    description: "Highly detailed and realistic images",
    template:
      "Photorealistic image of [subject], highly detailed, sharp focus, 8k, professional photography, natural lighting",
    icon: Camera,
    tags: ["realistic", "photography"],
  },
  {
    name: "Oil Painting",
    description: "Classic oil painting style",
    template: "Oil painting of [subject], detailed brushwork, vibrant colors, artistic, in the style of classical art",
    icon: Palette,
    tags: ["art", "painting"],
  },
  {
    name: "Watercolor",
    description: "Soft watercolor illustration",
    template: "Watercolor painting of [subject], soft colors, flowing, artistic, delicate brushstrokes",
    icon: Brush,
    tags: ["art", "painting"],
  },
  {
    name: "Fantasy",
    description: "Magical fantasy scene",
    template: "Fantasy scene of [subject], magical, ethereal, mystical atmosphere, detailed, vibrant colors",
    icon: Sparkles,
    tags: ["fantasy", "magical"],
  },
  {
    name: "Landscape",
    description: "Beautiful natural landscape",
    template: "Breathtaking landscape of [subject], panoramic view, golden hour lighting, atmospheric, detailed",
    icon: Mountain,
    tags: ["nature", "scenery"],
  },
  {
    name: "Concept Art",
    description: "Professional concept art",
    template:
      "Professional concept art of [subject], detailed, vibrant colors, cinematic lighting, trending on ArtStation",
    icon: Paintbrush,
    tags: ["art", "design"],
  },
]

interface PromptTemplatesProps {
  onSelectTemplate: (template: string) => void
}

export function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTemplates = selectedCategory
    ? promptTemplates.filter((template) => template.tags.includes(selectedCategory))
    : promptTemplates

  const categories = Array.from(new Set(promptTemplates.flatMap((template) => template.tags)))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Prompt Templates</h3>

        <div className="flex items-center gap-2">
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-400"
              onClick={() => setSelectedCategory(null)}
            >
              Clear
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 border-gray-700 bg-gray-800 text-xs">
                Filter
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 text-gray-200">
              {categories.map((category) => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)} className="capitalize">
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-3">
        {filteredTemplates.map((template) => {
          const Icon = template.icon
          return (
            <Button
              key={template.name}
              variant="outline"
              className="flex h-auto flex-col items-start justify-start gap-1 border-gray-700 bg-gray-800/50 p-3 text-left hover:bg-gray-700/50"
              onClick={() => onSelectTemplate(template.template)}
            >
              <div className="flex w-full items-center gap-2">
                <Icon className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-200">{template.name}</span>
              </div>
              <p className="line-clamp-2 text-xs text-gray-400">{template.description}</p>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

