import { Flags, Records } from "./core";

export default class NPCPatcher {

    helpers: xelibHelpers;
    settings: DefaultSettings;
    patchFile: handle;
    lang: string;

    patch: PatchFunction;
    load: FilterEntry;

    constructor(helpers: xelibHelpers, locals: any, patchFile: handle, settings: DefaultSettings) {
        this.helpers = helpers;
        this.settings = settings;
        this.patchFile = patchFile;

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: 'NPC_'
        };
        this.patch = this.patchFunc.bind(this);
    }

    isElementArraysEquals(masterRecord: handle, compareRecord: handle, short: string): boolean {
        var masterList: Array<handle> = [];
        if (xelib.HasElement(masterRecord, short))
            masterList = xelib.GetElements(masterRecord, short, false);

        var secondList: Array<handle> = [];
        if (xelib.HasElement(compareRecord, short))
            secondList = xelib.GetElements(compareRecord, short, false);

        if (masterList.length !== secondList.length)
            return false;

        var result = secondList.map((_, index) => {
            var val = xelib.GetValue(compareRecord, `${short}\\[${index}]`);
            return +xelib.HasArrayItem(masterRecord, short, '', val);
        });
        return secondList.length === result.reduce((v1, v2) => { return v1+v2; }, 0);
    }

    isRecordsEquals(master: handle, to: handle, list: Array<string>): boolean {
        var valMaster: string;
        var valTo: string;

        var result = list.map((el) => {
            if (xelib.HasElement(master, el))
                valMaster = xelib.GetValue(master, el);
            if (xelib.HasElement(to, el))
                valTo = xelib.GetValue(to, el);

            return +(valMaster === valTo);
        });
        return list.length === result.reduce((v1, v2) => { return v1+v2; }, 0);
    }

    copyElements(from: handle, to: handle, path: string, subkeys: Array<string> = []): void {
        var partsHandles = xelib.GetElements(from, path, false);

        xelib.RemoveElement(to, path);
        partsHandles.forEach((_, index) => {
            var tintPatch = `${path}\\[${index}]`;
            var newEntry = xelib.AddArrayItem(to, path, '', xelib.GetValue(from, tintPatch));
            if (subkeys.length > 0) {
                subkeys.forEach((key) => {
                    var tintElementPath = `${tintPatch}\\${key}`;
                    if (!xelib.HasElement(newEntry, key))
                        xelib.AddElement(newEntry, key);
                    xelib.SetValue(newEntry, key, xelib.GetValue(from, tintElementPath));
                });
            }
        });
    }

    copyRecord(from: handle, to: handle, path: string): void {
        if (!xelib.HasElement(from, path)) {
            xelib.RemoveElement(to, path);
            return
        }

        if (!xelib.HasElement(to, path))
            xelib.AddElement(to, path);
        xelib.SetValue(to, path, xelib.GetValue(from, path));
    }

    filterFunc(record: handle) {
        if (!this.settings.npc.enabled)
            return false;

        // filter to patch only one unique record
        if (!xelib.IsWinningOverride(record))
            return false;

        //ignore single mod records
        if (xelib.GetOverrides(record).length < 2)
            return false;

        // ignore creature mods and entries
        const npc = xelib.GetValue(record, Records.AttackRace).toUpperCase();
        if (npc.includes('DRAGON') || npc.includes('HORSE'))
            return false;

        return true;
    }

    patchFunc(npc: handle) {
        const masterRecord = xelib.GetMasterRecord(npc);
        var overrides = xelib.GetOverrides(npc).reverse();

        this.log(`processing record ${xelib.EditorID(npc)}`);
        overrides.some((patchRecord) => {
            var formID = xelib.ElementToJSON(xelib.GetElement(patchRecord, 'Record Header\\FormID'));
            if (!this.settings.npc.plugins.find((val) => {
                return formID.includes(val);
            }))
                return false;

            // Ignore plugin record is winning in overrides
            if (xelib.IsWinningOverride(patchRecord))
                return true;

            // Head parts
            if (xelib.HasElement(patchRecord, Records.HeadParts))
                this.copyElements(patchRecord, npc, Records.HeadParts);
            // some mods like Modpocalypse remove NPC flag for ACBS\Flags\Opposite Gender Anims
            xelib.SetFlag(npc, Records.ConfigurationFlags, Flags.OppositeGenderAnim, xelib.GetFlag(patchRecord, Records.ConfigurationFlags, Flags.OppositeGenderAnim));
            // Hair color, Weight, Height, Face texture
            [Records.HairColor, Records.Weight, Records.Height, Records.FaceTexture].forEach((p) => this.copyRecord(patchRecord, npc, p));
            // Face Parts
            [Records.FacePartEyes, Records.FacePartMouth, Records.FacePartNose, Records.FacePathOther].forEach((p) => this.copyRecord(patchRecord, npc, p));
            // Texture lightning
            Records.TextureLightList.forEach((p) => this.copyRecord(patchRecord, npc, p));
            // Face morphs
            Records.FaceMorphsList.forEach((p) => this.copyRecord(patchRecord, npc, p));
            // Tint layers
            if (!xelib.HasElement(patchRecord, Records.TintLayers))
                xelib.RemoveElement(npc, Records.TintLayers);
            else
                this.copyElements(patchRecord, npc, Records.TintLayers, Records.TintLayerKeys);
            return true;
        });
    }

    log(message: string) {
        this.helpers.logMessage("NPCPatcher ----> ".concat(message));
    }
}