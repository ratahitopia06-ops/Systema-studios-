import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type CreativeTemplate, type FilmProject, buildTemplatePreviewScript, createCustomTemplate } from "@/lib/cinema";
import { toast } from "sonner";
import { Check, CircleStop, Headphones, Layers3, Lock, Mic2, Music2, Palette, Pencil, Play, Plus, Save, Trash2, Volume2, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  project: FilmProject;
  templates: CreativeTemplate[];
  onUpdate: (project: FilmProject) => void;
  onApplyTemplate: (templateId: string) => void;
  onSaveCustomTemplate: (template: CreativeTemplate) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
};

function ProfileLine({ icon: Icon, label, value }: { icon: typeof Mic2; label: string; value: string }) {
  return <div className="flex gap-3 border-t border-amber-100/10 py-3 first:border-t-0 first:pt-0"><Icon size={15} className="mt-0.5 shrink-0 text-amber-200/65" /><div><p className="label text-[8px]">{label}</p><p className="mt-1 text-xs leading-5 text-stone-400">{value}</p></div></div>;
}

function familyTone(template: CreativeTemplate) {
  const values: Record<CreativeTemplate["family"], { pitch: number; rate: number; frequency: number; wave: OscillatorType }> = {
    Cinematic: { pitch: 0.92, rate: 0.9, frequency: 110, wave: "sine" },
    Comic: { pitch: 1.12, rate: 1.06, frequency: 196, wave: "square" },
    Anime: { pitch: 1.08, rate: 0.94, frequency: 174, wave: "sine" },
    Philosophy: { pitch: 0.88, rate: 0.82, frequency: 82, wave: "triangle" },
    "Modern social": { pitch: 1, rate: 1, frequency: 146, wave: "sawtooth" },
    Drama: { pitch: 0.9, rate: 0.88, frequency: 98, wave: "triangle" },
    Education: { pitch: 1, rate: 0.98, frequency: 164, wave: "sine" },
    Mythic: { pitch: 0.84, rate: 0.8, frequency: 74, wave: "sine" },
  };
  return values[template.family];
}

export default function CreativeTemplateLibrary({ project, templates, onUpdate, onApplyTemplate, onSaveCustomTemplate, onDeleteCustomTemplate }: Props) {
  const active = templates.find((template) => template.id === project.experience.templateId) ?? templates[0]!;
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreativeTemplate | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopPreview = () => {
    window.speechSynthesis?.cancel();
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setPreviewingId(null);
  };

  useEffect(() => stopPreview, []);

  const startPreview = (template: CreativeTemplate) => {
    stopPreview();
    const tone = familyTone(template);
    setPreviewingId(template.id);
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Narration preview is unavailable in this browser.");
      setPreviewingId(null);
      return;
    }
    const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextConstructor) {
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.frequency, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 5.5);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 5.6);
      audioContextRef.current = context;
    }
    const utterance = new SpeechSynthesisUtterance(buildTemplatePreviewScript(template));
    utterance.lang = "en-US";
    utterance.rate = tone.rate;
    utterance.pitch = tone.pitch;
    utterance.volume = 0.9;
    utterance.onend = stopPreview;
    utterance.onerror = stopPreview;
    window.speechSynthesis.speak(utterance);
  };

  const applyTemplate = (template: CreativeTemplate) => {
    if (project.experience.templateLocked && template.id !== project.experience.templateId) {
      toast.info("Unlock the attached profile before applying another direction.");
      return;
    }
    onApplyTemplate(template.id);
    toast.success(`${template.name} attached to this project.`);
  };

  const toggleLock = () => onUpdate({ ...project, experience: { ...project.experience, templateLocked: !project.experience.templateLocked } });
  const closeDraft = () => setDraft(null);
  const saveDraft = () => {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error("Give the custom profile a name before saving.");
    onSaveCustomTemplate({ ...draft, name: draft.name.trim(), custom: true, createdAt: draft.createdAt ?? Date.now() });
    closeDraft();
  };

  return <div className="reveal"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="label mb-2 text-amber-200/65">Attached creative direction</p><h1 className="serif text-3xl leading-none tracking-tight text-stone-100 sm:text-[2.35rem]">Template library</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">Preview a short narrated moment and atmospheric audio bed before attaching a direction. Save tailored profiles to reuse a distinctive narration, art, sound, and aesthetic language across projects.</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => setDraft(createCustomTemplate(active))} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Plus size={15} /> New custom profile</Button><Button onClick={toggleLock} variant="outline" className={`border-amber-100/20 bg-transparent hover:bg-white/5 ${project.experience.templateLocked ? "text-amber-100" : "text-stone-400"}`}><Lock size={14} /> {project.experience.templateLocked ? "Profile locked" : "Lock profile"}</Button></div></div><div className="grid gap-5 2xl:grid-cols-[.86fr_1.14fr]"><section className="panel overflow-hidden"><div className="filmstrip h-7 overflow-hidden border-y border-amber-100/10 bg-black/15 px-6 pt-[8px] mono text-[8px] tracking-[.28em] text-amber-100/45">ACTIVE TEMPLATE · PROJECT MEMORY</div><div className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="label text-amber-200/70">{active.custom ? "Custom profile" : active.family}</p><h2 className="serif mt-2 text-3xl text-stone-100">{active.name}</h2><p className="mt-3 text-sm leading-6 text-stone-400">{active.summary}</p></div><div className="grid size-10 place-items-center border border-amber-300/35 bg-amber-300/10 text-amber-200"><WandSparkles size={17} /></div></div><div className="mt-7 border-l-2 border-amber-300/60 bg-amber-300/[.06] p-4"><p className="label text-amber-200/65">Tone statement</p><p className="serif mt-2 text-xl text-stone-200">{active.tone}</p></div><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => previewingId === active.id ? stopPreview() : startPreview(active)} variant="outline" className="border-amber-300/35 bg-amber-300/[.06] text-amber-100 hover:bg-amber-300/[.12]">{previewingId === active.id ? <CircleStop size={15} /> : <Play size={15} />} {previewingId === active.id ? "Stop preview" : "Preview narration + audio"}</Button><span className="self-center mono text-[9px] tracking-[.12em] text-stone-500">5–7 SECOND SAMPLE</span></div><div className="mt-7"><ProfileLine icon={Mic2} label="Narration profile" value={`${active.narration.profile}. ${active.narration.pace}.`} /><ProfileLine icon={Palette} label="Illustration profile" value={`${active.illustration.profile}. ${active.illustration.composition}.`} /><ProfileLine icon={Volume2} label="Soundscape profile" value={`${active.soundscape.profile}. ${active.soundscape.silence}.`} /><ProfileLine icon={Music2} label="Soundtrack profile" value={`${active.soundtrack.profile}. ${active.soundtrack.dynamic}.`} /><ProfileLine icon={Layers3} label="Aesthetic profile" value={`${active.aesthetic.palette}. ${active.aesthetic.texture}. ${active.aesthetic.motion}.`} /></div></div></section><section className="grid gap-3 sm:grid-cols-2">{templates.map((template) => { const selected = template.id === active.id; return <article key={template.id} className={`group relative min-h-56 overflow-hidden border p-5 text-left transition ${selected ? "border-amber-300/55 bg-amber-300/[.09]" : "border-amber-100/10 bg-[#15181f]/80 hover:border-amber-300/35 hover:bg-[#1a1e26]"}`}><div className="filmstrip absolute inset-x-0 top-0 h-5 px-4 pt-[5px] text-[6px] tracking-[.22em]" /><div className="mt-6 flex items-start justify-between"><p className="mono text-[9px] tracking-[.13em] text-amber-200/75">{template.custom ? "CUSTOM PROFILE" : template.family.toUpperCase()}</p>{selected && <span className="grid size-5 place-items-center rounded-full bg-amber-300 text-stone-950"><Check size={12} /></span>}</div><button onClick={() => applyTemplate(template)} className="mt-3 block text-left"><h3 className="serif text-2xl text-stone-100">{template.name}</h3><p className="mt-2 text-xs leading-5 text-stone-500">{template.summary}</p></button><div className="mt-4 flex flex-wrap gap-2"><span className="border border-amber-100/10 px-2 py-1 mono text-[8px] tracking-wider text-stone-500">{template.narration.mode}</span><span className="border border-amber-100/10 px-2 py-1 mono text-[8px] tracking-wider text-stone-500">{template.illustration.style}</span><span className="border border-amber-100/10 px-2 py-1 mono text-[8px] tracking-wider text-stone-500">{template.soundtrack.direction}</span></div><div className="mt-4 flex items-center gap-2"><button onClick={() => previewingId === template.id ? stopPreview() : startPreview(template)} className="inline-flex items-center gap-1.5 mono text-[9px] tracking-wider text-amber-200 hover:text-amber-100">{previewingId === template.id ? <CircleStop size={13} /> : <Headphones size={13} />}{previewingId === template.id ? "STOP" : "PREVIEW"}</button>{template.custom && <><span className="h-3 w-px bg-amber-100/15" /><button onClick={() => setDraft({ ...template, narration: { ...template.narration }, illustration: { ...template.illustration }, soundscape: { ...template.soundscape }, soundtrack: { ...template.soundtrack }, aesthetic: { ...template.aesthetic } })} className="inline-flex items-center gap-1 mono text-[9px] tracking-wider text-stone-400 hover:text-stone-200"><Pencil size={12} /> EDIT</button><button onClick={() => onDeleteCustomTemplate(template.id)} className="inline-flex items-center gap-1 mono text-[9px] tracking-wider text-stone-500 hover:text-rose-300"><Trash2 size={12} /> DELETE</button></>}</div></article>; })}</section></div>{draft && <section className="panel mt-6 overflow-hidden"><div className="filmstrip h-7 overflow-hidden border-y border-amber-100/10 bg-black/15 px-6 pt-[8px] mono text-[8px] tracking-[.28em] text-amber-100/45">CUSTOM PROFILE · EDITOR</div><div className="p-6"><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="label text-amber-200/65">Personal template</p><h2 className="serif mt-2 text-2xl text-stone-100">Shape a reusable direction</h2></div><div className="flex gap-2"><Button onClick={closeDraft} variant="outline" className="border-amber-100/15 bg-transparent text-stone-300">Cancel</Button><Button onClick={saveDraft} className="bg-amber-300 text-stone-950 hover:bg-amber-200"><Save size={14} /> Save profile</Button></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Profile name"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Family"><select value={draft.family} onChange={(event) => setDraft({ ...draft, family: event.target.value as CreativeTemplate["family"] })} className="w-full border border-amber-100/15 bg-black/20 px-3 py-2 text-sm text-stone-200 outline-none">{["Cinematic", "Comic", "Anime", "Philosophy", "Modern social", "Drama", "Education", "Mythic"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Tone statement"><Input value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Narration mode"><select value={draft.narration.mode} onChange={(event) => setDraft({ ...draft, narration: { ...draft.narration, mode: event.target.value as typeof draft.narration.mode } })} className="w-full border border-amber-100/15 bg-black/20 px-3 py-2 text-sm text-stone-200 outline-none">{["Natural", "Dramatic", "Documentary", "Character-driven", "Educational"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Narration profile"><Input value={draft.narration.profile} onChange={(event) => setDraft({ ...draft, narration: { ...draft.narration, profile: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Narration pace"><Input value={draft.narration.pace} onChange={(event) => setDraft({ ...draft, narration: { ...draft.narration, pace: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Illustration style"><select value={draft.illustration.style} onChange={(event) => setDraft({ ...draft, illustration: { ...draft.illustration, style: event.target.value as typeof draft.illustration.style } })} className="w-full border border-amber-100/15 bg-black/20 px-3 py-2 text-sm text-stone-200 outline-none">{["Cinematic", "Realistic", "Illustrated", "Painterly", "Animation"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Illustration profile"><Input value={draft.illustration.profile} onChange={(event) => setDraft({ ...draft, illustration: { ...draft.illustration, profile: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Visual composition"><Input value={draft.illustration.composition} onChange={(event) => setDraft({ ...draft, illustration: { ...draft.illustration, composition: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Soundscape density"><select value={draft.soundscape.density} onChange={(event) => setDraft({ ...draft, soundscape: { ...draft.soundscape, density: event.target.value as typeof draft.soundscape.density } })} className="w-full border border-amber-100/15 bg-black/20 px-3 py-2 text-sm text-stone-200 outline-none">{["Minimal", "Atmospheric", "Cinematic", "Immersive"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Soundscape profile"><Input value={draft.soundscape.profile} onChange={(event) => setDraft({ ...draft, soundscape: { ...draft.soundscape, profile: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Soundtrack profile"><Input value={draft.soundtrack.profile} onChange={(event) => setDraft({ ...draft, soundtrack: { ...draft.soundtrack, profile: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Palette"><Input value={draft.aesthetic.palette} onChange={(event) => setDraft({ ...draft, aesthetic: { ...draft.aesthetic, palette: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Texture"><Input value={draft.aesthetic.texture} onChange={(event) => setDraft({ ...draft, aesthetic: { ...draft.aesthetic, texture: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><Field label="Motion language"><Input value={draft.aesthetic.motion} onChange={(event) => setDraft({ ...draft, aesthetic: { ...draft.aesthetic, motion: event.target.value } })} className="border-amber-100/15 bg-black/20" /></Field><div className="md:col-span-2 xl:col-span-3"><Field label="Profile summary"><Textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} className="min-h-20 border-amber-100/15 bg-black/20" /></Field></div></div><div className="mt-6 flex flex-wrap gap-3 border-t border-amber-100/10 pt-5"><Button onClick={() => previewingId === draft.id ? stopPreview() : startPreview(draft)} variant="outline" className="border-amber-300/35 bg-amber-300/[.06] text-amber-100 hover:bg-amber-300/[.12]">{previewingId === draft.id ? <CircleStop size={15} /> : <Play size={15} />} Preview this profile</Button><p className="self-center text-xs text-stone-500">Preview voice uses browser speech synthesis with a short generated tonal bed. It is an audition, not a final render.</p></div></div></section>}<div className="mt-5 flex gap-3 border border-amber-100/10 bg-black/15 p-4"><Headphones size={16} className="shrink-0 text-amber-200/60" /><p className="text-xs leading-5 text-stone-500">Templates express original, provider-neutral direction rather than replicating a named living artist or creator. Browser narration and the small synthetic audio bed let you audition a profile before you attach it; final narration and soundtrack rendering remain provider-backed production steps.</p></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label mb-2 block">{label}</span>{children}</label>;
}
