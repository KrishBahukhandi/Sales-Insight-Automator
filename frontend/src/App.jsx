import { useState, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const S = {
  IDLE: "idle",
  DRAGGING: "dragging",
  UPLOADING: "uploading",
  SUCCESS: "success",
  ERROR: "error",
};

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const UploadIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="1" y="1" width="34" height="34" rx="10" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3"/>
    <path d="M18 22V13M18 13L14 17M18 13L22 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 26h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

const FileCheckIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="1" y="1" width="34" height="34" rx="10" fill="rgba(232,197,71,0.08)" stroke="#e8c547" strokeWidth="1.2"/>
    <path d="M13 18.5L16.5 22L23 15" stroke="#e8c547" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Spinner = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}>
    <circle cx="11" cy="11" r="9" stroke="rgba(232,197,71,0.2)" strokeWidth="2.5"/>
    <path d="M11 2C11 2 18 4 20 11" stroke="#e8c547" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const CheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="10" stroke="#4ade80" strokeWidth="1.5"/>
    <path d="M6.5 11L9.5 14L15.5 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="10" stroke="#f87171" strokeWidth="1.5"/>
    <path d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const RabbitIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <ellipse cx="10" cy="12" rx="5" ry="4.5" fill="#e8c547" opacity="0.9"/>
    <path d="M7 7.5C7 5 5 2 5 2C5 2 4 5 5.5 7" stroke="#e8c547" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 7.5C13 5 15 2 15 2C15 2 16 5 14.5 7" stroke="#e8c547" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8.5" cy="12" r="0.8" fill="#0a0a0f"/>
    <circle cx="11.5" cy="12" r="0.8" fill="#0a0a0f"/>
    <ellipse cx="10" cy="13.5" rx="1" ry="0.6" fill="#0a0a0f" opacity="0.5"/>
  </svg>
);

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function App() {
  const [state, setState] = useState(S.IDLE);
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const validateEmail = (val) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailErr(ok || !val ? "" : "Enter a valid email address");
    return ok;
  };

  const acceptFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Only .csv, .xlsx and .xls files are supported.");
      setState(S.ERROR);
      return;
    }
    setFile(f);
    setError("");
    if (state === S.ERROR || state === S.SUCCESS) { setState(S.IDLE); }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) { return; }
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Only .csv, .xlsx and .xls files are supported.");
      setState(S.ERROR);
      return;
    }
    setFile(f);
    setError("");
    setState(S.IDLE);
  }, []);

  const submit = async () => {
    if (!file || !validateEmail(email)) return;
    setState(S.UPLOADING);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("recipientEmail", email);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");
      setResult(data);
      setState(S.SUCCESS);
    } catch (err) {
      setError(err.message || "Unexpected error.");
      setState(S.ERROR);
    }
  };

  const reset = () => {
    setState(S.IDLE);
    setFile(null);
    setEmail("");
    setResult(null);
    setError("");
    setEmailErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const busy = state === S.UPLOADING;
  const dragging = state === S.DRAGGING;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --gold:#e8c547;--gold-glow:rgba(232,197,71,0.18);--gold-border:rgba(232,197,71,0.28);
          --bg:#080810;--s1:#0f0f1a;--s2:#13131f;--s3:#17172a;
          --border:rgba(255,255,255,0.06);--text:#eeeef8;--muted:#55556e;
          --green:#4ade80;--red:#f87171;--blue:#818cf8;
        }
        html,body{height:100%}
        body{
          background:var(--bg);color:var(--text);
          font-family:'Onest',sans-serif;
          min-height:100vh;display:flex;align-items:center;justify-content:center;
          padding:20px;overflow-x:hidden;
        }
        body::before{
          content:'';position:fixed;top:-200px;left:-200px;
          width:700px;height:700px;
          background:radial-gradient(circle,rgba(232,197,71,0.035) 0%,transparent 65%);
          pointer-events:none;z-index:0;
        }
        body::after{
          content:'';position:fixed;bottom:-200px;right:-150px;
          width:600px;height:600px;
          background:radial-gradient(circle,rgba(129,140,248,0.04) 0%,transparent 65%);
          pointer-events:none;z-index:0;
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
        .wrap{
          width:100%;max-width:520px;position:relative;z-index:1;
          animation:up 0.45s ease both;
        }
        /* Top bar */
        .topbar{
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:20px;padding:0 2px;
        }
        .brand{display:flex;align-items:center;gap:8px}
        .brand-label{
          font-size:11px;font-weight:700;letter-spacing:3px;
          text-transform:uppercase;color:var(--gold);
          font-family:'JetBrains Mono',monospace;
        }
        .version-badge{
          font-family:'JetBrains Mono',monospace;font-size:10px;
          color:var(--muted);background:var(--s2);
          border:1px solid var(--border);border-radius:6px;padding:3px 8px;
        }
        /* Card */
        .card{
          background:var(--s1);border:1px solid var(--border);border-radius:18px;
          overflow:hidden;
          box-shadow:0 32px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.03),inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .card-head{
          padding:28px 32px 24px;
          background:linear-gradient(160deg,rgba(232,197,71,0.04) 0%,transparent 60%);
          border-bottom:1px solid var(--border);
        }
        h1{font-size:24px;font-weight:800;letter-spacing:-0.6px;line-height:1.2;margin-bottom:5px}
        .sub{font-size:13px;color:var(--muted);font-family:'JetBrains Mono',monospace;font-weight:300}
        .sub span{color:var(--gold);opacity:0.8}
        .card-body{padding:24px 32px 28px;display:flex;flex-direction:column;gap:18px}

        /* Drop zone */
        .dz{
          border:1.5px dashed var(--border);border-radius:12px;
          padding:28px 20px;text-align:center;cursor:pointer;
          background:var(--s2);transition:all 0.18s ease;
          display:flex;flex-direction:column;align-items:center;gap:10px;
        }
        .dz:hover:not(.dz--busy){border-color:var(--gold-border);background:var(--gold-glow)}
        .dz--drag{border-color:var(--gold);background:var(--gold-glow);transform:scale(1.01)}
        .dz--file{border-color:var(--gold-border);border-style:solid;background:rgba(232,197,71,0.05)}
        .dz-icon{color:var(--muted);transition:color 0.18s}
        .dz:hover:not(.dz--busy) .dz-icon,.dz--drag .dz-icon,.dz--file .dz-icon{color:var(--gold)}
        .dz-title{font-size:13.5px;font-weight:500;color:var(--muted)}
        .dz-file{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--gold);word-break:break-all}
        .dz-hint{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--muted);letter-spacing:0.3px}
        input[type=file]{display:none}

        /* Field */
        .field{display:flex;flex-direction:column;gap:5px}
        .field-label{
          font-size:10.5px;font-weight:700;letter-spacing:2px;
          text-transform:uppercase;color:var(--muted);
          font-family:'JetBrains Mono',monospace;
        }
        .field-input{
          background:var(--s2);border:1px solid var(--border);border-radius:10px;
          padding:11px 14px;color:var(--text);
          font-family:'JetBrains Mono',monospace;font-size:13.5px;
          outline:none;transition:border-color 0.18s,box-shadow 0.18s;width:100%;
        }
        .field-input:focus{
          border-color:var(--gold-border);
          box-shadow:0 0 0 3px rgba(232,197,71,0.07);
        }
        .field-input::placeholder{color:var(--muted)}
        .field-err{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--red)}

        /* Buttons */
        .btn{
          width:100%;padding:13px;border-radius:10px;border:none;
          font-family:'Onest',sans-serif;font-size:14px;font-weight:700;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;
          transition:all 0.18s ease;letter-spacing:0.2px;
        }
        .btn-gold{background:var(--gold);color:#08080f}
        .btn-gold:hover:not(:disabled){background:#f0d060;transform:translateY(-1px);box-shadow:0 8px 28px rgba(232,197,71,0.28)}
        .btn-gold:disabled{opacity:0.38;cursor:not-allowed}
        .btn-ghost{
          background:transparent;color:var(--muted);
          border:1px solid var(--border);font-size:13px;padding:10px;
        }
        .btn-ghost:hover{border-color:var(--gold-border);color:var(--gold)}

        /* Status panels */
        .panel{border-radius:11px;padding:16px;animation:up 0.25s ease both}
        .panel--busy{background:rgba(232,197,71,0.05);border:1px solid var(--gold-border)}
        .panel--ok{background:rgba(74,222,128,0.05);border:1px solid rgba(74,222,128,0.22)}
        .panel--err{background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.22)}
        .p-row{display:flex;align-items:flex-start;gap:11px}
        .p-title{font-size:13.5px;font-weight:700;margin-bottom:4px}
        .p-msg{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--muted);line-height:1.55}
        .busy-label{animation:blink 1.4s ease-in-out infinite}
        .chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
        .chip{
          background:var(--s1);border:1px solid var(--border);border-radius:6px;
          padding:4px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);
        }
        .chip strong{color:var(--gold)}
        .preview{
          margin-top:12px;background:var(--s1);border:1px solid var(--border);
          border-radius:8px;padding:12px 14px;
        }
        .preview-label{
          font-size:9.5px;font-weight:700;letter-spacing:2px;
          text-transform:uppercase;color:var(--muted);
          font-family:'JetBrains Mono',monospace;margin-bottom:7px;
        }
        .preview-text{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--text);line-height:1.65;opacity:0.88}

        /* Footer */
        .foot{
          display:flex;align-items:center;justify-content:center;gap:6px;
          margin-top:14px;opacity:0.45;
        }
        .foot-txt{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted)}

        @media(max-width:560px){.card-head,.card-body{padding-left:20px;padding-right:20px}h1{font-size:21px}}
      `}</style>

      <div className="wrap">
        {/* Topbar */}
        <div className="topbar">
          <div className="brand">
            <RabbitIcon />
            <span className="brand-label">Rabbitt AI</span>
          </div>
          <span className="version-badge">v1.0.0</span>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-head">
            <h1>Sales Insight<br />Automator</h1>
            <p className="sub">Upload <span>→</span> Analyze <span>→</span> Deliver</p>
          </div>

          <div className="card-body">
            {/* Drop zone */}
            <div
              className={`dz${dragging ? " dz--drag" : ""}${file ? " dz--file" : ""}${busy ? " dz--busy" : ""}`}
              onClick={() => !busy && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (!busy) setState(S.DRAGGING); }}
              onDragLeave={() => { if (state === S.DRAGGING) setState(S.IDLE); }}
              onDrop={!busy ? onDrop : undefined}
            >
              <div className="dz-icon">{file ? <FileCheckIcon /> : <UploadIcon />}</div>
              {file ? (
                <>
                  <div className="dz-file">{file.name}</div>
                  <div className="dz-hint">{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div className="dz-title">{dragging ? "Drop it!" : "Drop your sales file here"}</div>
                  <div className="dz-hint">CSV · XLSX · XLS · max 10 MB</div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
            </div>

            {/* Email */}
            <div className="field">
              <label className="field-label">Recipient Email</label>
              <input
                type="email"
                className="field-input"
                placeholder="executive@company.com"
                value={email}
                disabled={busy}
                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
              />
              {emailErr && <div className="field-err">{emailErr}</div>}
            </div>

            {/* Status: uploading */}
            {busy && (
              <div className="panel panel--busy">
                <div className="p-row">
                  <Spinner />
                  <div>
                    <div className="p-title busy-label">Processing your data…</div>
                    <div className="p-msg">Parsing file · Generating AI summary · Sending email</div>
                  </div>
                </div>
              </div>
            )}

            {/* Status: success */}
            {state === S.SUCCESS && result && (
              <div className="panel panel--ok">
                <div className="p-row">
                  <CheckCircle />
                  <div style={{ flex: 1 }}>
                    <div className="p-title" style={{ color: "var(--green)" }}>Summary sent!</div>
                    <div className="p-msg">Delivered to <strong style={{ color: "var(--text)" }}>{result.recipient}</strong></div>
                    <div className="chips">
                      <div className="chip">Rows: <strong>{result.rowsAnalyzed?.toLocaleString()}</strong></div>
                      <div className="chip">Columns: <strong>{result.columnsDetected?.length}</strong></div>
                      {result.reportId && <div className="chip">ID: <strong>{String(result.reportId).slice(-6)}</strong></div>}
                    </div>
                    {result.summaryPreview && (
                      <div className="preview">
                        <div className="preview-label">AI Summary Preview</div>
                        <div className="preview-text">{result.summaryPreview}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status: error */}
            {state === S.ERROR && error && (
              <div className="panel panel--err">
                <div className="p-row">
                  <XCircle />
                  <div>
                    <div className="p-title" style={{ color: "var(--red)" }}>Upload failed</div>
                    <div className="p-msg">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            {state !== S.SUCCESS ? (
              <button
                className="btn btn-gold"
                disabled={!file || !email || !!emailErr || busy}
                onClick={submit}
              >
                {busy ? <><Spinner size={18} />Generating report…</> : "Generate & Send Report →"}
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={reset}>← Analyze another file</button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="foot">
          <RabbitIcon />
          <span className="foot-txt">Rabbitt AI · Sales Insight Automator · MERN Stack</span>
        </div>
      </div>
    </>
  );
}
