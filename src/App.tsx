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
  createBreach,
  createHistory,
  createRiteDraft,
  createStarterState,
  hydrateState,
  loadRunState,
  saveRunState
} from "./state";
import { AccountStyle, BreachSeverity, Rite, RunPhase, RunState, UnlockTier, UnlockType } from "./types";

const statusLabels = {
  pending: "Rite open",
  prepared: "Ready to bury",
  buried: "Legal"
};

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
      pendingRites: [rite, ...current.pendingRites],
      history: [
        createHistory("Rite drafted", `${rite.unlockName} became forbidden until ${getTemplate(rite.templateId).name} is buried.`),
        ...current.history
      ]
    }));
    setSelectedId(rite.id);
    setDraft((current) => ({
      ...current,
      unlockName: "",
      surpassed: "",
      witness: "",
      proofNote: "",
      note: ""
    }));
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
      pendingRites: current.pendingRites.filter((rite) => rite.id !== selectedRite.id),
      memorialArchive: [buried, ...current.memorialArchive],
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
      breaches: [breach, ...current.breaches],
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
    anchor.download = "burialbound-ledger.json";
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
        setState({
          ...imported,
          history: [createHistory("Ledger imported", file.name), ...imported.history]
        });
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

  function resetLedger() {
    const starter = createStarterState();
    setState(starter);
    setSelectedId(starter.pendingRites[0]?.id || "");
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Old School RuneScape restrictive mode companion</p>
          <h1>Burialbound</h1>
          <p className="hero-copy">
            Run the account from a memorial ledger: draft rites, keep new unlocks forbidden, complete offerings,
            atone for breaches, and archive every power spike that becomes legal.
          </p>
        </div>
        <div className="ledger-actions">
          <label>
            <span>Run name</span>
            <input
              value={state.runName}
              onChange={(event) => patchState((current) => ({ ...current, runName: event.target.value }))}
            />
          </label>
          <button onClick={exportLedger}>Export</button>
          <button onClick={() => importRef.current?.click()}>Import</button>
          <button className="danger" onClick={resetLedger}>Reset</button>
          <input ref={importRef} className="hidden-input" type="file" accept="application/json" onChange={importLedger} />
        </div>
      </section>

      <section className="run-strip" aria-label="Run setup">
        <label>
          Account style
          <select
            value={state.accountStyle}
            onChange={(event) => patchState((current) => ({ ...current, accountStyle: event.target.value as AccountStyle }))}
          >
            {ACCOUNT_STYLES.map((style) => <option key={style}>{style}</option>)}
          </select>
        </label>
        <label>
          Account phase
          <select
            value={state.phase}
            onChange={(event) => patchState((current) => ({ ...current, phase: event.target.value as RunPhase }))}
          >
            {RUN_PHASES.map((phase) => <option key={phase}>{phase}</option>)}
          </select>
        </label>
        <button
          className={state.strictMode ? "seal active" : "seal"}
          onClick={() => patchState((current) => ({ ...current, strictMode: !current.strictMode }))}
        >
          Strict ledger {state.strictMode ? "on" : "off"}
        </button>
      </section>

      <section className="stat-row" aria-label="Burialbound ledger stats">
        <article><span>Pending rites</span><strong>{stats.pending}</strong></article>
        <article><span>Legal unlocks</span><strong>{stats.legal}</strong></article>
        <article><span>Forbidden</span><strong>{stats.forbidden}</strong></article>
        <article><span>Open breaches</span><strong>{stats.openBreaches}</strong></article>
        <article><span>Categories</span><strong>{stats.categories}</strong></article>
        <article><span>Mythic rites</span><strong>{stats.mythic}</strong></article>
      </section>

      <section className="workbench">
        <aside className="panel left-panel">
          <div className="panel-heading">
            <p className="eyebrow">Rite engine</p>
            <h2>Chapel Desk</h2>
          </div>
          <div className="draft-card">
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
            <label>
              Unlock name
              <input
                placeholder="Example: Barrows gloves"
                value={draft.unlockName}
                onChange={(event) => updateDraft("unlockName", event.target.value)}
              />
            </label>
            <label>
              What is being surpassed?
              <input
                placeholder="Example: rune gloves, old route, lesser boss"
                value={draft.surpassed}
                onChange={(event) => updateDraft("surpassed", event.target.value)}
              />
            </label>
            <label>
              Witness
              <input
                placeholder="Example: chapel ledger, clan note, screenshot"
                value={draft.witness}
                onChange={(event) => updateDraft("witness", event.target.value)}
              />
            </label>
            <label>
              Proof note
              <textarea
                placeholder="What will prove the first legal use?"
                value={draft.proofNote}
                onChange={(event) => updateDraft("proofNote", event.target.value)}
              />
            </label>
            <label>
              Extra rule note
              <textarea
                placeholder="Optional personal clause for this rite."
                value={draft.note}
                onChange={(event) => updateDraft("note", event.target.value)}
              />
            </label>
            <div className="tier-preview">
              <strong>{draft.tier}</strong>
              <span>{TIER_RULES[draft.tier].label}</span>
              <small>{TIER_RULES[draft.tier].offeringCount} offerings, {TIER_RULES[draft.tier].clauseCount} clauses</small>
            </div>
            <button className="primary" onClick={addRite}>Generate Rite</button>
          </div>

          <div className="rite-list">
            <h3>Pending rites</h3>
            {state.pendingRites.map((rite) => {
              const template = getTemplate(rite.templateId);
              return (
                <button
                  key={rite.id}
                  className={rite.id === selectedRite?.id ? "rite-card selected" : "rite-card"}
                  style={{ "--accent": template.accent } as React.CSSProperties}
                  onClick={() => setSelectedId(rite.id)}
                >
                  <span>{rite.tier} {rite.unlockType}</span>
                  <strong>{rite.unlockName}</strong>
                  <small>{statusLabels[rite.status]} - {progressFor(rite)}%</small>
                </button>
              );
            })}
          </div>
        </aside>

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
                <article>
                  <span>Forbidden until burial</span>
                  <strong>{selectedTemplate.forbiddenUntil}</strong>
                </article>
                <article>
                  <span>Legal reward</span>
                  <strong>{selectedTemplate.legalReward}</strong>
                </article>
              </div>
              <div className="rite-meta">
                <p><strong>Surpassed:</strong> {selectedRite.surpassed}</p>
                <p><strong>Witness:</strong> {selectedRite.witness}</p>
                <p><strong>Proof:</strong> {selectedRite.proofNote}</p>
                {selectedRite.note && <p><strong>Personal clause:</strong> {selectedRite.note}</p>}
              </div>

              <div className="progress-grid">
                <article>
                  <span>Total rite</span>
                  <strong>{progressFor(selectedRite)}%</strong>
                  <div><i style={{ width: `${progressFor(selectedRite)}%` }} /></div>
                </article>
                <article>
                  <span>Mode weight</span>
                  <strong>{TIER_RULES[selectedRite.tier].weight}</strong>
                  <div><i style={{ width: `${TIER_RULES[selectedRite.tier].weight * 20}%` }} /></div>
                </article>
              </div>

              <div className="check-section">
                <h3>Offerings</h3>
                {selectedRite.offerings.map((offering) => (
                  <button
                    key={offering}
                    className={selectedRite.completedOfferings.includes(offering) ? "check-row done" : "check-row"}
                    onClick={() => toggleListItem(selectedRite.id, "completedOfferings", offering)}
                  >
                    <span />
                    {offering}
                  </button>
                ))}
              </div>

              <div className="check-section clauses">
                <h3>Clauses</h3>
                {selectedRite.clauses.map((clause) => (
                  <button
                    key={clause}
                    className={selectedRite.completedClauses.includes(clause) ? "check-row done" : "check-row"}
                    onClick={() => toggleListItem(selectedRite.id, "completedClauses", clause)}
                  >
                    <span />
                    {clause}
                  </button>
                ))}
              </div>

              <div className="penalty-box">
                <h3>If broken</h3>
                {selectedRite.penalties.map((penalty) => <p key={penalty}>{penalty}</p>)}
              </div>

              <div className="approval-box">
                <div>
                  <span>Status</span>
                  <strong>{readyToBury ? "The rite can be buried." : "Unlock remains forbidden."}</strong>
                </div>
                <button className="primary" disabled={!readyToBury} onClick={burySelectedRite}>Bury and Approve</button>
              </div>
            </>
          ) : (
            <div className="empty-ledger">
              <h2>No rites pending</h2>
              <p>Create the next unlock rite from the chapel desk.</p>
            </div>
          )}
        </section>

        <aside className="panel right-panel">
          <div className="panel-heading">
            <p className="eyebrow">Account audit</p>
            <h2>Rule Registers</h2>
          </div>

          <div className="register">
            <h3>Forbidden Unlocks</h3>
            {state.pendingRites.slice(0, 6).map((rite) => (
              <article key={rite.id}>
                <span>{rite.tier} {rite.unlockType}</span>
                <strong>{rite.unlockName}</strong>
                <small>{getTemplate(rite.templateId).forbiddenUntil}</small>
              </article>
            ))}
          </div>

          <div className="register legal">
            <h3>Legal Unlocks</h3>
            {state.memorialArchive.length === 0 && <p className="muted">No legal unlocks archived yet.</p>}
            {state.memorialArchive.slice(0, 5).map((rite) => (
              <article key={rite.id}>
                <span>{rite.tier} {rite.unlockType}</span>
                <strong>{rite.unlockName}</strong>
                <small>{rite.buriedAt ? formatDate(rite.buriedAt) : "Buried"}</small>
              </article>
            ))}
          </div>

          <div className="breach-box">
            <h3>Breach Register</h3>
            <label>
              Breach title
              <input
                placeholder="Example: equipped item before burial"
                value={breachDraft.title}
                onChange={(event) => updateBreachDraft("title", event.target.value)}
              />
            </label>
            <div className="field-pair">
              <label>
                Severity
                <select
                  value={breachDraft.severity}
                  onChange={(event) => updateBreachDraft("severity", event.target.value as BreachSeverity)}
                >
                  {BREACH_SEVERITIES.map((severity) => <option key={severity}>{severity}</option>)}
                </select>
              </label>
              <label>
                Penalty
                <input
                  placeholder="Atonement task"
                  value={breachDraft.penalty}
                  onChange={(event) => updateBreachDraft("penalty", event.target.value)}
                />
              </label>
            </div>
            <textarea
              placeholder="What happened?"
              value={breachDraft.note}
              onChange={(event) => updateBreachDraft("note", event.target.value)}
            />
            <button onClick={addBreach}>Record Breach</button>
            <div className="breach-list">
              {state.breaches.slice(0, 5).map((breach) => (
                <article key={breach.id} className={breach.status === "atoned" ? "atoned" : ""}>
                  <span>{breach.severity} - {breach.status}</span>
                  <strong>{breach.title}</strong>
                  <p>{breach.penalty}</p>
                  {breach.status === "open" && <button onClick={() => resolveBreach(breach.id)}>Mark Atoned</button>}
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="panel archive-panel">
          <div className="panel-heading row-heading">
            <div>
              <p className="eyebrow">Permanent record</p>
              <h2>Memorial Archive</h2>
            </div>
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
          <div className="panel-heading">
            <p className="eyebrow">Chapel log</p>
            <h2>Recent History</h2>
          </div>
          {state.history.slice(0, 9).map((entry) => (
            <article key={entry.id}>
              <span>{formatDate(entry.timestamp)}</span>
              <strong>{entry.title}</strong>
              <p>{entry.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
