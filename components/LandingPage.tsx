"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import HeroVisual from "@/components/HeroVisual";
import ParallaxFlow from "@/components/ParallaxFlow";
import PremiumDashboardPreview from "@/components/PremiumDashboardPreview";

const badges = ["AI Track", "HSP-ready Flow", "HashKey Chain", "Post-FIT Solar"];

const problemCards = [
  ["Post-FIT gap", "Early feed-in tariff contracts are expiring, and rooftop solar needs a better market interface."],
  ["Surplus value", "Local producers need a clear way to convert unused sunlight into settlement-ready value."],
  ["Audit records", "Communities need transparent receipts that agents, homes, and operators can inspect instantly."],
];

const steps = [
  ["01", "Simulate meter data", "Model generation, demand, battery level, and zone."],
  ["02", "Find surplus", "Classify each home as producer, buyer, or balanced."],
  ["03", "Match locally", "Prioritize same-zone energy routes with the best available balance."],
  ["04", "Prepare HSP-ready order", "Prepare settlement terms for an HSP-aligned order lifecycle."],
  ["05", "Write receipt", "Capture kWh, JPY, USDT, CO2, zone, and chain status."],
];

const technicalRails = [
  ["HashKey Chain", "Transparent settlement records for every energy receipt."],
  ["HSP", "HSP-ready order flow for frequent agent-native settlement."],
  ["AI agent", "Weather-aware matching, pricing, and route recommendation layer."],
  ["Receipt", "Audit artifact linking energy, value, carbon estimate, and chain status."],
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(".hero-kicker, .hero-title, .hero-copy, .hero-badge, .hero-cta, .hero-visual", {
          autoAlpha: 1,
        });
        return;
      }

      gsap.from(".hero-kicker, .hero-title, .hero-copy, .hero-badge, .hero-cta", {
        autoAlpha: 0,
        y: 24,
        duration: 0.82,
        stagger: 0.07,
        ease: "power3.out",
      });

      gsap.from(".hero-visual", {
        autoAlpha: 0,
        scale: 0.965,
        duration: 1,
        delay: 0.16,
        ease: "power3.out",
      });

      gsap.to(".hero-orbit", {
        xPercent: 10,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F7F0] text-deep">
      <nav className="sticky top-0 z-50 bg-[#F7F7F0]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6">
          <Link href="/" className="[font-family:var(--font-rowdies)] text-3xl font-black tracking-tight">
            Yui<span className="text-energy">Den</span>
          </Link>
          <div className="hidden items-center gap-8 text-base font-black text-deep/80 md:flex">
            <a href="#problem" className="transition hover:text-deep">
              Problem
            </a>
            <a href="#how" className="transition hover:text-deep">
              How it Works
            </a>
            <a href="#demo" className="transition hover:text-deep">
              Console
            </a>
            <a href="#receipts" className="transition hover:text-deep">
              Receipts
            </a>
          </div>
          <Link href="/dashboard" className="rounded-full bg-[#9BE870] px-6 py-3 font-black text-deep shadow-sm">
            Open Console
          </Link>
        </div>
      </nav>

      <section ref={heroRef} className="relative min-h-[calc(100vh-5rem)]">
        <div className="hero-orbit absolute right-0 top-20 h-80 w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(155,232,112,0.35),transparent_64%)] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="hero-kicker mb-8 flex flex-wrap gap-4 text-sm font-black text-deep/80">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">AI energy settlement network</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Post-FIT solar settlement</span>
            </div>
            <h1 className="hero-title [font-family:var(--font-rowdies)] max-w-5xl text-6xl font-black uppercase leading-[0.86] text-[#050505] md:text-8xl xl:text-[7.5rem]">
              Settle local solar for less friction
            </h1>
            <p className="hero-copy mt-8 max-w-2xl text-xl font-bold leading-8 text-muted">
              YuiDen uses simulated smart-meter data, real Tokyo weather signals, and a custom AI agent to match surplus
              solar with nearby demand, then records HSP-aligned settlement receipts on HashKey Chain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span key={badge} className="hero-badge rounded-full bg-white px-4 py-2 text-sm font-black text-deep shadow-sm">
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/dashboard" className="hero-cta rounded-full bg-[#9BE870] px-8 py-4 text-lg font-black text-deep shadow-sm">
                Open YuiDen Console
              </Link>
              <a href="#how" className="hero-cta rounded-full bg-deep px-8 py-4 text-lg font-black text-white shadow-sm">
                View Settlement Flow
              </a>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section id="problem" className="bg-[#9BE870] py-24">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <h2 className="mx-auto max-w-5xl [font-family:var(--font-rowdies)] text-5xl font-black uppercase leading-[0.9] text-deep md:text-7xl">
            Never lose surplus sunlight value again
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-bold leading-8 text-deep/70">
            Post-FIT solar homes need a clean way to price, match, settle, and audit local renewable exchange.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 rounded-[2rem] bg-white p-6 shadow-soft md:grid-cols-3">
            {problemCards.map(([title, copy]) => (
              <article key={title} className="rounded-[1.5rem] bg-[#F7F7F0] p-6 text-left">
                <h3 className="[font-family:var(--font-rowdies)] text-2xl font-black">{title}</h3>
                <p className="mt-4 font-bold leading-7 text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ParallaxFlow />

      <AnimatedSection id="how" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-28">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <p className="text-sm font-black uppercase text-energy">How YuiDen works</p>
          <h2 className="mt-5 [font-family:var(--font-rowdies)] text-5xl font-black uppercase leading-[0.92] md:text-7xl">
            From meter signal to settlement receipt.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-bold leading-8 text-muted">
            YuiDen turns simulated neighborhood energy data into a clear five-step settlement loop for AI agents,
            households, and receipt auditors.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map(([number, title, copy]) => (
            <article key={title} className="rounded-[2rem] bg-white p-6 shadow-sm">
              <span className="mb-8 inline-flex rounded-full bg-solar px-4 py-2 font-black">{number}</span>
              <h3 className="[font-family:var(--font-rowdies)] text-2xl font-black leading-none">{title}</h3>
              <p className="mt-4 font-bold leading-7 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection id="demo" className="bg-deep px-5 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-sm font-black uppercase text-[#9BE870]">Product preview</p>
              <h2 className="max-w-4xl [font-family:var(--font-rowdies)] text-5xl font-black uppercase leading-[0.9] text-[#9BE870] md:text-7xl">
                An AI settlement desk for local energy.
              </h2>
            </div>
            <Link href="/dashboard" className="w-fit rounded-full bg-[#9BE870] px-7 py-4 font-black text-deep">
              Open YuiDen Console
            </Link>
          </div>
          <PremiumDashboardPreview />
        </div>
      </AnimatedSection>

      <AnimatedSection id="receipts" className="mx-auto max-w-7xl px-5 py-24">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-soft md:p-12">
          <p className="mb-5 text-sm font-black uppercase text-energy">HashKey and HSP alignment</p>
          <h2 className="max-w-4xl [font-family:var(--font-rowdies)] text-5xl font-black uppercase leading-[0.9] md:text-7xl">
            Local energy, clear settlement.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {technicalRails.map(([title, copy]) => (
              <article key={title} className="rounded-[2rem] bg-[#F7F7F0] p-6">
                <h3 className="[font-family:var(--font-rowdies)] text-2xl font-black">{title}</h3>
                <p className="mt-4 font-bold leading-7 text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0D3500] p-8 text-center text-[#9BE870] shadow-soft md:p-16">
          <div className="absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 rounded-full bg-solar/30 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-4xl [font-family:var(--font-rowdies)] text-5xl font-black uppercase leading-[0.9] md:text-7xl">
              TURN SURPLUS SUNLIGHT INTO INSTANT SETTLEMENT.
            </h2>
            <Link href="/dashboard" className="mt-9 inline-flex rounded-full bg-[#9BE870] px-8 py-4 font-black text-deep">
              Run YuiDen Agent
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
