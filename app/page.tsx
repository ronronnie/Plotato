"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type Screen = "setup" | "home" | "camera" | "review" | "processing" | "result" | "share";
type CheckState = "idle" | "unsafe" | "no-food" | "low-confidence" | "ready";

const services = ["Netflix", "Prime Video", "JioHotstar", "SonyLIV", "ZEE5", "Apple TV+"];
const languages = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Marathi"];

const loadingLines = [
  "Tasting the vibes...",
  "Checking what's streaming...",
  "Pairing your plate with a plot...",
  "Removing anything you've already watched...",
  "Almost ready - don't start eating yet.",
];

const tasteReel = ["SPICY", "SWEET", "CRUNCHY", "COMFORTING"];
const energyReel = ["CHAOTIC", "COZY", "CURIOUS", "DRAMATIC"];
const commitmentReel = ["22 MIN", "45 MIN", "MOVIE", "ONE EPISODE"];

const backups = [
  {
    title: "Brooklyn Nine-Nine",
    label: "Series",
    meta: "22 min - Comedy - English - 13+",
    service: "Netflix",
    explanation: "Your noodles called for fast, comforting chaos.",
    food: "noodles",
    palette: "blue",
  },
  {
    title: "The Bear",
    label: "Series",
    meta: "30 min - Drama - English - 16+",
    service: "JioHotstar",
    explanation: "Your biryani matched something intense, layered and over before you know it.",
    food: "biryani",
    palette: "red",
  },
  {
    title: "Panchayat",
    label: "Series",
    meta: "35 min - Comedy drama - Hindi - 13+",
    service: "Prime Video",
    explanation: "Your proper meal asked for warm, familiar storytelling with a gentle bite.",
    food: "thali",
    palette: "green",
  },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [country, setCountry] = useState("India");
  const [selectedServices, setSelectedServices] = useState(["Netflix", "Prime Video", "JioHotstar"]);
  const [selectedLanguages, setSelectedLanguages] = useState(["English", "Hindi"]);
  const [duration, setDuration] = useState("Proper meal");
  const [foodText, setFoodText] = useState("");
  const [capturedName, setCapturedName] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [providerSignal, setProviderSignal] = useState(false);
  const result = backups[resultIndex];

  const mealName = useMemo(() => {
    if (foodText.trim()) return foodText.trim();
    if (capturedName) return capturedName.replace(/\.[^/.]+$/, "").replaceAll("-", " ");
    return result.food;
  }, [capturedName, foodText, result.food]);

  useEffect(() => {
    if (screen !== "processing") return;
    const lineTimer = window.setInterval(() => {
      setLoadingIndex((index) => (index + 1) % loadingLines.length);
    }, 950);
    const doneTimer = window.setTimeout(() => {
      setScreen("result");
    }, 4200);
    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(doneTimer);
    };
  }, [screen]);

  function toggleItem(value: string, list: string[], update: (next: string[]) => void) {
    update(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function completeSetup(skip = false) {
    if (skip) {
      setSelectedServices(["Netflix", "Prime Video", "JioHotstar"]);
      setSelectedLanguages(["English", "Hindi"]);
    }
    setScreen("home");
  }

  function handleFile(file?: File) {
    if (!file) return;
    setCapturedName(file.name);
    setFoodText("");
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setCheckState("unsafe");
      setScreen("review");
      return;
    }
    setCheckState("low-confidence");
    setScreen("review");
  }

  function handleTypedFood() {
    const value = foodText.toLowerCase();
    if (!value.trim()) return;
    if (["phone", "laptop", "receipt", "face", "person"].some((word) => value.includes(word))) {
      setCheckState("no-food");
      setScreen("review");
      return;
    }
    setCheckState("ready");
    setScreen("processing");
  }

  function spinAgain() {
    setFeedback("");
    setSaved(false);
    setResultIndex((index) => (index + 1) % backups.length);
    setScreen("processing");
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="halftone" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="topbar">
          <button className="brand-mark" onClick={() => setScreen("home")} aria-label="Go home">
            <span>SNACK</span>
            <strong>SPIN</strong>
          </button>
          <div className="service-ticker" aria-label="Selected streaming services">
            {selectedServices.slice(0, 4).map((service) => (
              <span key={service}>{service}</span>
            ))}
          </div>
        </header>

        {screen === "setup" && (
          <section className="setup-sheet">
            <div className="setup-art" aria-hidden="true">
              <div className="plate">
                <span className="noodle n1" />
                <span className="noodle n2" />
                <span className="noodle n3" />
                <span className="chopstick c1" />
                <span className="chopstick c2" />
              </div>
              <div className="burst">POP!</div>
            </div>
            <div className="setup-copy">
              <p className="eyebrow">First-time setup</p>
              <h1>Set the table.</h1>
              <p>Keep it quick. You can change every preference later.</p>
            </div>
            <div className="setup-grid">
              <label className="field">
                <span>Country</span>
                <select value={country} onChange={(event) => setCountry(event.target.value)}>
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Singapore</option>
                </select>
              </label>

              <fieldset className="field">
                <legend>Streaming services</legend>
                <div className="chip-row">
                  {services.map((service) => (
                    <button
                      className={`chip ${selectedServices.includes(service) ? "selected" : ""}`}
                      key={service}
                      onClick={() => toggleItem(service, selectedServices, setSelectedServices)}
                      type="button"
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field">
                <legend>Preferred languages</legend>
                <div className="chip-row">
                  {languages.map((language) => (
                    <button
                      className={`chip ${selectedLanguages.includes(language) ? "selected" : ""}`}
                      key={language}
                      onClick={() => toggleItem(language, selectedLanguages, setSelectedLanguages)}
                      type="button"
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field">
                <legend>Typical meal viewing duration</legend>
                <div className="duration-grid">
                  {[
                    ["Quick bite", "under 25 minutes"],
                    ["Proper meal", "25-50 minutes"],
                    ["Movie night", "anything"],
                  ].map(([name, detail]) => (
                    <button
                      className={`duration-card ${duration === name ? "selected" : ""}`}
                      key={name}
                      onClick={() => setDuration(name)}
                      type="button"
                    >
                      <strong>{name}</strong>
                      <span>{detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="action-row">
              <button className="primary-button" onClick={() => completeSetup()} type="button">
                Save setup
              </button>
              <button className="ghost-button" onClick={() => completeSetup(true)} type="button">
                Skip for now
              </button>
            </div>
          </section>
        )}

        {screen === "home" && (
          <section className="home-stage">
            <div className="mascot-panel" aria-hidden="true">
              <div className="food-mascot">
                <span className="eye left" />
                <span className="eye right" />
                <span className="smile" />
              </div>
              <div className="speech">MATCH?</div>
            </div>
            <div className="home-actions">
              <p className="eyebrow">Dinner meets streaming</p>
              <h1>What are we eating today?</h1>
              <button className="scan-button" onClick={() => setScreen("camera")} type="button">
                Scan my food
              </button>
              <div className="secondary-actions">
                <label className="secondary-button">
                  Upload a photo
                  <input
                    accept="image/*"
                    className="sr-only"
                    type="file"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                </label>
                <button className="secondary-button" onClick={() => setCheckState("idle")} type="button">
                  Type the food instead
                </button>
                <button className="secondary-button accent" onClick={spinAgain} type="button">
                  Surprise me
                </button>
              </div>
              <div className="type-box">
                <input
                  aria-label="Type the food instead"
                  placeholder="Paneer roll, biryani, cereal..."
                  value={foodText}
                  onChange={(event) => setFoodText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleTypedFood();
                  }}
                />
                <button onClick={handleTypedFood} type="button">
                  Spin
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === "camera" && (
          <section className="camera-stage">
            <div className="camera-shell">
              <div className="camera-top">
                <button className="icon-button" onClick={() => setScreen("home")} aria-label="Close camera">
                  X
                </button>
                <button className="icon-button flash" aria-label="Toggle flash">
                  <span aria-hidden="true">F</span>
                </button>
              </div>
              <div className="camera-view">
                <div className="frame-guide">
                  <span />
                  <span />
                  <span />
                </div>
                <p>Keep people and private information outside the frame</p>
              </div>
              <div className="camera-controls">
                <label className="gallery-button">
                  Gallery
                  <input
                    accept="image/*"
                    className="sr-only"
                    type="file"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                </label>
                <button
                  className="capture-button"
                  onClick={() => {
                    setCapturedName("ramen-bowl.jpg");
                    setCheckState("low-confidence");
                    setScreen("review");
                  }}
                  aria-label="Capture food photo"
                  type="button"
                />
                <button
                  className="gallery-button"
                  onClick={() => {
                    setCheckState("no-food");
                    setScreen("review");
                  }}
                  type="button"
                >
                  No access
                </button>
              </div>
            </div>
            <div className="permission-card">
              <strong>Camera blocked?</strong>
              <span>Upload a photo or type the food instead.</span>
            </div>
          </section>
        )}

        {screen === "review" && (
          <section className="state-stage">
            {checkState === "unsafe" && (
              <StateCard
                title="That photo cannot be used here."
                body="Let's keep this camera focused on food."
                tone="red"
                actions={
                  <>
                    <button className="primary-button" onClick={() => setScreen("camera")} type="button">
                      Retake
                    </button>
                    <button className="ghost-button" onClick={() => setScreen("home")} type="button">
                      Type food
                    </button>
                  </>
                }
              />
            )}
            {checkState === "no-food" && (
              <StateCard
                title="We couldn't spot the meal."
                body="Try moving closer or tell us what you're eating."
                tone="yellow"
                actions={
                  <>
                    <button className="primary-button" onClick={() => setScreen("camera")} type="button">
                      Retake
                    </button>
                    <button className="ghost-button" onClick={() => setScreen("home")} type="button">
                      Tell us
                    </button>
                  </>
                }
              />
            )}
            {checkState === "low-confidence" && (
              <StateCard
                title="Is this a bowl of ramen?"
                body="Low confidence. A quick check keeps the match useful."
                tone="blue"
                actions={
                  <>
                    <button className="primary-button" onClick={() => setScreen("processing")} type="button">
                      Yes, spin it
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => {
                        setFoodText("ramen");
                        setScreen("home");
                      }}
                      type="button"
                    >
                      Edit food
                    </button>
                    <button className="ghost-button" onClick={() => setScreen("camera")} type="button">
                      Retake
                    </button>
                  </>
                }
              />
            )}
          </section>
        )}

        {screen === "processing" && (
          <section className="processing-stage" aria-live="polite">
            <div className="reel-machine">
              <div className="reel">
                {tasteReel.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
              <div className="reel">
                {energyReel.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
              <div className="reel">
                {commitmentReel.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </div>
            <div className="match-burst">MATCH!</div>
            <p>{loadingLines[loadingIndex]}</p>
          </section>
        )}

        {screen === "result" && (
          <section className="result-stage">
            <div className={`poster-card ${result.palette}`}>
              <span className="poster-label">{result.label}</span>
              <strong>{result.title}</strong>
              <span className="poster-food">{mealName}</span>
            </div>
            <div className="result-copy">
              <p className="eyebrow">{result.label}</p>
              <h1>{result.title}</h1>
              <p className="match-line">{result.explanation}</p>
              <p className="meta-line">{result.meta}</p>
              <p className="availability">Available on {result.service}</p>
              <div className="action-row">
                <button
                  className="primary-button"
                  onClick={() => setProviderSignal(true)}
                  type="button"
                >
                  Watch on {result.service}
                </button>
                <button className="ghost-button" onClick={() => setScreen("share")} type="button">
                  Share
                </button>
              </div>
              {providerSignal && <p className="signal-note">Nice. We&apos;ll remember this kind of match.</p>}
              <div className="compact-actions">
                <button onClick={() => setFeedback(feedback ? "" : "open")} type="button">
                  Seen it
                </button>
                <button onClick={spinAgain} type="button">
                  Spin again
                </button>
                <button onClick={() => setSaved((value) => !value)} type="button">
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
              {feedback && (
                <div className="feedback-chips" aria-label="Reason for rejecting this result">
                  {["Already watched", "Too long", "Wrong mood", "Don't like this genre", "Not on my platform"].map(
                    (reason) => (
                      <button
                        className={feedback === reason ? "selected" : ""}
                        key={reason}
                        onClick={() => setFeedback(reason)}
                        type="button"
                      >
                        {reason}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {screen === "share" && (
          <section className="share-stage">
            <button className="ghost-button" onClick={() => setScreen("result")} type="button">
              Back
            </button>
            <div className="share-grid">
              <ShareCard shape="story" mealName={mealName} result={result} />
              <ShareCard shape="square" mealName={mealName} result={result} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StateCard({
  title,
  body,
  tone,
  actions,
}: {
  title: string;
  body: string;
  tone: "red" | "yellow" | "blue";
  actions: ReactNode;
}) {
  return (
    <div className={`state-card ${tone}`}>
      <div className="state-icon" aria-hidden="true">
        !
      </div>
      <h1>{title}</h1>
      <p>{body}</p>
      <div className="action-row">{actions}</div>
    </div>
  );
}

function ShareCard({
  shape,
  mealName,
  result,
}: {
  shape: "story" | "square";
  mealName: string;
  result: (typeof backups)[number];
}) {
  return (
    <article className={`share-card ${shape}`}>
      <p>TONIGHT&apos;S PAIRING</p>
      <h2>
        {mealName} <span>x</span> {result.title}
      </h2>
      <blockquote>&quot;Intense, layered and over before you know it.&quot;</blockquote>
      <div className="share-visuals">
        <div className="share-food" aria-hidden="true" />
        <div className={`mini-poster ${result.palette}`}>
          <span>{result.title}</span>
        </div>
      </div>
      <footer>
        <span>{result.service}</span>
        <strong>SnackSpin</strong>
      </footer>
    </article>
  );
}
