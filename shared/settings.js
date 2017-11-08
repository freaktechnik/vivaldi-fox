let callbacks = new Set();

const Settings = {
  getDefaultTheme() {
    return getSetting("defaultTheme", "light");
  },
  getNightTheme() {
    return getSetting("nightTheme", "light");
  },
  getPageColorsOnInactive() {
    return getSetting("pageColorInactiveWins", true);
  },
  getThemes() {
    return getSetting("themes", {
      "light": {
        applyPageColors: ["toolbar_text", "toolbar"],
        name: "light",
        properties: {
          images: {
            headerURL: ""
          },
          colors: {
            accentcolor: "#dedede",
            textcolor: "#444444",
            toolbar: "#f8f8f8",
            toolbar_text: "#000000",
            toolbar_field: "#ffffff",
            toolbar_field_text: "#000000",
          }
        }
      },
      "dark": {
        applyPageColors: ["toolbar_text", "toolbar"],
        name: "dark",
        properties: {
          images: {
            headerURL: ""
          },
          colors: {
            textcolor: "#ffffff",
            accentcolor: "#0c0c0d",
            toolbar: "#323234",
            toolbar_text: "#eeeeee",
            toolbar_field: "#474749",
            toolbar_field_text: "#F9F9FA",
          }
        }
      }
    });
  },
  setThemes(value) {
    setSetting("themes", value);
  },
  setDefaultTheme(theme) {
    setSetting("defaultTheme", theme);
  },
  setNightTheme(theme) {
    setSetting("nightTheme", theme);
  },
  async getThemeProperty(property, type, theme) {
    let themes = await getThemes();
    return themes[theme][type][property];
  },
  async setThemeProperty(newValue, property, type, theme) {
    let themes = await getThemes();
    themes[theme][type][property] = newValue;
    return setSetting("themes", themes);
  },
  onChanged(callback) {
    return browser.storage.onChanged.addListener(changes => {
      changes = Object.assign({}, changes);
      for (let change in changes) {
        if (!change.startsWith("settings.")) {
          delete changes[change];
        }
      }
      if (Object.keys(changes).length > 0) {
        callback(changes);
      }
    });
  },
  clear() {
    browser.storage.local.clear();
  }
};

async function getSetting(setting, fallback) {
  try {
    const found = await browser.storage.local.get("settings." + setting);
    if (found.hasOwnProperty("settings." + setting)) {
      return found["settings." + setting];
    } else {
      return fallback;
    }
  } catch(e) {
    return fallback;
  }
}

async function setSetting(setting, value) {
  await browser.storage.local.set({["settings." + setting]: value});
}