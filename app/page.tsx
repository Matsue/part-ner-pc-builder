'use client';

import {
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Cpu,
  Gauge,
  GitCompareArrows,
  MemoryStick,
  Microchip,
  Power,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { useStore } from 'zustand';

import { Button } from '@/components/ui/button';
import { evaluateCompatibility } from '@/lib/domain/compatibility';
import { games, products, productsById } from '@/lib/domain/data';
import { evaluateBuildGoals } from '@/lib/domain/goals';
import type { Category, Product } from '@/lib/domain/types';
import { buildStore } from '@/lib/store/build-store';
import { baseToolNames, useWebMcpRegistration } from '@/lib/webmcp/use-webmcp';

const categoryMeta: Record<
  Category,
  { label: string; short: string; icon: typeof Box }
> = {
  case: { label: 'Case', short: 'Start with the frame', icon: Box },
  gpu: { label: 'Graphics', short: 'Shape your frame rate', icon: Microchip },
  cpu: { label: 'Processor', short: 'Keep every frame moving', icon: Cpu },
  motherboard: { label: 'Motherboard', short: 'Connect the platform', icon: MemoryStick },
  psu: { label: 'Power supply', short: 'Power it with headroom', icon: Power },
};

const yen = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

function productFacts(product: Product) {
  switch (product.category) {
    case 'case':
      return [`${product.maxGpuLengthMm} mm GPU`, product.motherboardForms.join(' / '), `${product.psuForm} PSU`];
    case 'gpu':
      return [`${product.vramGb} GB VRAM`, `${product.lengthMm} mm`, `${product.recommendedPsuW} W PSU`];
    case 'cpu':
      return [`${product.socket} socket`, `${product.tdpW} W`, `Gaming ${product.gamingScore}`];
    case 'motherboard':
      return [`${product.socket} socket`, product.form, product.color];
    case 'psu':
      return [`${product.wattageW} W`, product.form, `${product.efficiency} efficiency`];
  }
}

function ProductGlyph({ product }: { product: Product }) {
  const Icon = categoryMeta[product.category].icon;
  return (
    <div
      className={`product-glyph ${product.color === 'white' ? 'product-glyph--light' : ''}`}
      aria-hidden="true"
    >
      <div className="product-glyph__grid" />
      <Icon className="relative z-10 size-14 stroke-[1.15]" />
      <span className="relative z-10 font-mono text-[9px] uppercase tracking-[0.28em] opacity-60">
        {product.id}
      </span>
    </div>
  );
}

function GoalPill({ children }: { children: React.ReactNode }) {
  return <span className="goal-pill">{children}</span>;
}

function AppHeader() {
  const goal = useStore(buildStore, (state) => state.goal);
  const version = useStore(buildStore, (state) => state.version);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090b0f]/92 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-5 px-5 xl:px-7">
        <div className="flex shrink-0 items-center gap-3 border-r border-white/10 pr-5">
          <div className="grid size-9 place-items-center rounded-xl bg-lime-300 text-[#0a0c10] shadow-[0_0_30px_rgb(190_242_100/18%)]">
            <Microchip className="size-[18px]" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[-0.02em] text-white">PART / NER</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Shared build studio</div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
          <GoalPill><WalletCards className="size-3.5 text-lime-300" /> {yen.format(goal.budgetYen)}</GoalPill>
          <GoalPill><span className="size-2 rounded-full bg-zinc-100" /> {goal.theme} theme</GoalPill>
          {goal.games.map((game) => (
            <GoalPill key={game.gameId}>
              <Gauge className="size-3.5 text-cyan-300" />
              {games[game.gameId].name} · {game.resolution} / {game.preset} / {game.targetFps}+
            </GoalPill>
          ))}
        </div>
        <div className="hidden shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 lg:flex">
          <span className="size-1.5 rounded-full bg-lime-300 shadow-[0_0_9px_rgb(190_242_100)]" />
          Live build v{version}
        </div>
      </div>
    </header>
  );
}

function PartsNav() {
  const activeCategory = useStore(buildStore, (state) => state.activeCategory);
  const selected = useStore(buildStore, (state) => state.selected);
  const compatibility = evaluateCompatibility(selected);

  return (
    <aside className="parts-nav">
      <div className="mb-5 px-1">
        <p className="eyebrow">01 / Choose parts</p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Build your machine</h2>
      </div>
      <nav aria-label="PC part categories" className="space-y-1.5">
        {(Object.keys(categoryMeta) as Category[]).map((category, index) => {
          const meta = categoryMeta[category];
          const Icon = meta.icon;
          const issue = compatibility.issues.find((item) => item.affectedCategories.includes(category));
          const isSelected = Boolean(selected[category]);
          return (
            <button
              key={category}
              type="button"
              onClick={() => buildStore.getState().setActiveCategory(category)}
              className={`category-button ${activeCategory === category ? 'category-button--active' : ''}`}
            >
              <span className="category-button__index">0{index + 1}</span>
              <span className="category-button__icon"><Icon className="size-[17px]" /></span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[13px] font-bold text-zinc-100">{meta.label}</span>
                <span className="block truncate text-[10px] text-zinc-500">
                  {selected[category]?.name ?? meta.short}
                </span>
              </span>
              {issue ? (
                <CircleAlert className={`size-4 ${issue.severity === 'error' ? 'text-red-400' : 'text-amber-300'}`} />
              ) : isSelected ? (
                <Check className="size-4 text-lime-300" />
              ) : (
                <ChevronRight className="size-4 text-zinc-700" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-white/8 pt-5">
        <div className="assistant-note">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-lime-300" />
          <p><strong>Agent-ready.</strong> Your assistant sees the same live build and deterministic compatibility facts you do.</p>
        </div>
      </div>
    </aside>
  );
}

function ProductCard({ product }: { product: Product }) {
  const selected = useStore(buildStore, (state) => state.selected);
  const goal = useStore(buildStore, (state) => state.goal);
  const isSelected = selected[product.category]?.id === product.id;
  const projected = { ...selected, [product.category]: product };
  const compatibility = evaluateCompatibility(projected);
  const goals = evaluateBuildGoals(projected, goal);
  const relevantIssue = compatibility.issues.find((issue) => issue.affectedCategories.includes(product.category));

  return (
    <article className={`product-card ${isSelected ? 'product-card--selected' : ''}`}>
      <ProductGlyph product={product} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.17em] text-zinc-500">
              {product.color ? `${product.color} edition` : categoryMeta[product.category].label}
            </p>
            <h3 className="text-[14px] font-bold leading-snug tracking-tight text-zinc-100">{product.name}</h3>
          </div>
          {isSelected && <span className="selected-badge"><Check className="size-3" /> In build</span>}
        </div>
        <p className="mt-2 min-h-8 text-[11px] leading-relaxed text-zinc-500">{product.blurb}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {productFacts(product).map((fact) => <span key={fact} className="fact-chip">{fact}</span>)}
        </div>
        {product.category === 'gpu' && goals.games.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-white/7 pt-3">
            {goals.games.slice(0, 2).map((game) => (
              <div key={game.gameId} className="rounded-lg bg-white/[0.035] px-2.5 py-2">
                <div className="truncate text-[9px] font-semibold text-zinc-500">{games[game.gameId].name}</div>
                <div className="mt-0.5 text-[12px] font-bold tabular-nums text-zinc-200">{game.range.min}–{game.range.max} FPS</div>
                <div className={`mt-1 text-[9px] font-bold uppercase ${game.status === 'meets_goal' ? 'text-lime-300' : game.status === 'conditional' ? 'text-amber-300' : 'text-red-400'}`}>
                  {game.status === 'meets_goal' ? '✓ Meets goal' : game.status === 'conditional' ? '△ On the edge' : '↓ Adjust settings'}
                </div>
              </div>
            ))}
          </div>
        )}
        {relevantIssue && (
          <div className={`mt-3 flex items-start gap-2 rounded-lg px-2.5 py-2 text-[10px] ${relevantIssue.severity === 'error' ? 'bg-red-400/10 text-red-300' : 'bg-amber-300/10 text-amber-200'}`}>
            <CircleAlert className="mt-px size-3.5 shrink-0" /> {relevantIssue.title}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="text-[17px] font-black tracking-tight text-white">{yen.format(product.priceYen)}</div>
          <Button
            onClick={() => buildStore.getState().selectProduct(product.id, 'human')}
            variant={isSelected ? 'secondary' : 'default'}
            className={isSelected ? '' : 'bg-lime-300 text-[#0b0d10] hover:bg-lime-200'}
          >
            {isSelected ? 'Selected' : 'Add to build'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function RecommendationSection() {
  const recommendation = useStore(buildStore, (state) => state.recommendation);
  const selected = useStore(buildStore, (state) => state.selected);
  const goal = useStore(buildStore, (state) => state.goal);
  if (!recommendation) return null;

  return (
    <section className="recommendation-section" aria-labelledby="recommendation-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-lime-300">
            <Sparkles className="size-3.5" /> AI shop assistant recommends
          </div>
          <h2 id="recommendation-title" className="mt-1.5 text-[20px] font-black tracking-[-0.03em] text-white">
            {recommendation.title}
          </h2>
        </div>
        <div className="rounded-full border border-white/8 bg-black/20 px-3 py-1.5 font-mono text-[9px] text-zinc-500">
          Based on live build v{recommendation.basedOnBuildVersion}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {recommendation.candidates.map((candidate, index) => {
          const product = productsById[candidate.productId];
          if (!product) return null;
          const projected = { ...selected, [product.category]: product };
          const compatibility = evaluateCompatibility(projected);
          const goals = evaluateBuildGoals(projected, goal);
          const isSelected = selected[product.category]?.id === product.id;
          const tradeoff = goals.remainingYen < 0
            ? `${yen.format(Math.abs(goals.remainingYen))} over the total budget.`
            : product.color && goal.theme !== 'any' && product.color !== goal.theme
              ? `Breaks the ${goal.theme} visual theme.`
              : `Leaves ${yen.format(goals.remainingYen)} for the rest of the build.`;
          return (
            <article key={candidate.productId} className={`recommendation-card ${index === 0 ? 'recommendation-card--lead' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="recommendation-angle">{candidate.angle}</span>
                <span className="font-mono text-[8px] text-zinc-600">0{index + 1}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`grid size-11 shrink-0 place-items-center rounded-xl border border-white/9 ${product.color === 'white' ? 'bg-zinc-200 text-zinc-700' : 'bg-[#20242b] text-zinc-400'}`}>
                  {(() => { const Icon = categoryMeta[product.category].icon; return <Icon className="size-5" />; })()}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-[13px] font-bold text-white">{product.name}</h3>
                  <div className="mt-0.5 text-[16px] font-black text-zinc-100">{yen.format(product.priceYen)}</div>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-black/20 p-2.5">
                <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">Goal impact</div>
                {goals.games.slice(0, 2).map((game) => (
                  <div key={game.gameId} className="mt-1.5 flex items-center justify-between gap-2 text-[9px]">
                    <span className="truncate text-zinc-500">{games[game.gameId].name}</span>
                    <span className={game.status === 'meets_goal' ? 'font-bold text-lime-300' : game.status === 'conditional' ? 'font-bold text-amber-300' : 'font-bold text-red-400'}>
                      {projected.gpu ? `${game.range.min}–${game.range.max} FPS` : 'CPU fit'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2 text-[9px] leading-relaxed">
                <div><span className="font-bold text-zinc-400">Why this one? </span><span className="text-zinc-500">{candidate.reason}</span></div>
                <div><span className="font-bold text-zinc-400">Trade-off </span><span className="text-zinc-500">{tradeoff}</span></div>
                <div className={`flex items-center gap-1.5 font-bold ${compatibility.status === 'error' ? 'text-red-400' : compatibility.status === 'warning' ? 'text-amber-300' : 'text-lime-300'}`}>
                  {compatibility.status === 'compatible' ? <ShieldCheck className="size-3" /> : <CircleAlert className="size-3" />}
                  {compatibility.status === 'compatible' ? 'Compatible with the current build' : compatibility.issues[0]?.title}
                </div>
              </div>

              <Button
                className={`mt-4 w-full ${isSelected ? '' : index === 0 ? 'bg-lime-300 text-[#0b0d10] hover:bg-lime-200' : ''}`}
                variant={isSelected ? 'secondary' : index === 0 ? 'default' : 'outline'}
                onClick={() => buildStore.getState().selectProduct(product.id, 'human')}
              >
                {isSelected ? <><Check /> In your build</> : <>Choose this path <ArrowRight /></>}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductBrowser() {
  const activeCategory = useStore(buildStore, (state) => state.activeCategory);
  const recommendation = useStore(buildStore, (state) => state.recommendation);
  const items = products.filter((product) => product.category === activeCategory);
  const meta = categoryMeta[activeCategory];

  return (
    <section className="min-w-0 px-5 py-5 xl:px-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">02 / Browse {meta.label}</p>
          <h1 className="mt-1 text-[26px] font-black tracking-[-0.04em] text-white">{meta.short}</h1>
          <p className="mt-1 text-xs text-zinc-500">Six fictional products. Real compatibility logic. Your choice stays in control.</p>
        </div>
        <div className="hidden text-right sm:block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Showing</span>
          <div className="text-sm font-bold text-zinc-300">{items.length} products</div>
        </div>
      </div>
      {recommendation?.category === activeCategory && <RecommendationSection />}
      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3 ${recommendation?.category === activeCategory ? 'mt-5' : ''}`}>
        {items.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

function BuildSidebar() {
  const selected = useStore(buildStore, (state) => state.selected);
  const goal = useStore(buildStore, (state) => state.goal);
  const preview = useStore(buildStore, (state) => state.preview);
  const version = useStore(buildStore, (state) => state.version);
  const compatibility = evaluateCompatibility(selected);
  const evaluation = evaluateBuildGoals(selected, goal);
  const previewEvaluation = preview ? evaluateBuildGoals(preview.after, goal) : null;
  const previewCompatibility = preview ? evaluateCompatibility(preview.after) : null;
  const previewExpired = Boolean(preview && preview.basedOnBuildVersion !== version);

  return (
    <aside className="build-sidebar">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">03 / Shared workspace</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-white">Your build</h2>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Reset build" onClick={() => buildStore.getState().clearBuild()}>
          <RotateCcw className="size-3.5" />
        </Button>
      </div>

      {preview && previewEvaluation && previewCompatibility && (
        <section className={`preview-panel ${previewExpired ? 'preview-panel--expired' : ''}`} aria-label="Build change preview">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="size-4 text-cyan-300" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-200">Change preview</div>
                <div className="text-[8px] text-zinc-600">Preview only · build not changed</div>
              </div>
            </div>
            <button type="button" aria-label="Dismiss preview" onClick={() => buildStore.getState().dismissPreview()} className="text-zinc-600 hover:text-zinc-300"><X className="size-3.5" /></button>
          </div>
          <div className="mt-3 space-y-2">
            {(Object.entries(preview.changes) as Array<[Category, string | null]>).map(([category, productId]) => (
              <div key={category} className="preview-change-row">
                <span className="w-[68px] text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">{categoryMeta[category].label}</span>
                <span className="min-w-0 flex-1 truncate text-[9px] text-zinc-500">{preview.before[category]?.name ?? 'Empty'}</span>
                <ArrowRight className="size-3 text-zinc-700" />
                <span className="min-w-0 flex-1 truncate text-right text-[9px] font-semibold text-zinc-200">{productId ? productsById[productId]?.name : 'Remove'}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/20 p-2">
              <div className="text-[8px] uppercase tracking-wide text-zinc-600">New total</div>
              <div className="mt-0.5 text-[12px] font-bold text-zinc-200">{yen.format(previewEvaluation.totalYen)}</div>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <div className="text-[8px] uppercase tracking-wide text-zinc-600">Compatibility</div>
              <div className={`mt-0.5 text-[10px] font-bold ${previewCompatibility.status === 'compatible' ? 'text-lime-300' : 'text-red-400'}`}>{previewCompatibility.status}</div>
            </div>
          </div>
          {previewExpired ? (
            <div className="mt-3 rounded-lg bg-red-400/10 px-2.5 py-2 text-[9px] font-semibold text-red-300">PREVIEW_EXPIRED — the live build changed. Ask the assistant to create a fresh preview.</div>
          ) : (
            <Button className="mt-3 w-full bg-cyan-300 text-[#071015] hover:bg-cyan-200" onClick={() => buildStore.getState().applyPreview(preview.id, 'human')}>
              Approve & apply preview
            </Button>
          )}
        </section>
      )}

      <div className="mt-5 space-y-1.5">
        {(Object.keys(categoryMeta) as Category[]).map((category) => {
          const product = selected[category];
          return (
            <button
              key={category}
              type="button"
              onClick={() => buildStore.getState().setActiveCategory(category)}
              className="build-row"
            >
              <span className="w-[76px] shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">{categoryMeta[category].label}</span>
              <span className={`min-w-0 flex-1 truncate text-left text-[11px] ${product ? 'font-semibold text-zinc-200' : 'text-zinc-600'}`}>
                {product?.name ?? 'Not selected'}
              </span>
              <span className="text-[10px] tabular-nums text-zinc-500">{product ? yen.format(product.priceYen) : '—'}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-y border-white/8 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Build total</span>
          <span className="text-[22px] font-black tracking-tight text-white">{yen.format(evaluation.totalYen)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>Budget {yen.format(goal.budgetYen)}</span>
          <span className={evaluation.remainingYen < 0 ? 'font-bold text-red-400' : 'font-bold text-lime-300'}>
            {evaluation.remainingYen < 0 ? `${yen.format(Math.abs(evaluation.remainingYen))} over` : `${yen.format(evaluation.remainingYen)} left`}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/7">
          <div className={`h-full rounded-full ${evaluation.remainingYen < 0 ? 'bg-red-400' : 'bg-lime-300'}`} style={{ width: `${Math.min(100, (evaluation.totalYen / goal.budgetYen) * 100)}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <div className={`goal-check ${evaluation.budget.status === 'meets_goal' ? 'goal-check--pass' : 'goal-check--fail'}`}>
            <Check className="size-3" />
            <span>Budget {evaluation.budget.status === 'meets_goal' ? 'met' : 'over'}</span>
          </div>
          <div className={`goal-check ${evaluation.theme.status === 'meets_goal' ? 'goal-check--pass' : 'goal-check--fail'}`}>
            <Check className="size-3" />
            <span>Theme {evaluation.theme.status === 'meets_goal' ? 'matched' : 'mixed'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">Compatibility</p>
        <div className={`status-panel status-panel--${compatibility.status}`}>
          {compatibility.status === 'compatible' ? <Check className="size-4" /> : <CircleAlert className="size-4" />}
          <div>
            <div className="text-[11px] font-bold">{compatibility.status === 'compatible' ? 'Compatible so far' : compatibility.status === 'warning' ? 'Check power headroom' : 'Compatibility issue'}</div>
            <div className="mt-0.5 text-[9px] opacity-70">{compatibility.issues[0]?.title ?? 'Every selected part works together.'}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">Game goals</p>
        <div className="space-y-1.5">
          {evaluation.games.map((game) => (
            <div key={game.gameId} className="game-goal-row">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-semibold text-zinc-300">{games[game.gameId].name}</div>
                <div className="text-[9px] text-zinc-600">Target {game.targetFps} FPS</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold tabular-nums text-zinc-300">{selected.gpu ? `${game.range.min}–${game.range.max}` : '—'} FPS</div>
                <div className={`text-[8px] font-bold uppercase tracking-wide ${game.status === 'meets_goal' ? 'text-lime-300' : game.status === 'conditional' ? 'text-amber-300' : 'text-zinc-600'}`}>
                  {selected.gpu ? game.status.replace('_', ' ') : 'Select GPU'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function WebMcpDebugPanel({
  status,
}: {
  status: ReturnType<typeof useWebMcpRegistration>;
}) {
  const debugRequested = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get('debug') === '1',
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = debugRequested && !dismissed;
  const selected = useStore(buildStore, (state) => state.selected);
  const hasError = evaluateCompatibility(selected).status === 'error';

  if (!visible) return null;
  const tools = [...baseToolNames, ...(hasError ? ['resolve_build_issues'] : [])];
  return (
    <aside className="debug-panel" aria-label="WebMCP debug panel">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Radio className={`size-3.5 ${status.available ? 'text-lime-300' : 'text-amber-300'}`} />
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-200">WebMCP tools</div>
            <div className="text-[8px] text-zinc-600">{status.available ? 'Browser API detected' : 'API unavailable · declarations shown'}</div>
          </div>
        </div>
        <button type="button" aria-label="Hide WebMCP debug panel" className="text-zinc-600 hover:text-zinc-300" onClick={() => setDismissed(true)}><X className="size-3.5" /></button>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto p-2">
        {tools.map((name) => {
          const registered = status.registered.includes(name);
          const failed = status.failed.includes(name);
          return (
            <div key={name} className="flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-[8px] text-zinc-400">
              <span className={`size-1.5 rounded-full ${registered ? 'bg-lime-300' : failed ? 'bg-red-400' : 'bg-zinc-600'}`} />
              <span className="flex-1">{name}</span>
              <span className="text-[7px] uppercase text-zinc-600">{registered ? 'registered' : failed ? 'failed' : 'declared'}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default function Home() {
  const webMcpStatus = useWebMcpRegistration();
  return (
    <main className="min-h-screen bg-[#090b0f] text-zinc-100">
      <AppHeader />
      <div className="app-shell">
        <PartsNav />
        <ProductBrowser />
        <BuildSidebar />
      </div>
      <footer className="border-t border-white/8 px-6 py-4 text-center text-[10px] text-zinc-600">
        All products, games, prices, and performance estimates are fictional and provided for demonstration purposes.
      </footer>
      <WebMcpDebugPanel status={webMcpStatus} />
    </main>
  );
}
