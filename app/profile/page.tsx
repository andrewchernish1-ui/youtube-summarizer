"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, History, User, LogOut, Youtube, Calendar } from "lucide-react"

interface VideoSummary {
  id: string
  video_url: string
  summary: string
  created_at: string
}

interface UsageStats {
  todayCount: number
  totalCount: number
  remainingRequests: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [summaries, setSummaries] = useState<VideoSummary[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUser(user)
      await loadUserData(user.id)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const loadUserData = async (userId: string) => {
    try {
      // Load summaries
      const { data: summariesData, error: summariesError } = await supabase
        .from('video_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (summariesError) {
        console.error('Error loading summaries:', summariesError)
      } else {
        setSummaries(summariesData || [])
      }

      // Load usage stats
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
      const totalCount = summariesData?.length || 0
      const remainingRequests = Math.max(0, 3 - todayCount)

      console.log('Profile stats:', { todayCount, totalCount, remainingRequests, usageData })

      setStats({
        todayCount,
        totalCount,
        remainingRequests
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <User className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Профиль пользователя</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/')}>
              На главную
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                видео обработано
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                видео в истории
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Осталось</CardTitle>
              <Youtube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.remainingRequests ?? 3}</div>
              <p className="text-xs text-muted-foreground">
                осталось запросов
              </p>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              История обработок
            </CardTitle>
            <CardDescription>
              Ваши последние обработанные видео
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summaries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>У вас пока нет обработанных видео</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map((summary) => (
                  <div key={summary.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <a
                          href={summary.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          {summary.video_url}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(summary.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary">Обработано</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {summary.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
