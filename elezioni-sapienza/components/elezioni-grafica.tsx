"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Save, Download, Plus, X, Upload, Link, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import html2canvas from "html2canvas"

type ListItem = {
  id: string
  name: string
  votes: string
  seats: string
  color: string
  label: string
  candidateImage?: string
  candidateName?: string
  previousPercentage?: string // Percentuale precedente
}

const initialList = {
  id: "",
  name: "",
  votes: "",
  seats: "",
  color: "#cccccc",
  label: "",
  candidateImage: "",
  candidateName: "",
  previousPercentage: "",
}

export default function ElezioniGrafica() {
  const [lists, setLists] = useState<ListItem[]>([])
  const [newList, setNewList] = useState<ListItem>({ ...initialList, id: generateId() })
  const [affluenza, setAffluenza] = useState<number>(27.21)
  const [totaleAventiDiritto, setTotaleAventiDiritto] = useState<number>(116125)
  const [editingList, setEditingList] = useState<ListItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [showCandidateImages, setShowCandidateImages] = useState<boolean>(false)
  const [showPreviousResults, setShowPreviousResults] = useState<boolean>(false)
  const [titoloElezioni, setTitoloElezioni] = useState<string>("Elezioni Sapienza - Risultati")
  const [imageUploadTab, setImageUploadTab] = useState<string>("upload")
  const [editImageUploadTab, setEditImageUploadTab] = useState<string>("upload")
  const [previousAffluenza, setPreviousAffluenza] = useState<number>(0)
  const exportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const totalVotes = lists.reduce((sum, list) => sum + Number(list.votes || 0), 0)
  const totalSeats = lists.reduce((sum, list) => sum + Number(list.seats || 0), 0)
  const totalVotanti = Math.round((affluenza / 100) * totaleAventiDiritto)

  function generateId() {
    return Math.random().toString(36).substring(2, 9)
  }

  function getInitials(name: string): string {
    if (!name) return "?"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleAddList = () => {
    if (!newList.name || !newList.votes) {
      toast({
        title: "Errore",
        description: "Nome lista e numero di voti sono obbligatori",
        variant: "destructive",
      })
      return
    }

    setLists([...lists, { ...newList, id: generateId() }])
    setNewList({ ...initialList, id: generateId() })
    setImageUploadTab("upload")

    toast({
      title: "Lista aggiunta",
      description: `La lista "${newList.name}" è stata aggiunta con successo`,
    })
  }

  const handleDeleteList = (id: string) => {
    setLists(lists.filter((list) => list.id !== id))
    toast({
      title: "Lista eliminata",
      description: "La lista è stata eliminata con successo",
    })
  }

  const handleEditList = (list: ListItem) => {
    setEditingList(list)
    setIsDialogOpen(true)
    setEditImageUploadTab(list.candidateImage ? "url" : "upload")
  }

  const handleSaveEdit = () => {
    if (!editingList) return

    setLists(lists.map((list) => (list.id === editingList.id ? editingList : list)))

    setIsDialogOpen(false)
    setEditingList(null)

    toast({
      title: "Lista aggiornata",
      description: `La lista "${editingList.name}" è stata aggiornata con successo`,
    })
  }

  const handleExport = async () => {
    if (!exportRef.current) return

    try {
      toast({
        title: "Esportazione in corso",
        description: "Stiamo generando l'immagine...",
      })

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
      })

      const link = document.createElement("a")
      link.download = `elezioni-sapienza-${new Date().toISOString().split("T")[0]}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      toast({
        title: "Esportazione completata",
        description: "L'immagine è stata scaricata con successo",
      })
    } catch (error) {
      toast({
        title: "Errore durante l'esportazione",
        description: "Si è verificato un errore durante la generazione dell'immagine",
        variant: "destructive",
      })
    }
  }

  const handleResetForm = () => {
    setNewList({ ...initialList, id: generateId() })
    setImageUploadTab("upload")
  }

  const toggleCandidateImages = () => {
    setShowCandidateImages(!showCandidateImages)
  }

  const togglePreviousResults = () => {
    setShowPreviousResults(!showPreviousResults)
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verifica dimensione file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "L'immagine deve essere inferiore a 5MB",
        variant: "destructive",
      })
      return
    }

    // Verifica tipo file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato non supportato",
        description: "Carica un'immagine in formato JPG, PNG o GIF",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string
      if (isEdit && editingList) {
        setEditingList({ ...editingList, candidateImage: imageDataUrl })
      } else {
        setNewList({ ...newList, candidateImage: imageDataUrl })
      }
    }
    reader.readAsDataURL(file)
  }

  // Funzione per formattare la differenza percentuale
  const formatDifference = (current: number, previous: number | undefined): JSX.Element => {
    if (previous === undefined || isNaN(previous)) {
      return <span className="text-gray-400">n/a</span>
    }

    const diff = current - previous
    const formattedDiff = diff.toFixed(2)

    if (diff > 0) {
      return (
        <span className="text-green-600 flex items-center whitespace-nowrap">
          <TrendingUp className="h-3 w-3 mr-1" />+{formattedDiff}%
        </span>
      )
    } else if (diff < 0) {
      return (
        <span className="text-red-600 flex items-center whitespace-nowrap">
          <TrendingDown className="h-3 w-3 mr-1" />
          {formattedDiff}%
        </span>
      )
    } else {
      return (
        <span className="text-gray-500 flex items-center whitespace-nowrap">
          <Minus className="h-3 w-3 mr-1" />
          {formattedDiff}%
        </span>
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Generatore Grafica Elezioni Sapienza</h1>
        <p className="text-muted-foreground">Crea e personalizza grafiche per i risultati elettorali</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Aggiungi una nuova lista</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome lista</Label>
              <Input
                id="name"
                placeholder="Nome lista"
                value={newList.name}
                onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="votes">Voti</Label>
              <Input
                id="votes"
                placeholder="Voti"
                type="number"
                value={newList.votes}
                onChange={(e) => setNewList({ ...newList, votes: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="seats">Seggi</Label>
              <Input
                id="seats"
                placeholder="Seggi"
                type="number"
                value={newList.seats}
                onChange={(e) => setNewList({ ...newList, seats: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="color">Colore</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  className="w-12 h-10 p-1"
                  value={newList.color}
                  onChange={(e) => setNewList({ ...newList, color: e.target.value })}
                />
                <Input
                  placeholder="#RRGGBB"
                  value={newList.color}
                  onChange={(e) => setNewList({ ...newList, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="label">Etichetta</Label>
              <Input
                id="label"
                placeholder="Es. sinistra"
                value={newList.label}
                onChange={(e) => setNewList({ ...newList, label: e.target.value })}
              />
            </div>
          </div>

          {showCandidateImages && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="candidateName">Nome candidato</Label>
                <Input
                  id="candidateName"
                  placeholder="Nome del candidato"
                  value={newList.candidateName || ""}
                  onChange={(e) => setNewList({ ...newList, candidateName: e.target.value })}
                />
              </div>
              <div>
                <Label>Immagine candidato</Label>
                <Tabs value={imageUploadTab} onValueChange={setImageUploadTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <Upload className="h-4 w-4" /> Carica
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-1">
                      <Link className="h-4 w-4" /> URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-2">
                    <div className="flex flex-col gap-2">
                      <Input
                        id="candidateImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                      />
                      {newList.candidateImage && newList.candidateImage.startsWith("data:image/") && (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={newList.candidateImage || "/placeholder.svg"} alt="Anteprima" />
                            <AvatarFallback>{getInitials(newList.candidateName || newList.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">Immagine caricata</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-2">
                    <Input
                      id="candidateImageUrl"
                      placeholder="https://esempio.com/immagine.jpg"
                      value={newList.candidateImage || ""}
                      onChange={(e) => setNewList({ ...newList, candidateImage: e.target.value })}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {showPreviousResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="previousPercentage">
                  Percentuale precedente (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 text-muted-foreground cursor-help text-xs">(?)</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Inserisci la percentuale ottenuta nelle elezioni precedenti</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="previousPercentage"
                  placeholder="Es. 15.2"
                  type="number"
                  step="0.01"
                  value={newList.previousPercentage || ""}
                  onChange={(e) => setNewList({ ...newList, previousPercentage: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleResetForm}>
              <X className="mr-2 h-4 w-4" /> Cancella
            </Button>
            <Button onClick={handleAddList}>
              <Plus className="mr-2 h-4 w-4" /> Aggiungi Lista
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Dati generali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="titolo">Titolo elezioni</Label>
              <Input
                id="titolo"
                placeholder="Titolo delle elezioni"
                value={titoloElezioni}
                onChange={(e) => setTitoloElezioni(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Switch id="candidate-mode" checked={showCandidateImages} onCheckedChange={toggleCandidateImages} />
                <Label htmlFor="candidate-mode" className="cursor-pointer">
                  Mostra foto candidati (elezioni presidenziali)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="previous-results" checked={showPreviousResults} onCheckedChange={togglePreviousResults} />
                <Label htmlFor="previous-results" className="cursor-pointer">
                  Confronta con elezioni precedenti
                </Label>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-medium mb-3">Affluenza</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="affluenza">Affluenza attuale (%)</Label>
              <Input
                id="affluenza"
                placeholder="Affluenza (%)"
                type="number"
                step="0.01"
                value={affluenza}
                onChange={(e) => setAffluenza(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="aventiDiritto">Aventi diritto</Label>
              <Input
                id="aventiDiritto"
                placeholder="Aventi diritto"
                type="number"
                value={totaleAventiDiritto}
                onChange={(e) => setTotaleAventiDiritto(Number(e.target.value))}
              />
            </div>
            {showPreviousResults && (
              <div>
                <Label htmlFor="previousAffluenza">Affluenza precedente (%)</Label>
                <Input
                  id="previousAffluenza"
                  placeholder="Affluenza precedente (%)"
                  type="number"
                  step="0.01"
                  value={previousAffluenza}
                  onChange={(e) => setPreviousAffluenza(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <div className="flex items-end mt-2">
            <div className="text-sm text-muted-foreground">
              Votanti: <strong>{totalVotanti.toLocaleString()}</strong>
              {showPreviousResults && previousAffluenza > 0 && (
                <span className="ml-2">Differenza affluenza: {formatDifference(affluenza, previousAffluenza)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Anteprima grafica</h2>
            <Button onClick={handleExport} disabled={lists.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Esporta come immagine
            </Button>
          </div>

          <div ref={exportRef} className="space-y-3 bg-white p-4 rounded-lg">
            <div className="text-center font-bold text-lg mb-4">{titoloElezioni}</div>

            {lists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aggiungi delle liste per visualizzare l'anteprima
              </div>
            ) : (
              <>
                {lists.map((list) => {
                  const percentage = totalVotes > 0 ? ((Number(list.votes) / totalVotes) * 100).toFixed(2) : "0.00"
                  const hasCandidate = showCandidateImages && (list.candidateImage || list.candidateName)
                  const previousPerc = list.previousPercentage ? Number.parseFloat(list.previousPercentage) : undefined

                  return (
                    <Card key={list.id} className="p-2">
                      <CardContent className="space-y-2 p-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium flex items-center gap-2">
                            {hasCandidate ? (
                              <Avatar className="h-8 w-8 border-2" style={{ borderColor: list.color }}>
                                {list.candidateImage ? (
                                  <AvatarImage
                                    src={list.candidateImage || "/placeholder.svg"}
                                    alt={list.candidateName || list.name}
                                  />
                                ) : null}
                                <AvatarFallback>{getInitials(list.candidateName || list.name)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.color }} />
                            )}
                            <div>
                              <span>{list.name}</span>
                              {hasCandidate && list.candidateName && (
                                <div className="text-xs text-muted-foreground">Candidato: {list.candidateName}</div>
                              )}
                              {list.label && !hasCandidate && (
                                <span className="text-sm text-muted-foreground">({list.label})</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{percentage}%</span>
                                {showPreviousResults && (
                                  <span className="ml-1 text-xs">
                                    {formatDifference(Number.parseFloat(percentage), previousPerc)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Number(list.votes).toLocaleString()} voti
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditList(list)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteList(list.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 h-5 rounded">
                          <div
                            className="h-5 rounded flex items-center justify-end px-2"
                            style={{
                              width: `${Math.max(Number(percentage), 3)}%`,
                              backgroundColor: list.color,
                            }}
                          >
                            {Number(percentage) > 5 && (
                              <span className="text-xs font-medium text-white">{percentage}%</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          {list.seats && (
                            <div className="text-right text-sm">
                              Seggi: <strong>{list.seats}</strong>
                            </div>
                          )}
                          {showPreviousResults && previousPerc !== undefined && (
                            <div className="text-sm ml-auto">
                              Precedente: <strong>{previousPerc}%</strong>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                <div className="flex justify-between text-sm mt-4">
                  <div>
                    Totale voti: <strong>{totalVotes.toLocaleString()}</strong>
                  </div>
                  <div>
                    Totale seggi: <strong>{totalSeats}</strong>
                  </div>
                </div>

                <div className="mt-4 text-sm text-center">
                  Affluenza: <strong>{affluenza}%</strong>
                  {showPreviousResults && previousAffluenza > 0 && (
                    <span className="ml-1">{formatDifference(affluenza, previousAffluenza)}</span>
                  )}
                  <span className="mx-1">–</span>
                  Totale aventi diritto: <strong>{totaleAventiDiritto.toLocaleString()}</strong>
                  <span className="mx-1">–</span>
                  Votanti: <strong>{totalVotanti.toLocaleString()}</strong>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica lista</DialogTitle>
          </DialogHeader>

          {editingList && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-name">Nome lista</Label>
                <Input
                  id="edit-name"
                  value={editingList.name}
                  onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-votes">Voti</Label>
                  <Input
                    id="edit-votes"
                    type="number"
                    value={editingList.votes}
                    onChange={(e) => setEditingList({ ...editingList, votes: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-seats">Seggi</Label>
                  <Input
                    id="edit-seats"
                    type="number"
                    value={editingList.seats}
                    onChange={(e) => setEditingList({ ...editingList, seats: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-color">Colore</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={editingList.color}
                    onChange={(e) => setEditingList({ ...editingList, color: e.target.value })}
                  />
                  <Input
                    value={editingList.color}
                    onChange={(e) => setEditingList({ ...editingList, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-label">Etichetta</Label>
                <Input
                  id="edit-label"
                  value={editingList.label}
                  onChange={(e) => setEditingList({ ...editingList, label: e.target.value })}
                />
              </div>

              {showPreviousResults && (
                <div>
                  <Label htmlFor="edit-previous-percentage">Percentuale precedente (%)</Label>
                  <Input
                    id="edit-previous-percentage"
                    type="number"
                    step="0.01"
                    value={editingList.previousPercentage || ""}
                    onChange={(e) => setEditingList({ ...editingList, previousPercentage: e.target.value })}
                  />
                </div>
              )}

              {showCandidateImages && (
                <>
                  <div>
                    <Label htmlFor="edit-candidate-name">Nome candidato</Label>
                    <Input
                      id="edit-candidate-name"
                      value={editingList.candidateName || ""}
                      onChange={(e) => setEditingList({ ...editingList, candidateName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Immagine candidato</Label>
                    <Tabs value={editImageUploadTab} onValueChange={setEditImageUploadTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" className="flex items-center gap-1">
                          <Upload className="h-4 w-4" /> Carica
                        </TabsTrigger>
                        <TabsTrigger value="url" className="flex items-center gap-1">
                          <Link className="h-4 w-4" /> URL
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-2">
                        <div className="flex flex-col gap-2">
                          <Input
                            id="editCandidateImageUpload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                          />
                          {editingList.candidateImage && editingList.candidateImage.startsWith("data:image/") && (
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={editingList.candidateImage || "/placeholder.svg"} alt="Anteprima" />
                                <AvatarFallback>
                                  {getInitials(editingList.candidateName || editingList.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">Immagine caricata</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="url" className="mt-2">
                        <Input
                          id="editCandidateImageUrl"
                          placeholder="https://esempio.com/immagine.jpg"
                          value={editingList.candidateImage || ""}
                          onChange={(e) => setEditingList({ ...editingList, candidateImage: e.target.value })}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label>Anteprima:</Label>
                    <Avatar className="h-10 w-10 border-2" style={{ borderColor: editingList.color }}>
                      {editingList.candidateImage ? (
                        <AvatarImage
                          src={editingList.candidateImage || "/placeholder.svg"}
                          alt={editingList.candidateName || editingList.name}
                        />
                      ) : null}
                      <AvatarFallback>{getInitials(editingList.candidateName || editingList.name)}</AvatarFallback>
                    </Avatar>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="mr-2 h-4 w-4" /> Salva modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
