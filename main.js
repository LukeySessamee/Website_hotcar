const word = "Good Bye";
let index = 0;

const box = document.getElementById("box");
const clearBtn = document.getElementById("clearBtn");
const counter = document.getElementById("count");

const reward1 = document.getElementById("reward1");
const reward2 = document.getElementById("reward2");
const reward3 = document.getElementById("reward3");
const reward4 = document.getElementById("reward4");
const reward5 = document.getElementById("reward5");

let count = 0;
let lastSeenCount = 0;
let animating = false;
let animationInterval = null;

function loadSavedValues() {
  count = parseInt(localStorage.getItem("count")) || 0;
  lastSeenCount = parseInt(localStorage.getItem("lastSeenCount")) || 0;
}

function buildText(amount) {
  return amount > 0 ? Array(amount).fill(word).join(" ") : "";
}

function updateRewards(displayedCount) {
  reward1.style.display = displayedCount >= 10 ? "block" : "none";
  reward2.style.display = displayedCount >= 25 ? "block" : "none";
  reward3.style.display = displayedCount >= 50 ? "block" : "none";
  reward4.style.display = displayedCount >= 100 ? "block" : "none";
  reward5.style.display = displayedCount >= 200 ? "block" : "none";
}

function updateDisplayInstant(displayedCount) {
  counter.textContent = displayedCount;
  box.value = buildText(displayedCount);
  updateRewards(displayedCount);
}

function stopAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  animating = false;
}

function animateCountGain(fromCount, toCount) {
  stopAnimation();

  if (toCount <= fromCount) {
    updateDisplayInstant(toCount);
    localStorage.setItem("lastSeenCount", toCount);
    return;
  }

  animating = true;
  let shown = fromCount;
  updateDisplayInstant(shown);

  animationInterval = setInterval(() => {
    shown++;
    updateDisplayInstant(shown);

    if (shown >= toCount) {
      stopAnimation();
      localStorage.setItem("lastSeenCount", toCount);
    }
  }, 120);
}

function refreshFromStorage() {
  loadSavedValues();

  if (count > lastSeenCount) {
    animateCountGain(lastSeenCount, count);
  } else {
    updateDisplayInstant(count);
    localStorage.setItem("lastSeenCount", count);
  }
}

// initial load
refreshFromStorage();

// refresh when tab gets focus again
window.addEventListener("focus", refreshFromStorage);

// typing in the box
box.addEventListener("keydown", function (e) {
  e.preventDefault();
  if (animating) return;

  const letter = word[index];
  box.value += letter;
  index++;

  if (index >= word.length) {
    index = 0;
    count++;
    localStorage.setItem("count", count);

    // Since user is seeing this page right now,
    // it is okay to update the display immediately.
    updateDisplayInstant(count);
    localStorage.setItem("lastSeenCount", count);
  }
});

// reset button
clearBtn.addEventListener("click", function () {
  stopAnimation();

  count = 0;
  lastSeenCount = 0;
  index = 0;

  localStorage.setItem("count", 0);
  localStorage.setItem("lastSeenCount", 0);

  updateDisplayInstant(0);
});