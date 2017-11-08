class AddonState {
  constructor({ onTabColorChange, onNightMode, onInit }) {
    this.state = {
      tabColorMap: new Map(),
    };
  
    onTabColorChange = onTabColorChange.bind(this);
    onNightMode = onNightMode.bind(this);
    onInit = onInit.bind(this);

    browser.tabs.onActivated.addListener(async ({ tabId }) => {
      let {tabColorMap} = this.state;
      let tab = await browser.tabs.get(tabId);

      if (!tabColorMap.has(tabId)) {
        tabColorMap.set(tabId, await findColor(tab));
      }
      onTabColorChange(tab);
    });

    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (!changeInfo.url && !changeInfo.favIconUrl) {
        return;
      }
      let color = await findColor(tab);
      let {tabColorMap} = this.state;      

      if (color && tabColorMap.get(tab.id) !== null && Color.equals(color, tabColorMap.get(tab.id))) {
        // Don't bother changing the theme if color is still the same.
        return;
      }

      tabColorMap.set(tabId, color);

      if (tab.active) {
        await onTabColorChange(tab);
      }
    });

    this.refreshAddon = async () => {
      onInit();
      
      await new Promise(r => setTimeout(r, 500));
      let tabs = await browser.tabs.query({ active: true });
      if (tabs.length == 0) {
        return;
      }
      for (let tab of tabs) {
        onTabColorChange(tab);
      }
    };

    Settings.onChanged(this.refreshAddon);

    browser.alarms.create(
      "nightToggle",
      {
        when: firstAlarm(),
        periodInMinutes: 12 * 60, // 12 hours
      }
    );
    browser.alarms.onAlarm.addListener(({name}) => {
      if (name === "nightToggle") {
        onNightMode();
      }
    });
    onInit();
  }
}

function firstAlarm() {
  let now = new Date(Date.now());
  let then = new Date(Date.now());
  if (now.getHours() >= NIGHTMODE_EVENING) {
    then.setHours(24 + NIGHTMODE_MORNING);
  } else if (now.getHours() < NIGHTMODE_MORNING) {
    then.setHours(NIGHTMODE_MORNING);
  } else {
    then.setHours(NIGHTMODE_EVENING);
  }
  then.setMinutes(0);
  then.setSeconds(0);
  return then.getTime();
}

async function findColor(tab) {
  try {
    let [foundPageColor] = await browser.tabs.executeScript(tab.id, { file: "data/contentscript.js"})
    if (foundPageColor) {
      return new Color(foundPageColor);
    }
  } catch(e) {}

  if (tab.favIconUrl) {
    let img = await createFaviconImage(tab.favIconUrl);
    let color = getColorFromImage(img);
    return color;
  }
  return null;
}