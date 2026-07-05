import { initHeroScene, initAmbientScene } from "./scenes.js";

/* ============================================================
   WEDDING CONSTANTS — edit these to update the whole site
   ============================================================ */
const WEDDING = {
  brideName: "Dr. Sandra Ajith",
  groomName: "Gokul Surendran",
  // Muhurtham 9:45 AM IST, 13 Sept 2026
  startISO: "2026-09-13T09:45:00+05:30",
  endISO: "2026-09-13T10:30:00+05:30",
  venue: "Sana Auditorium, Kallumthazham, Kollam",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sana%20Auditorium%2C%20Kallumthazham%2C%20Kollam",
};

/* ============================================================
   PAGE FADE-IN — removes opacity:0 once the page has loaded
   ============================================================ */
window.addEventListener("load", () => {
  document.body.classList.remove("page-loading");
  // Start observing reveal elements after the fade begins
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
});

/* ============================================================
   NAV
   ============================================================ */
const navToggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");
navToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll("[data-nav]").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

/* ============================================================
   SCROLL CUE
   ============================================================ */
document.getElementById("scroll-cue").addEventListener("click", () => {
  document.getElementById("blessing").scrollIntoView({ behavior: "smooth" });
});

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);



/* ============================================================
   COUNTDOWN
   ============================================================ */
const weddingDate = new Date(WEDDING.startISO);

function updateCountdown() {
  const now = new Date();
  let diff = weddingDate.getTime() - now.getTime();
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  document.getElementById("cd-days").textContent = String(days).padStart(2, "0");
  document.getElementById("cd-hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("cd-mins").textContent = String(mins).padStart(2, "0");
  document.getElementById("cd-secs").textContent = String(secs).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ============================================================
   CALENDAR LINKS
   ============================================================ */
function toUTCStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

const startDate = new Date(WEDDING.startISO);
const endDate = new Date(WEDDING.endISO);
const calTitle = `${WEDDING.brideName.split(" ").pop()} & ${WEDDING.groomName.split(" ")[0]}'s Wedding`;
const calDetails = "Muhurtham ceremony — with love, an invitation to celebrate.";

const gcalUrl = new URL("https://www.google.com/calendar/render");
gcalUrl.searchParams.set("action", "TEMPLATE");
gcalUrl.searchParams.set("text", calTitle);
gcalUrl.searchParams.set("dates", `${toUTCStamp(startDate)}/${toUTCStamp(endDate)}`);
gcalUrl.searchParams.set("details", calDetails);
gcalUrl.searchParams.set("location", WEDDING.venue);
document.getElementById("gcal-link").href = gcalUrl.toString();

function buildICS() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sandra & Gokul Wedding//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@sandra-gokul-wedding`,
    `DTSTAMP:${toUTCStamp(new Date())}`,
    `DTSTART:${toUTCStamp(startDate)}`,
    `DTEND:${toUTCStamp(endDate)}`,
    `SUMMARY:${calTitle}`,
    `DESCRIPTION:${calDetails}`,
    `LOCATION:${WEDDING.venue}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
const icsBlob = new Blob([buildICS()], { type: "text/calendar" });
document.getElementById("ics-link").href = URL.createObjectURL(icsBlob);

/* ============================================================
   RSVP FLOW
   ============================================================ */
const form = document.getElementById("rsvp-form");
const steps = {
  1: form.querySelector('[data-step="1"]'),
  2: form.querySelector('[data-step="2"]'),
  "thanks-yes": form.querySelector('[data-step="thanks-yes"]'),
  "thanks-no": form.querySelector('[data-step="thanks-no"]'),
};
const nameInput = document.getElementById("rsvp-name");
const nameError = document.getElementById("rsvp-name-error");
const guestsInput = document.getElementById("rsvp-guests");

function showStep(key) {
  Object.values(steps).forEach((el) => (el.hidden = true));
  steps[key].hidden = false;
}

// Start with only step 1 visible
showStep(1);

let lastAnswer = null;

form.querySelectorAll("[data-answer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameError.classList.add("show");
      nameInput.focus();
      return;
    }
    nameError.classList.remove("show");
    lastAnswer = btn.dataset.answer;

    if (lastAnswer === "yes") {
      showStep(2);
    } else {
      submitRSVP({ name, attending: "no", guests: 0 }, () => showStep("thanks-no"));
    }
  });
});

document.getElementById("guest-minus").addEventListener("click", () => {
  guestsInput.value = Math.max(1, Number(guestsInput.value) - 1);
});
document.getElementById("guest-plus").addEventListener("click", () => {
  guestsInput.value = Math.min(10, Number(guestsInput.value) + 1);
});

document.getElementById("rsvp-continue").addEventListener("click", () => {
  const name = nameInput.value.trim();
  submitRSVP({ name, attending: "yes", guests: Number(guestsInput.value) }, () => showStep("thanks-yes"));
});
document.getElementById("rsvp-back-1").addEventListener("click", () => showStep(1));
document.getElementById("rsvp-change-1").addEventListener("click", () => showStep(1));
document.getElementById("rsvp-change-2").addEventListener("click", () => showStep(1));

/* ============================================================
   GOOGLE SHEETS ENDPOINT
   ▶ Paste your Google Apps Script Web App URL below.
   ▶ See rsvp-google-apps-script.gs + setup-guide.md for steps.
   ============================================================ */
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzo53vFDQ2VnmzmwSiGdOzAQGD6D0n6UvJSZuvrAIsZ5VWoYniCZ2EeQ429_nSg_ufT/exec";
// const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzKxc7eJTub7sSfeR5QxykNY67Wbojgz-G45jhL5RQr_rAHnZnzuw-hqvDCIbOSTMFA/exec";

function submitRSVP(data, onComplete) {
  // Show a submitting state on all primary buttons
  const primaryBtns = form.querySelectorAll(".btn-primary");
  primaryBtns.forEach((b) => {
    b.disabled = true;
    b._originalText = b.textContent;
    b.textContent = "Sending…";
  });

  // If no URL has been set yet, just log and carry on
  if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("PASTE_")) {
    console.warn("RSVP: No Google Sheet URL set — response not recorded.");
    _restoreButtons(primaryBtns);
    if (onComplete) onComplete();
    return;
  }

  // Build form-encoded body — the only format reliably read by
  // Apps Script's e.parameter in no-cors POST requests.
  const params = new URLSearchParams();
  params.append("name",      data.name);
  params.append("attending", data.attending);
  params.append("guests",    String(data.guests));
  params.append("timestamp", new Date().toISOString());

  fetch(GOOGLE_SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    // URLSearchParams sets Content-Type: application/x-www-form-urlencoded automatically —
    // a simple CORS header that works in no-cors mode AND populates e.parameter in Apps Script.
    body: params,
  })
    .then(() => {
      console.log("RSVP sent to Google Sheet:", data);
    })
    .catch((err) => {
      console.error("RSVP send failed (will still show thank-you):", err);
    })
    .finally(() => {
      _restoreButtons(primaryBtns);
      if (onComplete) onComplete();
    });
}

function _restoreButtons(btns) {
  btns.forEach((b) => {
    b.disabled = false;
    if (b._originalText) b.textContent = b._originalText;
  });
}


/* ============================================================
   THREE.JS SCENES
   ============================================================ */
initHeroScene(document.getElementById("hero-canvas"));
initAmbientScene(document.getElementById("countdown-canvas"), "#c8973f", 70);
initAmbientScene(document.getElementById("closing-canvas"), "#7a1f2b", 50);
