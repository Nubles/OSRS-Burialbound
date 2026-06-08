import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ACCOUNT_STYLES,
  BREACH_SEVERITIES,
  getTemplate,
  RUN_PHASES,
  TIER_RULES,
  UNLOCK_TIERS,
  UNLOCK_TYPES
} from "./data/rites";
import {
  createBackup,
  createBreach,
  createHistory,
  createReveal,
  createRiteDraft,
  createStarterState,
  hydrateState,
  loadRunState,
  saveRunState
} from "./state";
import { AccountStyle, AppTab, BreachSeverity, Rite, RunPhase, RunState, UnlockTier, UnlockType } from "./types";

const statusLabels = {
  pending: "Rite open",
  prepared: "Ready to bury",
  buried: "Legal"
};

const tabs: { id: AppTab; label: string; caption: string }[] = [
  { id: "draft", label: "Draft Rite", caption: "Generate the next legal gate" },
  { id: "rite", label: "Active Rite", caption: "Finish offerings and clauses" },
  { id: "registers", label: "Registers", caption: "Audit legal, forbidden, breaches" },
  { id: "archive", label: "Archive", caption: "Review permanent memorials" },
  { id: "codex", label: "Codex", caption: "Rules and examples" }
];

const onboarding = [
  {
    title: "Everything New Is Forbidden",
    detail: "A gear upgrade, region, quest reward, boss, activity, or skill tier starts illegal until the account buries what it is replacing."
  },
  {
    title: "Draft The Rite",
    detail: "Pick a category and power tier. Burialbound generates offerings, clauses, penalties, a witness, and a proof note for first legal use."
  },
  {
    title: "Complete The Ledger",
    detail: "Offerings prove the old path was honored. Clauses keep the new unlock from leaking into the run before approval."
  },
  {
    title: "Bury And Approve",
    detail: "When every task is checked, the unlock moves from forbidden to legal and becomes part of the memorial archive."
  },
  {
    title: "Atonement Matters",
    detail: "If you slip, record a breach, assign a penalty, and mark it atoned before the run chases the next major unlock."
  }
];

function formatDate(value: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function progressFor(rite: Rite): number {
  const total = rite.offerings.length + rite.clauses.length;
  if (!total) return 0;
  return Math.round(((rite.completedOfferings.length + rite.completedClauses.length) / total) * 100);
}

function uniqueCount(items: Rite[], field: keyof Pick<Rite, "unlockType" | "tier">): number {
  return new Set(items.map((item) => item[field])).size;
}

function App() {
  const [state, setState] = useState<RunState>(() => loadRunState());
  const [selectedId, setSelectedId] = useState<string>(() => state.pendingRites[0]?.id || "");
  const [archiveQuery, setArchiveQuery] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [draft, setDraft] = useState({
    unlockType: "Gear" as UnlockType,
    tier: "Notable" as UnlockTier,
    unlockName: "",
    surpassed: "",
    witness: "",
    proofNote: "",
    note: ""
  });
  const [breachDraft, setBreachDraft] = useState({
    title: "",
    severity: "Minor" as BreachSeverity,
    penalty: "",
    note: ""
  });
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => saveRunState(state), [state]);

  useEffect(() => {
    if (!selectedId || !state.pendingRites.some((rite) => rite.id === selectedId)) {
      setSelectedId(state.pendingRites[0]?.id || "");
    }
  }, [selectedId, state.pendingRites]);

  const selectedRite = useMemo(
    () => state.pendingRites.find((rite) => rite.id === selectedId) || state.pendingRites[0],
    [selectedId, state.pendingRites]
  );
  const selectedTemplate = selectedRite ? getTemplate(selectedRite.templateId) : getTemplate("retired-gear");
  const readyToBury =
    selectedRite &&
    selectedRite.completedOfferings.length === selectedRite.offerings.length &&
    selectedRite.completedClauses.length === selectedRite.clauses.length;

  const openBreaches = state.breaches.filter((breach) => breach.status === "open");
  const readyRites = state.pendingRites.filter((rite) => progressFor(rite) === 100);
  const nextRite = readyRites[0] || state.pendingRites.slice().sort((a, b) => progressFor(b) - progressFor(a))[0];
  const filteredArchive = state.memorialArchive.filter((rite) => {
    const haystack = `${rite.unlockName} ${rite.unlockType} ${rite.tier} ${rite.surpassed}`.toLowerCase();
    return haystack.includes(archiveQuery.toLowerCase());
  });

  const stats = {
    pending: state.pendingRites.length,
    legal: state.memorialArchive.length,
    forbidden: state.pendingRites.length,
    openBreaches: openBreaches.length,
    categories: uniqueCount([...state.pendingRites, ...state.memorialArchive], "unlockType"),
    mythic: [...state.pendingRites, ...state.memorialArchive].filter((rite) => rite.tier === "Mythic").length
  };

  function patchState(updater: (current: RunState) => RunState) {
    setState((current) => updater(current));
  }

  function setActiveTab(activeTab: AppTab) {
    patchState((current) => ({ ...current, activeTab }));
  }

  function updateDraft<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateBreachDraft<K extends keyof typeof breachDraft>(key: K, value: (typeof breachDraft)[K]) {
    setBreachDraft((current) => ({ ...current, [key]: value }));
  }

  function addRite() {
    if (!draft.unlockName.trim()) return;
    const rite = createRiteDraft({
      ...draft,
      surpassed: draft.surpassed || "the previous account state",
      witness: draft.witness || "Chapel ledger",
      proofNote: draft.proofNote || "First legal use will be recorded after burial."
    });
    patchState((current) => ({
      ...current,
      activeTab: "rite",
      pendingRites: [rite, ...current.pendingRites],
      lastReveal: createReveal("rite", "Rite Generated", `${rite.unlockName} is forbidden until its burial is complete.`),
      history: [
        createHistory("Rite drafted", `${rite.unlockName} became forbidden until ${getTemplate(rite.templateId).name} is buried.`),
        ...current.history
      ]
    }));
    setSelectedId(rite.id);
    setDraft((current) => ({ ...current, unlockName: "", surpassed: "", witness: "", proofNote: "", note: "" }));
  }

  function toggleListItem(riteId: string, field: "completedOfferings" | "completedClauses", item: string) {
    patchState((current) => ({
      ...current,
      pendingRites: current.pendingRites.map((rite) => {
        if (rite.id !== riteId) return rite;
        const exists = rite[field].includes(item);
        const nextItems = exists ? rite[field].filter((entry) => entry !== item) : [...rite[field], item];
        const offeringCount = field === "completedOfferings" ? nextItems.length : rite.completedOfferings.length;
        const clauseCount = field === "completedClauses" ? nextItems.length : rite.completedClauses.length;
        return {
          ...rite,
          [field]: nextItems,
          status: offeringCount === rite.offerings.length && clauseCount === rite.clauses.length ? "prepared" : "pending"
        };
      })
    }));
  }

  function burySelectedRite() {
    if (!selectedRite || !readyToBury) return;
    const buried: Rite = { ...selectedRite, status: "buried", buriedAt: Date.now() };
    patchState((current) => ({
      ...current,
      activeTab: "archive",
      pendingRites: current.pendingRites.filter((rite) => rite.id !== selectedRite.id),
      memorialArchive: [buried, ...current.memorialArchive],
      lastReveal: createReveal("burial", "Unlock Made Legal", `${selectedRite.unlockName} was sealed in the memorial archive.`),
      history: [
        createHistory("Unlock made legal", `${selectedRite.unlockName} was buried and moved into the memorial archive.`),
        ...current.history
      ]
    }));
  }

  function addBreach() {
    if (!breachDraft.title.trim()) return;
    const breach = createBreach({
      ...breachDraft,
      penalty: breachDraft.penalty || "Complete one manual atonement before the next major unlock."
    });
    patchState((current) => ({
      ...current,
      activeTab: "registers",
      breaches: [breach, ...current.breaches],
      lastReveal: createReveal("breach", "Breach Recorded", `${breach.title} now requires atonement.`),
      history: [createHistory("Breach recorded", `${breach.severity} breach: ${breach.title}`), ...current.history]
    }));
    setBreachDraft({ title: "", severity: "Minor", penalty: "", note: "" });
  }

  function resolveBreach(id: string) {
    patchState((current) => ({
      ...current,
      breaches: current.breaches.map((breach) =>
        breach.id === id ? { ...breach, status: "atoned", resolvedAt: Date.now() } : breach
      ),
      history: [createHistory("Breach atoned", "A breach was marked resolved in the chapel register."), ...current.history]
    }));
  }

  function exportLedger() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `burialbound-${state.runName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "ledger"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importLedger(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = hydrateState(JSON.parse(String(reader.result)) as Partial<RunState>);
        setState((current) => ({
          ...imported,
          backups: [createBackup(current, "Before import"), ...imported.backups].slice(0, 8),
          activeTab: "rite",
          lastReveal: createReveal("rite", "Ledger Imported", file.name),
          history: [createHistory("Ledger imported", file.name), ...imported.history]
        }));
      } catch {
        patchState((current) => ({
          ...current,
          history: [createHistory("Import failed", "The selected file could not be read as a Burialbound ledger."), ...current.history]
        }));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function restoreBackup(snapshot: string) {
    try {
      const restored = hydrateState(JSON.parse(snapshot) as Partial<RunState>);
      setState((current) => ({
        ...restored,
        backups: [createBackup(current, "Before backup restore"), ...restored.backups].slice(0, 8),
        lastReveal: createReveal("rite", "Backup Restored", restored.runName),
        history: [createHistory("Backup restored", restored.runName), ...restored.history]
      }));
    } catch {
      patchState((current) => ({
        ...current,
        history: [createHistory("Restore failed", "The selected backup could not be restored."), ...current.history]
      }));
    }
  }

  function resetLedger() {
    setState((current) => {
      const starter = createStarterState();
      return {
        ...starter,
        backups: [createBackup(current, "Before reset"), ...current.backups].slice(0, 8),
        lastReveal: createReveal("rite", "Ledger Reset", "A fresh Burialbound run was opened.")
      };
    });
  }

  const draftPanel = (
    <section className="panel command-panel">
      <div className="panel-heading">
        <p className="eyebrow">Rite engine</p>
        <h2>Draft The Next Burial</h2>
      </div>
      <div className="draft-card expanded">
        <div className="field-pair">
          <label>
            Unlock type
            <select value={draft.unlockType} onChange={(event) => updateDraft("unlockType", event.target.value as UnlockType)}>
              {UNLOCK_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>
            Power tier
            <select value={draft.tier} onChange={(event) => updateDraft("tier", event.target.value as UnlockTier)}>
              {UNLOCK_TIERS.map((tier) => <option key={tier}>{tier}</option>)}
            </select>
          </label>
        </div>
        <div className="field-pair">
          <label>
            Unlock name
            <input placeholder="Example: Barrows gloves" value={draft.unlockName} onChange={(event) => updateDraft("unlockName", event.target.value)} />
          </label>
          <label>
            What is being surpassed?
            <input placeholder="Example: rune gloves, old route, lesser boss" value={draft.surpassed} onChange={(event) => updateDraft("surpassed", event.target.value)} />
          </label>
        </div>
        <div className="field-pair">
          <label>
            Witness
            <input placeholder="Example: chapel ledger, clan note, screenshot" value={draft.witness} onChange={(event) => updateDraft("witness", event.target.value)} />
          </label>
          <label>
            Proof note
            <textarea placeholder="What will prove the first legal use?" value={draft.proofNote} onChange={(event) => updateDraft("proofNote", event.target.value)} />
          </label>
        </div>
        <label>
          Extra rule note
          <textarea placeholder="Optional personal clause for this rite." value={draft.note} onChange={(event) => updateDraft("note", event.target.value)} />
        </label>
        <div className="tier-preview">
          <strong>{draft.tier}</strong>
          <span>{TIER_RULES[draft.tier].label}</span>
          <small>{TIER_RULES[draft.tier].offeringCount} offerings, {TIER_RULES[draft.tier].clauseCount} clauses</small>
        </div>
        <button className="primary big-action" onClick={addRite}>Generate Rite</button>
      </div>
    </section>
  );

  const activeRitePanel = (
    <section className="memorial-board" style={{ "--accent": selectedTemplate.accent } as React.CSSProperties}>
      {selectedRite ? (
        <>
          <div className="memorial-title">
            <p className="eyebrow">Memorial Ledger</p>
            <h2>{selectedRite.unlockName}</h2>
            <span>{selectedRite.tier} {selectedRite.unlockType}</span>
          </div>
          <p className="epitaph">{selectedTemplate.epitaph}</p>
          <div className="law-box">
            <article><span>Forbidden until burial</span><strong>{selectedTemplate.forbiddenUntil}</strong></article>
            <article><span>Legal reward</span><strong>{selectedTemplate.legalReward}</strong></article>
          </div>
          <div className="rite-meta">
            <p><strong>Surpassed:</strong> {selectedRite.surpassed}</p>
            <p><strong>Witness:</strong> {selectedRite.witness}</p>
            <p><strong>Proof:</strong> {selectedRite.proofNote}</p>
            {selectedRite.note && <p><strong>Personal clause:</strong> {selectedRite.note}</p>}
          </div>
          <div className="progress-grid">
            <article><span>Total rite</span><strong>{progressFor(selectedRite)}%</strong><div><i style={{ width: `${progressFor(selectedRite)}%` }} /></div></article>
            <article><span>Mode weight</span><strong>{TIER_RULES[selectedRite.tier].weight}</strong><div><i style={{ width: `${TIER_RULES[selectedRite.tier].weight * 20}%` }} /></div></article>
          </div>
          <div className="check-section">
            <h3>Offerings</h3>
            {selectedRite.offerings.map((offering) => (
              <button key={offering} className={selectedRite.completedOfferings.includes(offering) ? "check-row done" : "check-row"} onClick={() => toggleListItem(selectedRite.id, "completedOfferings", offering)}>
                <span />{offering}
              </button>
            ))}
          </div>
          <div className="check-section clauses">
            <h3>Clauses</h3>
            {selectedRite.clauses.map((clause) => (
              <button key={clause} className={selectedRite.completedClauses.includes(clause) ? "check-row done" : "check-row"} onClick={() => toggleListItem(selectedRite.id, "completedClauses", clause)}>
                <span />{clause}
              </button>
            ))}
          </div>
          <div className="penalty-box">
            <h3>If broken</h3>
            {selectedRite.penalties.map((penalty) => <p key={penalty}>{penalty}</p>)}
          </div>
          <div className="approval-box">
            <div><span>Status</span><strong>{readyToBury ? "The rite can be buried." : "Unlock remains forbidden."}</strong></div>
            <button className="primary" disabled={!readyToBury} onClick={burySelectedRite}>Bury and Approve</button>
          </div>
        </>
      ) : (
        <div className="empty-ledger"><h2>No rites pending</h2><p>Create the next unlock rite from the chapel desk.</p></div>
      )}
    </section>
  );

  const registersPanel = (
    <section className="register-grid">
      <div className="panel register">
        <h3>Forbidden Unlocks</h3>
        {state.pendingRites.map((rite) => (
          <article key={rite.id}>
            <span>{rite.tier} {rite.unlockType}</span>
            <strong>{rite.unlockName}</strong>
            <small>{getTemplate(rite.templateId).forbiddenUntil}</small>
          </article>
        ))}
      </div>
      <div className="panel register legal">
        <h3>Legal Unlocks</h3>
        {state.memorialArchive.length === 0 && <p className="muted">No legal unlocks archived yet.</p>}
        {state.memorialArchive.map((rite) => (
          <article key={rite.id}>
            <span>{rite.tier} {rite.unlockType}</span>
            <strong>{rite.unlockName}</strong>
            <small>{rite.buriedAt ? formatDate(rite.buriedAt) : "Buried"}</small>
          </article>
        ))}
      </div>
      <div className="panel breach-box">
        <h3>Breach Register</h3>
        <label>Breach title<input placeholder="Example: equipped item before burial" value={breachDraft.title} onChange={(event) => updateBreachDraft("title", event.target.value)} /></label>
        <div className="field-pair">
          <label>Severity<select value={breachDraft.severity} onChange={(event) => updateBreachDraft("severity", event.target.value as BreachSeverity)}>{BREACH_SEVERITIES.map((severity) => <option key={severity}>{severity}</option>)}</select></label>
          <label>Penalty<input placeholder="Atonement task" value={breachDraft.penalty} onChange={(event) => updateBreachDraft("penalty", event.target.value)} /></label>
        </div>
        <textarea placeholder="What happened?" value={breachDraft.note} onChange={(event) => updateBreachDraft("note", event.target.value)} />
        <button onClick={addBreach}>Record Breach</button>
        <div className="breach-list">
          {state.breaches.map((breach) => (
            <article key={breach.id} className={breach.status === "atoned" ? "atoned" : ""}>
              <span>{breach.severity} - {breach.status}</span>
              <strong>{breach.title}</strong>
              <p>{breach.penalty}</p>
              {breach.status === "open" && <button onClick={() => resolveBreach(breach.id)}>Mark Atoned</button>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const archivePanel = (
    <section className="lower-grid archive-view">
      <div className="panel archive-panel">
        <div className="panel-heading row-heading">
          <div><p className="eyebrow">Permanent record</p><h2>Memorial Archive</h2></div>
          <input placeholder="Search archive" value={archiveQuery} onChange={(event) => setArchiveQuery(event.target.value)} />
        </div>
        <div className="archive-grid">
          {filteredArchive.length === 0 && <p className="muted">Buried unlocks will appear here with their rite proof.</p>}
          {filteredArchive.map((rite) => (
            <article key={rite.id}>
              <span>{rite.tier} {rite.unlockType}</span>
              <strong>{rite.unlockName}</strong>
              <p>{getTemplate(rite.templateId).name}</p>
              <small>{rite.surpassed} - {rite.buriedAt ? formatDate(rite.buriedAt) : "Buried"}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="panel history-feed">
        <div className="panel-heading"><p className="eyebrow">Chapel log</p><h2>Recent History</h2></div>
        {state.history.slice(0, 12).map((entry) => (
          <article key={entry.id}><span>{formatDate(entry.timestamp)}</span><strong>{entry.title}</strong><p>{entry.detail}</p></article>
        ))}
      </div>
    </section>
  );

  const codexPanel = (
    <section className="codex-grid">
      {onboarding.map((step, index) => (
        <article className="panel codex-card" key={step.title}>
          <span>Rule {index + 1}</span>
          <strong>{step.title}</strong>
          <p>{step.detail}</p>
        </article>
      ))}
      <article className="panel codex-card wide">
        <span>Save safety</span>
        <strong>Backups</strong>
        <p>Burialbound now snapshots the run before imports, resets, and backup restores. Keep exports for long-term storage; browser backups are a quick local safety net.</p>
        <div className="backup-list">
          {state.backups.length === 0 && <p className="muted">No local backups yet.</p>}
          {state.backups.map((backup) => (
            <button key={backup.id} onClick={() => restoreBackup(backup.snapshot)}>
              <span>{formatDate(backup.timestamp)}</span>
              <strong>{backup.reason}</strong>
            </button>
          ))}
        </div>
      </article>
    </section>
  );

  return (
    <main className="app-shell">
      {!state.hasSeenOnboarding && (
        <div className="onboarding">
          <div className="onboarding-card">
            <div className="onboarding-visual">
              <div className="grave-grid">
                {onboarding.map((_, index) => <span key={index} className={index <= onboardingStep ? "lit" : ""} />)}
              </div>
            </div>
            <div>
              <p className="eyebrow">Step {onboardingStep + 1} / {onboarding.length}</p>
              <h2>{onboarding[onboardingStep].title}</h2>
              <p>{onboarding[onboardingStep].detail}</p>
              <div className="onboarding-actions">
                <button disabled={onboardingStep === 0} onClick={() => setOnboardingStep((step) => Math.max(0, step - 1))}>Back</button>
                <button
                  className="primary"
                  onClick={() => {
                    if (onboardingStep < onboarding.length - 1) setOnboardingStep((step) => step + 1);
                    else patchState((current) => ({ ...current, hasSeenOnboarding: true }));
                  }}
                >
                  {onboardingStep === onboarding.length - 1 ? "Open Ledger" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.lastReveal && (
        <div className="reveal-toast" onClick={() => patchState((current) => ({ ...current, lastReveal: undefined }))}>
          <span>{state.lastReveal.kind}</span>
          <strong>{state.lastReveal.title}</strong>
          <p>{state.lastReveal.detail}</p>
        </div>
      )}

      <header className="command-header">
        <div className="brand-lockup">
          <div className="brand-seal">B</div>
          <div>
            <p className="eyebrow">OSRS restrictive mode companion</p>
            <h1>Burialbound</h1>
          </div>
        </div>
        <div className="resource-bar">
          <article><span>Pending</span><strong>{stats.pending}</strong></article>
          <article><span>Legal</span><strong>{stats.legal}</strong></article>
          <article><span>Breaches</span><strong>{stats.openBreaches}</strong></article>
          <button className={state.animationsEnabled ? "seal active" : "seal"} onClick={() => patchState((current) => ({ ...current, animationsEnabled: !current.animationsEnabled }))}>Motion {state.animationsEnabled ? "on" : "off"}</button>
        </div>
        <div className="ledger-actions compact">
          <label>
            <span>Run name</span>
            <input value={state.runName} onChange={(event) => patchState((current) => ({ ...current, runName: event.target.value }))} />
          </label>
          <button onClick={exportLedger}>Export</button>
          <button onClick={() => importRef.current?.click()}>Import</button>
          <button className="danger" onClick={resetLedger}>Reset</button>
          <input ref={importRef} className="hidden-input" type="file" accept="application/json" onChange={importLedger} />
        </div>
      </header>

      <section className="run-strip" aria-label="Run setup">
        <label>Account style<select value={state.accountStyle} onChange={(event) => patchState((current) => ({ ...current, accountStyle: event.target.value as AccountStyle }))}>{ACCOUNT_STYLES.map((style) => <option key={style}>{style}</option>)}</select></label>
        <label>Account phase<select value={state.phase} onChange={(event) => patchState((current) => ({ ...current, phase: event.target.value as RunPhase }))}>{RUN_PHASES.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
        <button className={state.strictMode ? "seal active" : "seal"} onClick={() => patchState((current) => ({ ...current, strictMode: !current.strictMode }))}>Strict ledger {state.strictMode ? "on" : "off"}</button>
      </section>

      <section className="next-up">
        <article>
          <span>Next up</span>
          <strong>{nextRite ? nextRite.unlockName : "Draft a new rite"}</strong>
          <p>{nextRite ? `${progressFor(nextRite)}% complete - ${statusLabels[nextRite.status]}` : "No pending rites remain."}</p>
        </article>
        <article>
          <span>Atonement</span>
          <strong>{openBreaches[0]?.title || "No open breaches"}</strong>
          <p>{openBreaches[0]?.penalty || "The chapel register is clean."}</p>
        </article>
        <article>
          <span>Ready to bury</span>
          <strong>{readyRites.length}</strong>
          <p>{readyRites.length ? "A prepared rite can be approved now." : "Finish all offerings and clauses first."}</p>
        </article>
      </section>

      <nav className="tab-bar" aria-label="Burialbound sections">
        {tabs.map((tab) => (
          <button key={tab.id} className={state.activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
            <strong>{tab.label}</strong>
            <span>{tab.caption}</span>
          </button>
        ))}
      </nav>

      <section className="tab-stage">
        {state.activeTab === "draft" && draftPanel}
        {state.activeTab === "rite" && (
          <div className="workbench command-workbench">
            <aside className="panel left-panel">
              <div className="panel-heading"><p className="eyebrow">Rite queue</p><h2>Pending</h2></div>
              <div className="rite-list">
                {state.pendingRites.map((rite) => {
                  const template = getTemplate(rite.templateId);
                  return (
                    <button key={rite.id} className={rite.id === selectedRite?.id ? "rite-card selected" : "rite-card"} style={{ "--accent": template.accent } as React.CSSProperties} onClick={() => setSelectedId(rite.id)}>
                      <span>{rite.tier} {rite.unlockType}</span>
                      <strong>{rite.unlockName}</strong>
                      <small>{statusLabels[rite.status]} - {progressFor(rite)}%</small>
                    </button>
                  );
                })}
              </div>
            </aside>
            {activeRitePanel}
          </div>
        )}
        {state.activeTab === "registers" && registersPanel}
        {state.activeTab === "archive" && archivePanel}
        {state.activeTab === "codex" && codexPanel}
      </section>
    </main>
  );
}

export default App;
