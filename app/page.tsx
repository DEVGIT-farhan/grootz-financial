"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const WHATSAPP_NUMBER = "918056466932";
const CONTACT_EMAIL = "munafmmr01@gmail.com";

const services = [
  ["01", "Wealth management", "Bring investments, cash flow, protection and family priorities into one considered financial picture."],
  ["02", "Equity & markets", "Market context, research and trading-account enquiries for investors who want a clearer decision framework."],
  ["03", "Mutual funds", "Goal-led fund conversations built around time horizon, liquidity needs and comfort with market movement."],
  ["04", "Protection & insurance", "Review the financial risks that matter to your household, business and long-term plan."],
  ["05", "Loans & credit", "Understand borrowing options, repayment trade-offs and the documentation needed before you proceed."],
  ["06", "Portfolio management", "A focused view for larger, more complex portfolios requiring a more deliberate review rhythm."],
  ["07", "NRI & business", "Coordinate questions around global finances, succession, business capital and India-linked priorities."],
  ["08", "Financial advisory", "Turn changing goals, tax questions and major life decisions into a practical next conversation."],
];

const insights = [
  ["Planning", "Before the next investment, define the job your money needs to do.", "A simple three-question framework for purpose, time horizon and liquidity."],
  ["Markets", "Market movement is information—not an instruction.", "How to separate a useful market check-in from an impulse to act."],
  ["Protection", "The financial plan people skip is often the one they need first.", "A short review of emergency reserves, insurance and nomination details."],
];

const riskQuestions: Array<[string, string[]]> = [
  ["When would you likely need this money?", ["Within 2 years", "3–5 years", "More than 5 years"]],
  ["If your investment temporarily fell 15%, you would…", ["Feel uncomfortable and reduce exposure", "Wait and review the plan", "Stay invested if the goal remains on track"]],
  ["Your priority today is closest to…", ["Capital stability", "Balance between stability and growth", "Long-term growth"]],
  ["How familiar are you with market volatility?", ["New to investing", "Some experience", "Comfortable with it"]],
  ["Which outcome matters most?", ["Reliable access to money", "A balanced goal plan", "Building wealth over time"]],
];

type ToolKey = "sip" | "lump" | "emi" | "goal" | "retirement" | "cagr" | "fd" | "rd" | "tax" | "inflation";

const toolTabs: Array<[ToolKey, string]> = [
  ["sip", "SIP"], ["lump", "Lump sum"], ["emi", "EMI"], ["goal", "Goal plan"], ["retirement", "Retirement"],
  ["cagr", "CAGR"], ["fd", "FD"], ["rd", "RD"], ["tax", "Tax"], ["inflation", "Inflation"],
];

const initialCalculatorInputs = {
  sipMonthly: 25000, sipReturn: 12, sipYears: 10,
  lumpInvestment: 1000000, lumpReturn: 12, lumpYears: 10,
  loanAmount: 3000000, loanRate: 9, loanYears: 15,
  goalAmount: 5000000, currentSavings: 500000, goalReturn: 11, goalYears: 10,
  currentAge: 30, retirementAge: 60, lifeExpectancy: 85, monthlyExpense: 50000, retirementInflation: 6,
  startValue: 500000, endValue: 1000000, cagrYears: 5,
  fdDeposit: 500000, fdRate: 7, fdYears: 3,
  rdDeposit: 10000, rdRate: 7, rdYears: 3,
  annualIncome: 1200000, deductions: 150000,
  currentCost: 50000, inflationRate: 6, inflationYears: 10,
};

type CalculatorInputKey = keyof typeof initialCalculatorInputs;
type FieldFormat = "currency" | "percent" | "years" | "age";
type CalculatorField = { key: CalculatorInputKey; label: string; min: number; max: number; step: number; format: FieldFormat };

const calculatorFields: Record<ToolKey, CalculatorField[]> = {
  sip: [
    { key: "sipMonthly", label: "Monthly investment", min: 500, max: 200000, step: 500, format: "currency" },
    { key: "sipReturn", label: "Expected annual return", min: 1, max: 25, step: 0.5, format: "percent" },
    { key: "sipYears", label: "Investment period", min: 1, max: 40, step: 1, format: "years" },
  ],
  lump: [
    { key: "lumpInvestment", label: "One-time investment", min: 10000, max: 50000000, step: 10000, format: "currency" },
    { key: "lumpReturn", label: "Expected annual return", min: 1, max: 25, step: 0.5, format: "percent" },
    { key: "lumpYears", label: "Holding period", min: 1, max: 40, step: 1, format: "years" },
  ],
  emi: [
    { key: "loanAmount", label: "Loan amount", min: 100000, max: 50000000, step: 100000, format: "currency" },
    { key: "loanRate", label: "Annual interest rate", min: 1, max: 20, step: 0.1, format: "percent" },
    { key: "loanYears", label: "Loan tenure", min: 1, max: 35, step: 1, format: "years" },
  ],
  goal: [
    { key: "goalAmount", label: "Target amount", min: 100000, max: 100000000, step: 100000, format: "currency" },
    { key: "currentSavings", label: "Current savings for this goal", min: 0, max: 50000000, step: 10000, format: "currency" },
    { key: "goalReturn", label: "Expected annual return", min: 1, max: 25, step: 0.5, format: "percent" },
    { key: "goalYears", label: "Years to goal", min: 1, max: 40, step: 1, format: "years" },
  ],
  retirement: [
    { key: "currentAge", label: "Current age", min: 18, max: 70, step: 1, format: "age" },
    { key: "retirementAge", label: "Retirement age", min: 40, max: 80, step: 1, format: "age" },
    { key: "monthlyExpense", label: "Current monthly expenses", min: 10000, max: 1000000, step: 5000, format: "currency" },
    { key: "retirementInflation", label: "Expected inflation", min: 1, max: 15, step: 0.5, format: "percent" },
    { key: "lifeExpectancy", label: "Expected life age", min: 60, max: 100, step: 1, format: "age" },
  ],
  cagr: [
    { key: "startValue", label: "Initial investment value", min: 1000, max: 50000000, step: 1000, format: "currency" },
    { key: "endValue", label: "Current or final value", min: 1000, max: 100000000, step: 1000, format: "currency" },
    { key: "cagrYears", label: "Investment period", min: 1, max: 40, step: 1, format: "years" },
  ],
  fd: [
    { key: "fdDeposit", label: "Fixed deposit amount", min: 1000, max: 50000000, step: 1000, format: "currency" },
    { key: "fdRate", label: "Annual interest rate", min: 1, max: 15, step: 0.1, format: "percent" },
    { key: "fdYears", label: "Deposit tenure", min: 1, max: 10, step: 1, format: "years" },
  ],
  rd: [
    { key: "rdDeposit", label: "Monthly deposit", min: 500, max: 200000, step: 500, format: "currency" },
    { key: "rdRate", label: "Annual interest rate", min: 1, max: 15, step: 0.1, format: "percent" },
    { key: "rdYears", label: "Deposit tenure", min: 1, max: 10, step: 1, format: "years" },
  ],
  tax: [
    { key: "annualIncome", label: "Annual taxable income", min: 100000, max: 100000000, step: 50000, format: "currency" },
    { key: "deductions", label: "Eligible deduction", min: 0, max: 200000, step: 1000, format: "currency" },
  ],
  inflation: [
    { key: "currentCost", label: "Current monthly cost", min: 1000, max: 1000000, step: 1000, format: "currency" },
    { key: "inflationRate", label: "Expected annual inflation", min: 1, max: 20, step: 0.5, format: "percent" },
    { key: "inflationYears", label: "Years from today", min: 1, max: 40, step: 1, format: "years" },
  ],
};

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.max(0, value));
}

function TradingViewWidget({ chart = false, height = 360 }: { chart?: boolean; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.replaceChildren();
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.async = true;
    script.src = chart
      ? "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
      : "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.innerHTML = JSON.stringify(chart ? {
      width: "100%", height, symbol: "TVC:GOLD", interval: "D", timezone: "Asia/Kolkata", theme: "light", style: "1",
      locale: "en", enable_publishing: false, hide_top_toolbar: false, hide_legend: false, allow_symbol_change: false,
      save_image: false, calendar: false, support_host: "https://www.tradingview.com",
    } : {
      symbols: [
        { proName: "TVC:GOLD", title: "GOLD" }, { proName: "TVC:SILVER", title: "SILVER" },
        { proName: "FX_IDC:USDINR", title: "USD/INR" }, { proName: "COINBASE:BTCUSD", title: "BTC/USD" },
      ], showSymbolLogo: true, isTransparent: false, displayMode: "adaptive", colorTheme: "light", locale: "en",
    });
    host.append(widget, script);
    return () => host.replaceChildren();
  }, [chart, height]);

  return <div ref={ref} style={chart ? { height } : undefined} className={chart ? "tv-chart tradingview-widget-container" : "tv-ticker tradingview-widget-container"} />;
}

export default function Home() {
  const [tool, setTool] = useState<ToolKey>("sip");
  const [calculatorInputs, setCalculatorInputs] = useState(initialCalculatorInputs);
  const [taxRegime, setTaxRegime] = useState<"new" | "old">("new");
  const [taxResidency, setTaxResidency] = useState<"resident" | "nonresident">("resident");
  const [deductionInfoOpen, setDeductionInfoOpen] = useState(false);
  const [riskAnswers, setRiskAnswers] = useState<number[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "Wealth management", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const toolResult = useMemo(() => {
    const value = calculatorInputs;
    const futureValue = (principal: number, annualRate: number, years: number) => principal * Math.pow(1 + annualRate / 100, years);
    const sipFutureValue = (monthlyAmount: number, annualRate: number, years: number) => {
      const monthlyRate = annualRate / 1200;
      const months = years * 12;
      return monthlyRate ? monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate) : monthlyAmount * months;
    };
    const sipValue = sipFutureValue(value.sipMonthly, value.sipReturn, value.sipYears);
    const lumpValue = futureValue(value.lumpInvestment, value.lumpReturn, value.lumpYears);
    const emiMonths = value.loanYears * 12;
    const loanMonthlyRate = value.loanRate / 1200;
    const emi = loanMonthlyRate ? value.loanAmount * loanMonthlyRate * Math.pow(1 + loanMonthlyRate, emiMonths) / (Math.pow(1 + loanMonthlyRate, emiMonths) - 1) : value.loanAmount / emiMonths;
    const totalRepayment = emi * emiMonths;
    const goalGap = Math.max(0, value.goalAmount - value.currentSavings);
    const goalMonthlyRate = value.goalReturn / 1200;
    const goalMonths = value.goalYears * 12;
    const goalMonthly = goalMonthlyRate ? goalGap * goalMonthlyRate / ((Math.pow(1 + goalMonthlyRate, goalMonths) - 1) * (1 + goalMonthlyRate)) : goalGap / goalMonths;
    const yearsToRetirement = Math.max(1, value.retirementAge - value.currentAge);
    const yearsInRetirement = Math.max(1, value.lifeExpectancy - value.retirementAge);
    const annualRetirementExpense = value.monthlyExpense * 12 * Math.pow(1 + value.retirementInflation / 100, yearsToRetirement);
    const retirementRate = 0.04;
    const retirementCorpus = annualRetirementExpense * (1 - Math.pow(1 + retirementRate, -yearsInRetirement)) / retirementRate;
    const cagr = value.startValue > 0 && value.endValue > 0 ? (Math.pow(value.endValue / value.startValue, 1 / value.cagrYears) - 1) * 100 : 0;
    const fdValue = value.fdDeposit * Math.pow(1 + value.fdRate / 400, value.fdYears * 4);
    const rdValue = sipFutureValue(value.rdDeposit, value.rdRate, value.rdYears);
    const taxableIncome = Math.max(0, value.annualIncome - (taxRegime === "old" ? value.deductions : 0));
    const newTax = taxableIncome <= 400000 ? 0 : taxableIncome <= 800000 ? (taxableIncome - 400000) * 0.05 : taxableIncome <= 1200000 ? 20000 + (taxableIncome - 800000) * 0.1 : taxableIncome <= 1600000 ? 60000 + (taxableIncome - 1200000) * 0.15 : taxableIncome <= 2000000 ? 120000 + (taxableIncome - 1600000) * 0.2 : taxableIncome <= 2400000 ? 200000 + (taxableIncome - 2000000) * 0.25 : 300000 + (taxableIncome - 2400000) * 0.3;
    const oldTax = taxableIncome <= 250000 ? 0 : taxableIncome <= 500000 ? (taxableIncome - 250000) * 0.05 : taxableIncome <= 1000000 ? 12500 + (taxableIncome - 500000) * 0.2 : 112500 + (taxableIncome - 1000000) * 0.3;
    const grossTax = taxRegime === "new" ? newTax : oldTax;
    const rebateIncomeLimit = taxRegime === "new" ? 1200000 : 500000;
    const rebateCap = taxRegime === "new" ? 60000 : 12500;
    const section87ARebate = taxResidency === "resident" && taxableIncome <= rebateIncomeLimit ? Math.min(grossTax, rebateCap) : 0;
    const taxAfterRebate = Math.max(0, grossTax - section87ARebate);
    const marginalRelief = taxRegime === "new" && taxResidency === "resident" && taxableIncome > 1200000 ? Math.max(0, taxAfterRebate - (taxableIncome - 1200000)) : 0;
    const tax = Math.max(0, taxAfterRebate - marginalRelief);
    const inflationValue = value.currentCost * Math.pow(1 + value.inflationRate / 100, value.inflationYears);
    const items: Record<ToolKey, { label: string; value: number; detail: string; isPercent?: boolean; contributionLabel: string; contribution: number; outcomeLabel: string; outcome: number; rebate?: number; marginalRelief?: number }> = {
      sip: { label: "Estimated future value", value: sipValue, detail: `With a monthly SIP of ${inr(value.sipMonthly)} for ${value.sipYears} years.`, contributionLabel: "Your investments", contribution: value.sipMonthly * value.sipYears * 12, outcomeLabel: "Estimated growth", outcome: Math.max(0, sipValue - value.sipMonthly * value.sipYears * 12) },
      lump: { label: "Estimated future value", value: lumpValue, detail: `Based on a one-time investment of ${inr(value.lumpInvestment)}.`, contributionLabel: "One-time investment", contribution: value.lumpInvestment, outcomeLabel: "Estimated growth", outcome: Math.max(0, lumpValue - value.lumpInvestment) },
      emi: { label: "Estimated monthly EMI", value: emi, detail: `For a ${value.loanYears}-year loan at ${value.loanRate}% p.a.`, contributionLabel: "Loan principal", contribution: value.loanAmount, outcomeLabel: "Estimated interest", outcome: Math.max(0, totalRepayment - value.loanAmount) },
      goal: { label: "Indicative monthly investment", value: goalMonthly, detail: `To bridge the remaining ${inr(goalGap)} in ${value.goalYears} years.`, contributionLabel: "Current savings", contribution: Math.min(value.currentSavings, value.goalAmount), outcomeLabel: "Target gap", outcome: goalGap },
      retirement: { label: "Illustrative retirement corpus", value: retirementCorpus, detail: `For ${yearsInRetirement} years after retiring at ${value.retirementAge}.`, contributionLabel: "First-year retirement cost", contribution: annualRetirementExpense, outcomeLabel: "Later-year spending", outcome: Math.max(0, retirementCorpus - annualRetirementExpense) },
      cagr: { label: "Annualised growth rate", value: cagr, detail: `From ${inr(value.startValue)} to ${inr(value.endValue)} over ${value.cagrYears} years.`, isPercent: true, contributionLabel: "Starting value", contribution: value.startValue, outcomeLabel: "Value change", outcome: Math.max(0, value.endValue - value.startValue) },
      fd: { label: "Estimated maturity value", value: fdValue, detail: `Quarterly compounding for ${value.fdYears} years.`, contributionLabel: "Deposit amount", contribution: value.fdDeposit, outcomeLabel: "Estimated interest", outcome: Math.max(0, fdValue - value.fdDeposit) },
      rd: { label: "Estimated maturity value", value: rdValue, detail: `Monthly deposits of ${inr(value.rdDeposit)} for ${value.rdYears} years.`, contributionLabel: "Your deposits", contribution: value.rdDeposit * value.rdYears * 12, outcomeLabel: "Estimated interest", outcome: Math.max(0, rdValue - value.rdDeposit * value.rdYears * 12) },
      tax: { label: "Illustrative income tax", value: tax, detail: taxRegime === "new" ? "New regime estimate for FY 2025–26. General Chapter VI-A deductions are not included." : "Old regime estimate for FY 2025–26. This calculator caps 80C plus additional self-NPS at ₹2 lakh; other deductions have separate rules.", contributionLabel: "Estimated tax", contribution: tax, outcomeLabel: "Income after tax", outcome: Math.max(0, taxableIncome - tax), rebate: section87ARebate, marginalRelief },
      inflation: { label: "Future monthly cost", value: inflationValue, detail: `A current cost of ${inr(value.currentCost)} after ${value.inflationYears} years.`, contributionLabel: "Current cost", contribution: value.currentCost, outcomeLabel: "Inflation impact", outcome: Math.max(0, inflationValue - value.currentCost) },
    };
    return items[tool];
  }, [calculatorInputs, taxRegime, taxResidency, tool]);

  const pieBreakdown = useMemo(() => {
    const total = Math.max(1, toolResult.contribution + toolResult.outcome);
    return { ...toolResult, contributionPercent: (toolResult.contribution / total) * 100 };
  }, [toolResult]);
  const activeCalculatorFields = calculatorFields[tool].filter((field) => tool !== "tax" || taxRegime === "old" || field.key !== "deductions");
  const riskScore = riskAnswers.reduce((sum, item) => sum + item, 0) / Math.max(riskAnswers.length, 1);
  const riskProfile = riskScore < 1 ? ["Careful navigator", "Start with liquidity, protection and a stable goal plan."] : riskScore < 2 ? ["Balanced builder", "Explore diversified, goal-led options with a regular review rhythm."] : ["Growth seeker", "Discuss a longer-horizon growth plan with clear risk guardrails."];
  const enquiryText = encodeURIComponent(`Hello Grootz, I am ${form.name || "interested in a consultation"}. I would like help with ${form.interest}. Phone: ${form.phone || "not provided"}. ${form.message}`);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main id="top" className="site-shell min-h-screen overflow-x-hidden">
      <div className="ticker-wrap"><TradingViewWidget /></div>
      <header className="site-header mx-auto flex w-[min(1180px,calc(100%-40px))] items-center justify-between py-6">
        <a href="#top" aria-label="Grootz home" className="brand-logo"><img src="/grootz-logo-approved.svg" alt="Grootz" /><span>TRADINGCORE BROKING SERVICES PVT LTD</span></a>
        <nav className="hidden items-center gap-7 text-xs text-slate-400 lg:flex"><a href="#services">Services</a><a href="#markets">Markets</a><a href="#tools">Tools</a><a href="#insights">Insights</a><a href="#contact">Contact</a></nav>
        <a className="rounded-full bg-[#21dc7e] px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-[#45ef9b]" href="#contact">Book a consultation</a>
      </header>
      <details className="mobile-menu mx-auto w-[min(1180px,calc(100%-40px))] lg:hidden">
        <summary>Explore Grootz <span aria-hidden="true">+</span></summary>
        <nav aria-label="Mobile navigation"><a href="#services">Services</a><a href="#markets">Markets</a><a href="#tools">Planning tools</a><a href="#insights">Insights</a><a href="#contact">Contact</a></nav>
      </details>

      <section className="hero-grid mx-auto w-[min(1180px,calc(100%-40px))] py-14 lg:py-20">
        <div className="relative z-10 py-5 lg:py-12">
          <p className="eyebrow"><span /> Independent financial clarity</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-medium leading-[.93] tracking-[-.075em] text-slate-100 sm:text-7xl">Make your next<br />money move with <i>clarity.</i></h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-400">Financial guidance for investors, families, business owners and global Indians. Start with the decision—not a product pitch.</p>
          <div className="mt-9 flex flex-wrap gap-4"><a href="#contact" className="button-primary">Start a conversation <span>↗</span></a><a href="#tools" className="button-text">Explore planning tools <span>↓</span></a></div>
          <p className="mt-12 text-[11px] text-slate-500">For investors, families, founders and NRIs. No trade execution—only informed decisions.</p>
        </div>
        <div className="hero-visual relative min-h-[450px] overflow-hidden rounded-[28px] border border-white/10 p-5 sm:min-h-[540px]">
          <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: "url('/grootz-hero.jpg')" }} />
          <div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between text-[10px] font-bold tracking-[.16em] text-emerald-200"><span>LIVE MARKET VIEW</span><span>GOLD · TRADINGVIEW</span></div><div className="chart-float rounded-2xl border p-3 shadow-2xl backdrop-blur"><TradingViewWidget chart height={360} /></div><div className="flex items-center justify-between text-xs text-slate-400"><span>Observe the signal. Decide with context.</span><a href="#markets" className="text-emerald-200">Market lens ↗</a></div></div>
        </div>
      </section>

      <section className="trust-strip border-y"><div className="mx-auto flex min-h-20 w-[min(1180px,calc(100%-40px))] flex-wrap items-center justify-between gap-5 py-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">We Set The Standard of Excellence</p><div className="flex flex-wrap gap-x-7 gap-y-2 text-xs text-slate-300"><span>Wealth</span><span>Markets</span><span>Protection</span><span>Goals</span><span>Guidance</span></div></div></section>

      <section id="services" className="section"><div className="mx-auto w-[min(1180px,calc(100%-40px))]"><div className="section-heading"><div><p className="eyebrow"><span /> Services</p><h2>Your financial life,<br /><i>seen as a whole.</i></h2></div><p>Each conversation begins with the life behind the decision: your goals, responsibilities, available time and comfort with uncertainty.</p></div><div className="service-grid mt-12">{services.map(([number, title, copy]) => <article key={title} className="service-card"><span>{number}</span><h3>{title}</h3><p>{copy}</p><a href="#contact">Discuss this <b>↗</b></a></article>)}</div></div></section>

      <section id="markets" className="market-section border-y py-24"><div className="market-grid mx-auto w-[min(1180px,calc(100%-40px))] items-center gap-14"><div><p className="eyebrow"><span /> Markets without the noise</p><h2 className="mt-5">A calmer way to<br /><i>read a moving world.</i></h2><p className="mt-6 max-w-md leading-7 text-slate-400">Follow key global instruments in a single focused view. Use the market as context for your plan—not as a reason to rush it.</p><div className="mt-8 flex gap-8 text-xs"><div><span className="block text-[10px] uppercase tracking-widest text-slate-500">Coverage</span><b>Global</b></div><div><span className="block text-[10px] uppercase tracking-widest text-slate-500">Lens</span><b>Long-term</b></div><div><span className="block text-[10px] uppercase tracking-widest text-slate-500">Approach</span><b>Independent</b></div></div><div className="market-note mt-8 border-l-2 p-4 text-xs leading-5 text-slate-400"><b className="block text-[10px] uppercase tracking-widest text-emerald-200">Use this view well</b>Notice what is moving, check why it matters to your plan, then decide whether any action is actually needed.</div></div><div className="chart-card"><div className="chart-label"><span>COMMODITIES · GOLD</span><span>LIVE DATA · TRADINGVIEW</span></div><TradingViewWidget chart height={430} /></div></div></section>

      <section id="tools" className="section">
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="section-heading">
            <div><p className="eyebrow"><span /> Grootz planning tools</p><h2>Make the numbers<br /><i>make sense.</i></h2></div>
            <p>Practical calculators for conversations, not promises. Results are illustrative and are not financial, tax or investment advice.</p>
          </div>
          <div className="tool-shell mt-12">
            <div className="tool-tabs" role="tablist">
              {toolTabs.map(([key, label]) => <button key={key} type="button" className={tool === key ? "active" : ""} onClick={() => setTool(key)}>{label}</button>)}
            </div>
            <div className="calculator-grid">
              <div className="calculator-fields">
                {activeCalculatorFields.map((field) => (
                  <div key={field.key}>
                    <div className="calculator-input-header">
                      {field.key === "deductions" ? <span className="deduction-info">Eligible deduction <button type="button" className="info-button" aria-label="Show eligible deduction limits" aria-expanded={deductionInfoOpen} onClick={() => setDeductionInfoOpen(!deductionInfoOpen)}>i</button><span role="tooltip" className="deduction-tooltip">₹1.5 lakh under 80C/80CCC/80CCD(1), + ₹50,000 additional self-NPS under 80CCD(1B) (Maximum: ₹2,00,000)</span></span> : <span>{field.label}</span>}
                      <input className="manual-number" type="number" aria-label={`Enter ${field.label}`} title="Type an exact value" min={field.min} max={field.max} step={field.format === "percent" ? 0.1 : 1} value={calculatorInputs[field.key]} onChange={(event) => setCalculatorInputs({ ...calculatorInputs, [field.key]: Number(event.target.value) })} />
                    </div>
                    <input type="range" min={field.min} max={field.max} step={field.step} value={calculatorInputs[field.key]} onChange={(event) => setCalculatorInputs({ ...calculatorInputs, [field.key]: Number(event.target.value) })} />
                  </div>
                ))}
                {tool === "tax" && (
                  <>
                    <label className="calculator-select">Tax regime
                      <select value={taxRegime} onChange={(event) => setTaxRegime(event.target.value as "new" | "old")}>
                        <option value="new">New regime</option>
                        <option value="old">Old regime</option>
                      </select>
                    </label>
                    <label className="calculator-select">Residential status
                      <select value={taxResidency} onChange={(event) => setTaxResidency(event.target.value as "resident" | "nonresident")}>
                        <option value="resident">Resident individual</option>
                        <option value="nonresident">NRI / non-resident</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
              <div className="result-panel">
                <p className="eyebrow"><span /> {tool.toUpperCase()} VIEW</p>
                <h3>{toolResult.label}</h3>
                <strong>{toolResult.isPercent ? `${toolResult.value.toFixed(1)}%` : inr(toolResult.value)}</strong>
                <p>{toolResult.detail}</p>
                {tool === "tax" && <p className="tax-result-note"><span>Section 87A rebate</span><b>−{inr(toolResult.rebate ?? 0)}</b>{(toolResult.marginalRelief ?? 0) > 0 && <><span>Marginal relief</span><b>−{inr(toolResult.marginalRelief ?? 0)}</b></>}</p>}
                <a href="#contact" className="button-text">Talk through these numbers <span>↗</span></a>
              </div>
            </div>
            <div className="projection">
              <div className="flex items-end justify-between">
                <div><p className="text-xs font-bold text-slate-200">Illustrative breakdown</p><p className="mt-1 text-[11px] text-slate-500">See how the result is split by your selected calculator inputs.</p></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Planning only</span>
              </div>
              <div className="pie-layout">
                <div className="pie-chart" role="img" aria-label={`${pieBreakdown.contributionLabel} ${inr(pieBreakdown.contribution)} and ${pieBreakdown.outcomeLabel} ${inr(pieBreakdown.outcome)}`} style={{ background: `conic-gradient(#21dc7e 0 ${pieBreakdown.contributionPercent}%, #2c6dff ${pieBreakdown.contributionPercent}% 100%)` }}>
                  <div className="pie-centre"><strong>{pieBreakdown.contributionPercent.toFixed(0)}%</strong><span>input share</span></div>
                </div>
                <div className="pie-legend">
                  <div><span className="legend-dot contribution-dot" /><p><b>{pieBreakdown.contributionLabel}</b><strong>{inr(pieBreakdown.contribution)}</strong></p></div>
                  <div><span className="legend-dot outcome-dot" /><p><b>{pieBreakdown.outcomeLabel}</b><strong>{inr(pieBreakdown.outcome)}</strong></p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="risk" className="risk-section border-y py-24"><div className="risk-grid mx-auto w-[min(1180px,calc(100%-40px))] gap-14"><div><p className="eyebrow"><span /> Your planning profile</p><h2 className="mt-5">Every good plan starts<br />with <i>knowing yourself.</i></h2><p className="mt-6 max-w-md leading-7 text-slate-400">Answer five short questions. Your result offers a useful starting conversation, not an investment recommendation.</p><div className="mt-9 flex gap-2">{riskQuestions.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < riskAnswers.length ? "bg-emerald-200" : "bg-white/10"}`} />)}</div></div><div className="risk-card">{riskAnswers.length < riskQuestions.length ? <><p className="text-[10px] font-bold tracking-widest text-emerald-200">QUESTION {riskAnswers.length + 1} / {riskQuestions.length}</p><h3 className="mt-5">{riskQuestions[riskAnswers.length][0]}</h3><div className="mt-6 grid gap-3">{riskQuestions[riskAnswers.length][1].map((option, index) => <button className="risk-option" type="button" key={option} onClick={() => setRiskAnswers([...riskAnswers, index])}>{option}<span>→</span></button>)}</div></> : <><p className="text-[10px] font-bold tracking-widest text-emerald-200">YOUR PLANNING PROFILE</p><h3 className="mt-5 text-3xl">{riskProfile[0]}</h3><p className="mt-4 leading-7 text-slate-400">{riskProfile[1]}</p><a href="#contact" className="button-primary mt-7">Discuss my profile <span>↗</span></a><button type="button" className="mt-6 block text-xs text-slate-500 underline" onClick={() => setRiskAnswers([])}>Start again</button></>}</div></div></section>

      <section id="insights" className="section"><div className="mx-auto w-[min(1180px,calc(100%-40px))]"><div className="section-heading"><div><p className="eyebrow"><span /> Research & insights</p><h2>Thoughtful context for<br /><i>better questions.</i></h2></div><p>Educational articles and market notes designed to slow the decision down just enough to make it more considered.</p></div><div className="insight-grid mt-12">{insights.map(([tag, title, copy]) => <article key={title}><span>{tag}</span><h3>{title}</h3><p>{copy}</p><a href="#contact">Ask about this <b>↗</b></a></article>)}</div></div></section>

      <section id="contact" className="contact-section"><div className="contact-grid mx-auto w-[min(1180px,calc(100%-40px))] gap-14"><div><p className="eyebrow"><span /> Let’s begin</p><h2 className="mt-5">A better financial<br />conversation <i>starts here.</i></h2><p className="mt-6 max-w-lg leading-7 text-slate-400">Tell us what you are working through. Your message stays on your device until you choose email or WhatsApp to send it.</p><dl className="contact-details mt-9"><dt>Email</dt><dd><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></dd><dt>WhatsApp</dt><dd><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">+91 80564 66932</a></dd><dt>Address</dt><dd>No. 27/4, Thandavarayan Street, Royapettah, Chennai-14</dd></dl></div><form className="contact-form" onSubmit={submitForm}>{!submitted ? <><div className="form-row"><label>Your name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label><label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Optional" inputMode="tel" /></label></div><label>Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label>I’d like help with<select value={form.interest} onChange={(event) => setForm({ ...form, interest: event.target.value })}><option>Wealth management</option><option>Market research</option><option>Mutual funds</option><option>Insurance & protection</option><option>Loans & credit</option><option>Portfolio review</option></select></label><label>What would you like to discuss?<textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Goal, timeframe or question—any context helps." /></label><button className="button-primary w-fit" type="submit">Prepare my enquiry <span>↗</span></button><p className="text-[11px] leading-5 text-slate-500">Grootz does not store this form. You choose whether to send it by email or WhatsApp.</p></> : <div className="py-5"><p className="eyebrow"><span /> Enquiry prepared</p><h3 className="mt-4 text-3xl">Choose how to send it.</h3><p className="mt-3 leading-7 text-slate-400">Your enquiry is ready. Select a contact channel below.</p><div className="mt-7 flex flex-wrap gap-4"><a className="button-primary" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Grootz enquiry — ${form.interest}`)}&body=${enquiryText}`}>Email Grootz <span>↗</span></a><a className="button-text" target="_blank" rel="noreferrer" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${enquiryText}`}>Open WhatsApp <span>↗</span></a></div><button type="button" className="mt-8 text-xs text-slate-500 underline" onClick={() => setSubmitted(false)}>Edit enquiry</button></div>}</form></div></section>

      <section className="legal-strip border-y py-12"><div className="mx-auto w-[min(1180px,calc(100%-40px))]"><p className="eyebrow"><span /> Important information</p><div className="mt-5 grid gap-5 text-xs leading-6 text-slate-500 md:grid-cols-3"><p><b className="text-slate-300">Informational only.</b> Calculators, profiles and market content are educational tools, not personal investment, tax, insurance, lending or legal advice.</p><p><b className="text-slate-300">No execution.</b> Grootz does not execute transactions or hold client money through this website.</p><p><b className="text-slate-300">Before public launch.</b> Required registrations, disclosures, partner arrangements, privacy terms and grievance contacts must be published.</p></div></div></section>
      <footer className="site-footer mx-auto flex w-[min(1180px,calc(100%-40px))] flex-wrap items-center justify-between gap-6 py-9 text-xs text-slate-500"><a href="#top" aria-label="Grootz home" className="brand-logo brand-logo-footer"><img src="/grootz-logo-approved.svg" alt="Grootz" /><span>TRADINGCORE BROKING SERVICES PVT LTD</span></a><p>© {new Date().getFullYear()} Grootz. We Set The Standard of Excellence.</p><div className="flex gap-5"><a href="#services">Services</a><a href="#tools">Tools</a><a href="#contact">Contact</a></div></footer>
    </main>
  );
}
