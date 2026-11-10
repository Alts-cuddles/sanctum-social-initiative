# Changelog

## 2.0.0
Rebuilt to match CPR's normal initiative exactly, with only the four social changes.

- Social initiative now runs through CPR's own `CPRCombat.rollInitiative` and the normal CPR initiative chat card, criticals and Dice So Nice handling. Only `getInitiativeRoll` is wrapped.
- COOL replaces REF. Speedware (`bonuses.initiative` effects) and Solo Initiative Reaction (role initiative mods) are not added. Charismatic Impact rank, plus Active Effects on `bonuses.charismaticImpact`, is added.
- Removed: the token right-click chat-bubble button, the Start Social Encounter button, the SOCIAL banner and tracker styling, the custom breakdown chat card, the GM modifier prompt, the Charismatic Impact mode settings, the COOL tie-break sort, and the `api` object.
- The only UI left is a GM toggle in the combat tracker header that marks the current encounter as social.

## 1.0.0
First release as Sanctum Social Initiative.
