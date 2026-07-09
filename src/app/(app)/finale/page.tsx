"use client";

import { useState } from "react";
import { goldenBloom, finaleConcepts, riskBoard } from "@/data/finale";

const statusStyle: Record<string, { color: string; label: string }> = {
  confirm: { color: "var(--danger)", label: "Confirm" },
  watch: { color: "var(--warn)", label: "Watch" },
  ok: { color: "var(--emerald-bright)", label: "On track" },
};

export default function FinalePage() {
  const [chosen, setChosen] = useState<string>("B");

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="mb-5">
        <div className="chip mb-2">Module 04 · Finale</div>
        <h1 className="font-display italic text-3xl md:text-5xl gold-gradient">
          {goldenBloom.title}
        </h1>
        <p className="text-[13px] text-[var(--text-dim)] mt-1">
          {goldenBloom.subtitle} · {goldenBloom.placement}
        </p>
      </div>

      {/* Concept + palette */}
      <section className="panel px-7 py-6 mb-4">
        <div className="flex flex-wrap gap-3 mb-3">
          <span className="chip">⏱ {goldenBloom.duration}</span>
          <span className="chip" style={{ color: "var(--emerald-bright)" }}>
            ● Emerald
          </span>
          <span className="chip" style={{ color: "var(--gold-bright)" }}>
            ● Gold
          </span>
          <span className="chip">{goldenBloom.palette}</span>
        </div>
        <p className="text-[14px] text-[var(--text-dim)] leading-relaxed max-w-4xl">
          {goldenBloom.concept}
        </p>
      </section>

      {/* Build beats */}
      <section className="grid md:grid-cols-4 gap-3 mb-4">
        {goldenBloom.beats.map((b, i) => (
          <div key={b.name} className="panel px-5 py-5">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display text-xl gold-text">{b.name}</span>
              <span className="text-[11px] text-[var(--text-faint)]">{b.window}</span>
            </div>
            <div
              className="h-1 rounded-full mb-3"
              style={{
                background: "linear-gradient(90deg, var(--emerald), var(--gold-bright))",
                opacity: 0.3 + i * 0.23,
              }}
            />
            <p className="text-[12.5px] text-[var(--text-dim)] leading-relaxed">
              {b.body}
            </p>
          </div>
        ))}
      </section>

      {/* Concept boards */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold gold-text">
            Concept boards — pick the direction
          </h2>
          <span className="text-[12px] text-[var(--text-faint)]">
            Selected: {finaleConcepts.find((c) => c.id === chosen)?.title}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {finaleConcepts.map((c) => {
            const active = chosen === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setChosen(c.id)}
                className="panel overflow-hidden text-left transition-all"
                style={{
                  borderColor: active ? "var(--gold)" : "var(--border-soft)",
                  boxShadow: active ? "0 0 0 1px var(--gold)" : "none",
                }}
              >
                <div className="relative h-56 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className="absolute top-3 left-3 chip"
                    style={{
                      background: active ? "var(--gold)" : "rgba(10,15,13,0.8)",
                      color: active ? "#201a08" : "var(--text)",
                      borderColor: "transparent",
                    }}
                  >
                    {c.label}
                    {active ? " ✓" : ""}
                  </span>
                </div>
                <div className="px-5 py-4">
                  <h3 className="font-semibold text-[15px] mb-1">{c.title}</h3>
                  <p className="text-[12.5px] text-[var(--text-dim)] leading-relaxed">
                    {c.pitch}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Success criteria */}
        <section className="panel px-6 py-5">
          <h3 className="text-sm font-semibold emerald-text mb-3">
            Success criteria — non-negotiables
          </h3>
          <ul className="space-y-2">
            {goldenBloom.successCriteria.map((s) => (
              <li key={s} className="flex gap-2 text-[13px] text-[var(--text-dim)]">
                <span className="emerald-text shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* Risk board */}
        <section className="panel px-6 py-5">
          <h3 className="text-sm font-semibold gold-text mb-3">Production risk board</h3>
          <div className="space-y-2.5">
            {riskBoard.map((r) => {
              const st = statusStyle[r.status];
              return (
                <div key={r.area} className="flex gap-3">
                  <span
                    className="mt-1 w-2 h-2 rounded-full shrink-0"
                    style={{ background: st.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">{r.area}</span>
                      <span
                        className="text-[10px] font-semibold uppercase"
                        style={{ color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-faint)] leading-snug">
                      {r.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
