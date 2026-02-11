import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import {
    ArrowRight,
    Calendar,
    Users,
    BarChart3,
    Shield,
    MessageSquare,
    ClipboardList,
    Package,
    Zap,
    Clock,
    TrendingUp,
    HeartHandshake,
    CheckCircle2,
    Star,
    ChevronRight,
    Globe,
    Twitter,
    Linkedin,
    Github,
    Mail,
    Sparkles,
} from "lucide-react";

/* ── Animated Section wrapper (fade-in on scroll) ──────────────────────── */
function AnimatedSection({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── Floating particles (decorative) ───────────────────────────────────── */
function FloatingParticles() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-brand/30"
                    style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: 4 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.7,
                    }}
                />
            ))}
        </div>
    );
}

/* ── Mock Dashboard SVG (CSS-illustrated, no external images) ──────────── */
function DashboardMockup() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface-card shadow-2xl shadow-brand/[0.03]">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-border/40 bg-surface-elevated/60 px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-brand/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                <div className="ml-3 h-3 w-40 rounded-md bg-border/30" />
            </div>
            {/* Dashboard body */}
            <div className="p-5">
                {/* Stat cards row */}
                <div className="mb-4 grid grid-cols-4 gap-3">
                    {[
                        { label: "Bookings", val: "248", color: "text-brand" },
                        { label: "Revenue", val: "$12.4k", color: "text-green-400" },
                        { label: "Staff", val: "12", color: "text-blue-400" },
                        { label: "Completion", val: "94%", color: "text-purple-400" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="rounded-lg border border-border/30 bg-surface-deep/60 p-3"
                        >
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                        </div>
                    ))}
                </div>
                {/* Chart placeholder */}
                <div className="mb-4 rounded-lg border border-border/30 bg-surface-deep/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Bookings Overview
                        </span>
                        <span className="text-[10px] text-brand">This week</span>
                    </div>
                    <div className="flex items-end gap-1.5">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 rounded-sm bg-gradient-to-t from-brand/30 to-brand/60"
                                initial={{ height: 0 }}
                                whileInView={{ height: h }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                            />
                        ))}
                    </div>
                </div>
                {/* Table rows */}
                <div className="space-y-2">
                    {[1, 2, 3].map((r) => (
                        <div
                            key={r}
                            className="flex items-center gap-3 rounded-lg border border-border/20 bg-surface-deep/40 px-3 py-2"
                        >
                            <div className="h-6 w-6 rounded-full bg-brand/15" />
                            <div className="flex-1 space-y-1">
                                <div className="h-2 w-24 rounded bg-border/40" />
                                <div className="h-1.5 w-16 rounded bg-border/20" />
                            </div>
                            <div className="h-5 w-14 rounded-md bg-brand/10 text-center text-[9px] leading-5 text-brand">
                                Active
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
    const { user, loading } = useAuth();
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-surface-deep">
            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  NAVBAR                                                  ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <nav className="sticky top-0 z-50 border-b border-border/50 bg-surface-deep/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/20">
                            CO
                        </div>
                        <span className="text-sm font-semibold tracking-widest text-foreground uppercase">
                            CareOps
                        </span>
                    </Link>

                    {/* Nav links — desktop */}
                    <div className="hidden items-center gap-8 md:flex">
                        {["Product", "Pricing", "Docs"].map((link) => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Auth buttons */}
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button
                                variant="ghost"
                                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
                            >
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button className="btn-glow bg-brand text-sm font-semibold text-white hover:bg-brand-hover">
                                Get Started
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  HERO SECTION                                            ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section
                ref={heroRef}
                className="auth-panel-bg relative overflow-hidden"
            >
                <div className="dot-grid absolute inset-0" />
                <div className="accent-line absolute left-[18%] top-0 h-[65%]" />
                <div className="accent-line absolute left-[78%] bottom-0 h-[45%]" />
                <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-brand/[0.04] blur-[160px]" />
                <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-brand/[0.03] blur-[140px]" />
                <FloatingParticles />

                <motion.div
                    style={{ opacity: heroOpacity, y: heroY }}
                    className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40"
                >
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        {/* Left: Copy */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-brand" />
                                <span className="text-xs font-medium tracking-wider text-brand uppercase">
                                    Unified Operations Platform
                                </span>
                            </div>

                            <h1 className="editorial-heading text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.95] text-ink/95">
                                Run Your Entire
                                <br />
                                Business From{" "}
                                <em className="relative text-brand">
                                    One System
                                    <motion.div
                                        className="absolute -bottom-1 left-0 h-[2px] bg-brand/40"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1, delay: 0.8 }}
                                    />
                                </em>
                            </h1>

                            <p className="mt-8 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
                                Bookings, messaging, forms, inventory, and operations unified in
                                one powerful platform. Setup takes under 5 minutes. No customer
                                login required.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link to="/register">
                                    <Button className="btn-glow group h-12 gap-2 bg-brand px-8 text-base font-semibold text-white hover:bg-brand-hover">
                                        Get Started
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button
                                        variant="outline"
                                        className="h-12 gap-2 border-border/50 bg-transparent px-8 text-base text-foreground hover:border-ink-muted/20 hover:bg-surface-elevated"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="mt-10 flex flex-wrap items-center gap-6">
                                {[
                                    "5-minute setup",
                                    "No credit card",
                                    "No customer login needed",
                                ].map((badge) => (
                                    <div
                                        key={badge}
                                        className="flex items-center gap-2 text-xs text-ink-muted/70"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-brand/60" />
                                        {badge}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right: Dashboard mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.9, delay: 0.3 }}
                            className="relative hidden lg:block"
                        >
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand/10 via-transparent to-brand/5 blur-xl" />
                            <div className="relative">
                                <DashboardMockup />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  SOCIAL PROOF — LOGO BAR                                 ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section className="border-y border-border/30 bg-surface-card/30 py-10">
                <div className="mx-auto max-w-7xl px-6">
                    <AnimatedSection className="text-center">
                        <p className="mb-8 text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">
                            Trusted by forward-thinking service businesses
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                            {[
                                "HealthFirst Clinics",
                                "UrbanSpa Co.",
                                "PetCare Pro",
                                "NextGen Dental",
                                "FitLife Studios",
                                "BrightSmile Orthodontics",
                            ].map((name) => (
                                <span
                                    key={name}
                                    className="text-sm font-semibold tracking-wider text-muted-foreground/30 uppercase"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  FEATURES GRID                                           ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section id="product" className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <AnimatedSection className="text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5">
                            <Zap className="h-3.5 w-3.5 text-brand" />
                            <span className="text-xs font-medium tracking-wider text-brand uppercase">
                                Core Features
                            </span>
                        </div>
                        <h2 className="editorial-heading text-3xl text-ink/95 sm:text-5xl">
                            Everything you need to{" "}
                            <em className="text-brand">operate</em>
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base text-ink-muted">
                            From scheduling to inventory, CareOps gives your team a single source
                            of truth reducing operational chaos and enabling real-time
                            visibility across every touchpoint.
                        </p>
                    </AnimatedSection>

                    <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Calendar,
                                title: "Smart Booking",
                                desc: "Automated scheduling with conflict detection, reminders, and customer self-booking zero friction.",
                                accent: "from-brand/20 to-brand/5",
                            },
                            {
                                icon: MessageSquare,
                                title: "Real-Time Messaging",
                                desc: "Email, SMS, and in-app notifications in one unified inbox. Never miss a customer message.",
                                accent: "from-blue-400/20 to-blue-400/5",
                            },
                            {
                                icon: ClipboardList,
                                title: "Dynamic Forms",
                                desc: "Intake forms, surveys, and waivers that auto-populate into your workflow. No paper, no chaos.",
                                accent: "from-green-400/20 to-green-400/5",
                            },
                            {
                                icon: Package,
                                title: "Inventory Tracking",
                                desc: "Track supplies, products, and equipment in real-time with low-stock alerts and reorder triggers.",
                                accent: "from-purple-400/20 to-purple-400/5",
                            },
                            {
                                icon: Users,
                                title: "Staff Management",
                                desc: "Role-based access, shift scheduling, and performance insights all from one dashboard.",
                                accent: "from-pink-400/20 to-pink-400/5",
                            },
                            {
                                icon: BarChart3,
                                title: "Unified Dashboard",
                                desc: "Real-time analytics, KPIs, and operational metrics at a glance. Make data-driven decisions instantly.",
                                accent: "from-cyan-400/20 to-cyan-400/5",
                            },
                            {
                                icon: Zap,
                                title: "Smart Automation",
                                desc: "Automate follow-ups, reminders, and workflows. Reduce manual work and focus on what matters.",
                                accent: "from-yellow-400/20 to-yellow-400/5",
                            },
                            {
                                icon: Shield,
                                title: "Secure Access Control",
                                desc: "Enterprise-grade security with role-based permissions, audit logs, and encrypted data at rest.",
                                accent: "from-red-400/20 to-red-400/5",
                            },
                        ].map((feat, i) => (
                            <AnimatedSection key={feat.title} delay={i * 0.08}>
                                <Card className="group relative h-full overflow-hidden border-border/50 bg-surface-card transition-all duration-300 hover:border-brand/20 hover:shadow-[0_0_40px_rgba(80,70,229,0.06)]">
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${feat.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                                    />
                                    <CardContent className="relative p-6">
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/15 transition-transform duration-300 group-hover:scale-110">
                                            <feat.icon className="h-5 w-5 text-brand" />
                                        </div>
                                        <h3 className="font-heading text-lg font-semibold text-foreground">
                                            {feat.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {feat.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  DASHBOARD PREVIEW (scroll-animated)                     ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section className="relative overflow-hidden border-y border-border/30 bg-surface-card/20 py-24 sm:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-surface-deep via-transparent to-surface-deep" />
                <div className="absolute left-1/2 top-0 h-px w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-6">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        {/* Left: Mockup */}
                        <AnimatedSection>
                            <div className="relative">
                                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand/8 via-transparent to-brand/4 blur-2xl" />
                                <div className="relative">
                                    <DashboardMockup />
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Right: Copy */}
                        <AnimatedSection delay={0.2}>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5">
                                <BarChart3 className="h-3.5 w-3.5 text-brand" />
                                <span className="text-xs font-medium tracking-wider text-brand uppercase">
                                    Command Center
                                </span>
                            </div>
                            <h2 className="editorial-heading text-3xl text-ink/95 sm:text-4xl">
                                Your operations,{" "}
                                <em className="text-brand">at a glance</em>
                            </h2>
                            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted">
                                A unified dashboard that brings together bookings, revenue, staff
                                activity, and customer engagement into one real-time view.
                                No switching between tools. No blind spots.
                            </p>
                            <ul className="mt-8 space-y-4">
                                {[
                                    "Live booking and revenue metrics",
                                    "Staff performance and shift tracking",
                                    "Customer communication history",
                                    "Inventory alerts and automation logs",
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-3 text-sm text-ink-muted"
                                    >
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="mt-8 inline-block">
                                <Button className="btn-glow group gap-2 bg-brand font-semibold text-white hover:bg-brand-hover">
                                    Try It Free
                                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  HOW IT WORKS                                            ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <AnimatedSection className="text-center">
                        <h2 className="editorial-heading text-3xl text-ink/95 sm:text-5xl">
                            Up and running in{" "}
                            <em className="text-brand">3 steps</em>
                        </h2>
                        <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted">
                            No complicated setup. No lengthy onboarding calls. Get your workspace
                            live and operating within minutes.
                        </p>
                    </AnimatedSection>

                    <div className="relative mt-20 grid gap-8 sm:grid-cols-3">
                        {/* Connecting line */}
                        <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent sm:block" />

                        {[
                            {
                                step: "01",
                                title: "Create Your Workspace",
                                desc: "Sign up, name your business, set your timezone and address. Your operational hub is ready in 60 seconds.",
                                icon: Globe,
                            },
                            {
                                step: "02",
                                title: "Connect Your Channels",
                                desc: "Set up email notifications, SMS, custom forms, and shareable booking links. Meet customers where they are.",
                                icon: MessageSquare,
                            },
                            {
                                step: "03",
                                title: "Operate in Real Time",
                                desc: "Share your booking link, invite staff, and manage everything from your unified dashboard. No customer login required.",
                                icon: Zap,
                            },
                        ].map((item, i) => (
                            <AnimatedSection key={item.step} delay={i * 0.15}>
                                <div className="relative rounded-2xl border border-border/50 bg-surface-card p-8 text-center transition-all duration-300 hover:border-brand/20 hover:shadow-[0_0_50px_rgba(80,70,229,0.05)]">
                                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
                                        <item.icon className="h-6 w-6 text-brand" />
                                    </div>
                                    <span className="text-xs font-bold tracking-widest text-brand uppercase">
                                        Step {item.step}
                                    </span>
                                    <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                        {item.desc}
                                    </p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  BUSINESS IMPACT                                         ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section className="border-y border-border/30 bg-surface-card/20 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <AnimatedSection className="text-center">
                        <h2 className="editorial-heading text-3xl text-ink/95 sm:text-5xl">
                            Real impact,{" "}
                            <em className="text-brand">measurable results</em>
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base text-ink-muted">
                            CareOps doesn't just organize it transforms. Businesses using our
                            platform report significant improvements across key metrics.
                        </p>
                    </AnimatedSection>

                    <div className="mt-16 grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                icon: TrendingUp,
                                metric: "60%",
                                label: "Fewer Missed Appointments",
                                desc: "Automated reminders and smart scheduling dramatically reduce no-shows.",
                            },
                            {
                                icon: HeartHandshake,
                                metric: "3×",
                                label: "Better Staff Coordination",
                                desc: "Role-based access and real-time updates keep everyone aligned and accountable.",
                            },
                            {
                                icon: Clock,
                                metric: "45min",
                                label: "Saved Per Day",
                                desc: "Automation handles follow-ups, form collection, and inventory alerts so you don't have to.",
                            },
                        ].map((stat, i) => (
                            <AnimatedSection key={stat.label} delay={i * 0.12}>
                                <div className="group rounded-2xl border border-border/50 bg-surface-card p-8 text-center transition-all duration-300 hover:border-brand/20">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/15 transition-transform duration-300 group-hover:scale-110">
                                        <stat.icon className="h-5 w-5 text-brand" />
                                    </div>
                                    <p className="text-4xl font-bold text-brand">
                                        {stat.metric}
                                    </p>
                                    <p className="mt-2 font-heading text-lg font-semibold text-foreground">
                                        {stat.label}
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {stat.desc}
                                    </p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  TESTIMONIALS                                            ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <AnimatedSection className="text-center">
                        <h2 className="editorial-heading text-3xl text-ink/95 sm:text-5xl">
                            Loved by{" "}
                            <em className="text-brand">operators everywhere</em>
                        </h2>
                    </AnimatedSection>

                    <div className="mt-16 grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                quote:
                                    "CareOps replaced 4 different tools for us. Everything from bookings to staff scheduling lives in one place now. Game changer.",
                                name: "Dr. Priya Kapoor",
                                role: "Founder, HealthFirst Clinics",
                            },
                            {
                                quote:
                                    "We reduced no-shows by over 50% in the first month. The automated reminders and real-time dashboard alone are worth it.",
                                name: "Marcus Chen",
                                role: "Operations Manager, UrbanSpa Co.",
                            },
                            {
                                quote:
                                    "The setup was incredibly fast. We were up and running in under 5 minutes no IT support needed. Our staff loves the simplicity.",
                                name: "Sarah Williams",
                                role: "Director, PetCare Pro",
                            },
                        ].map((testimonial, i) => (
                            <AnimatedSection key={testimonial.name} delay={i * 0.12}>
                                <Card className="h-full border-border/50 bg-surface-card transition-all duration-300 hover:border-brand/15">
                                    <CardContent className="flex h-full flex-col p-6">
                                        <div className="mb-4 flex gap-1">
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <Star
                                                    key={s}
                                                    className="h-4 w-4 fill-brand text-brand"
                                                />
                                            ))}
                                        </div>
                                        <p className="flex-1 text-sm leading-relaxed text-ink-muted italic">
                                            "{testimonial.quote}"
                                        </p>
                                        <Separator className="my-5 bg-border/30" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {testimonial.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {testimonial.role}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  FINAL CTA                                               ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <section className="relative overflow-hidden py-24 sm:py-32">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface-deep via-surface-card to-surface-deep" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand/[0.04] via-transparent to-brand/[0.04]" />
                <div className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand/25 to-transparent" />
                <div className="absolute bottom-0 left-1/2 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand/25 to-transparent" />
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/[0.05] blur-[150px]" />

                <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
                    <AnimatedSection>
                        <h2 className="editorial-heading text-4xl text-ink/95 sm:text-6xl">
                            Stop juggling tools.
                            <br />
                            <em className="text-brand">Start operating.</em>
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
                            Join hundreds of service businesses that ditched spreadsheets and
                            disconnected apps for one unified platform. Free to start. Ready in
                            minutes.
                        </p>
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Link to="/register">
                                <Button className="btn-glow group h-13 gap-2 bg-brand px-10 text-base font-semibold text-white hover:bg-brand-hover">
                                    Create Free Account
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button
                                    variant="outline"
                                    className="h-13 gap-2 border-border/50 bg-transparent px-8 text-base text-foreground hover:border-ink-muted/20 hover:bg-surface-elevated"
                                >
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-xs text-muted-foreground/50">
                            No credit card required · Free tier available · Setup in under 5 minutes
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* ╔═══════════════════════════════════════════════════════════╗
                ║  FOOTER                                                  ║
                ╚═══════════════════════════════════════════════════════════╝ */}
            <footer className="border-t border-border/40 bg-surface-card/30">
                <div className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/20">
                                    CO
                                </div>
                                <span className="text-sm font-semibold tracking-widest text-foreground uppercase">
                                    CareOps
                                </span>
                            </div>
                            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                                The unified operations platform for service-based businesses.
                                Reduce chaos. Increase visibility. Automate everything.
                            </p>
                            <div className="mt-6 flex gap-3">
                                {[Twitter, Linkedin, Github].map((Icon, i) => (
                                    <a
                                        key={i}
                                        href="#"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 text-muted-foreground transition-colors hover:border-brand/30 hover:text-brand"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Links */}
                        {[
                            {
                                heading: "Product",
                                links: [
                                    "Features",
                                    "Pricing",
                                    "Integrations",
                                    "Changelog",
                                    "Roadmap",
                                ],
                            },
                            {
                                heading: "Resources",
                                links: [
                                    "Documentation",
                                    "API Reference",
                                    "Blog",
                                    "Community",
                                    "Support",
                                ],
                            },
                            {
                                heading: "Company",
                                links: [
                                    "About",
                                    "Careers",
                                    "Privacy Policy",
                                    "Terms of Service",
                                    "Contact",
                                ],
                            },
                        ].map((col) => (
                            <div key={col.heading}>
                                <h4 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                    {col.heading}
                                </h4>
                                <ul className="mt-4 space-y-3">
                                    {col.links.map((link) => (
                                        <li key={link}>
                                            <a
                                                href="#"
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <Separator className="my-10 bg-border/30" />

                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-xs text-muted-foreground/50">
                            © {new Date().getFullYear()} CareOps. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            {["Privacy", "Terms", "Cookies"].map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    className="text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
