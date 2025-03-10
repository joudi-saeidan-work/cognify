import {
  Feather,
  Lightbulb,
  Medal,
  Scale,
  WandSparkles,
  BookOpen,
  Briefcase,
} from "lucide-react";
import NoteWhiz from "@/app/(platform)/(dashboard)/_components/(ai-agents)/note-whiz";
import RoutineBuilder from "@/app/(platform)/(dashboard)/_components/(ai-agents)/routine-builder";

import { ReactNode } from "react";
import MagicTodo from "@/app/(platform)/(dashboard)/_components/(ai-agents)/magic-todo";
import Formalizer from "./formalizer";
import Professor from "@/app/(platform)/(dashboard)/_components/(ai-agents)/professor";
import Consultant from "@/app/(platform)/(dashboard)/_components/(ai-agents)/consultant";
import Judge from "./judge";

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
    id: "formalizer",
    name: "Text Formalizer",
    description: "Need to polish your writing?",
    icon: Feather,
    component: Formalizer,
    apiRoute: "/api/formalizer",
    initialMessage: "Enter text to reformulate...",
  },
  {
    id: "professor",
    name: "The Professor",
    description: "Want to learn something new?",
    icon: BookOpen,
    component: Professor,
    apiRoute: "/api/professor",
    initialMessage: "What do you want to learn about?",
  },
  {
    id: "consultant",
    name: "The Consultant",
    description: "Need help with a decision?",
    icon: Briefcase,
    component: Consultant,
    apiRoute: "/api/consultant",
    initialMessage: "Describe your situation...",
  },
  {
    id: "routine-builder",
    name: "RoutineBuilder",
    description: "Want to stay productive?",
    icon: Medal,
    component: RoutineBuilder,
    apiRoute: "/api/routineBuilder",
    initialMessage: "Let's build your routine",
  },
];
