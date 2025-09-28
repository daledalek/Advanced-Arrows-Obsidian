const { Plugin, PluginSettingTab, Setting } = require('obsidian');
const { EditorView } = require('@codemirror/view');

// Always-on replacements
const BASE_RULES = {
  ".do": "↓",
  ".up": "↑",
  ".lr": "↔",
  ".ud": "↕",
  ".nw": "↖",
  ".ne": "↗",
  ".se": "↘",
  ".sw": "↙",
  ".rol": "⇄",
  ".lor": "⇆",
  ".uod": "⇅",
  ".zz": "↯",
  ".acw": "↺",
  ".cw": "↻"
};

// Optional replacements (enabled together)
const OPTIONAL_RULES = {
  "->": "→",
  "<-": "←"
};

module.exports = class AdvancedArrowsPlugin extends Plugin {
  async onload() {
    // Load settings
    this.settings = Object.assign({}, await this.loadData());
    if (this.settings.enableArrowPair == null) this.settings.enableArrowPair = false;

    // Register editor listener
    const listener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      const view = update.view;
      if (!view) return;
      const pos = view.state.selection.main.head;
      if (pos == null) return;
      const start = Math.max(0, pos - 4); // Longest key is 4 (.rol, .lor, .uod)
      const last = view.state.doc.sliceString(start, pos);

      // Merge active rules
      const allRules = Object.assign({}, BASE_RULES);
      if (this.settings.enableArrowPair) {
        Object.assign(allRules, OPTIONAL_RULES);
      }

      for (const [key, val] of Object.entries(allRules)) {
        if (last.endsWith(key)) {
          const from = pos - key.length;
          view.dispatch({
            changes: { from, to: pos, insert: val },
            userEvent: "input.replace.advanced-arrows"
          });
          return;
        }
      }
    });
    this.registerEditorExtension(listener);

    // Add settings tab
    this.addSettingTab(new AdvancedArrowsSettingTab(this.app, this));
  }

  onunload() {}

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class AdvancedArrowsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Advanced Arrows Settings" });

    containerEl.createEl("p", { text: "Always active replacements:" });
    const list = containerEl.createEl("ul");
    for (const [key, val] of Object.entries(BASE_RULES)) {
      list.createEl("li", { text: `${key} → ${val}` });
    }

    new Setting(containerEl)
      .setName("Enable -> and <- replacements")
      .setDesc("Replaces '->' with '→' and '<-' with '←'")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableArrowPair)
          .onChange(async (value) => {
            this.plugin.settings.enableArrowPair = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
