import { clamp, getWinningLinksTo, safeHasFlag } from "./core";

export default class AlchemyPatcher {

    baseStats: AlchemyBaseStats;
    helpers: xelibHelpers;
    locals: any;
    rules: any;
    settings: DefaultSettings;

    patch: PatchFunction;
    load: FilterEntry;

    constructor(helpers: xelibHelpers, locals: any, patch: any, settings: DefaultSettings) {
        this.baseStats = settings.alchemy.baseStats;
        this.helpers = helpers;
        this.locals = locals;
        this.rules = locals.rules.alchemy;
        this.settings = settings;

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: "INGR"
        }
        this.patch = this.patchFunc.bind(this);
    }

    clampValue(record: handle) {
        if (!this.baseStats.usePriceLimits) {
            return;
        }

        var newValue = clamp(this.baseStats.priceLimits.lower, parseInt(xelib.GetValue(record, 'DATA\\Value'), 10), this.baseStats.priceLimits.upper);
        xelib.SetFlag(record, 'ENIT\\Flags', 'No auto-calculation', true);
        xelib.SetUIntValue(record, 'DATA\\Value', newValue);
    }

    updateEffects(record: handle) {
        xelib.GetElements(record, 'Effects').forEach(this.updateEffect.bind(this));
    }

    updateEffect(effectsHandle: handle) {
        var mgef = getWinningLinksTo(effectsHandle, 'EFID');
        if (!mgef)
            return;
        var name = xelib.FullName(mgef);
        var edid = xelib.EditorID(mgef);

        if (this.rules.excludedEffects.includes(name))
            return;

        var newDuration = xelib.GetIntValue(effectsHandle, 'EFIT\\Duration');
        var newMagnitude = xelib.GetFloatValue(effectsHandle, 'EFIT\\Magnitude');

        this.rules.effects.some((effect) => {
            if (name.includes(effect.name) || edid.includes(effect.name) || (effect.edid && edid.includes(effect.edid))) {
                newDuration = this.baseStats.duration + effect.bonus;
                newMagnitude *= effect.magnitudeFactor;
                return true;
            }
        });

        if (safeHasFlag(mgef, 'Magic Effect Data\\DATA\\Flags', 'No Duration'))
            xelib.SetUIntValue(effectsHandle, 'EFIT\\Duration', newDuration);

        if (safeHasFlag(mgef, 'Magic Effect Data\\DATA\\Flags', 'No Magnitude')) {
            newMagnitude = Math.max(1.0, newMagnitude);
            xelib.SetFloatValue(effectsHandle, 'EFIT\\Magnitude', newMagnitude);
        }
    }

    filterFunc(record: handle) {
        if (!this.settings.alchemy.enabled)
            return false;

        return true;
    }

    patchFunc(record: handle) {
        this.updateEffects(record);
        this.clampValue(record);
    }
}
