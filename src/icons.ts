import { SkyrimForms, safeHasArrayItem } from "./core";
import { LocData } from "./localization";

function fontIconFor(name: string, color = ""): string {
    var result = "".concat("<font face='Iconographia'>", name, "</font>")
    if (color.length > 0)
        result = "".concat("<font color='", color, "'>", result, "</font>");
    return result;
}

function hasWord(list: Array<string>, name: string): boolean {
    return list.some((e) => name.includes(e));
}

export class InteractionIconsFloraPatcher {

    helpers: xelibHelpers;
    settings: DefaultSettings;
    lang: string;

    patch: PatchFunction;
    load: FilterEntry;

    constructor(helpers: xelibHelpers, locals: any, filePatch: handle, settings: DefaultSettings) {
        this.helpers = helpers;
        this.settings = settings;
        this.lang = settings.lang;

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: 'FLOR'
        };
        this.patch = this.patchFunc.bind(this);
    }

    filterFunc(record: handle) {
        if (!this.settings.icons.enabled)
            return false
        return true;
    }

    patchFunc(flora: handle) {
        const edid = xelib.EditorID(flora).toUpperCase();
        const full = xelib.FullName(flora).toLocaleUpperCase(this.lang);
        // Activate Text Override
        const rnam = xelib.GetValue(flora, 'RNAM');
        const soundv = xelib.GetValue(flora, 'SNAM');

        // Mushrooms
        if (soundv.includes(SkyrimForms.itmMushroomUp) || edid.includes("SHROOM") || (full && hasWord(LocData.flora.mushrooms[this.lang], full)))
            xelib.AddElementValue(flora, 'RNAM', fontIconFor('A'));
        // Clams
        else if (soundv.includes(SkyrimForms.itmClampUp) || edid.includes("CLAM") || (full && hasWord(LocData.flora.clams[this.lang], full)))
            xelib.AddElementValue(flora, 'RNAM', fontIconFor('b'));
        // Fill action
        else if (soundv.includes(SkyrimForms.itmPotionUpSD) || (rnam && hasWord(LocData.flora.fill[this.lang], rnam)))
            xelib.AddElementValue(flora, 'RNAM', fontIconFor('L'));
        // Cask or Barrel
        else if (hasWord(["BARREL", "CASK"], edid) || (full && hasWord(LocData.flora.barrel[this.lang], full)))
            xelib.AddElementValue(flora, 'RNAM', fontIconFor('L'));
        // Coin Pouch
        else if (soundv.includes(SkyrimForms.itmCoinPouchUp) || soundv.includes(SkyrimForms.itmCoinPouchDown)
                || edid.includes("COIN") || (full && hasWord(LocData.flora.coins[this.lang], full)))
            xelib.AddElementValue(flora, 'RNAM', fontIconFor('S'));
        // Other
        else
            xelib.AddElementValue(flora, 'RNAM', fontIconFor('Q'));
    }

    log(message: string) {
        this.helpers.logMessage("---->".concat(message));
    }
}

export class InteractionIconsActivatorPatcher {

    helpers: xelibHelpers;
    locals: any;
    settings: DefaultSettings;
    lang: string;

    patch: PatchFunction;
    load: FilterEntry;

    constructor(helpers: xelibHelpers, locals: any, filePatch: handle, settings: DefaultSettings) {
        this.helpers = helpers;
        this.locals = locals;
        this.settings = settings;
        this.lang = settings.lang;

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: 'ACTI'
        };
        this.patch = this.patchFunc.bind(this);
    }

    filterFunc(record: handle) {
        if (!this.settings.icons.enabled)
            return false;

        const edid = xelib.EditorID(record).toUpperCase();
        if (edid.includes("TRIGGER") || edid.includes("FX"))
            return false;
        return true;
    }

    patchFunc(activator: handle) {
        const full = xelib.FullName(activator).toLocaleUpperCase(this.lang);
        const edid = xelib.EditorID(activator).toUpperCase();
        // RNAM - Activate Text Override
        const masterRecord = xelib.GetMasterRecord(activator);
        const rnam = xelib.GetValue(masterRecord, 'RNAM').toLocaleUpperCase(this.lang);

        // Civil War
        if (edid.includes("CWMAP"))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('F'));

        // Search
        if (rnam && hasWord(LocData.activators.search[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('V'));

        // Grab & Touch
        if (rnam && hasWord(LocData.activators.grab[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('S'));

        // Levers
        if (safeHasArrayItem(activator, 'KWDA', '', SkyrimForms.kwActivatorLever) || edid.includes("PULLBAR")
                || (full && hasWord(LocData.activators.lever[this.lang], full)))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('D'));

        // Chains
        if (full && hasWord(LocData.activators.chain[this.lang], full))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('E'));

        // Mine
        if (rnam && hasWord(LocData.activators.mine[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('G'));

        // Button, Examine , Push, Investigate
        if (rnam && hasWord(LocData.activators.examine[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('F'));

        if (full && hasWord(LocData.activators.button[this.lang], full))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('F'));

        // Write
        if (rnam && hasWord(LocData.activators.write[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('H'));

        // Pray
        if (full && hasWord(LocData.activators.shrine[this.lang], full) || edid.includes("DLC2STANDINGSTONE"))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('C'));

        if (rnam && hasWord(LocData.activators.shrine[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('C'));

        // Drink
        if (rnam && hasWord(LocData.activators.drink[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('C'));
        
        // Eat
        if (rnam && hasWord(LocData.activators.eat[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('K'));

        // Drop or Place
        if (rnam && hasWord(LocData.activators.drop[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('K'));

        // Pick Up
        if (rnam && hasWord(LocData.activators.pickup[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('O'));

        // Read
        if (rnam && hasWord(LocData.activators.read[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('P'));
        
        // Harvest
        if (rnam && hasWord(LocData.activators.harvest[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('Q'));

        // Take
        if (rnam && hasWord(LocData.activators.take[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('S'));

        // Talk
        if (rnam && hasWord(LocData.activators.talk[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('T'));

        // Sit
        if (rnam && hasWord(LocData.activators.sit[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('U'));

        // Open
        if ((rnam && hasWord(LocData.activators.open[this.lang], rnam)) && (full && hasWord(LocData.activators.open[this.lang], full)))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('V'));

        if (rnam && hasWord(LocData.activators.open[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('X'));

        // Activate
        if (rnam && hasWord(LocData.activators.activate[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('Y'));

        // Unlock
        if (rnam && hasWord(LocData.activators.unlock[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('Z'));

        // Sleep
        if ((rnam && hasWord(LocData.activators.sleep[this.lang], rnam)) || (full && hasWord(LocData.activators.sleep[this.lang], full)))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('a'));

        // Steal from
        if (rnam && hasWord(LocData.activators.stealFrom[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('V', 'ff0000'));

        // Steal
        if (rnam && hasWord(LocData.activators.steal[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('S', 'ff0000'));

        // Pickpocket
        if (rnam && hasWord(LocData.activators.pickpocket[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('b', 'ff0000'));

        // Close
        if (rnam && hasWord(LocData.activators.close[this.lang], rnam))
            return xelib.AddElementValue(activator, 'RNAM', fontIconFor('X', 'dddddd'));

        return xelib.AddElementValue(activator, 'RNAM', fontIconFor('W'));
    }

    log(message: string) {
        this.helpers.logMessage("---->".concat(message));
    }
}