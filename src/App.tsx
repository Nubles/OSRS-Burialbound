import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { getTemplate, RITE_TEMPLATES, templateForType, UNLOCK_TYPES } from "./data/rites";
import { createHistory, createId, defaultRunState, loadRunState, saveRunState } from "./state";
import { Rite, RunState, UnlockType } from "./types";

const statusLabels = {
  pending: "Awaiting offerings",
  prepared: "Ready for burial",
  buried: "Approved"
};

const starterCopy = {
  unlockName: "First lawful upgrade",
  unlockType: "Gear" as UnlockType,
  note: "Starter example: bury the old tool before claiming the upgrade."
};

function formatDate(value: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function createRite(unlockType: UnlockType, unlockName: string, note: string): Rite {
  const template = templateForType(unlockType);
  return {
    id: createId("rite"),
    unlockName: unlockName.trim(),
    unlockType,
    templateId: template.id,
    status: "pending",
    completedOfferings: [],
    completedClauses: [],
    createdAt: Date.now(),
    note: note.trim()
  };
}

function App() {
  const [state, setState] = useState<RunState>(() => {
    const loaded = loadRunState();
    if (loaded.pendingRites.length || loaded.memorialArchive.length || loaded.history.length) return loaded;
    const starter = createRite(starterCopy.unlockType, starterCopy.unlockName, starterCopy.note);
    return {
      ...loaded,
      pendingRites: [starter],
      history: [createHistory("Ledger opened", "A first sample rite was placed in the chapel ledger.")]
    };
  });
  const [selectedId, setSelectedId] = useState<string>(() => state.pendingRites[0]?.id || "");
  const [unlockType, setUnlockType] = useState<UnlockType>("Gear");
  const [unlockName, setUnlockName] = useState("");
  const [riteNote, setRiteNote] = useState("");
  const [breachDraft, setBreachDraft] = useState("");
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

  const selectedTemplate = selectedRite ? getTemplate(selectedRite.templateId) : RITE_TEMPLATES[0];
  const offeringProgress = selectedRite
    ? Math.round((selectedRite.completedOfferings.length / selectedTemplate.offerings.length) * 100)
    : 0;
  const clauseProgress = selectedRite
    ? Math.round((selectedRite.completedClauses.length / selectedTemplate.clauses.length) * 100)
    : 0;
  const readyToBury =
    selectedRite &&
    selectedRite.completedOfferings.length === selectedTemplate.offerings.length &&
    selectedRite.completedClauses.length === selectedTemplate.clauses.length;

  function patchState(updater: (current: RunState) => RunState) {
    setState((current) => updater(current));
  }

  function addRite() {
    if (!unlockName.trim()) return;
    const rite = createRite(unlockType, unlockName, riteNote);
    patchState((current) => ({
      ...current,
      pendingRites: [rite, ...current.pendingRites],
      history: [
        createHistory("Rite drafted", `${rite.unlockName} entered the ledger under ${rite.unlockType}.`),
        ...current.history
      ]
    }));
    setSelectedId(rite.id);
    setUnlockName("");
    setRiteNote("");
  }

  function toggleListItem(riteId: string, field: "completedOfferings" | "completedClauses", item: string) {
    patchState((current) => ({
      ...current,
      pendingRites: current.pendingRites.map((rite) => {
        if (rite.id !== riteId) return rite;
        const exists = rite[field].includes(item);
        const nextItems = exists ? rite[field].filter((entry) => entry !== item) : [...rite[field], item];
        const template = getTemplate(rite.templateId);
        const complete =
          field === "completedOfferings"
            ? nextItems.length === template.offerings.length && rite.completedClauses.length === template.clauses.length
            : rite.completedOfferings.length === template.offerings.length && nextItems.length === template.clauses.length;
        return {
          ...rite,
          [field]: nextItems,
          status: complete ? "prepared" : "pending"
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
        createHistory("Unlock approved", `${selectedRite.unlockName} is now legal through ${selectedTemplate.name}.`),
        ...current.history
      ]
    }));
  }

  function addBreachNote() {
    if (!breachDraft.trim()) return;
    patchState((current) => ({
      ...current,
      breachNotes: [`${formatDate(Date.now())} - ${breachDraft.trim()}`, ...current.breachNotes],
      history: [createHistory("Breach note logged", breachDraft.trim()), ...current.history]
    }));
    setBreachDraft("");
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
        const parsed = JSON.parse(String(reader.result)) as RunState;
        setState({
          ...defaultRunState,
          ...parsed,
          pendingRites: Array.isArray(parsed.pendingRites) ? parsed.pendingRites : [],
          memorialArchive: Array.isArray(parsed.memorialArchive) ? parsed.memorialArchive : [],
          breachNotes: Array.isArray(parsed.breachNotes) ? parsed.breachNotes : [],
          history: [createHistory("Ledger imported", file.name), ...(Array.isArray(parsed.history) ? parsed.history : [])]
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
    const starter = createRite(starterCopy.unlockType, starterCopy.unlockName, starterCopy.note);
    setState({
      ...defaultRunState,
      pendingRites: [starter],
      history: [createHistory("Ledger reset", "The chapel records were cleared and a starter rite was added.")]
    });
    setSelectedId(starter.id);
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Old School RuneScape restrictive mode companion</p>
          <h1>Burialbound</h1>
          <p className="hero-copy">
            Every unlock needs a funeral. Surpass an item, region, boss, quest, activity, or skill tier only after its old
            path has been buried in the memorial ledger.
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

      <section className="stat-row" aria-label="Burialbound ledger stats">
        <article>
          <span>Pending rites</span>
          <strong>{state.pendingRites.length}</strong>
        </article>
        <article>
          <span>Buried unlocks</span>
          <strong>{state.memorialArchive.length}</strong>
        </article>
        <article>
          <span>Strict ledger</span>
          <button
            className={state.strictMode ? "seal active" : "seal"}
            onClick={() => patchState((current) => ({ ...current, strictMode: !current.strictMode }))}
          >
            {state.strictMode ? "On" : "Off"}
          </button>
        </article>
      </section>

      <section className="workbench">
        <aside className="panel left-panel">
          <div className="panel-heading">
            <p className="eyebrow">Draft a rite</p>
            <h2>Chapel Desk</h2>
          </div>
          <div className="draft-card">
            <label>
              Unlock type
              <select value={unlockType} onChange={(event) => setUnlockType(event.target.value as UnlockType)}>
                {UNLOCK_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Unlock name
              <input
                placeholder="Example: Barrows gloves"
                value={unlockName}
                onChange={(event) => setUnlockName(event.target.value)}
              />
            </label>
            <label>
              What is being laid to rest?
              <textarea
                placeholder="Example: rune gloves and the old quest path"
                value={riteNote}
                onChange={(event) => setRiteNote(event.target.value)}
              />
            </label>
            <button className="primary" onClick={addRite}>Create Rite</button>
          </div>

          <div className="rite-list">
            <h3>Open graves</h3>
            {state.pendingRites.map((rite) => {
              const template = getTemplate(rite.templateId);
              return (
                <button
                  key={rite.id}
                  className={rite.id === selectedRite?.id ? "rite-card selected" : "rite-card"}
                  style={{ "--accent": template.accent } as React.CSSProperties}
                  onClick={() => setSelectedId(rite.id)}
                >
                  <span>{rite.unlockType}</span>
                  <strong>{rite.unlockName}</strong>
                  <small>{statusLabels[rite.status]}</small>
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
                <span>{selectedTemplate.name}</span>
              </div>
              <p className="epitaph">{selectedTemplate.epitaph}</p>
              {selectedRite.note && <p className="grave-note">{selectedRite.note}</p>}

              <div className="progress-grid">
                <article>
                  <span>Offerings</span>
                  <strong>{offeringProgress}%</strong>
                  <div><i style={{ width: `${offeringProgress}%` }} /></div>
                </article>
                <article>
                  <span>Clauses</span>
                  <strong>{clauseProgress}%</strong>
                  <div><i style={{ width: `${clauseProgress}%` }} /></div>
                </article>
              </div>

              <div className="check-section">
                <h3>Offerings</h3>
                {selectedTemplate.offerings.map((offering) => (
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
                <h3>Restrictive clauses</h3>
                {selectedTemplate.clauses.map((clause) => (
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

              <div className="approval-box">
                <div>
                  <span>Legal reward</span>
                  <strong>{selectedTemplate.legalReward}</strong>
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
            <p className="eyebrow">Records</p>
            <h2>Archive</h2>
          </div>

          <div className="breach-box">
            <h3>Breach Notes</h3>
            <textarea
              placeholder="Log accidental unlock use, boosted access, or rule disputes."
              value={breachDraft}
              onChange={(event) => setBreachDraft(event.target.value)}
            />
            <button onClick={addBreachNote}>Add Note</button>
            <div className="compact-list">
              {state.breachNotes.slice(0, 4).map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>

          <div className="archive-list">
            <h3>Memorial Archive</h3>
            {state.memorialArchive.length === 0 && <p className="muted">No unlocks have been buried yet.</p>}
            {state.memorialArchive.slice(0, 5).map((rite) => (
              <article key={rite.id}>
                <span>{rite.unlockType}</span>
                <strong>{rite.unlockName}</strong>
                <small>{rite.buriedAt ? formatDate(rite.buriedAt) : "Buried"}</small>
              </article>
            ))}
          </div>

          <div className="history-feed">
            <h3>Chapel Log</h3>
            {state.history.slice(0, 6).map((entry) => (
              <article key={entry.id}>
                <span>{formatDate(entry.timestamp)}</span>
                <strong>{entry.title}</strong>
                <p>{entry.detail}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
