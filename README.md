# Sanctum Social Initiative

Social initiative for **Cyberpunk RED** on **Foundry VTT**. A social encounter is a normal combat encounter with one flag set, and its initiative is CPR's normal initiative with four changes:

1. The stat is **COOL** instead of REF.
2. **Speedware** (Kerenzikov, Sandevistan and any other `bonuses.initiative` Active Effect) adds nothing.
3. **Solo Initiative Reaction** adds nothing.
4. The Rockerboy's **Charismatic Impact** rank is added, plus any Active Effect on `bonuses.charismaticImpact`.

Everything else is unchanged CPR and Foundry: the d10, CPR's "Initiative rolls criticals" setting, the CPR initiative chat card, Dice So Nice, sorting, adding tokens with the normal right-click Combat toggle, and the Roll / Roll All / Roll NPCs buttons. Black ICE and Demons roll exactly as they do in combat.

- **Foundry:** v11 to v12 (verified on v12.343)
- **System:** Cyberpunk RED - CORE (`cyberpunk-red-core`), verified on 0.92.4
- **Recommended:** libWrapper (optional)

## Install

1. In Foundry's setup screen, open **Add-on Modules**, click **Install Module**, paste
   `https://github.com/Alts-cuddles/sanctum-social-initiative/releases/latest/download/module.json`
   into **Manifest URL**, and click **Install**.
2. In your world, enable **Sanctum Social Initiative** under **Manage Modules**.

For a manual install, unzip the release into `Data/modules/sanctum-social-initiative/` and restart.

## Usage

1. Create an encounter and add tokens the usual way.
2. As GM, click the speech-bubble button in the combat tracker header. It's highlighted while the encounter is social. Click it again to switch back to normal combat initiative.
3. Roll initiative as normal.

If you switch an encounter after rolling, reset initiative and roll again.

## How it works

The module wraps `CPRCombatant.getInitiativeRoll` (through libWrapper when it's installed). In a social encounter, for characters and mooks, it builds the same `CPRInitiative` roll CPR does, but with COOL as the stat and Charismatic Impact as the only mod. Any other combatant, and every non-social encounter, goes straight to CPR's original method.

## Development

```bash
npm test        # helper tests
npm run check   # syntax check
```

## License

MIT. See [LICENSE](LICENSE).
