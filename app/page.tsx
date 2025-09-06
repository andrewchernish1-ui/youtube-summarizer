"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Youtube, Sparkles, Clock, FileText, Bot, List, LogOut, User } from "lucide-react"
import { supabase } from "@/lib/utils"

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        router.push('/auth')
      } else {
        await loadRemainingRequests(user.id)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/auth')
      } else {
        loadRemainingRequests(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const loadRemainingRequests = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      let { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('video_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (usageError && usageError.code === 'PGRST116') {
        // No record found, create initial record
        const { error: insertError } = await supabase
          .from('user_usage')
          .insert({
            user_id: userId,
            date: today,
            video_count: 0
          })

        if (insertError) {
          console.error('Error creating usage record:', insertError)
        } else {
          usageData = { video_count: 0 }
        }
      } else if (usageError) {
        console.error('Error loading usage:', usageError)
      }

      const todayCount = usageData?.video_count || 0
      const remaining = Math.max(0, 3 - todayCount)

      console.log('Main page remaining requests:', { todayCount, remaining, usageData })
      setRemainingRequests(remaining)
    } catch (error) {
      console.error('Error loading remaining requests:', error)
    }
  }

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    setSummary("")
    setError("")

    try {
      console.log('Client: Sending request to /api/summarize with URL:', url);

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: url }),
        credentials: 'include',
      })

      console.log('Client: Response status:', response.status);
      console.log('Client: Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();

      console.log('API Response:', {
        status: response.status,
        contentType,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      });

      // Try to parse as JSON regardless of content-type
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        if (response.ok) {
          throw new Error('Сервер вернул неожиданный ответ. Попробуйте позже.');
        } else {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || "Произошла ошибка при обработке запроса.")
      }

      setSummary(data.summary)

      // Update remaining requests after successful summarization
      if (user) {
        await loadRemainingRequests(user.id)
      }
    } catch (err: any) {
      console.error('Client error:', err);
      setError(err.message || 'Произошла непредвиденная ошибка.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* User Info and Sign Out */}
          {user && (
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Осталось запросов: {remainingRequests !== null ? remainingRequests : '...'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/profile')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Профиль
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </Button>
              </div>
            </div>
          )}

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
