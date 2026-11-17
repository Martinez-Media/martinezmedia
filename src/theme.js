(() => {
  const key = "martinezmedia-theme";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const colors = document.querySelectorAll('meta[name="theme-color"]');
  const preferences = ["system", "light", "dark"];
  let preference = "system";

  try {
    const saved = window.localStorage.getItem(key);
    if (preferences.includes(saved)) {
      preference = saved;
    } else if (saved !== null) {
      console.warn("Unrecognized saved theme preference. Using the device setting.");
    }
  } catch (error) {
    if (error.name !== "SecurityError") throw error;
    console.warn("Theme preference could not be read. Using the device setting.", error);
  }

  function apply() {
    root.dataset.theme = preference;
    const dark = preference === "dark" || (preference === "system" && system.matches);
    for (const meta of colors) meta.content = dark ? "#0b1725" : "#f1f7fc";
  }

  apply();
  system.addEventListener("change", apply);

  document.addEventListener("DOMContentLoaded", () => {
    const control = document.querySelector("[data-theme-control]");
    const select = control.querySelector("select");
    select.value = preference;
    select.addEventListener("change", () => {
      if (!preferences.includes(select.value)) {
        console.warn("Unrecognized theme selection. The current theme was retained.");
        return;
      }
      preference = select.value;
      apply();
      try {
        window.localStorage.setItem(key, preference);
      } catch (error) {
        if (error.name !== "SecurityError" && error.name !== "QuotaExceededError") throw error;
        console.warn("Theme changed, but the preference could not be saved in this browser.", error);
      }
    });
    control.hidden = false;
  });
})();
