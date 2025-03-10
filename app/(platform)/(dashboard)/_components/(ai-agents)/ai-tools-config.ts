import { Lightbulb, Medal, Scale, WandSparkles } from "lucide-react";
import NoteWhiz from "@/app/(platform)/(dashboard)/_components/(ai-agents)/note-whiz";
import Judge from "@/app/(platform)/(dashboard)/_components/(ai-agents)/judge";
import RoutineBuilder from "@/app/(platform)/(dashboard)/_components/(ai-agents)/routine-builder";

import { ReactNode } from "react";
import MagicTodo from "@/app/(platform)/(dashboard)/_components/(ai-agents)/magic-todo";

export interface AIToolConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<{
    onClose: () => void;
    open: boolean;
    config: AIToolConfig;
  }>;
  apiRoute: string;
  initialMessage: string | ReactNode;
}

export const AI_TOOLS: AIToolConfig[] = [
  {
    id: "notewhiz",
    name: "NoteWhiz",
    description: "Got questions about your notes?",
    icon: Lightbulb,
    component: NoteWhiz,
    apiRoute: "/api/notewhiz",
    initialMessage: "Ask me questions about your notes",
  },
  {
    id: "magic-todo",
    name: "Magic Todo",
    description: "Need help organizing your thoughts?",
    icon: WandSparkles,
    component: MagicTodo,
    apiRoute: "/api/magictodo",
    initialMessage: "Start dumping your thoughts here...",
  },
  {
    id: "judge",
    name: "Judge",
    description: "Am I misreading the tone of this?",
    icon: Scale,
    component: Judge,
    apiRoute: "/api/judge",
    initialMessage: "Start dumping your thoughts here...",
  },
  {
    id: "routine builder",
    name: "RoutineBuilder",
    description: "Want to stay productive?",
    icon: Medal,
    component: RoutineBuilder,
    apiRoute: "/api/routineBuilder",
    initialMessage: "Let's build your routine",
  },
];
