"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const stories = [
  {
    tag: "Simulated meters",
    title: "Read the local energy moment.",
    copy: "Modeled solar output, battery reserve, household demand, and Tokyo weather become a clean settlement signal.",
    meta: "24.7 kWh surplus",
    tone: "bg-[#9BE870]",
  },
  {
    tag: "YuiDen Agent",
    title: "Match homes like a settlement desk.",
    copy: "The custom agent prioritizes same-zone routes, highest surplus, nearby demand, and settlement readiness.",
    meta: "94% confidence",
    tone: "bg-[#123D24] text-[#9BE870]",
  },
  {
    tag: "HSP-ready flow",
    title: "Prepare the order lifecycle.",
    copy: "Dynamic kWh pricing is shaped into an HSP-aligned order and receipt path for future merchant integration.",
    meta: "¥27.5/kWh",
    tone: "bg-[#F6B73C] text-[#071A12]",
  },
  {
    tag: "HashKey Chain",
    title: "Leave a receipt every time.",
    copy: "Each receipt records producer, buyer, kWh, value, zone, carbon estimate, and transaction status.",
    meta: "Audit ready",
    tone: "bg-white text-[#071A12]",
  },
];

export default function ParallaxFlow() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(".story-card", { autoAlpha: 1 });
        return;
      }

      gsap.from(".story-kicker, .story-title, .story-copy, .story-controls", {
        autoAlpha: 0,
        y: 24,
        duration: 0.75,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
        },
      });

      gsap.from(".story-card", {
        autoAlpha: 0,
        x: 80,
        scale: 0.96,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top 78%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  function scrollTrack(direction: "left" | "right") {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction === "right" ? 640 : -640,
      behavior: "smooth",
    });
  }

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-white py-20 md:py-24">
      <div className="pl-5 pr-0 md:pl-10 xl:pl-[max(4rem,calc((100vw-1440px)/2+4rem))]">
        <div className="grid gap-10 lg:grid-cols-[25rem_minmax(0,1fr)] lg:items-center xl:grid-cols-[31rem_minmax(0,1fr)]">
        <div className="max-w-[31rem] pr-5 md:pr-8">
          <p className="story-kicker mb-5 inline-flex rounded-full bg-[#E8FFF6] px-4 py-2 text-sm font-black text-[#20C997]">
            Product story
          </p>
          <h2 className="story-title [font-family:var(--font-rowdies)] text-5xl font-black leading-[0.9] text-[#071A12] sm:text-6xl md:text-7xl">
            For solar communities settling locally.
          </h2>
          <p className="story-copy mt-6 max-w-lg text-lg font-bold leading-8 text-[#53645B]">
            A carousel-style journey from simulated meter context to auditable HashKey Chain receipt, designed for
            local renewable settlement.
          </p>
          <div className="story-controls mt-8 flex gap-4">
            <button
              onClick={() => scrollTrack("left")}
              className="grid h-14 w-14 place-items-center rounded-full bg-[#9BE870] text-3xl font-black text-[#071A12] shadow-sm transition hover:bg-[#86D960] md:h-16 md:w-16 md:text-4xl"
              aria-label="Previous story card"
            >
              &larr;
            </button>
            <button
              onClick={() => scrollTrack("right")}
              className="grid h-14 w-14 place-items-center rounded-full bg-[#9BE870] text-3xl font-black text-[#071A12] shadow-sm transition hover:bg-[#86D960] md:h-16 md:w-16 md:text-4xl"
              aria-label="Next story card"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className="relative min-w-0 overflow-hidden">
          <div
            ref={trackRef}
            className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-5 pr-[12vw] md:gap-7 lg:pr-[10vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {stories.map((story, index) => (
              <article
                key={story.title}
                className={`story-card min-h-[29rem] w-[84vw] min-w-[84vw] shrink-0 snap-start rounded-[2.25rem] border border-[#E5E7EB] p-6 shadow-sm sm:w-[31rem] sm:min-w-[31rem] md:min-h-[33rem] md:w-[34rem] md:min-w-[34rem] md:p-8 xl:w-[40rem] xl:min-w-[40rem] ${story.tone}`}
              >
                <div className="mb-14 flex items-center justify-between">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white/85 text-2xl font-black md:h-24 md:w-24 md:text-3xl">
                    {index === 0 ? "kWh" : index === 1 ? "AI" : index === 2 ? "HSP" : "TX"}
                  </div>
                  <span className="rounded-full bg-white/85 px-5 py-3 text-sm font-black text-[#071A12]">{story.meta}</span>
                </div>
                <p className="text-sm font-black uppercase opacity-70">{story.tag}</p>
                <h3 className="mt-4 [font-family:var(--font-rowdies)] text-4xl font-black leading-[0.98] md:text-5xl">{story.title}</h3>
                <p className="mt-6 max-w-md text-lg font-bold leading-8 opacity-75">{story.copy}</p>
              </article>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
