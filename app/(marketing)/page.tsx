import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  MicIcon,
  Users,
  Calendar,
  Workflow,
} from "lucide-react";

const headingFont = localFont({ src: "../../public/fonts/font.woff2" });

const textFont = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const MarketingPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="w-full pt-20 md:pt-24 lg:pt-32 pb-10 md:pb-16 lg:pb-20 px-4 sm:px-6 md:px-8 flex justify-center items-center bg-gradient-to-b from-background to-secondary/20 dark:from-background dark:to-background">
        <div className="container max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Hero Text */}
          <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left">
            <h1
              className={cn(
                "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
                headingFont.className
              )}
            >
              Transform <br className="hidden xs:inline sm:hidden" />
              Your Tasks <br className="hidden xs:inline sm:hidden" />
              Into{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 dark:from-blue-400 dark:to-teal-400">
                Achievements
              </span>
            </h1>
            <p
              className={cn(
                "text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0",
                textFont.className
              )}
            >
              Cognify combines voice recording, task management, and AI to help
              you organize your work, boost your productivity, and focus on what
              truly matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-base font-medium rounded-md"
                asChild
              >
                <Link href="/sign-up">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-base font-medium rounded-md"
                asChild
              >
                <Link href="/sign-in">Log In</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 w-full max-w-md lg:max-w-none mt-8 lg:mt-0">
            <div className="relative w-full overflow-hidden rounded-xl border shadow-xl aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary/20 dark:text-primary/10">
                <div className="text-7xl sm:text-8xl md:text-9xl font-bold">
                  ✓
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full h-full rounded-lg bg-card/80 backdrop-blur shadow-lg p-4 border border-border/50 flex items-center justify-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Dashboard Preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="w-full py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-background"
      >
        <div className="container max-w-7xl mx-auto space-y-10 md:space-y-16">
          <div className="text-center space-y-3 md:space-y-4">
            <h2
              className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight px-4",
                headingFont.className
              )}
            >
              Everything you need to stay productive
            </h2>
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4",
                textFont.className
              )}
            >
              Cognify combines the best task management tools with powerful
              voice-to-text capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature cards */}
            {[
              {
                icon: (
                  <MicIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                ),
                title: "Voice Recording",
                description:
                  "Speak your tasks and let Cognify convert them to actionable items automatically.",
                features: [
                  "Speech-to-text",
                  "Works offline",
                  "Automatic categorization",
                ],
              },
              {
                icon: (
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                ),
                title: "Kanban Boards",
                description:
                  "Organize your work with visual boards that adapt to your workflow and team structure.",
                features: ["Drag & drop", "Custom labels", "Priority markers"],
              },
              {
                icon: <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                title: "Team Collaboration",
                description:
                  "Work together with your team in real-time, assign tasks, and track progress effortlessly.",
                features: [
                  "Real-time updates",
                  "Role management",
                  "Activity history",
                ],
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border/50 flex flex-col h-full"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 sm:mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground flex-grow mb-4">
                  {feature.description}
                </p>
                <div className="mt-auto pt-4 border-t border-border/30">
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-xs sm:text-sm"
                      >
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingPage;

// needs to be page.tsx in order for the routing system to work
// need to import button npx shadcn-ui@latest add button
// @ is the alias
