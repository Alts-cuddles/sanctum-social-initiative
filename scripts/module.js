/**
 * Sanctum Social Initiative
 *
 * In an encounter flagged as social, CPRCombatant.getInitiativeRoll is replaced by a
 * copy of CPR 0.92.4's own character/mook branch with four changes:
 *   1. The stat is COOL instead of REF.
 *   2. Active Effects on bonuses.initiative (Speedware) are not added.
 *   3. Role initiative mods (Solo Initiative Reaction) are not added.
 *   4. Charismatic Impact rank, plus Active Effects on bonuses.charismaticImpact, is added.
 * Everything else is still CPR's normal initiative and the core Combat Tracker.
 */
import { CPRInitiative } from "/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
import CPRMod from "/systems/cyberpunk-red-core/modules/rolls/cpr-modifiers.js";
import SystemUtils from "/systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js";
import { MODULE_ID, SOCIAL_FLAG, isSocialCombat, findCharismaticImpact } from "./social-initiative.js";

const TARGET = "CONFIG.Combatant.documentClass.prototype.getInitiativeRoll";

async function socialGetInitiativeRoll(wrapped, formula) {
  const { actor } = this.token;
  if (!isSocialCombat(this.combat) || !["character", "mook"].includes(actor?.type)) {
    return wrapped(formula);
  }

  const cprInitiative = new CPRInitiative(
    actor.name,
    formula,
    SystemUtils.Localize("CPR.global.stats.cool"),
    actor.getStat("cool")
  );

  const impact = findCharismaticImpact(actor);
  if (impact) {
    const effects = Array.from(actor.allApplicableEffects());
    const allMods = CPRMod.getAllModifiers(effects);
    const filteredMods = allMods.filter(
      (m) => !m.isSituational || (m.isSituational && m.onByDefault)
    );
    cprInitiative.addMod([{ value: impact.rank, source: impact.name }]);
    cprInitiative.addMod(CPRMod.getRelevantMods(filteredMods, SystemUtils.slugify(impact.name)));
  }

  await cprInitiative.roll();
  return cprInitiative;
}

function registerWrapper() {
  if (globalThis.libWrapper) {
    libWrapper.register(MODULE_ID, TARGET, socialGetInitiativeRoll, "MIXED");
    return;
  }
  const proto = CONFIG.Combatant.documentClass.prototype;
  const original = proto.getInitiativeRoll;
  proto.getInitiativeRoll = function getInitiativeRoll(...args) {
    return socialGetInitiativeRoll.call(this, original.bind(this), ...args);
  };
}

/** GM-only toggle in the tracker header. */
function addSocialToggle(app, html) {
  if (!game.user.isGM) return;
  const combat = app.viewed;
  if (!combat) return;
  const root = html instanceof HTMLElement ? html : (html[0] || html);
  const nav = root?.querySelector?.("nav.encounters") || root?.find?.("nav.encounters")?.[0];
  if (!nav || nav.querySelector(".sit-toggle")) return;

  const social = isSocialCombat(combat);
  const button = document.createElement("a");
  button.className = `combat-button sit-toggle${social ? " active" : ""}`;
  button.dataset.tooltip = game.i18n.localize(social ? "SIT.Toggle.Disable" : "SIT.Toggle.Enable");
  button.innerHTML = '<i class="fas fa-comments"></i>';
  button.addEventListener("click", (event) => {
    event.preventDefault();
    combat.setFlag(MODULE_ID, SOCIAL_FLAG, !social);
  });
  nav.append(button);
}

async function toggleSocialForTokens(token) {
  if (!game.user.isGM) return;
  const tokens = canvas.tokens.controlled.length ? canvas.tokens.controlled : [token];
  if (!tokens.length) return;

  let combat = game.combat;
  if (!combat) {
    combat = await Combat.create({ scene: canvas.scene.id, active: true });
  }

  if (!isSocialCombat(combat)) {
    await combat.setFlag(MODULE_ID, SOCIAL_FLAG, true);
  }

  const toAdd = [];
  const toRemove = [];
  for (const t of tokens) {
    const existing = combat.combatants.find(c => c.tokenId === t.id);
    if (existing) toRemove.push(existing.id);
    else toAdd.push({ tokenId: t.id, sceneId: canvas.scene.id, actorId: t.actor?.id, hidden: t.document.hidden });
  }

  if (toRemove.length) await combat.deleteEmbeddedDocuments("Combatant", toRemove);
  if (toAdd.length) await combat.createEmbeddedDocuments("Combatant", toAdd);
}

function addTokenHudButton(hud, html, data) {
  if (!game.user.isGM) return;
  const root = html instanceof HTMLElement ? html : (html[0] || html);
  // Robust column finder for different Foundry versions
  const col = root.querySelector(".col.right")
    || root.querySelector(".column.right")
    || root.querySelector(".right")
    || root.querySelector("[class*='right']")
    || root;
  if (!col || col.querySelector(".sit-hud-social")) return;

  const tokenId = data._id || data.id || hud.object?.id;
  const combat = game.combat;
  const inSocial = combat && isSocialCombat(combat) && combat.combatants.some(c => c.tokenId === tokenId);

  const button = document.createElement("div");
  button.className = `control-icon sit-hud-social${inSocial ? " active" : ""}`;
  button.title = game.i18n.localize("SIT.HUD.Toggle");
  button.innerHTML = '<i class="fas fa-comments"></i>';
  button.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    toggleSocialForTokens(hud.object);
  });

  // Prefer placing after the combat button
  const combatIcon = col.querySelector(".fa-swords, .fa-fist-raised, [data-action='combat']");
  const combatBtn = combatIcon?.closest(".control-icon");
  if (combatBtn) {
    combatBtn.after(button);
  } else {
    col.append(button);
  }
}

Hooks.once("setup", registerWrapper);
Hooks.on("renderCombatTracker", addSocialToggle);
Hooks.on("renderTokenHUD", addTokenHudButton);
