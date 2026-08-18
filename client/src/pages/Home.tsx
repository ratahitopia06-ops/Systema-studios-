import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Copy,
  FileText,
  Film,
  Frame,
  GalleryVerticalEnd,
  GripVertical,
  ImagePlus,
  Layers3,
  LayoutDashboard,
  Lock,
  MapPin,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScanLine,
  Settings2,
  Sparkles,
  Target,
  UsersRound,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  type Character,
  type FilmProject,
  type ProjectStatus,
  type Scene,
  type Shot,
  type StudioState,
  composeGenerationPrompt,
  createFilmProject,
  getProjectProgress,
  sortShots,
  studioSeed,
} from "@/lib/cinema";
import { trpc } from "@/lib/trpc";

type StudioTab = "Studio" | "Projects" | "Story Bible" | "Characters" | "World" | "Scenes" | "Shot List" | "AI Assistant" | "Generation";

const navItems: { label: StudioTab; icon: typeof LayoutDashboard }[] = [
  { label: "Studio", icon: LayoutDashboard },
  { label: "Projects", icon: Film },
  { label: "Story Bible", icon: BookOpen },
  { label: "Characters", icon: UsersRound },
  { label: "World", icon: MapPin },
  { label: "Scenes", icon: FileText },
  { label: "Shot List", icon: Clapperboard },
  { label: "AI Assistant", icon: Bot },
  { label: "Generation", icon: ImagePlus },
];

const storyFields: { key: keyof FilmProject["story"]; label: string; hint: string }[] = [
  { key: "premise", label: "Premise", hint: "The irreducible cinematic proposition." },
  { key: "themes", label: "Themes", hint: "Tensions to express through image, action, and sound." },
  { key: "actOne", label: "Act I · Commitment", hint: "The disruption and the decisive crossing." },
  { key: "actTwo", label: "Act II · Pressure", hint: "Escalation, reversals, and the costly middle." },
  { key: "actThree", label: "Act III · Resolution", hint: "The final choice and changed image." },
  { key: "narrativeArc", label: "Narrative Arc", hint: "How the protagonist's interior movement changes the film." },
];

function shortId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function updateProjectInState(state: StudioState, updated: FilmProject): StudioState {
  return { ...state, projects: state.projects.map((project) => (project.id === updated.id ? updated : project)) };
}

function StageChip({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    Development: "border-amber-400/30 bg-amber-300/10 text-amber-200",
    "Pre-production": "border-sky-400/30 bg-sky-300/10 text-sky-200",
    Production: "border-emerald-400/30 bg-emerald-300/10 text-emerald-200",
    Review: "border-violet-400/30 bg-violet-300/10 text-violet-200",
  };
  return <span className={`inline-flex border px-2 py-1 mono text-[9px] uppercase tracking-[.12em] ${styles[status]}`}>{status}</span>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="label mb-2 text-amber-200/65">{eyebrow}</p>
        <h1 className="serif text-3xl leading-none tracking-tight text-stone-100 sm:text-[2.35rem]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function FilmStrip({ label }: { label?: string }) {
  return <div className="filmstrip h-7 overflow-hidden border-y border-amber-100/10 bg-black/15 px-6 pt-[8px] mono text-[8px] tracking-[.32em] text-amber-100/45">{label}</div>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [studio, setStudio] = useState<StudioState>(() => {
    try {
      const saved = window.localStorage.getItem("cinema-os-studio");
      return saved ? (JSON.parse(saved) as StudioState) : studioSeed;
    } catch {
      return studioSeed;
    }
  });
  const [activeTab, setActiveTab] = useState<StudioTab>("Studio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", logline: "", genre: "" });
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [artDirection, setArtDirection] = useState("Naturalistic sea mist, finely observed texture, restrained amber practical light, contemporary 35mm grain.");
  const [messages, setMessages] = useState<Message[]>([]);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const current = studio.projects.find((project) => project.id === studio.activeProjectId) ?? studio.projects[0]!;
  const selectedScene = current.scenes.find((scene) => scene.id === selectedSceneId) ?? current.scenes[0];
  const selectedShot = current.shots.find((shot) => shot.id === selectedShotId) ?? current.shots[0];
  const progress = getProjectProgress(current);
  const assistMutation = trpc.cinema.assist.useMutation();
  const generateMutation = trpc.cinema.generateFrame.useMutation();

  useEffect(() => {
    window.localStorage.setItem("cinema-os-studio", JSON.stringify(studio));
  }, [studio]);

  const context = useMemo(
    () => [
      `Logline: ${current.logline}`,
      `Premise: ${current.story.premise}`,
      `Themes: ${current.story.themes}`,
      `Characters: ${current.characters.map((character) => `${character.name} (${character.role})`).join(", ") || "not yet defined"}`,
      `Current scene: ${selectedScene ? `${selectedScene.heading} — ${selectedScene.action}` : "not selected"}`,
    ].join("\n"),
    [current, selectedScene]
  );

  const updateCurrent = (updated: FilmProject) => setStudio((state) => updateProjectInState(state, updated));

  const setTab = (tab: StudioTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const createProject = () => {
    const project = createFilmProject(newProject);
    setStudio((state) => ({ projects: [project, ...state.projects], activeProjectId: project.id }));
    setNewProject({ title: "", logline: "", genre: "" });
    setCreateOpen(false);
    setActiveTab("Story Bible");
    toast.success("Project created. Start with its story DNA.");
  };

  const addCharacter = () => {
    const character: Character = {
      id: shortId("character"), name: "New character", role: "Supporting role", backstory: "", arc: "", relationships: "", voice: "", locked: false,
    };
    updateCurrent({ ...current, characters: [...current.characters, character] });
  };

  const addScene = () => {
    const scene: Scene = {
      id: shortId("scene"), number: current.scenes.length + 1, heading: "New scene", designation: "INT.", location: "Undecided", timeOfDay: "Day", characters: "", action: "Describe the visual action and dramatic turn.", notes: "",
    };
    updateCurrent({ ...current, scenes: [...current.scenes, scene] });
    setSelectedSceneId(scene.id);
  };

  const addShot = () => {
    if (!selectedScene) return toast.error("Create or select a scene before adding a shot.");
    const sceneShots = current.shots.filter((shot) => shot.sceneId === selectedScene.id);
    const shot: Shot = {
      id: shortId("shot"), sceneId: selectedScene.id, order: sceneShots.length + 1, type: "MS", lens: "50mm", movement: "Locked-off", framing: "Describe the narrative image.", status: "Draft",
    };
    updateCurrent({ ...current, shots: [...current.shots, shot] });
    setSelectedShotId(shot.id);
  };

  const sendAssistant = (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    assistMutation.mutate(
      { projectTitle: current.title, projectContext: context, messages: nextMessages.map(({ role, content: messageContent }) => ({ role: role === "system" ? "user" : role, content: messageContent })) },
      {
        onSuccess: (result) => setMessages((existing) => [...existing, { role: "assistant", content: result.content }]),
        onError: () => {
          setMessages((existing) => [...existing, { role: "assistant", content: "The studio assistant needs an authenticated workspace to respond. Your story materials remain available in this session." }]);
          toast.error("Sign in to use live assistant generation.");
        },
      }
    );
  };

  const generateFrame = () => {
    if (!selectedShot) return toast.error("Select a shot before generating a frame.");
    const targetShotId = selectedShot.id;
    const prompt = composeGenerationPrompt({ project: current, shot: selectedShot, scene: selectedScene, artisticDirection: artDirection });
    generateMutation.mutate(
      { prompt },
      {
        onSuccess: ({ url }) => {
          if (!url) {
            toast.error("The provider returned no frame URL. Please try again.");
            return;
          }
          updateCurrent({ ...current, frames: [{ id: shortId("frame"), shotId: targetShotId, url, prompt, createdAt: Date.now() }, ...current.frames] });
          toast.success("Storyboard frame added to the shot gallery.");
        },
        onError: () => toast.error("Frame generation needs an authenticated workspace. Refine the prompt and try again."),
      }
    );
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "Projects":
        return <ProjectsPanel projects={studio.projects} activeProjectId={current.id} onSelect={(id) => setStudio((state) => ({ ...state, activeProjectId: id }))} onCreate={() => setCreateOpen(true)} />;
      case "Story Bible":
        return <StoryPanel project={current} onUpdate={updateCurrent} onAsk={() => setTab("AI Assistant")} />;
      case "Characters":
        return <CharactersPanel project={current} onUpdate={updateCurrent} onAdd={addCharacter} onAsk={() => setTab("AI Assistant")} />;
      case "World":
        return <WorldPanel project={current} onUpdate={updateCurrent} />;
      case "Scenes":
        return <ScenesPanel project={current} onUpdate={updateCurrent} selectedId={selectedScene?.id} onSelect={setSelectedSceneId} onAdd={addScene} />;
      case "Shot List":
        return <ShotsPanel project={current} selectedScene={selectedScene} selectedShotId={selectedShot?.id} onSelectShot={setSelectedShotId} onSelectScene={setSelectedSceneId} onUpdate={updateCurrent} onAdd={addShot} />;
      case "AI Assistant":
        return <AssistantPanel project={current} messages={messages} loading={assistMutation.isPending} onSend={sendAssistant} canUseLiveAI={isAuthenticated && !authLoading} onSignIn={startLogin} />;
      case "Generation":
        return <GenerationPanel project={current} selectedScene={selectedScene} selectedShot={selectedShot} artDirection={artDirection} onArtDirection={setArtDirection} onScene={setSelectedSceneId} onShot={setSelectedShotId} onGenerate={generateFrame} isGenerating={generateMutation.isPending} canUseLiveAI={isAuthenticated && !authLoading} onSignIn={startLogin} />;
      default:
        return <StudioPanel project={current} onTab={setTab} onCreate={() => setCreateOpen(true)} onSelectScene={setSelectedSceneId} />;
    }
  };

  return (
    <div className="cinema-shell cinema-grid film-grain flex min-h-screen overflow-x-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-amber-100/10 bg-[#101217]/95 transition-[width] duration-200 md:flex md:flex-col ${sidebarOpen ? "w-[260px]" : "w-[72px]"}`}>
        <div className="filmstrip flex h-[82px] shrink-0 items-center px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 place-items-center border border-amber-300/50 bg-amber-300/10 text-amber-200"><ScanLine size={17} /></div>
            {sidebarOpen && <div><p className="serif text-lg leading-none text-stone-100">CINEMA OS</p><p className="mt-1 mono text-[8px] tracking-[.23em] text-amber-200/55">FILM INTELLIGENCE</p></div>}
          </div>
        </div>
        <div className="border-b border-amber-100/10 px-3 py-4">
          <button onClick={() => setCreateOpen(true)} className={`button-press flex w-full items-center justify-center gap-2 border border-amber-300/40 bg-amber-300/10 px-3 py-2.5 mono text-[10px] tracking-[.12em] text-amber-100 transition hover:bg-amber-200/15 ${sidebarOpen ? "" : "px-0"}`}>
            <Plus size={15} /> {sidebarOpen && "NEW FILM"}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ label, icon: Icon }, index) => <div key={label}>{index === 2 && sidebarOpen && <p className="label mb-2 mt-5 px-2 text-[8px]">Creative development</p>}<button onClick={() => setTab(label)} data-active={activeTab === label} className="nav-item" title={label}><Icon size={15} strokeWidth={1.6} /><span className={sidebarOpen ? "" : "hidden"}>{label}</span></button></div>)}
        </nav>
        <div className="border-t border-amber-100/10 p-3">
          <button onClick={() => setSidebarOpen((open) => !open)} className="nav-item"><>{sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</><span className={sidebarOpen ? "" : "hidden"}>Collapse navigation</span></button>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ${sidebarOpen ? "md:ml-[260px]" : "md:ml-[72px]"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-amber-100/10 bg-[#111319]/80 px-4 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileMenuOpen((open) => !open)} className="icon-button md:hidden"><Menu size={17} /></button>
            <div className="hidden h-5 w-px bg-amber-100/20 sm:block" />
            <button onClick={() => setTab("Projects")} className="flex min-w-0 items-center gap-2 text-left"><span className="label hidden sm:inline">Active project</span><span className="max-w-[150px] truncate serif text-lg text-stone-100 sm:max-w-[240px]">{current.title}</span><ChevronDown size={14} className="shrink-0 text-stone-500" /></button>
            <StageChip status={current.status} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3"><span className="hidden mono text-[9px] tracking-[.1em] text-stone-500 lg:inline">{progress}% PRODUCTION MAP</span><div className="hidden h-1.5 w-24 overflow-hidden bg-stone-800 sm:block"><div className="h-full bg-amber-300" style={{ width: `${progress}%` }} /></div><button onClick={() => toast.info("Project settings are being prepared.")} className="icon-button"><Settings2 size={15} /></button><button onClick={() => setLocation("/404")} className="icon-button"><CircleHelp size={15} /></button></div>
        </header>

        {mobileMenuOpen && <div className="fixed inset-x-3 top-[72px] z-40 border border-amber-100/15 bg-[#14171d] p-3 shadow-2xl md:hidden"><div className="grid grid-cols-2 gap-1">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setTab(label)} data-active={activeTab === label} className="nav-item"><Icon size={14} />{label}</button>)}</div></div>}
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-10">{renderPanel()}</main>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-amber-100/15 bg-[#15181e] text-stone-100 sm:max-w-[560px]">
          <DialogHeader><p className="label text-amber-200/65">New production</p><DialogTitle className="serif text-3xl">Begin a film project</DialogTitle><DialogDescription className="text-stone-400">Name the working file and record the dramatic proposition. You can build its bibles, scenes, and visual plan from here.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2"><div><label className="label">Working title</label><Input value={newProject.title} onChange={(event) => setNewProject((value) => ({ ...value, title: event.target.value }))} placeholder="The title on the slate" className="mt-2 border-amber-100/15 bg-black/20" /></div><div><label className="label">Logline</label><Textarea value={newProject.logline} onChange={(event) => setNewProject((value) => ({ ...value, logline: event.target.value }))} placeholder="Who wants what, against what force?" className="mt-2 min-h-24 border-amber-100/15 bg-black/20" /></div><div><label className="label">Genre</label><Input value={newProject.genre} onChange={(event) => setNewProject((value) => ({ ...value, genre: event.target.value }))} placeholder="Drama, animation, documentary..." className="mt-2 border-amber-100/15 bg-black/20" /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)} className="border-amber-100/15 bg-transparent text-stone-300">Cancel</Button><Button onClick={createProject} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Clapperboard size={15} /> Create project</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudioPanel({ project, onTab, onCreate, onSelectScene }: { project: FilmProject; onTab: (tab: StudioTab) => void; onCreate: () => void; onSelectScene: (id: string) => void }) {
  const progress = getProjectProgress(project);
  const stages = [
    ["01", "Story DNA", Boolean(project.story.premise), "Premise · Themes · Arc", "Story Bible"],
    ["02", "Character & World", project.characters.length > 0 && project.world.length > 0, `${project.characters.length} characters · ${project.world.length} world entries`, "Characters"],
    ["03", "Scene Architecture", project.scenes.length > 0, `${project.scenes.length} scenes mapped`, "Scenes"],
    ["04", "Shot Design", project.shots.length > 0, `${project.shots.length} intentional shots`, "Shot List"],
    ["05", "Visual Development", project.frames.length > 0, `${project.frames.length} storyboard frames`, "Generation"],
  ] as const;
  return <div className="reveal">
    <div className="relative overflow-hidden border border-amber-100/15 bg-[#15181f]/85 p-6 sm:p-9">
      <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-[radial-gradient(circle_at_80%_35%,rgba(210,162,77,.18),transparent_20%),linear-gradient(135deg,transparent_32%,rgba(210,162,77,.05)_32%,rgba(210,162,77,.05)_34%,transparent_34%)] lg:block" />
      <FilmStrip label="ROLL 01 · PRODUCTION MAP · CINEMA OS" />
      <div className="relative mt-8 grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
        <div><p className="label text-amber-200/70">Production intelligence workspace</p><h1 className="serif mt-3 max-w-3xl text-4xl leading-[.95] tracking-tight text-stone-100 sm:text-6xl">Make the film<br /><em className="text-amber-200/90">before the frame.</em></h1><p className="mt-5 max-w-xl text-sm leading-7 text-stone-400">CINEMA OS holds the story, directorial intent, and shot logic in one production memory—so every image begins with context, not a blank prompt.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => onTab("Story Bible")} className="button-press bg-amber-300 text-stone-950 hover:bg-amber-200"><BookOpen size={15} /> Open story bible</Button><Button onClick={onCreate} variant="outline" className="button-press border-amber-100/20 bg-transparent text-stone-200 hover:bg-white/5"><Plus size={15} /> Create another film</Button></div></div>
        <div className="panel-soft grid gap-5 p-5"><div className="flex items-center justify-between"><p className="label">Current production</p><StageChip status={project.status} /></div><div><p className="serif text-2xl text-stone-100">{project.title}</p><p className="mt-2 text-xs leading-5 text-stone-400">{project.logline || "No logline yet. Frame the central dramatic question."}</p></div><div><div className="mb-2 flex justify-between mono text-[9px] tracking-wider text-stone-500"><span>PRODUCTION MAP</span><span className="text-amber-200">{progress}%</span></div><div className="h-1.5 bg-stone-900"><div className="h-full bg-gradient-to-r from-amber-500 to-amber-200" style={{ width: `${progress}%` }} /></div></div></div>
      </div>
    </div>
    <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="label">The production path</p><h2 className="serif mt-2 text-2xl text-stone-100">Work in a deliberate sequence.</h2></div><button onClick={() => onTab("Projects")} className="mono text-[10px] tracking-[.12em] text-amber-200 hover:text-amber-100">ALL PROJECTS <ArrowRight className="ml-1 inline" size={13} /></button></div><div className="grid gap-px overflow-hidden border border-amber-100/10 bg-amber-100/10 md:grid-cols-5">{stages.map(([number, title, ready, meta, tab]) => <button key={title} onClick={() => onTab(tab)} className="group min-h-48 bg-[#15181f] p-5 text-left transition hover:bg-[#1a1e26]"><div className="flex justify-between"><span className="mono text-[10px] text-stone-600">{number}</span><span className={`size-2 rounded-full ${ready ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,120,.8)]" : "bg-stone-700"}`} /></div><p className="serif mt-9 text-xl text-stone-100">{title}</p><p className="mt-2 text-[11px] leading-5 text-stone-500">{meta}</p><span className="mt-5 inline-block mono text-[9px] tracking-[.1em] text-amber-200/0 transition group-hover:text-amber-200">ENTER MODULE →</span></button>)}</div></section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><div className="panel p-6"><div className="flex items-start justify-between"><div><p className="label">Live sequence</p><h2 className="serif mt-2 text-2xl text-stone-100">Scene pulse</h2></div><button onClick={() => onTab("Scenes")} className="icon-button"><ArrowRight size={15} /></button></div><div className="mt-5 divide-y divide-amber-100/10">{project.scenes.slice(0, 4).map((scene) => <button key={scene.id} onClick={() => { onSelectScene(scene.id); onTab("Scenes"); }} className="grid w-full grid-cols-[auto_1fr_auto] gap-4 py-4 text-left transition hover:bg-white/[.02]"><span className="mono text-[10px] text-amber-200">{String(scene.number).padStart(2, "0")}</span><span><span className="block serif text-lg text-stone-200">{scene.heading}</span><span className="mt-1 block mono text-[9px] tracking-wider text-stone-500">{scene.designation} · {scene.location.toUpperCase()} · {scene.timeOfDay.toUpperCase()}</span></span><ArrowRight size={15} className="mt-1 text-stone-600" /></button>)}</div></div><div className="panel relative overflow-hidden p-6"><FilmStrip label="CREATIVE CONTINUITY" /><div className="mt-7"><p className="label">Assistant cue</p><h2 className="serif mt-2 text-2xl text-stone-100">Protect the throughline.</h2><p className="mt-3 text-sm leading-6 text-stone-400">Ask the Script Assistant to test an emotional turn, find a continuity risk, or draft the subtext before a scene becomes a shot.</p><Button onClick={() => onTab("AI Assistant")} variant="outline" className="mt-6 border-amber-100/20 bg-transparent text-amber-100 hover:bg-amber-100/5"><Sparkles size={14} /> Consult the studio</Button></div></div></section>
  </div>;
}

function ProjectsPanel({ projects, activeProjectId, onSelect, onCreate }: { projects: FilmProject[]; activeProjectId: string; onSelect: (id: string) => void; onCreate: () => void }) {
  return <div className="reveal"><SectionHeading eyebrow="Project desk" title="Films in development" description="Each project carries its own story memory, production decisions, visual references, and generated frames." action={<Button onClick={onCreate} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Plus size={15} /> New film</Button>} /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <button key={project.id} onClick={() => onSelect(project.id)} className={`group relative overflow-hidden border p-6 text-left transition hover:-translate-y-0.5 ${project.id === activeProjectId ? "border-amber-300/45 bg-amber-300/[.07]" : "border-amber-100/10 bg-[#16191f]/75 hover:border-amber-100/25"}`}><FilmStrip label="CINEMA OS · FILM FILE" /><div className="mt-9 flex items-start justify-between"><p className="serif max-w-[80%] text-3xl leading-none text-stone-100">{project.title}</p><MoreHorizontal size={18} className="text-stone-600" /></div><p className="mt-4 min-h-16 text-xs leading-6 text-stone-400">{project.logline || "A working file awaiting its central dramatic proposition."}</p><div className="mt-7 flex items-center justify-between"><StageChip status={project.status} /><span className="mono text-[9px] tracking-wider text-amber-200">{getProjectProgress(project)}% MAP</span></div></button>)}</div></div>;
}

function StoryPanel({ project, onUpdate, onAsk }: { project: FilmProject; onUpdate: (project: FilmProject) => void; onAsk: () => void }) {
  const updateStory = (key: keyof FilmProject["story"], value: string) => onUpdate({ ...project, story: { ...project.story, [key]: value } });
  return <div className="reveal"><SectionHeading eyebrow="Story intelligence" title="Story Bible" description="Build the narrative DNA that downstream character, scene, shot, and generation decisions can inherit." action={<Button onClick={onAsk} variant="outline" className="border-amber-100/20 bg-transparent text-amber-100 hover:bg-white/5"><Sparkles size={15} /> Develop with AI</Button>} /><div className="grid gap-5 lg:grid-cols-2">{storyFields.map(({ key, label, hint }) => <section key={key} className="panel p-5"><div className="mb-3 flex items-center justify-between"><div><p className="label text-amber-200/60">{label}</p><p className="mt-1 text-[11px] text-stone-500">{hint}</p></div><Target size={15} className="text-amber-200/50" /></div><textarea value={project.story[key]} onChange={(event) => updateStory(key, event.target.value)} placeholder={`Write the ${label.toLowerCase()}...`} className="editor-field" /></section>)}</div><div className="mt-5 flex items-center gap-3 border-l-2 border-amber-300/60 bg-amber-300/[.06] px-4 py-3"><Lock size={15} className="text-amber-200" /><p className="text-xs leading-5 text-stone-400"><strong className="font-medium text-stone-200">Canonical source:</strong> edits here become the narrative context for new scene and image prompts. Review before locking a direction.</p></div></div>;
}

function CharactersPanel({ project, onUpdate, onAdd, onAsk }: { project: FilmProject; onUpdate: (project: FilmProject) => void; onAdd: () => void; onAsk: () => void }) {
  const updateCharacter = (id: string, key: keyof Character, value: string | boolean) => onUpdate({ ...project, characters: project.characters.map((character) => character.id === id ? { ...character, [key]: value } : character) });
  return <div className="reveal"><SectionHeading eyebrow="Performance intelligence" title="Character Manager" description="Track interior movement, relationship pressure, and playable voice alongside the visual identity of every essential person." action={<div className="flex gap-2"><Button onClick={onAsk} variant="outline" className="border-amber-100/20 bg-transparent text-amber-100 hover:bg-white/5"><Sparkles size={14} /> AI develop</Button><Button onClick={onAdd} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Plus size={15} /> Character</Button></div>} /><div className="grid gap-5 xl:grid-cols-2">{project.characters.map((character, index) => <section key={character.id} className="panel overflow-hidden"><FilmStrip label={`CHARACTER ${String(index + 1).padStart(2, "0")} · CONTINUITY FILE`} /><div className="p-6"><div className="flex justify-between gap-4"><div className="flex-1"><Input value={character.name} onChange={(event) => updateCharacter(character.id, "name", event.target.value)} className="h-auto border-0 bg-transparent p-0 serif text-3xl text-stone-100 shadow-none focus-visible:ring-0" /><Input value={character.role} onChange={(event) => updateCharacter(character.id, "role", event.target.value)} className="mt-2 h-auto border-0 bg-transparent p-0 mono text-[10px] tracking-[.1em] text-amber-200/70 shadow-none focus-visible:ring-0" /></div><button onClick={() => updateCharacter(character.id, "locked", !character.locked)} className={`icon-button ${character.locked ? "border-amber-300/40 text-amber-200" : ""}`} title="Lock character continuity"><Lock size={14} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{([ ["backstory", "Backstory"], ["arc", "Emotional arc"], ["relationships", "Relationship pressure"], ["voice", "Voice & playable rhythm"] ] as const).map(([key, label]) => <div key={key} className="sm:col-span-1"><p className="label mb-2">{label}</p><textarea value={character[key]} onChange={(event) => updateCharacter(character.id, key, event.target.value)} className="editor-field min-h-28 text-xs leading-5" placeholder={`Define ${label.toLowerCase()}...`} /></div>)}</div></div></section>)}</div>{project.characters.length === 0 && <EmptyState icon={UsersRound} title="Cast the first role" detail="Create a character profile to begin tracking continuity and performance direction." action={<Button onClick={onAdd} className="bg-amber-300 text-stone-950">Add character</Button>} />}</div>;
}

function WorldPanel({ project, onUpdate }: { project: FilmProject; onUpdate: (project: FilmProject) => void }) {
  const addEntry = () => onUpdate({ ...project, world: [...project.world, { id: shortId("world"), title: "New world entry", category: "Location", detail: "" }] });
  const updateEntry = (id: string, key: "title" | "category" | "detail", value: string) => onUpdate({ ...project, world: project.world.map((entry) => entry.id === id ? { ...entry, [key]: value } as typeof entry : entry) });
  return <div className="reveal"><SectionHeading eyebrow="World continuity" title="World-Building" description="Give the production a shared physical, cultural, tonal, and visual vocabulary before individual frames are made." action={<Button onClick={addEntry} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Plus size={15} /> World entry</Button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{project.world.map((entry, index) => <section key={entry.id} className="panel group relative min-h-64 p-5"><span className="absolute right-5 top-5 mono text-[10px] text-stone-700">{String(index + 1).padStart(2, "0")}</span><select value={entry.category} onChange={(event) => updateEntry(entry.id, "category", event.target.value)} className="label appearance-none border-0 bg-transparent p-0 text-amber-200/70 outline-none"><option>Location</option><option>Lore</option><option>Tone</option><option>Visual language</option></select><Input value={entry.title} onChange={(event) => updateEntry(entry.id, "title", event.target.value)} className="mt-6 h-auto border-0 bg-transparent p-0 serif text-2xl text-stone-100 shadow-none focus-visible:ring-0" /><textarea value={entry.detail} onChange={(event) => updateEntry(entry.id, "detail", event.target.value)} className="editor-field mt-4 min-h-28 text-xs leading-5" placeholder="Concrete details, material qualities, sensory conditions..." /></section>)}</div>{project.world.length === 0 && <EmptyState icon={MapPin} title="Construct the place" detail="Locations, lore, and visual language will become reusable context in every shot prompt." action={<Button onClick={addEntry} className="bg-amber-300 text-stone-950">Add world entry</Button>} />}</div>;
}

function ScenesPanel({ project, onUpdate, selectedId, onSelect, onAdd }: { project: FilmProject; onUpdate: (project: FilmProject) => void; selectedId?: string; onSelect: (id: string) => void; onAdd: () => void }) {
  const selected = project.scenes.find((scene) => scene.id === selectedId) ?? project.scenes[0];
  const updateScene = (key: keyof Scene, value: string | number) => selected && onUpdate({ ...project, scenes: project.scenes.map((scene) => scene.id === selected.id ? { ...scene, [key]: value } : scene) });
  return <div className="reveal"><SectionHeading eyebrow="Screenplay production map" title="Scene Breakdown" description="Turn the script into units of place, time, dramatic action, and production-ready continuity notes." action={<Button onClick={onAdd} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Plus size={15} /> Scene</Button>} />{project.scenes.length ? <div className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]"><section className="panel overflow-hidden"><FilmStrip label="SCENE STRIP" /><div className="divide-y divide-amber-100/10">{project.scenes.map((scene) => <button key={scene.id} onClick={() => onSelect(scene.id)} className={`grid w-full grid-cols-[auto_1fr_auto] gap-4 p-5 text-left transition ${selected?.id === scene.id ? "bg-amber-300/[.07]" : "hover:bg-white/[.025]"}`}><span className="mono text-[10px] text-amber-200">{String(scene.number).padStart(2, "0")}</span><span><span className="block serif text-xl text-stone-100">{scene.heading}</span><span className="mt-1 block mono text-[9px] tracking-wider text-stone-500">{scene.designation} · {scene.location}</span></span><ArrowRight size={15} className="mt-1 text-stone-600" /></button>)}</div></section>{selected && <section className="panel p-6"><div className="mb-6 flex items-center justify-between"><p className="label text-amber-200/65">Scene {String(selected.number).padStart(2, "0")} · Editable breakdown</p><button className="icon-button"><MoreHorizontal size={15} /></button></div><Input value={selected.heading} onChange={(event) => updateScene("heading", event.target.value)} className="h-auto border-0 bg-transparent p-0 serif text-3xl text-stone-100 shadow-none focus-visible:ring-0" /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{([ ["designation", "INT / EXT"], ["location", "Location"], ["timeOfDay", "Time"], ["characters", "Characters present"] ] as const).map(([key, label]) => <div key={key}><p className="label mb-2">{label}</p><Input value={selected[key]} onChange={(event) => updateScene(key, event.target.value)} className="border-amber-100/15 bg-black/20 text-xs" /></div>)}</div><div className="mt-5"><p className="label mb-2">Visible action & dramatic turn</p><textarea value={selected.action} onChange={(event) => updateScene("action", event.target.value)} className="editor-field min-h-36 text-sm leading-6" /></div><div className="mt-5"><p className="label mb-2">Production & continuity notes</p><textarea value={selected.notes} onChange={(event) => updateScene("notes", event.target.value)} className="editor-field min-h-24 text-sm leading-6" placeholder="Eyelines, props, sound handoff, locked conditions..." /></div></section>}</div> : <EmptyState icon={FileText} title="Break the story into scenes" detail="Map each change of place, time, pressure, or visual strategy before you cover it with shots." action={<Button onClick={onAdd} className="bg-amber-300 text-stone-950">Add first scene</Button>} />}</div>;
}

function ShotsPanel({ project, selectedScene, selectedShotId, onSelectShot, onSelectScene, onUpdate, onAdd }: { project: FilmProject; selectedScene?: Scene; selectedShotId?: string; onSelectShot: (id: string) => void; onSelectScene: (id: string) => void; onUpdate: (project: FilmProject) => void; onAdd: () => void }) {
  const shots = selectedScene ? sortShots(project.shots.filter((shot) => shot.sceneId === selectedScene.id)) : [];
  const updateShot = (id: string, key: keyof Shot, value: string | number) => onUpdate({ ...project, shots: project.shots.map((shot) => shot.id === id ? { ...shot, [key]: value } : shot) });
  return <div className="reveal"><SectionHeading eyebrow="Cinematography & editorial intent" title="Shot List Builder" description="Use only the coverage the scene needs. Every camera choice should give the audience information, feeling, or rhythm." action={<Button onClick={onAdd} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Plus size={15} /> Add shot</Button>} /><div className="mb-5 flex flex-wrap gap-2">{project.scenes.map((scene) => <button key={scene.id} onClick={() => onSelectScene(scene.id)} className={`border px-3 py-2 mono text-[9px] tracking-wider ${selectedScene?.id === scene.id ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : "border-amber-100/10 text-stone-500 hover:text-stone-300"}`}>SC {String(scene.number).padStart(2, "0")} · {scene.heading}</button>)}</div>{selectedScene ? <div className="grid gap-4">{shots.map((shot) => <section key={shot.id} className={`panel grid gap-5 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-start ${selectedShotId === shot.id ? "border-amber-300/45" : ""}`}><div className="flex items-center gap-2 text-stone-600"><GripVertical size={17} /><span className="mono text-xs text-amber-200">{String(shot.order).padStart(2, "0")}</span></div><button onClick={() => onSelectShot(shot.id)} className="grid gap-4 text-left lg:grid-cols-[110px_140px_150px_1fr]"><div><p className="label">Shot type</p><Input value={shot.type} onChange={(event) => updateShot(shot.id, "type", event.target.value)} className="mt-2 h-auto border-0 bg-transparent p-0 serif text-2xl text-stone-100 shadow-none focus-visible:ring-0" /></div><div><p className="label">Lens</p><Input value={shot.lens} onChange={(event) => updateShot(shot.id, "lens", event.target.value)} className="mt-2 h-auto border-0 bg-transparent p-0 text-xs text-stone-300 shadow-none focus-visible:ring-0" /></div><div><p className="label">Movement</p><Input value={shot.movement} onChange={(event) => updateShot(shot.id, "movement", event.target.value)} className="mt-2 h-auto border-0 bg-transparent p-0 text-xs text-stone-300 shadow-none focus-visible:ring-0" /></div><div><p className="label">Framing & purpose</p><textarea value={shot.framing} onChange={(event) => updateShot(shot.id, "framing", event.target.value)} className="mt-2 min-h-14 w-full resize-none border-0 bg-transparent p-0 text-xs leading-5 text-stone-400 outline-none" /></div></button><select value={shot.status} onChange={(event) => updateShot(shot.id, "status", event.target.value)} className="border border-amber-100/15 bg-black/20 px-2 py-2 mono text-[9px] tracking-wider text-amber-100 outline-none"><option>Draft</option><option>Ready</option><option>Locked</option></select></section>)}{shots.length === 0 && <EmptyState icon={Clapperboard} title="No shots in this scene yet" detail="Start with the minimum effective coverage for the scene's emotional and narrative work." action={<Button onClick={onAdd} className="bg-amber-300 text-stone-950">Add shot</Button>} />}</div> : <EmptyState icon={Clapperboard} title="Choose a scene first" detail="Create a scene breakdown before designing camera coverage." />}</div>;
}

function AssistantPanel({ project, messages, loading, onSend, canUseLiveAI, onSignIn }: { project: FilmProject; messages: Message[]; loading: boolean; onSend: (content: string) => void; canUseLiveAI: boolean; onSignIn: () => void }) {
  const prompts = ["Find a visual alternative to the exposition in scene one.", "Stress-test Mara's emotional turn in the final act.", "Give me three subtext passes for Mara and Ivo at the tidal flats.", "Run a concise continuity check across the current scenes."];
  return <div className="reveal"><SectionHeading eyebrow="Cinematic intelligence" title="AI Script Assistant" description="Brainstorm, interrogate a scene, reshape dialogue, or test continuity against the project’s current canon." /><div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><section className="panel p-6"><FilmStrip label="ASSISTANT CONTRACT" /><div className="mt-7"><p className="label text-amber-200/65">Project context sent with each request</p><h2 className="serif mt-2 text-2xl text-stone-100">{project.title}</h2><p className="mt-3 text-sm leading-6 text-stone-400">The assistant receives the active logline, Story Bible, character roster, and selected scene context. It returns concise creative options, not opaque hidden reasoning.</p><div className="mt-7 space-y-3">{[ ["Story DNA", project.story.premise ? "Loaded" : "Missing"], ["Character bibles", `${project.characters.length} profiles`], ["Scene context", `${project.scenes.length} scenes`], ["Continuity state", "Session-aware"], ].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-amber-100/10 pb-3"><span className="mono text-[10px] tracking-wider text-stone-500">{label}</span><span className="mono text-[9px] tracking-wider text-amber-200/80">{value}</span></div>)}</div></div></section><section className="overflow-hidden border border-amber-100/15 bg-[#15181f]"><div className="flex items-center gap-3 border-b border-amber-100/10 px-5 py-4"><div className="grid size-8 place-items-center bg-amber-300/10 text-amber-200"><Sparkles size={15} /></div><div><p className="mono text-[10px] tracking-[.13em] text-stone-300">STUDIO ASSISTANT</p><p className="text-[10px] text-stone-500">Script · Dialogue · Continuity · Visual opportunities</p></div><span className={`ml-auto size-2 rounded-full ${canUseLiveAI ? "bg-emerald-400/80" : "bg-amber-300/70"}`} /></div>{canUseLiveAI ? <AIChatBox messages={messages} onSendMessage={onSend} isLoading={loading} height="560px" emptyStateMessage="Give the studio a creative problem to solve." suggestedPrompts={prompts} className="rounded-none border-0 bg-transparent shadow-none" placeholder="Ask about story, character, scene, dialogue, or continuity..." /> : <div className="grid min-h-[560px] place-items-center p-7 text-center"><div><Lock size={27} className="mx-auto text-amber-200/55" /><p className="serif mt-4 text-2xl text-stone-200">Sign in to consult the studio.</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">Live creative assistance is kept inside your authenticated workspace so the project context and generated response stay private.</p><Button onClick={onSignIn} className="mt-6 bg-amber-300 text-stone-950 hover:bg-amber-200">Sign in to enable AI</Button></div></div>}</section></div></div>;
}

function GenerationPanel({ project, selectedScene, selectedShot, artDirection, onArtDirection, onScene, onShot, onGenerate, isGenerating, canUseLiveAI, onSignIn }: { project: FilmProject; selectedScene?: Scene; selectedShot?: Shot; artDirection: string; onArtDirection: (value: string) => void; onScene: (id: string) => void; onShot: (id: string) => void; onGenerate: () => void; isGenerating: boolean; canUseLiveAI: boolean; onSignIn: () => void }) {
  const prompt = selectedShot ? composeGenerationPrompt({ project, shot: selectedShot, scene: selectedScene, artisticDirection: artDirection }) : "Select a scene and shot to compose a structured visual prompt.";
  const frames = selectedShot ? project.frames.filter((frame) => frame.shotId === selectedShot.id) : [];
  return <div className="reveal"><SectionHeading eyebrow="Provider-neutral visual planning" title="Generation Workspace" description="Compose prompt context from the story, characters, world, scene, and camera plan—then save generated frames against the shot that prompted them." /><div className="grid gap-6 2xl:grid-cols-[1fr_.94fr]"><section className="panel overflow-hidden"><FilmStrip label="PROMPT COMPOSER · STRUCTURED CONTEXT" /><div className="p-6"><div className="grid gap-4 sm:grid-cols-2"><div><p className="label mb-2">Scene source</p><select value={selectedScene?.id ?? ""} onChange={(event) => onScene(event.target.value)} className="w-full border border-amber-100/15 bg-black/20 px-3 py-3 text-xs text-stone-200 outline-none">{project.scenes.map((scene) => <option key={scene.id} value={scene.id}>SC {String(scene.number).padStart(2, "0")} · {scene.heading}</option>)}</select></div><div><p className="label mb-2">Shot source</p><select value={selectedShot?.id ?? ""} onChange={(event) => onShot(event.target.value)} className="w-full border border-amber-100/15 bg-black/20 px-3 py-3 text-xs text-stone-200 outline-none">{project.shots.filter((shot) => shot.sceneId === selectedScene?.id).map((shot) => <option key={shot.id} value={shot.id}>SHOT {String(shot.order).padStart(2, "0")} · {shot.type} · {shot.lens}</option>)}</select></div></div><div className="mt-5"><p className="label mb-2">Art direction layer</p><textarea value={artDirection} onChange={(event) => onArtDirection(event.target.value)} className="editor-field min-h-24 text-sm leading-6" /></div><div className="mt-5 border border-amber-100/10 bg-black/20 p-4"><div className="mb-3 flex items-center justify-between"><p className="label text-amber-200/65">Assembled generation request</p><button onClick={() => { navigator.clipboard.writeText(prompt); toast.success("Prompt copied."); }} className="icon-button size-7"><Copy size={12} /></button></div><p className="mono text-[11px] leading-6 text-stone-400">{prompt}</p></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-[11px] leading-5 text-stone-500">{canUseLiveAI ? "Generation uses your authenticated workspace and returns a stored frame URL. No provider limits are bypassed." : "Sign in to send this structured request to an authorized image provider and preserve the returned frame in the gallery."}</p>{canUseLiveAI ? <Button onClick={onGenerate} disabled={!selectedShot || isGenerating} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Wand2 size={15} /> {isGenerating ? "Generating…" : "Generate frame"}</Button> : <Button onClick={onSignIn} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Lock size={14} /> Sign in to generate</Button>}</div></div></section><section className="panel overflow-hidden"><FilmStrip label="SHOT GALLERY · APPROVED OUTPUTS" /><div className="p-6"><div className="flex items-end justify-between"><div><p className="label text-amber-200/65">Selected visual target</p><h2 className="serif mt-2 text-2xl text-stone-100">{selectedShot ? `Shot ${String(selectedShot.order).padStart(2, "0")} · ${selectedShot.type}` : "No shot selected"}</h2></div><span className="mono text-[10px] tracking-wider text-stone-500">{frames.length} FRAMES</span></div>{frames.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{frames.map((frame) => <figure key={frame.id} className="overflow-hidden border border-amber-100/10 bg-black/20"><img src={frame.url} alt={`Generated storyboard frame for ${selectedShot?.type ?? "shot"}`} className="aspect-video w-full object-cover" /><figcaption className="p-3"><p className="mono text-[9px] tracking-wider text-amber-200">SHOT-BOUND FRAME</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-stone-500">{frame.prompt}</p></figcaption></figure>)}</div> : <div className="mt-5 grid min-h-72 place-items-center border border-dashed border-amber-100/15 bg-black/15 p-6 text-center"><div><Frame size={27} className="mx-auto text-amber-200/45" /><p className="serif mt-4 text-xl text-stone-300">The gallery is waiting for the first frame.</p><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-500">Select a shot, refine the direction, and generate a provider-backed storyboard image. Generated visuals stay organized by shot.</p></div></div>}</div></section></div></div>;
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: typeof Layers3; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="panel mt-5 grid min-h-64 place-items-center p-7 text-center"><div><Icon size={27} className="mx-auto text-amber-200/45" /><p className="serif mt-4 text-2xl text-stone-200">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">{detail}</p>{action && <div className="mt-5">{action}</div>}</div></div>;
}
