/* =========================================================
   REDLINE MOTORWORKS — support site behavior
   ========================================================= */
(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mainNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => mainNav.classList.remove("open"))
  );

  /* ---------- session id (cosmetic, ties the device chrome together) ---------- */
  const sessionId = "RM-" + String(Math.floor(1000 + Math.random() * 9000));
  document.getElementById("sessionId").textContent = sessionId;

  /* =========================================================
     HELP CENTER — screen navigation
     ========================================================= */
  const menuBtns = document.querySelectorAll(".menu-btn");
  const screens = document.querySelectorAll(".screen");
  const breadcrumb = document.getElementById("deviceBreadcrumb");
  const helpSection = document.getElementById("help");

  const SCREEN_LABELS = {
    home: "HELP / HOME",
    faq: "HELP / FAQ",
    troubleshoot: "HELP / TROUBLESHOOTER",
    chat: "HELP / LIVE CHAT",
    ticket: "HELP / SUBMIT TICKET",
    track: "HELP / TRACK TICKET",
    contact: "HELP / CONTACT SUPPORT",
  };

  function showScreen(name, opts) {
    opts = opts || {};
    menuBtns.forEach((b) => b.classList.toggle("active", b.dataset.screen === name));
    screens.forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
    breadcrumb.textContent = SCREEN_LABELS[name] || "HELP";
    if (name === "troubleshoot" && !opts.keepState) renderTroubleshoot("start");
    if (name === "chat" && chatLog.children.length === 0) startChat();
    if (opts.scroll !== false) {
      helpSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (name === "faq" && opts.category) {
      setFaqCategory(opts.category);
    }
  }

  menuBtns.forEach((btn) =>
    btn.addEventListener("click", () => showScreen(btn.dataset.screen, { scroll: false }))
  );

  // Any element anywhere on the page with data-goto jumps straight into a Help Center screen
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen(el.dataset.goto, { category: el.dataset.cat });
    });
  });

  document.getElementById("helpFab").addEventListener("click", () => showScreen("home"));

  /* =========================================================
     FAQ DATA + rendering
     ========================================================= */
  const FAQS = [
    { cat: "appointments", q: "How do I book a service appointment?", a: "Call (555) 123-4911, email us, or open a support ticket from this Help Center with your preferred date. We confirm within a few hours during business hours." },
    { cat: "appointments", q: "Can I drop my car off before you open?", a: "Yes — we have an after-hours key drop box at the main entrance. Fill out an envelope with your name, phone number, and the issue, and we'll call once it's checked in." },
    { cat: "appointments", q: "Do you offer loaner cars?", a: "Loaner cars are available for repairs expected to keep your vehicle overnight, subject to availability. Ask your service advisor when you book." },
    { cat: "pricing", q: "Do you give a quote before starting work?", a: "Always. Every job — from an oil change to an engine rebuild — gets a written quote after inspection, and we call before doing anything beyond that quote." },
    { cat: "pricing", q: "What payment methods do you accept?", a: "Cash, all major credit/debit cards, GCash, and bank transfer. Financing is available for repairs over ₱25,000 through our partner lender." },
    { cat: "pricing", q: "Why did my final bill differ from the estimate?", a: "Estimates are based on the visible issue. If we find something else during teardown (a worn part behind the one we're replacing, for example) we call you for approval before touching it — the bill only changes if you say yes." },
    { cat: "warranty", q: "What's covered under your workmanship warranty?", a: "All labor is warrantied for 12 months / 12,000 miles. Brake pads carry a lifetime warranty for as long as you own the vehicle. Parts follow the manufacturer's warranty terms." },
    { cat: "warranty", q: "What if the same problem comes back?", a: "Bring it back and we'll re-diagnose at no charge. If it's related to our original repair, the fix is free under warranty." },
    { cat: "parts", q: "Do you use OEM or aftermarket parts?", a: "We install OEM parts by default. Quality aftermarket alternatives are available on request and are always priced separately so you can choose." },
    { cat: "parts", q: "Can I supply my own parts?", a: "We can install customer-supplied parts for most jobs, but the workmanship warranty won't cover parts we didn't source, and labor is billed the same either way." },
    { cat: "appointments", q: "How long will my car be in the shop?", a: "Most routine services (oil change, brakes, tires, diagnostics) are same-day. Transmission and engine work can take 1–3 days — we'll give you a specific estimate after inspection." },
    { cat: "pricing", q: "Is the diagnostic fee refunded if I get the repair done?", a: "Yes — the ₱1,500 diagnostic fee is credited toward the repair if you approve the work with us the same visit." },
  ];

  const faqList = document.getElementById("faqList");
  const faqTabs = document.getElementById("faqTabs");
  let currentFaqCat = "all";

  function renderFaqs() {
    const items = FAQS.filter((f) => currentFaqCat === "all" || f.cat === currentFaqCat);
    faqList.innerHTML = items
      .map(
        (f, i) => `
      <div class="faq-item" data-idx="${i}">
        <button class="faq-q" type="button">
          <span>${f.q}</span><span class="plus">+</span>
        </button>
        <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
      </div>`
      )
      .join("");

    faqList.querySelectorAll(".faq-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.closest(".faq-item").classList.toggle("open");
      });
    });
  }

  function setFaqCategory(cat) {
    currentFaqCat = cat || "all";
    faqTabs.querySelectorAll(".faq-tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.cat === currentFaqCat)
    );
    renderFaqs();
  }

  faqTabs.querySelectorAll(".faq-tab").forEach((tab) =>
    tab.addEventListener("click", () => setFaqCategory(tab.dataset.cat))
  );

  renderFaqs();

  /* =========================================================
     HELP HOME — search across FAQs
     ========================================================= */
  const searchInput = document.getElementById("helpSearchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) {
      searchResults.innerHTML = "";
      return;
    }
    const hits = FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    ).slice(0, 5);

    if (hits.length === 0) {
      searchResults.innerHTML = `<div class="search-hit">No FAQ matches “${escapeHtml(
        searchInput.value
      )}” — try the <a href="#" style="color:var(--teal)" data-goto-inline="troubleshoot">troubleshooter</a> or <a href="#" style="color:var(--teal)" data-goto-inline="ticket">open a ticket</a>.</div>`;
      searchResults.querySelectorAll("[data-goto-inline]").forEach((a) =>
        a.addEventListener("click", (e) => {
          e.preventDefault();
          showScreen(a.dataset.gotoInline, { scroll: false });
        })
      );
      return;
    }

    searchResults.innerHTML = hits
      .map(
        (f) =>
          `<div class="search-hit" data-cat="${f.cat}"><span>${f.q}</span><span class="tag">${f.cat}</span></div>`
      )
      .join("");
    searchResults.querySelectorAll(".search-hit").forEach((el, i) =>
      el.addEventListener("click", () => showScreen("faq", { scroll: false, category: hits[i].cat }))
    );
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* =========================================================
     TROUBLESHOOTER — branching symptom wizard
     ========================================================= */
  const TS_TREE = {
    start: {
      title: "What's going on with your vehicle?",
      options: [
        { label: "Car won't start", next: "nostart" },
        { label: "Warning light is on", next: "warninglight" },
        { label: "Strange noise", next: "noise" },
        { label: "Engine overheating", next: "overheat" },
        { label: "Brake issue", next: "brake" },
      ],
    },
    nostart: {
      title: "When you turn the key, what happens?",
      back: "start",
      options: [
        { label: "Nothing at all — no lights, no sound", next: "result_battery_dead" },
        { label: "Clicking sound, no crank", next: "result_battery_weak" },
        { label: "Engine cranks but won't catch", next: "result_fuel_ignition" },
      ],
    },
    warninglight: {
      title: "Which light is on?",
      back: "start",
      options: [
        { label: "Check engine (steady)", next: "result_check_engine" },
        { label: "Check engine (flashing)", next: "result_check_engine_flash" },
        { label: "Oil pressure light", next: "result_oil_pressure" },
        { label: "Battery / charging light", next: "result_battery_weak" },
      ],
    },
    noise: {
      title: "Where's the noise coming from, and when?",
      back: "start",
      options: [
        { label: "High-pitched squeal when braking", next: "result_brake_pads" },
        { label: "Grinding/clunking over bumps", next: "result_suspension" },
        { label: "Squeal from under the hood at startup", next: "result_belt" },
      ],
    },
    overheat: {
      title: "Is there steam, or a sweet smell from the vents?",
      back: "start",
      options: [
        { label: "Yes, steam from under the hood", next: "result_overheat_urgent" },
        { label: "Temp gauge creeping up, no steam yet", next: "result_overheat_watch" },
      ],
    },
    brake: {
      title: "What are the brakes doing?",
      back: "start",
      options: [
        { label: "Pedal feels soft or sinks to the floor", next: "result_brake_urgent" },
        { label: "Squealing but braking feels normal", next: "result_brake_pads" },
        { label: "Car pulls to one side when braking", next: "result_brake_uneven" },
      ],
    },

    // ---- results ----
    result_battery_dead: {
      result: true, urgency: "med", back: "nostart",
      title: "Sounds like a dead battery",
      body: "No lights or sound at the key usually means the battery is fully discharged or a terminal connection is loose. If you have jumper cables, a jump-start may get you moving, but the battery should still be tested.",
      service: "Battery & Electrical (SVC-07)",
    },
    result_battery_weak: {
      result: true, urgency: "med", back: "nostart",
      title: "Likely a weak battery or alternator",
      body: "Clicking without a crank, or a battery/charging light on the dash, points to a battery that can't hold enough charge or an alternator not recharging it while you drive.",
      service: "Battery & Electrical (SVC-07)",
    },
    result_fuel_ignition: {
      result: true, urgency: "med", back: "nostart",
      title: "Could be fuel delivery or ignition",
      body: "Cranking without catching suggests the engine isn't getting fuel or spark. This needs a scan-tool diagnosis rather than guesswork — a diagnostic will pinpoint it before we quote a repair.",
      service: "Engine Diagnostics (SVC-04)",
    },
    result_check_engine: {
      result: true, urgency: "low", back: "warninglight",
      title: "Steady check-engine light — safe to drive carefully",
      body: "A steady light usually flags an emissions or sensor issue that won't strand you, but it's worth scanning soon so small issues don't turn into bigger ones.",
      service: "Engine Diagnostics (SVC-04)",
    },
    result_check_engine_flash: {
      result: true, urgency: "high", back: "warninglight",
      title: "Flashing check-engine light — pull over when safe",
      body: "A flashing light usually means active engine misfire, which can damage the catalytic converter if you keep driving hard. Ease off the gas, avoid highway speeds, and get it scanned as soon as possible.",
      service: "Engine Diagnostics (SVC-04)",
    },
    result_oil_pressure: {
      result: true, urgency: "high", back: "warninglight",
      title: "Oil pressure light — stop as soon as it's safe",
      body: "Low oil pressure can cause serious engine damage within minutes of driving. Pull over safely, shut the engine off, and check the oil level if you're able to before calling for a tow.",
      service: "Engine Repair (SVC-09) / Roadside Towing",
    },
    result_brake_pads: {
      result: true, urgency: "low", back: "start",
      title: "Sounds like worn brake pads",
      body: "That high-pitched squeal is usually a built-in wear indicator letting you know the pads are due. Safe to drive gently to us, but don't put it off too long.",
      service: "Brake Repair (SVC-02)",
    },
    result_suspension: {
      result: true, urgency: "med", back: "noise",
      title: "Possible suspension wear",
      body: "Clunking or grinding over bumps often points to worn shocks, struts, or control-arm bushings. It won't necessarily strand you, but it does affect handling and tire wear.",
      service: "Suspension & Steering (SVC-08)",
    },
    result_belt: {
      result: true, urgency: "low", back: "noise",
      title: "Likely a worn serpentine belt or tensioner",
      body: "A squeal at startup that fades is a classic sign of a worn accessory belt or a tensioner pulley going bad. Not urgent, but it can strand you if the belt fails completely.",
      service: "Engine Diagnostics (SVC-04)",
    },
    result_overheat_urgent: {
      result: true, urgency: "high", back: "overheat",
      title: "Stop driving now",
      body: "Steam means the engine is actively overheating. Pull over, turn off the engine, and let it cool for at least 20 minutes before checking coolant. Do not open a hot radiator cap. Call us or roadside towing if you're not near the shop.",
      service: "Engine Repair (SVC-09) / Roadside Towing",
    },
    result_overheat_watch: {
      result: true, urgency: "med", back: "overheat",
      title: "Coolant system needs attention soon",
      body: "A rising gauge without steam can still mean a coolant leak, bad thermostat, or failing water pump. Keep an eye on the gauge and get it checked before it becomes an emergency.",
      service: "Engine Diagnostics (SVC-04)",
    },
    result_brake_urgent: {
      result: true, urgency: "high", back: "brake",
      title: "Stop driving — this is a safety issue",
      body: "A soft or sinking brake pedal can mean a fluid leak or failing master cylinder. Don't drive the car further than necessary. Call us for a tow or emergency slot.",
      service: "Brake Repair (SVC-02) / Roadside Towing",
    },
    result_brake_uneven: {
      result: true, urgency: "med", back: "brake",
      title: "Uneven braking — likely a stuck caliper or uneven pad wear",
      body: "Pulling to one side under braking often means a caliper isn't releasing evenly, or pads are worn unevenly. Drivable to us, but get it looked at soon.",
      service: "Brake Repair (SVC-02)",
    },
  };

  const tsRoot = document.getElementById("troubleshootRoot");

  function renderTroubleshoot(nodeKey) {
    const node = TS_TREE[nodeKey];
    if (!node) return;

    if (node.result) {
      tsRoot.innerHTML = `
        <div class="ts-step">
          ${node.back ? `<button class="ts-back" data-back="${node.back}">← Back</button>` : ""}
          <div class="ts-result">
            <span class="urgency ${node.urgency}">${
        node.urgency === "high" ? "Act now" : node.urgency === "med" ? "See us soon" : "Low urgency"
      }</span>
            <h4>${node.title}</h4>
            <p>${node.body}</p>
            <p class="muted-sm">Recommended service: <strong style="color:var(--off-white)">${node.service}</strong></p>
            <div class="ts-result-actions">
              <button class="btn btn-primary btn-sm" data-goto-inline="ticket">Book this / Open ticket</button>
              <button class="btn btn-ghost btn-sm" data-goto-inline="chat">Talk to someone now</button>
              <button class="btn btn-ghost btn-sm" data-restart>Start over</button>
            </div>
          </div>
        </div>`;
    } else {
      tsRoot.innerHTML = `
        <div class="ts-step">
          ${node.back ? `<button class="ts-back" data-back="${node.back}">← Back</button>` : ""}
          <h3 style="margin:0">${node.title}</h3>
          <div class="ts-options">
            ${node.options
              .map((o) => `<button class="ts-opt" data-next="${o.next}">${o.label}</button>`)
              .join("")}
          </div>
        </div>`;
    }

    tsRoot.querySelectorAll("[data-next]").forEach((btn) =>
      btn.addEventListener("click", () => renderTroubleshoot(btn.dataset.next))
    );
    tsRoot.querySelectorAll("[data-back]").forEach((btn) =>
      btn.addEventListener("click", () => renderTroubleshoot(btn.dataset.back))
    );
    const restart = tsRoot.querySelector("[data-restart]");
    if (restart) restart.addEventListener("click", () => renderTroubleshoot("start"));
    tsRoot.querySelectorAll("[data-goto-inline]").forEach((btn) =>
      btn.addEventListener("click", () => showScreen(btn.dataset.gotoInline, { scroll: false }))
    );
  }

  /* =========================================================
     LIVE CHAT — canned bot with keyword matching
     ========================================================= */
  const chatLog = document.getElementById("chatLog");
  const chatQuick = document.getElementById("chatQuick");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  const CHAT_RULES = [
    { kw: ["hour", "open", "close"], reply: "We're open Mon–Sat 7:30 AM–6:30 PM, and Sunday 9 AM–2 PM for inspections only." },
    { kw: ["price", "cost", "quote", "how much"], reply: "Prices depend on the job — check the Service Menu above for starting rates, or open a ticket and we'll send a firm quote after a quick look." },
    { kw: ["brake"], reply: "Brake service starts at ₱3,500 and includes a free rotor check. Want me to pull up the full details, or would you rather run the symptom checker?" },
    { kw: ["oil"], reply: "Oil changes start at ₱1,200 and take about 30 minutes — no appointment needed for that one, just drop in." },
    { kw: ["warranty"], reply: "Labor is warrantied 12 months / 12,000 miles, and brake pads are covered for as long as you own the car. Want the full FAQ on warranty?" },
    { kw: ["appointment", "book", "schedule"], reply: "You can book by phone at (555) 123-4911, or open a support ticket right here and pick your preferred day — we'll confirm by email or phone." },
    { kw: ["tow", "stuck", "roadside"], reply: "For roadside help right now, call (555) 123-9111 — that line is answered 24/7." },
    { kw: ["light", "check engine", "warning"], reply: "A dashboard warning light is worth running through our symptom checker so I can tell you how urgent it is — want me to open that for you?" },
    { kw: ["thank"], reply: "Anytime! Anything else I can help with?" },
  ];

  function startChat() {
    addChatMsg("bot", "Hey, welcome to Redline Motorworks support. I'm the shop's chat assistant — ask me about hours, pricing, warranty, or what to do about a warning light.");
    setChatQuick(["What are your hours?", "How much is a brake job?", "My check engine light is on"]);
  }

  function addChatMsg(who, text) {
    const div = document.createElement("div");
    div.className = "chat-msg " + who;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setChatQuick(options) {
    chatQuick.innerHTML = "";
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.textContent = opt;
      b.addEventListener("click", () => sendChat(opt));
      chatQuick.appendChild(b);
    });
  }

  function botReply(userText) {
    const lower = userText.toLowerCase();
    const rule = CHAT_RULES.find((r) => r.kw.some((k) => lower.includes(k)));

    const typing = document.createElement("div");
    typing.className = "chat-msg bot typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    chatLog.appendChild(typing);
    chatLog.scrollTop = chatLog.scrollHeight;

    setTimeout(() => {
      typing.remove();
      if (rule) {
        addChatMsg("bot", rule.reply);
      } else {
        addChatMsg(
          "bot",
          "I don't have a canned answer for that one — I'll hand you to a service advisor. Want to open a support ticket, or run the symptom checker if it's about a specific problem?"
        );
        setChatQuick(["Open a ticket", "Run symptom checker"]);
        return;
      }
      setChatQuick(["Book an appointment", "Talk about pricing", "Something else"]);
    }, 850);
  }

  function sendChat(text) {
    text = text.trim();
    if (!text) return;
    addChatMsg("user", text);
    chatQuick.innerHTML = "";
    if (/open a ticket/i.test(text)) {
      setTimeout(() => showScreen("ticket", { scroll: false }), 500);
      return;
    }
    if (/symptom checker/i.test(text)) {
      setTimeout(() => showScreen("troubleshoot", { scroll: false }), 500);
      return;
    }
    botReply(text);
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = chatInput.value;
    chatInput.value = "";
    sendChat(val);
  });

  /* =========================================================
     SUPPORT TICKETS — submit + track (in-memory demo store)
     ========================================================= */
  const ticketsDB = {
    "RM-2026-40217": {
      status: "assigned",
      vehicle: "2019 Toyota Vios",
      category: "Brakes",
      submitted: "Aug 1, 2026",
      tech: "J. Santos",
      eta: "Aug 5, 2026",
    },
    "RM-2026-40118": {
      status: "resolved",
      vehicle: "2017 Ford Ranger",
      category: "AC / Heating",
      submitted: "Jul 22, 2026",
      tech: "M. Cruz",
      eta: "Completed Jul 23, 2026",
    },
  };

  const ticketForm = document.getElementById("ticketForm");
  const ticketFormWrap = document.getElementById("ticketFormWrap");
  const ticketConfirm = document.getElementById("ticketConfirm");
  const confirmTicketId = document.getElementById("confirmTicketId");

  function generateTicketId() {
    const n = Math.floor(10000 + Math.random() * 89999);
    return "RM-2026-" + n;
  }

  ticketForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(ticketForm);
    const id = generateTicketId();

    ticketsDB[id] = {
      status: "received",
      vehicle: data.get("vehicle") || "—",
      category: data.get("category") || "General",
      submitted: "Just now",
      tech: "Unassigned",
      eta: "Pending review",
    };

    confirmTicketId.textContent = id;
    ticketFormWrap.classList.add("hidden");
    ticketConfirm.classList.remove("hidden");
    ticketConfirm.dataset.lastId = id;
    ticketForm.reset();
  });

  document.getElementById("confirmNewTicketBtn").addEventListener("click", () => {
    ticketConfirm.classList.add("hidden");
    ticketFormWrap.classList.remove("hidden");
  });

  document.getElementById("confirmTrackBtn").addEventListener("click", () => {
    const id = ticketConfirm.dataset.lastId;
    showScreen("track", { scroll: false });
    document.getElementById("trackInput").value = id;
    lookupTicket(id);
  });

  const trackInput = document.getElementById("trackInput");
  const trackResult = document.getElementById("trackResult");

  const STATUS_ORDER = ["received", "review", "assigned", "resolved"];
  const STATUS_LABEL = { received: "Received", review: "In Review", assigned: "Technician Assigned", resolved: "Resolved" };

  function lookupTicket(rawId) {
    const id = rawId.trim().toUpperCase();
    const t = ticketsDB[id];
    if (!t) {
      trackResult.innerHTML = `<p class="not-found">No ticket found for “${escapeHtml(rawId)}”. Double check the ID, or <button class="chip" data-goto-inline="ticket">open a new ticket</button>.</p>`;
      const b = trackResult.querySelector("[data-goto-inline]");
      if (b) b.addEventListener("click", () => showScreen("ticket", { scroll: false }));
      return;
    }

    const currentIdx = STATUS_ORDER.indexOf(t.status);
    trackResult.innerHTML = `
      <div class="ticket-card">
        <div class="ticket-card-top">
          <h4>${id}</h4>
          <span class="status-pill ${t.status}">${STATUS_LABEL[t.status]}</span>
        </div>
        <div class="timeline">
          ${STATUS_ORDER.map((s, i) => `
            <div class="tl-step ${i < currentIdx ? "done" : i === currentIdx ? "current" : ""}">
              <div class="tl-dot"></div>
              <span>${STATUS_LABEL[s]}</span>
            </div>`).join("")}
        </div>
        <div class="ticket-meta">
          <div><span>Vehicle</span>${t.vehicle}</div>
          <div><span>Category</span>${t.category}</div>
          <div><span>Submitted</span>${t.submitted}</div>
          <div><span>Technician</span>${t.tech}</div>
          <div><span>ETA</span>${t.eta}</div>
        </div>
      </div>`;
  }

  document.getElementById("trackBtn").addEventListener("click", () => {
    if (trackInput.value.trim()) lookupTicket(trackInput.value);
  });
  trackInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (trackInput.value.trim()) lookupTicket(trackInput.value);
    }
  });
  document.querySelectorAll("[data-demo]").forEach((btn) =>
    btn.addEventListener("click", () => {
      trackInput.value = btn.dataset.demo;
      lookupTicket(btn.dataset.demo);
    })
  );

  /* ---------- init ---------- */
  showScreen("home", { scroll: false });
})();