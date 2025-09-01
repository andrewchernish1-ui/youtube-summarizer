"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Youtube, Sparkles, Clock, FileText, Bot, List } from "lucide-react"

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const [error, setError] = useState("")
  const summaryRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to summary when it appears
  useEffect(() => {
    if (summary && summaryRef.current) {
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 500) // Small delay to ensure content is rendered
    }
  }, [summary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    setSummary("")
    setError("")

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "An error occurred.")
      }

      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Youtube className="h-8 w-8 text-accent" />
            </div>
            <div className="p-3 bg-accent/10 rounded-xl">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
          </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance bg-gradient-to-r from-blue-600 via-purple-600 to-accent bg-clip-text text-transparent">
            Краткое содержание YouTube-Видео
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Превратите любое YouTube-видео в краткое резюме с помощью ИИ за считанные секунды
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Начать работу</CardTitle>
            <CardDescription className="text-base">
              Вставьте ссылку на YouTube-видео ниже, чтобы создать мгновенное резюме
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-14 text-lg pl-12 pr-4 border-2 focus:border-accent/50 transition-colors"
                  disabled={isLoading}
                />
                <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Анализ видео...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Создать резюме
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Summary Display */}
        {summary && !isLoading && (
          <Card ref={summaryRef} className="shadow-lg border-0 bg-muted/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">Резюме видео</CardTitle>
                  <CardDescription>Выводы и ключевые моменты, созданные ИИ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-line text-muted-foreground leading-relaxed">{summary}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-8 border-accent/20 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-3 h-3 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-3 h-3 bg-accent rounded-full animate-bounce"></div>
                </div>
                <p className="text-accent font-medium">Обработка вашего видео...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && !isLoading && (
          <Card className="mb-8 border-destructive/20 bg-destructive/5 text-destructive">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center p-6 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">Экономия времени</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Получите суть видео за минуты вместо часов просмотра
            </p>
          </Card>

          <Card className="text-center p-6 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <List className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">Ключевые выводы</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Извлекаем самые важные моменты и идеи из контента
            </p>
          </Card>

          <Card className="text-center p-6 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Bot className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-2">На основе ИИ</h3>
            <p className="text-purple-700 dark:text-purple-300 text-sm">
              Используем передовые технологии для точного анализа
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p className="text-sm">На основе ИИ • Быстро • Точно • Бесплатно</p>
        </div>
      </div>
    </div>
  )
}
