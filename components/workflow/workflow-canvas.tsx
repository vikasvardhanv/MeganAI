/**
 * Workflow Canvas Component
 * n8n-like visual workflow editor with voice control
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    WorkflowNode,
    WorkflowEdge,
    NodeType,
    NODE_CONFIGS
} from "@/lib/workflow/types"
import { processVoiceCommand, generateCommandResponse } from "@/lib/workflow/voice-processor"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { useVoiceOutput } from "@/hooks/use-voice-output"
import {
    Mic, MicOff, Play, Save, Undo, Trash2, Plus,
    ZoomIn, ZoomOut, Move, Volume2, Settings
} from "lucide-react"

interface WorkflowCanvasProps {
    initialWorkflow?: {
        nodes: WorkflowNode[]
        edges: WorkflowEdge[]
    }
    onSave?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void
}

export function WorkflowCanvas({ initialWorkflow, onSave }: WorkflowCanvasProps) {
    const [nodes, setNodes] = useState<WorkflowNode[]>(
        initialWorkflow?.nodes || []
    )
    const [edges, setEdges] = useState<WorkflowEdge[]>(
        initialWorkflow?.edges || []
    )
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragNode, setDragNode] = useState<string | null>(null)
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
    const [history, setHistory] = useState<{ nodes: WorkflowNode[], edges: WorkflowEdge[] }[]>([])
    const [voiceStatus, setVoiceStatus] = useState<string>("")

    const canvasRef = useRef<HTMLDivElement>(null)

    // Voice hooks
    const {
        isListening,
        isSupported: voiceSupported,
        startListening,
        stopListening
    } = useVoiceInput({
        onResult: (text, isFinal) => {
            if (isFinal) {
                handleVoiceCommand(text)
            } else {
                setVoiceStatus(text)
            }
        }
    })

    const { speak, isSpeaking } = useVoiceOutput({ voice: "nova" })

    // Handle voice command
    const handleVoiceCommand = useCallback((text: string) => {
        const command = processVoiceCommand(text)
        const response = generateCommandResponse(command)

        setVoiceStatus(`"${text}" → ${command.type}`)
        speak(response)

        switch (command.type) {
            case "add_node":
                if (command.nodeType) {
                    addNode(command.nodeType)
                }
                break
            case "delete":
                if (selectedNode) {
                    deleteNode(selectedNode)
                }
                break
            case "run":
                executeWorkflow()
                break
            case "save":
                saveWorkflow()
                break
            case "undo":
                undoAction()
                break
        }
    }, [selectedNode, speak])

    // Save history for undo
    const saveHistory = useCallback(() => {
        setHistory(prev => [...prev.slice(-19), { nodes: [...nodes], edges: [...edges] }])
    }, [nodes, edges])

    // Add new node
    const addNode = useCallback((type: NodeType) => {
        saveHistory()
        const config = NODE_CONFIGS[type]
        const newNode: WorkflowNode = {
            id: `node_${Date.now()}`,
            type,
            position: {
                x: 100 + nodes.length * 50,
                y: 100 + (nodes.length % 3) * 120
            },
            data: {
                label: config.label,
                config: { ...config.defaultConfig }
            }
        }
        setNodes(prev => [...prev, newNode])
        setSelectedNode(newNode.id)
    }, [nodes, saveHistory])

    // Delete node
    const deleteNode = useCallback((nodeId: string) => {
        saveHistory()
        setNodes(prev => prev.filter(n => n.id !== nodeId))
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId))
        setSelectedNode(null)
    }, [saveHistory])

    // Connect nodes
    const connectNodes = useCallback((sourceId: string, targetId: string) => {
        saveHistory()
        const newEdge: WorkflowEdge = {
            id: `edge_${Date.now()}`,
            source: sourceId,
            target: targetId
        }
        setEdges(prev => [...prev, newEdge])
    }, [saveHistory])

    // Undo last action
    const undoAction = useCallback(() => {
        if (history.length > 0) {
            const lastState = history[history.length - 1]
            setNodes(lastState.nodes)
            setEdges(lastState.edges)
            setHistory(prev => prev.slice(0, -1))
        }
    }, [history])

    // Execute workflow
    const executeWorkflow = useCallback(() => {
        speak("Starting workflow execution")
        // TODO: Implement actual execution
        console.log("Executing workflow:", { nodes, edges })
    }, [nodes, edges, speak])

    // Save workflow
    const saveWorkflow = useCallback(() => {
        onSave?.(nodes, edges)
        speak("Workflow saved successfully")
    }, [nodes, edges, onSave, speak])

    // Handle node drag
    const handleNodeDrag = useCallback((e: React.MouseEvent, nodeId: string) => {
        if (!isDragging) return

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom

        setNodes(prev => prev.map(node =>
            node.id === nodeId
                ? { ...node, position: { x, y } }
                : node
        ))
    }, [isDragging, pan, zoom])

    // Toggle voice listening
    const toggleVoice = () => {
        if (isListening) {
            stopListening()
            setVoiceStatus("")
        } else {
            startListening()
            setVoiceStatus("Listening...")
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">Workflow Builder</h2>
                    <Badge variant="secondary" className="text-xs">
                        {nodes.length} nodes
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {/* Voice Control */}
                    {voiceSupported && (
                        <Button
                            variant={isListening ? "destructive" : "secondary"}
                            size="sm"
                            onClick={toggleVoice}
                            className={cn(isListening && "animate-pulse")}
                        >
                            {isListening ? (
                                <MicOff className="h-4 w-4 mr-1" />
                            ) : (
                                <Mic className="h-4 w-4 mr-1" />
                            )}
                            {isListening ? "Stop" : "Voice"}
                        </Button>
                    )}

                    {/* Zoom Controls */}
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-slate-600" />

                    {/* Actions */}
                    <Button variant="outline" size="sm" onClick={undoAction} disabled={history.length === 0}>
                        <Undo className="h-4 w-4 mr-1" />
                        Undo
                    </Button>
                    <Button variant="outline" size="sm" onClick={saveWorkflow}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                    <Button variant="default" size="sm" onClick={executeWorkflow}>
                        <Play className="h-4 w-4 mr-1" />
                        Run
                    </Button>
                </div>
            </div>

            {/* Voice Status Banner */}
            {voiceStatus && (
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-900/50 border-b border-violet-700">
                    <Volume2 className="h-4 w-4 text-violet-400 animate-pulse" />
                    <span className="text-sm text-violet-200">{voiceStatus}</span>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Node Palette */}
                <div className="w-64 border-r border-slate-700 bg-slate-800 p-4 overflow-y-auto">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Nodes</h3>
                    <div className="space-y-2">
                        {(Object.entries(NODE_CONFIGS) as [NodeType, typeof NODE_CONFIGS[NodeType]][]).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => addNode(type)}
                                className="flex items-center gap-3 w-full p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left group"
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br text-xl",
                                    config.color
                                )}>
                                    {config.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{config.label}</p>
                                    <p className="text-xs text-slate-400 line-clamp-1">{config.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="flex-1 relative bg-slate-900 overflow-hidden"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(71, 85, 105, 0.3) 1px, transparent 1px)`,
                        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`
                    }}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => {
                        setIsDragging(false)
                        setDragNode(null)
                    }}
                    onMouseLeave={() => {
                        setIsDragging(false)
                        setDragNode(null)
                    }}
                >
                    {/* Edges (SVG) */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}>
                        {edges.map(edge => {
                            const source = nodes.find(n => n.id === edge.source)
                            const target = nodes.find(n => n.id === edge.target)
                            if (!source || !target) return null

                            const sx = source.position.x + 100
                            const sy = source.position.y + 40
                            const tx = target.position.x
                            const ty = target.position.y + 40

                            const cx1 = sx + (tx - sx) / 2
                            const cx2 = tx - (tx - sx) / 2

                            return (
                                <path
                                    key={edge.id}
                                    d={`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ty}, ${tx} ${ty}`}
                                    stroke="rgb(139, 92, 246)"
                                    strokeWidth={2}
                                    fill="none"
                                    className="transition-all"
                                />
                            )
                        })}
                    </svg>

                    {/* Nodes */}
                    {nodes.map(node => {
                        const config = NODE_CONFIGS[node.type]
                        return (
                            <div
                                key={node.id}
                                className={cn(
                                    "absolute w-48 rounded-xl border-2 bg-slate-800 shadow-xl cursor-move transition-all",
                                    selectedNode === node.id
                                        ? "border-violet-500 ring-2 ring-violet-500/30"
                                        : "border-slate-600 hover:border-slate-500"
                                )}
                                style={{
                                    left: node.position.x * zoom + pan.x,
                                    top: node.position.y * zoom + pan.y,
                                    transform: `scale(${zoom})`
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (connectingFrom && connectingFrom !== node.id) {
                                        connectNodes(connectingFrom, node.id)
                                        setConnectingFrom(null)
                                    } else {
                                        setSelectedNode(node.id)
                                    }
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation()
                                    setDragNode(node.id)
                                    setIsDragging(true)
                                }}
                                onMouseMove={(e) => dragNode === node.id && handleNodeDrag(e, node.id)}
                            >
                                {/* Node Header */}
                                <div className={cn(
                                    "flex items-center gap-2 p-3 rounded-t-xl bg-gradient-to-r",
                                    config.color
                                )}>
                                    <span className="text-lg">{config.icon}</span>
                                    <span className="text-sm font-medium text-white">{node.data.label}</span>
                                </div>

                                {/* Node Body */}
                                <div className="p-3">
                                    <p className="text-xs text-slate-400">
                                        {config.description}
                                    </p>
                                </div>

                                {/* Connection Points */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-500 cursor-pointer hover:bg-violet-500"
                                    title="Input"
                                />
                                <div
                                    className="absolute right-0 top-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-500 cursor-pointer hover:bg-violet-500"
                                    title="Output"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setConnectingFrom(node.id)
                                    }}
                                />

                                {/* Delete button */}
                                {selectedNode === node.id && (
                                    <button
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteNode(node.id)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )
                    })}

                    {/* Empty State */}
                    {nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Plus className="h-8 w-8 text-slate-500" />
                                </div>
                                <p className="text-lg font-medium text-slate-400">Start building your workflow</p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Click nodes on the left or say "Add email node"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
