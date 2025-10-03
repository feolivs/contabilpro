"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, FileText, CheckSquare, DollarSign, Calendar } from "lucide-react"
import { useClientTimeline } from "@/hooks/use-timeline"
import { TimelineEvent } from "./timeline-event"
import type { TimelineCategory } from "@/types/timeline"

interface ClientTimelineSectionProps {
  clientId: string
}

const CATEGORIES: Array<{ value: TimelineCategory | "all"; label: string; icon: typeof FileText }> = [
  { value: "all", label: "Todas", icon: Calendar },
  { value: "documents", label: "Documentos", icon: FileText },
  { value: "tasks", label: "Tarefas", icon: CheckSquare },
  { value: "entries", label: "Lançamentos", icon: DollarSign }
]

const PAGE_SIZE = 10

export function ClientTimelineSection({ clientId }: ClientTimelineSectionProps) {
  const [activeCategory, setActiveCategory] = useState<TimelineCategory | "all">("all")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const {
    events,
    isLoading,
    error,
    hasMore,
    loadMore,
    isLoadingMore
  } = useClientTimeline(clientId, {
    category: activeCategory === "all" ? undefined : activeCategory,
    limit: visibleCount
  })

  // Garantir que events seja sempre um array
  const safeEvents = events || []

  const handleCategoryChange = (category: TimelineCategory | "all") => {
    setActiveCategory(category)
    setVisibleCount(PAGE_SIZE)
  }

  const handleLoadMore = () => {
    const newCount = visibleCount + PAGE_SIZE
    setVisibleCount(newCount)
    loadMore()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Timeline do Cliente</h2>
        <p className="text-muted-foreground">
          Histórico completo de atividades e eventos
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => handleCategoryChange(v as TimelineCategory | "all")}>
        <TabsList className="grid w-full grid-cols-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.charAt(0)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent
            key={category.value}
            value={category.value}
            className="space-y-4 mt-6"
          >
            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Carregando timeline...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="p-6">
                  <div className="text-center text-destructive">
                    <p className="font-semibold">Erro ao carregar timeline</p>
                    <p className="text-sm mt-1">{error.message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && safeEvents.length === 0 && (
              <Card>
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Calendar className="w-12 h-12 opacity-50" />
                    <div className="text-center">
                      <p className="font-semibold">Nenhum evento encontrado</p>
                      <p className="text-sm mt-1">
                        {activeCategory === "all"
                          ? "Ainda não há atividades registradas para este cliente."
                          : `Não há eventos na categoria "${CATEGORIES.find(c => c.value === activeCategory)?.label}".`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events List */}
            {!isLoading && !error && safeEvents.length > 0 && (
              <>
                <div className="space-y-3" role="feed" aria-label="Timeline de eventos do cliente">
                  {safeEvents.map((event) => (
                    <TimelineEvent key={event.id} event={event} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      aria-label="Carregar mais eventos"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        `Carregar mais eventos`
                      )}
                    </Button>
                  </div>
                )}

                {/* Event Count */}
                <div className="text-center text-sm text-muted-foreground pt-2">
                  Exibindo {safeEvents.length} {safeEvents.length === 1 ? "evento" : "eventos"}
                  {hasMore && " • Há mais eventos disponíveis"}
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
