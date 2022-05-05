import { addPerkScript, getValueFromName, getKwda, getModifierFromMap,
    overrideCraftingRecipes, safeHasArrayItem, createHasPerkCondition, createGetEquippedCondition,
    updateHasPerkCondition, removeTemperingConditions, createGetItemCountCondition } from "./core";
import { LocData } from "./localization";

export default class WeaponPatcher {

    names: { [key: string]: string; };
    editorIds: { [key: string]: number; };

    baseStats: WeaponBaseStats;
    modifiers: WeaponModifiers;
    cobj: Array<IRecipe>;

    helpers: xelibHelpers;
    locals: any;
    patchFile: handle;
    rules: any;
    settings: DefaultSettings;

    statics: IFormIDList;
    lang: string;

    keywordMaterialMap: Array<MaterialMap>;
    vanillaTypesMap: Array<MaterialMap>;
    keywordTypesMap: Array<MaterialMap>;
    skyreTypesMap: Array<MaterialMap>;

    patch: PatchFunction;
    load: FilterEntry;


    constructor(helpers: xelibHelpers, locals: any, pf: handle, settings: DefaultSettings) {
        this.names = {};
        this.editorIds = {};

        this.baseStats = settings.weapons.baseStats;
        this.cobj = locals.cobj;
        this.helpers = helpers;
        this.locals = locals;
        this.modifiers = settings.weapons.modifiers;
        this.patchFile = pf;
        this.rules = locals.rules.weapons;
        this.settings = settings;
        this.lang = settings.lang;
        // sanitize user modified values
        this.statics = locals.statics;

        this.keywordMaterialMap = null;
        this.keywordTypesMap = null;
        this.vanillaTypesMap = null;
        this.skyreTypesMap = null;
        this.createKeywordMaps();

        Object.keys(this.modifiers).map((k) => {
            if (this.modifiers[k] < 0) {
                this.modifiers[k] = 0;
            }

            return this.modifiers[k];
        });

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: 'WEAP'
        };
        this.patch = this.patchFunc.bind(this);
    }

    newEditorId(id: string): string {
        if (this.editorIds[id] === undefined) {
            this.editorIds[id] = 0;
        }

        this.editorIds[id] += 1;
        return "".concat(id).concat(String(this.editorIds[id]));
    }

    filterFunc(record: handle): boolean {
        if (!this.settings.weapons.enabled) {
            return false;
        }

        var name = xelib.FullName(record);

        if (name && this.rules.excludedWeapons.find((e: string) => {
            return name.includes(e);
        })) {
            return false;
        }

        if (safeHasArrayItem(record, 'KWDA', '', this.statics.kwWeapTypeStaff)) {
            return false;
        }

        if (xelib.HasElement(record, 'CNAM')) {
            return true;
        }

        if (xelib.GetFlag(record, 'DNAM\\Flags', 'Non-playable') && !xelib.GetFlag(record, 'DNAM\\Flags2', 'Bound Weapon')) {
            return false;
        }

        if (!name) {
            return false;
        }

        return true;

    }

    getWeaponMaterialOverrideString(name: string): string {
        var override = this.rules.materialOverrides.find((o: IJSONElement) => {
            if (o.edid && o.edid !== null)
                return name.includes(o.edid)
            else
                return name.includes(o.substring);
        });
        return override ? override.material : null;
    }

    getWeaponTypeOverride(name: string, edid: string): string {
        var override = this.rules.typeOverrides.find((t: IJSONElement) => {
            if (t.edid && t.edid !== null) {
                return edid.includes(t.edid);
            } else {
                return name === t.name;
            }
        });
        return override ? override.type : null;
    }

    removeMaterialKeywords(weapon: handle): void {
        this.keywordMaterialMap.find((e) => {
            if (!xelib.HasArrayItem(weapon, 'KWDA', '', e.kwda)) {
                return false;
            }

            if (e.name === 'Silver' && xelib.HasScript(weapon, 'SilverSwordScript')) {
                xelib.RemoveScript(weapon, 'SilverSwordScript');

                if (!xelib.HasElement(weapon, 'scriptName')) {
                    xelib.RemoveElement(weapon, 'VMAD');
                }
            }

            xelib.RemoveArrayItem(weapon, 'KWDA', '', e.kwda);
            return false;
        });
    }

    checkOverrides(weapon: handle): void {
        var type = this.getWeaponTypeOverride(this.names[weapon], xelib.EditorID(weapon));
        var s = this.statics;
        var input;
        var perk;

        if (type) {
            var name = LocData.weapon.weapTypes[type][this.lang];
            this.names[weapon] = "".concat(this.names[weapon], " [").concat(name, "]");
            xelib.AddElementValue(weapon, 'FULL', this.names[weapon]);
        }

        var override = this.getWeaponMaterialOverrideString(this.names[weapon]);
        if (!override)
            override = this.getWeaponMaterialOverrideString(xelib.EditorID(weapon))

        if (!override) {
            return;
        } else {
            override.replace('_', ' ');
        }

        this.removeMaterialKeywords(weapon);
        this.keywordMaterialMap.some((e) => {
            if (e.name) {
                if (override !== e.name && override !== e.name.toUpperCase()) {
                    return false;
                }
            }

            if (e.name === 'Silver' && !xelib.HasScript(weapon, 'SilverSwordScript') && !xelib.HasArrayItem(weapon, 'KWDA', '', s.kwWeapTypeBow)) {
                addPerkScript(weapon, 'SilverSwordScript', 'SilverPerk', e.perk);
            }

            xelib.AddElementValue(weapon, 'KWDA\\.', e.kwda);
            input = e.input;
            perk = e.perk;
            return false;
        });
        var bench = parseInt(this.statics.kwCraftingSmithingSharpeningWheel, 16);
        overrideCraftingRecipes(this.cobj, weapon, bench, perk, input, this.patchFile);
    }

    patchBowType(weapon: handle, enchanted?: boolean): void {
        var kwda = getKwda(weapon);

        if (!kwda(this.statics.kwWeapTypeBow) || kwda(this.statics.kwWeapTypeCrossbow)) {
            return;
        }

        if (kwda(this.statics.kwWeapTypeLongbow) || kwda(this.statics.kwWeapTypeShortbow)) {
            return;
        }

        const name = xelib.FullName(weapon).toLocaleUpperCase();
        const edid = xelib.EditorID(weapon).toLowerCase();
        const shortbowName = LocData.weapon.shortbow.name[this.lang];
        const longbowName = LocData.weapon.longbow.name[this.lang].toLocaleUpperCase();
        const crossbowName = LocData.weapon.crossbow.Classic.name[this.lang].toLocaleUpperCase();
        const searchName = LocData.weapon.shortbow.searchFor[this.lang];

        if (name.includes(shortbowName) || name.includes(longbowName) || name.includes(crossbowName)
            || edid.includes("longbow") || edid.includes("longbow") || edid.includes('crossbow')) {
            return;
        }

        if (enchanted && (name.includes(longbowName) || edid.includes("longbow"))) {
            return;
        }

        xelib.AddElementValue(weapon, 'KWDA\\.', this.statics.kwWeapTypeShortbow);

        if (name.includes(searchName.toLocaleUpperCase())) {
            this.names[weapon] = this.names[weapon].replace(new RegExp(searchName, 'i'), shortbowName);
            xelib.AddElementValue(weapon, 'FULL', this.names[weapon]);
        }
    }

    checkBroadswordName(weapon: handle, enchanted?: boolean): void {
        if (enchanted && !xelib.HasArrayItem(weapon, 'KWDA', '', this.statics.kwWeapTypeSword)) {
            return;
        }

        var broadswordName = LocData.weapon.weapTypes.Broadsword[this.lang];
        if (this.names[weapon].includes(broadswordName)) {
            return;
        }

        this.names[weapon] = this.names[weapon].replace(LocData.weapon.weapTypes.Sword[this.lang], broadswordName);
        xelib.AddElementValue(weapon, 'FULL', this.names[weapon]);
    }
    
    patchWeaponKeywords(weapon: handle): void {
        var typeString = getValueFromName(this.rules.typeOverrides, this.names[weapon], 'name', 'type');
        if (typeString === null)
            typeString = getValueFromName(this.rules.typeOverrides, xelib.EditorID(weapon), 'name', 'type');
        var s = this.statics;

        if (!typeString && xelib.HasArrayItem(weapon, 'KWDA', '', s.kwWeapTypeSword)) {
            this.checkBroadswordName(weapon);
        }

        this.skyreTypesMap.some((e) => {
            if (xelib.HasArrayItem(weapon, 'KWDA', '', e.kwda))
                return false;

            if (xelib.EditorID(weapon).toLowerCase().includes(e.name.toLowerCase()) || xelib.FullName(weapon).includes(e.name)) {
                xelib.AddArrayItem(weapon, 'KWDA', '', e.kwda);

                if (e.kwda === s.kwWeapTypeYari && !xelib.HasScript(weapon, 'xxxPassiveYari')) {
                    addPerkScript(weapon, 'xxxPassiveYari', 'xxxPassiveYariEffect', s.perkWeaponYari);
                } else if (e.kwda === s.kwWeapTypeShortspear && !xelib.HasScript(weapon, 'xxxPassiveShortspear')) {
                    addPerkScript(weapon, 'xxxPassiveShortspear', 'xxxPassiveShortspearEffect', s.perkWeaponShortspear);
                }

                return true;
            }
        });
        this.patchBowType(weapon);
    }

    getBaseDamage(weapon: handle): number {
        var s = this.statics;
        var kwda = getKwda(weapon);
        var base = null;

        if (kwda(s.kwWeapTypeSword) || kwda(s.kwWeapTypeWaraxe) || kwda(s.kwWeapTypeMace) || kwda(s.kwWeapTypeDagger)) {
            base = this.baseStats.damage.oneHanded;
        }

        if (kwda(s.kwWeapTypeGreatsword) || kwda(s.kwWeapTypeWarhammer) || kwda(s.kwWeapTypeBattleaxe)) {
            base = this.baseStats.damage.twoHanded;
        }

        if (kwda(s.kwWeapTypeCrossbow)) {
            base = this.baseStats.damage.crossbow;
        }

        if (kwda(s.kwWeapTypeBow)) {
            base = this.baseStats.damage.bow;
        }

        if (base === null) {
            this.log(weapon, "Couldn't set base weapon damage.");
        }

        return base;
    }

    getWeaponMaterialDamageModifier(weapon: handle): number {
        var modifier = null;
        var edid = xelib.EditorID(weapon);

        if (xelib.GetFlag(weapon, 'DNAM\\Flags2', 'Bound Weapon')) {
            modifier = 0;
        } else {
            modifier = getValueFromName<number>(this.rules.materials, this.names[weapon], 'name', 'damage');
        }

        if (modifier !== null) {
            return modifier;
        } else {
            modifier = getValueFromName<number>(this.rules.materials, edid, 'name', 'damage')
        }

        modifier = getModifierFromMap(this.keywordMaterialMap, this.rules.materials, weapon, 'name', 'damage');

        if (modifier === null) {
            this.log(weapon, "Couldn't find material damage modifier for weapon.");
        }

        return modifier;
    }

    getWeaponTypeDamageModifier(weapon: handle): number {
        var modifier = getModifierFromMap(this.keywordTypesMap, this.rules.types, weapon, 'name', 'damage', false);

        if (modifier === null) {
            this.log(weapon, "Couldn't find type damage modifier for weapon.");
        }

        return modifier;
    }

    getKeywordWeaponDamageModifier(weapon: handle): number {
        var kwda = getKwda(weapon);
        var modifier = getValueFromName<number>(this.rules.modifierOverrides, this.names[weapon], 'name', 'multiplier');
        if (modifier === null)
            modifier = getValueFromName<number>(this.rules.modifierOverrides, xelib.EditorID(weapon), 'name', 'multiplier')

        if (!modifier) {
            if (kwda(this.statics.weaponStrongerLow)) {
                modifier = this.modifiers.weaponStrongerLow;
            } else if (kwda(this.statics.weaponStrongerMedium)) {
                modifier = this.modifiers.weaponStrongerMedium;
            } else if (kwda(this.statics.weaponStrongerHigh)) {
                modifier = this.modifiers.weaponStrongerHigh;
            } else if (kwda(this.statics.weaponWeakerLow)) {
                modifier = this.modifiers.weaponWeakerLow;
            } else if (kwda(this.statics.weaponWeakerMedium)) {
                modifier = this.modifiers.weaponWeakerMedium;
            } else if (kwda(this.statics.weaponWeakerHigh)) {
                modifier = this.modifiers.weaponWeakerHigh;
            } else {
                modifier = 1;
            }
        }

        return modifier;
    }

    patchWeaponDamage(weapon: handle): void {
        var baseDamage = this.getBaseDamage(weapon);
        var materialDamage = this.getWeaponMaterialDamageModifier(weapon);
        var typeDamage = this.getWeaponTypeDamageModifier(weapon);
        var modifier = this.getKeywordWeaponDamageModifier(weapon);
        var damage = (baseDamage + materialDamage + typeDamage) * modifier;

        if (damage < 0) {
            damage = 0;
        }

        if (baseDamage === null || materialDamage === null || typeDamage === null) {
            this.log(weapon, "Base: ".concat(String(baseDamage), " Material: ").concat(String(materialDamage), " Type: ").concat(String(typeDamage)));
        }

        xelib.SetUIntValue(weapon, 'DATA\\Damage', damage);
        xelib.SetUIntValue(weapon, 'CRDT\\Damage', damage / 2);
    }

    addTemperingRecipe(weapon: handle): void {
        var input;
        var perk;
        this.keywordMaterialMap.some((e) => {
            if (!xelib.HasArrayItem(weapon, 'KWDA', '', e.kwda)) {
                return false;
            }

            input = e.input;
            perk = e.perk;
            return true;
        });

        if (!input) {
            this.log(weapon, "Couldn't determine material - no tempering recipe generated.");
            return;
        }

        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_TEMPER_".concat(xelib.EditorID(weapon)));
        xelib.AddElement(newRecipe, 'Items');
        var ingredient = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(ingredient, 'CNTO\\Item', input);
        xelib.SetUIntValue(ingredient, 'CNTO\\Count', 1);
        xelib.AddElementValue(newRecipe, 'NAM1', '1');
        xelib.AddElementValue(newRecipe, 'CNAM', xelib.GetHexFormID(weapon));
        xelib.AddElementValue(newRecipe, 'BNAM', this.statics.kwCraftingSmithingSharpeningWheel);

        if (perk) {
            xelib.AddElement(newRecipe, 'Conditions');
            var condition = xelib.GetElement(newRecipe, 'Conditions\\[0]');
            updateHasPerkCondition(newRecipe, condition, 10000000, 1, perk);
        }
    }

    getWeaponTypeFloatValueModifier(weapon: handle, field2: string): number {
        var modifier = getModifierFromMap(this.skyreTypesMap, this.rules.types, weapon, 'name', field2, false);

        if (modifier) {
            return modifier;
        }

        modifier = getValueFromName<number>(this.rules.types, this.names[weapon], 'name', field2, false);

        if (modifier === null)
            modifier = getValueFromName<number>(this.rules.types, xelib.EditorID(weapon), 'name', field2, false);

        if (modifier) {
            return modifier;
        }

        modifier = getModifierFromMap(this.vanillaTypesMap, this.rules.types, weapon, 'name', field2, false);

        if (modifier === null) {
            this.log(weapon, "Couldn't find type ".concat(field2, " modifier for weapon."));
        }

        return modifier === null ? 0 : modifier;
    }

    patchWeaponReach(weapon: handle): void {
        var reach = this.getWeaponTypeFloatValueModifier(weapon, 'reach');
        xelib.SetFloatValue(weapon, 'DNAM\\Reach', reach);
    }

    patchWeaponSpeed(weapon: handle): void {
        var speed = this.getWeaponTypeFloatValueModifier(weapon, 'speed');
        xelib.SetFloatValue(weapon, 'DNAM\\Speed', speed);
    }

    applyRecurveCrossbowChanges(weapon: handle): void {
        var baseDamage = this.getBaseDamage(weapon);
        var materialDamage = this.getWeaponMaterialDamageModifier(weapon);
        var typeDamage = this.getWeaponTypeDamageModifier(weapon);
        var recurveDamage = this.baseStats.damageBonuses.recurveCrossbow;
        var modifier = this.getKeywordWeaponDamageModifier(weapon);
        var desc = xelib.GetValue(weapon, 'DESC');
        var damage = (baseDamage + materialDamage + typeDamage + recurveDamage) * modifier;

        if (damage < 0) {
            damage = 0;
        }

        if (baseDamage === null || materialDamage === null || typeDamage === null) {
            this.log(weapon, "Base: ".concat(String(baseDamage), " Material: ").concat(String(materialDamage), " Type: ").concat(String(typeDamage)));
        }

        xelib.SetUIntValue(weapon, 'DATA\\Damage', damage);
        xelib.AddElementValue(weapon, 'DESC', "".concat(desc, LocData.weapon.crossbow.Recurve.desc[this.lang]));
    }

    applyArbalestCrossbowChanges(weapon: handle): void {
        var speed = xelib.GetIntValue(weapon, 'DNAM\\Speed');
        var weight = xelib.GetIntValue(weapon, 'DATA\\Weight');
        var desc = xelib.GetValue(weapon, 'DESC');
        xelib.SetFloatValue(weapon, 'DNAM\\Speed', speed + this.baseStats.speedBonuses.arbalestCrossbow);
        xelib.SetFloatValue(weapon, 'DATA\\Weight', weight * this.baseStats.weightMultipliers.arbalestCrossbow);
        xelib.AddElementValue(weapon, 'DESC', "".concat(desc, LocData.weapon.crossbow.Arbalest.desc[this.lang]));
    }

    applyLightweightCrossbowChanges(weapon: handle): void {
        var speed = xelib.GetIntValue(weapon, 'DNAM\\Speed');
        var weight = xelib.GetIntValue(weapon, 'DATA\\Weight');
        var desc = xelib.GetValue(weapon, 'DESC');
        xelib.SetFloatValue(weapon, 'DNAM\\Speed', speed + this.baseStats.speedBonuses.lightweightCrossbow);
        xelib.SetFloatValue(weapon, 'DATA\\Weight', weight * this.baseStats.weightMultipliers.lightweightCrossbow);
        xelib.AddElementValue(weapon, 'DESC', "".concat(desc, LocData.weapon.crossbow.Lightweight.desc[this.lang]));
    }

    applySilencedCrossbowChanges(weapon:handle): void {
        var desc = xelib.GetValue(weapon, 'DESC');
        xelib.AddElementValue(weapon, 'DESC', "".concat(desc, LocData.weapon.crossbow.Silenced.desc[this.lang]));
    }

    processCrossbow(weapon: handle): void {
        if (!xelib.HasArrayItem(weapon, 'KWDA', '', this.statics.kwWeapTypeCrossbow)) {
            return;
        }

        if (xelib.HasScript(weapon, 'DLC1EnhancedCrossBowAddPerkScript')) {
            xelib.RemoveScript(weapon, 'DLC1EnhancedCrossBowAddPerkScript');
            addPerkScript(weapon, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbow);
            xelib.AddElementValue(weapon, 'DESC', LocData.weapon.crossbow.Classic.desc[this.lang]);
            xelib.AddArrayItem(weapon, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        }

        if (this.rules.excludedCrossbows.find((e: string) => {
            if (this.names[weapon].includes(e))
                return true;
            else if (xelib.EditorID(weapon).toLowerCase().includes(e.toLowerCase()))
                return true;
            return false;
        })) {
            return;
        }

        var crossbowDesc = LocData.weapon.crossbow.Classic.desc[this.lang];

        var requiredPerks = [];
        var secondaryIngredients = [];
        var recurveName = LocData.weapon.crossbow.Recurve.name[this.lang];
        var newName = "".concat(recurveName, " ", this.names[weapon]);
        var newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newRecurveCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newRecurveCrossbow, newEditorId);
        xelib.AddElementValue(newRecurveCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newRecurveCrossbow, 'FULL', newName);
        xelib.AddElementValue(newRecurveCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newRecurveCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newRecurveCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newRecurveCrossbow] = newName;
        this.applyRecurveCrossbowChanges(newRecurveCrossbow);
        addPerkScript(newRecurveCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbow);
        this.addTemperingRecipe(newRecurveCrossbow);
        this.addMeltdownRecipe(newRecurveCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipRecurve);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newRecurveCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        var arbalestName = LocData.weapon.crossbow.Arbalest.name[this.lang];
        newName = "".concat(arbalestName, " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newArbalestCrossbow, newEditorId);
        xelib.AddElementValue(newArbalestCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newArbalestCrossbow, 'FULL', newName);
        xelib.AddElementValue(newArbalestCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newArbalestCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newArbalestCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newArbalestCrossbow] = newName;
        this.applyArbalestCrossbowChanges(newArbalestCrossbow);
        addPerkScript(newArbalestCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowArbalest);
        this.addTemperingRecipe(newArbalestCrossbow);
        this.addMeltdownRecipe(newArbalestCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipArbalest);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newArbalestCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        var lightweightName = LocData.weapon.crossbow.Lightweight.name[this.lang];
        newName = "".concat(lightweightName, " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newLightweightCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newLightweightCrossbow, newEditorId);
        xelib.AddElementValue(newLightweightCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newLightweightCrossbow, 'FULL', newName);
        xelib.AddElementValue(newLightweightCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newLightweightCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newLightweightCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newLightweightCrossbow] = newName;
        this.applyLightweightCrossbowChanges(newLightweightCrossbow);
        addPerkScript(newLightweightCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbow);
        this.addTemperingRecipe(newLightweightCrossbow);
        this.addMeltdownRecipe(newLightweightCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipLightweightConstruction);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newLightweightCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        var silencedName = LocData.weapon.crossbow.Silenced.name[this.lang];
        newName = "".concat(silencedName, " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newSilencedCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newSilencedCrossbow, newEditorId);
        xelib.AddElementValue(newSilencedCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newSilencedCrossbow, 'FULL', newName);
        xelib.AddElementValue(newSilencedCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newSilencedCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newSilencedCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newSilencedCrossbow] = newName;
        this.applySilencedCrossbowChanges(newSilencedCrossbow);
        addPerkScript(newSilencedCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowSilenced);
        this.addTemperingRecipe(newSilencedCrossbow);
        this.addMeltdownRecipe(newSilencedCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipSilencer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newSilencedCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        newName = "".concat(recurveName, " ", arbalestName.toLowerCase(), " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newRecurveArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newRecurveArbalestCrossbow, newEditorId);
        xelib.AddElementValue(newRecurveArbalestCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newRecurveArbalestCrossbow, 'FULL', newName);
        xelib.AddElementValue(newRecurveArbalestCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newRecurveArbalestCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newRecurveArbalestCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newRecurveArbalestCrossbow] = newName;
        this.applyRecurveCrossbowChanges(newRecurveArbalestCrossbow);
        this.applyArbalestCrossbowChanges(newRecurveArbalestCrossbow);
        addPerkScript(newRecurveArbalestCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowArbalest);
        this.addTemperingRecipe(newRecurveArbalestCrossbow);
        this.addMeltdownRecipe(newRecurveArbalestCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipRecurve);
        requiredPerks.push(this.statics.perkMarksmanshipArbalest);
        requiredPerks.push(this.statics.perkMarksmanshipEngineer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newRecurveArbalestCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        newName = "".concat(recurveName, " ", lightweightName.toLowerCase(), " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newRecurveLightweightCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newRecurveLightweightCrossbow, newEditorId);
        xelib.AddElementValue(newRecurveLightweightCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newRecurveLightweightCrossbow, 'FULL', newName);
        xelib.AddElementValue(newRecurveLightweightCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newRecurveLightweightCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newRecurveLightweightCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newRecurveLightweightCrossbow] = newName;
        this.applyRecurveCrossbowChanges(newRecurveLightweightCrossbow);
        this.applyLightweightCrossbowChanges(newRecurveLightweightCrossbow);
        addPerkScript(newRecurveLightweightCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowArbalest);
        this.addTemperingRecipe(newRecurveLightweightCrossbow);
        this.addMeltdownRecipe(newRecurveLightweightCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipRecurve);
        requiredPerks.push(this.statics.perkMarksmanshipLightweightConstruction);
        requiredPerks.push(this.statics.perkMarksmanshipEngineer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newRecurveLightweightCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        newName = "".concat(recurveName, " ", silencedName, " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newRecurveSilencedCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newRecurveSilencedCrossbow, newEditorId);
        xelib.AddElementValue(newRecurveSilencedCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newRecurveSilencedCrossbow, 'FULL', newName);
        xelib.AddElementValue(newRecurveSilencedCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newRecurveSilencedCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newRecurveSilencedCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newRecurveSilencedCrossbow] = newName;
        this.applyRecurveCrossbowChanges(newRecurveSilencedCrossbow);
        this.applySilencedCrossbowChanges(newRecurveSilencedCrossbow);
        addPerkScript(newRecurveSilencedCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowSilenced);
        this.addTemperingRecipe(newRecurveSilencedCrossbow);
        this.addMeltdownRecipe(newRecurveSilencedCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipRecurve);
        requiredPerks.push(this.statics.perkMarksmanshipSilencer);
        requiredPerks.push(this.statics.perkMarksmanshipEngineer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newRecurveSilencedCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        newName = "".concat(lightweightName, " ", arbalestName.toLowerCase(), " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newLightweightArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newLightweightArbalestCrossbow, newEditorId);
        xelib.AddElementValue(newLightweightArbalestCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newLightweightArbalestCrossbow, 'FULL', newName);
        xelib.AddElementValue(newLightweightArbalestCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newLightweightArbalestCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newLightweightArbalestCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newLightweightArbalestCrossbow] = newName;
        this.applyArbalestCrossbowChanges(newLightweightArbalestCrossbow);
        this.applyLightweightCrossbowChanges(newLightweightArbalestCrossbow);
        addPerkScript(newLightweightArbalestCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowArbalest);
        this.addTemperingRecipe(newLightweightArbalestCrossbow);
        this.addMeltdownRecipe(newLightweightArbalestCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipLightweightConstruction);
        requiredPerks.push(this.statics.perkMarksmanshipArbalest);
        requiredPerks.push(this.statics.perkMarksmanshipEngineer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newLightweightArbalestCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        newName = "".concat(silencedName, " ", arbalestName, " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newSilencedArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newSilencedArbalestCrossbow, newEditorId);
        xelib.AddElementValue(newSilencedArbalestCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newSilencedArbalestCrossbow, 'FULL', newName);
        xelib.AddElementValue(newSilencedArbalestCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newSilencedArbalestCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newSilencedArbalestCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newSilencedArbalestCrossbow] = newName;
        this.applyArbalestCrossbowChanges(newSilencedArbalestCrossbow);
        this.applySilencedCrossbowChanges(newSilencedArbalestCrossbow);
        addPerkScript(newSilencedArbalestCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowArbalestSilenced);
        this.addTemperingRecipe(newSilencedArbalestCrossbow);
        this.addMeltdownRecipe(newSilencedArbalestCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipSilencer);
        requiredPerks.push(this.statics.perkMarksmanshipArbalest);
        requiredPerks.push(this.statics.perkMarksmanshipEngineer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newSilencedArbalestCrossbow, requiredPerks, secondaryIngredients);

        requiredPerks = [];
        secondaryIngredients = [];
        newName = "".concat(lightweightName, " ", silencedName, " ", this.names[weapon]);
        newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
        var newLightweightSilencedCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
        this.helpers.cacheRecord(newLightweightSilencedCrossbow, newEditorId);
        xelib.AddElementValue(newLightweightSilencedCrossbow, 'EDID', newEditorId);
        xelib.AddElementValue(newLightweightSilencedCrossbow, 'FULL', newName);
        xelib.AddElementValue(newLightweightSilencedCrossbow, 'DESC', crossbowDesc);
        xelib.AddArrayItem(newLightweightSilencedCrossbow, 'KWDA', '', this.statics.kwDLC1CrossbowIsEnhanced);
        xelib.AddArrayItem(newLightweightSilencedCrossbow, 'KWDA', '', this.statics.kwMagicDisallowEnchanting);
        this.names[newLightweightSilencedCrossbow] = newName;
        this.applyLightweightCrossbowChanges(newLightweightSilencedCrossbow);
        this.applySilencedCrossbowChanges(newLightweightSilencedCrossbow);
        addPerkScript(newLightweightSilencedCrossbow, 'xxxAddPerkWhileEquipped', 'p', this.statics.perkWeaponCrossbowSilenced);
        this.addTemperingRecipe(newLightweightSilencedCrossbow);
        this.addMeltdownRecipe(newLightweightSilencedCrossbow);
        requiredPerks.push(this.statics.perkMarksmanshipBallistics);
        requiredPerks.push(this.statics.perkMarksmanshipLightweightConstruction);
        requiredPerks.push(this.statics.perkMarksmanshipSilencer);
        requiredPerks.push(this.statics.perkMarksmanshipEngineer);
        secondaryIngredients.push(this.statics.leatherStrips);
        secondaryIngredients.push(this.statics.firewood);
        secondaryIngredients.push(xelib.GetHexFormID(weapon));
        this.addCraftingRecipe(newLightweightSilencedCrossbow, requiredPerks, secondaryIngredients);
        requiredPerks = [];
        secondaryIngredients = [];
    }

    temperingPerkFromKeyword(weapon: handle): string {
        var s = this.statics;
        var kwda = getKwda(weapon);
        var perk;
        this.keywordMaterialMap.some((e) => {
            if (!xelib.HasArrayItem(weapon, 'KWDA', '', e.kwda)) {
                return false;
            }

            perk = e.perk;
            return true;
        });

        if (!perk && !kwda(s.kwWeapMaterialIron) && !kwda(s.kwWAF_TreatAsMaterialIron) && !kwda(s.kwWeapMaterialWood) && !kwda(s.kwWAF_WeapMaterialForsworn)) {
            this.log(weapon, "Couldn't determine material - tempering recipe not modified.");
        }

        return perk;
    }

    modifyTemperingRecipe(weapon: handle, weaponFormID: string, excluded: boolean, recipe: IRecipe): void {
        var bnam = recipe.bnam;
        var cnamv = recipe.cnamv;
        var bench = parseInt(this.statics.kwCraftingSmithingSharpeningWheel, 16);
        var isRefers = cnamv.includes(weaponFormID);

        if (bnam !== bench || !isRefers || excluded) {
            return;
        }

        var perk = this.temperingPerkFromKeyword(weapon);

        if (!perk) {
            return;
        }

        var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
        var condition = removeTemperingConditions(newRecipe, this.keywordMaterialMap, perk);
        var newCond: handle;

        if (!condition && !xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Parameter #1', perk)) {
            newCond = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCond, 10000000, 1, perk);
            xelib.MoveArrayItem(newCond, 0);
        }

        if (!xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Function', 'EPTemperingItemIsEnchanted')
            && !xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Parameter #1', this.statics.perkSmithingArcaneBlacksmith)) {
            newCond = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCond, '00010000', 1, '', 'EPTemperingItemIsEnchanted');
            newCond = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCond, 10000000, 1, this.statics.perkSmithingArcaneBlacksmith);
        }
    }

    modifyCrossbowCraftingRecipe(weapon: handle, weaponFormID: string, weaponIsCrossbow: boolean, excluded: boolean, recipe: IRecipe): void {
        var cnamv = recipe.cnamv;
        var isRefers = cnamv.includes(weaponFormID);

        if (!weaponIsCrossbow || excluded || !isRefers) {
            return;
        }

        var bench = parseInt(this.statics.kwCraftingSmithingSharpeningWheel, 16);
        var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);

        if (recipe.bnam !== bench) {
            xelib.AddElementValue(newRecipe, 'BNAM', this.statics.kwCraftingSmithingForge);
        }

        var perk = this.temperingPerkFromKeyword(weapon);

        if (!perk) {
            return;
        }

        xelib.RemoveElement(newRecipe, 'Conditions');
        var condition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
        updateHasPerkCondition(newRecipe, condition, 10000000, 1, perk);
        condition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
        updateHasPerkCondition(newRecipe, condition, 10000000, 1, this.statics.perkMarksmanshipBallistics);
    }

    modifyRecipes(weapon: handle): void {
        var name = this.names[weapon];
        var edid = xelib.EditorID(weapon);

        var weaponFormID = xelib.GetHexFormID(weapon);
        var weaponIsCrossbow = xelib.HasArrayItem(weapon, 'KWDA', '', this.statics.kwWeapTypeCrossbow);
        var excluded = this.rules.excludedFromRecipes.find((e: IJSONElement) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid)
            else
                return name.includes(e.name);
        });
        this.cobj.forEach((recipe) => {
            this.modifyCrossbowCraftingRecipe(weapon, weaponFormID, weaponIsCrossbow, excluded, recipe);

            this.modifyTemperingRecipe(weapon, weaponFormID, excluded, recipe);
        });
    }

    processSilverWeapon(weapon: handle): void {
        if (!xelib.HasArrayItem(weapon, 'KWDA', '', this.statics.kwWeapMaterialSilver) || xelib.HasArrayItem(weapon, 'KWDA', '', this.statics.kwWeapTypeBow)) {
            return;
        }

        var newName = "".concat(this.names[weapon], " - ", LocData.weapon.silverRefined.name[this.lang]);
        var newEditorId = this.newEditorId("REP_WEAPON_REFINED_".concat(xelib.EditorID(weapon)));
        var desc = LocData.weapon.silverRefined.desc[this.lang];
        var newRefinedSilverWeapon = xelib.CopyElement(weapon, this.patchFile, true);

        this.helpers.cacheRecord(newRefinedSilverWeapon, newEditorId);
        xelib.AddElementValue(newRefinedSilverWeapon, 'EDID', newEditorId);
        xelib.AddElementValue(newRefinedSilverWeapon, 'FULL', newName);
        this.names[newRefinedSilverWeapon] = newName;
        xelib.AddElementValue(newRefinedSilverWeapon, 'DESC', desc);
        xelib.AddElementValue(newRefinedSilverWeapon, 'KWDA\\.', this.statics.kwWeapMaterialSilverRefined);
        this.patchWeaponDamage(newRefinedSilverWeapon);
        this.patchWeaponReach(newRefinedSilverWeapon);
        this.patchWeaponSpeed(newRefinedSilverWeapon);

        var vmad;
        if (!xelib.HasElement(newRefinedSilverWeapon, 'VMAD')) {
            vmad = xelib.AddElement(weapon, 'VMAD');
            xelib.SetIntValue(vmad, 'Version', 5);
            xelib.SetIntValue(vmad, 'Object Format', 2);
        } else {
            vmad = xelib.GetElement(newRefinedSilverWeapon, 'VMAD');
        }

        if (xelib.HasScript(newRefinedSilverWeapon, 'SilverSwordScript')) {
            xelib.RemoveScript(newRefinedSilverWeapon, 'SilverSwordScript');
        }

        var script = xelib.AddElement(vmad, 'Scripts\\.');
        xelib.SetValue(script, 'scriptName', 'SilverSwordScript');
        var property = xelib.AddElement(script, 'Properties\\.');
        xelib.SetValue(property, 'propertyName', 'SilverPerk');
        xelib.SetValue(property, 'Type', 'Object');
        xelib.SetValue(property, 'Flags', 'Edited');
        xelib.SetValue(property, 'Value\\Object Union\\Object v2\\FormID', this.statics.perkWeaponSilverRefined);
        xelib.SetValue(property, 'Value\\Object Union\\Object v2\\Alias', 'None');
        this.addTemperingRecipe(newRefinedSilverWeapon);
        var ingredients = [this.statics.ingotGold, this.statics.ingotQuicksilver, xelib.GetHexFormID(weapon)];
        this.addCraftingRecipe(newRefinedSilverWeapon, [this.statics.perkSmithingSilverRefined], ingredients);
        this.addMeltdownRecipe(newRefinedSilverWeapon);
    }

    addMeltdownRecipe(weapon: handle): void {
        var s = this.statics;
        var kwda = getKwda(weapon);
        var outputQuantity = 1;
        var inputQuantity = 1;
        var input;
        var perk;

        var name = this.names[weapon];
        var edid = xelib.EditorID(weapon);
        var excluded = this.rules.excludedFromRecipes.find((e: IJSONElement) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid)
            else
                return name.includes(e.name);
        });

        // ignore enchanted
        if (xelib.HasElement(weapon, 'EITM'))
            return;

        if (xelib.HasArrayItem(weapon, 'KWDA', '', s.excludeFromMeltdownRecipes) || xelib.GetFlag(weapon, 'DNAM\\Flags2', 'Bound Weapon') || excluded) {
            return;
        }

        if (kwda(s.kwWeapTypeBattleaxe) || kwda(s.kwWeapTypeGreatsword) || kwda(s.kwWeapTypeWarhammer) || kwda(s.kwWeapTypeBow)) {
            outputQuantity += 1;
        } else if (kwda(s.kwWeapTypeDagger)) {
            inputQuantity += 1;
        }

        this.keywordMaterialMap.some((e) => {
            if (!xelib.HasArrayItem(weapon, 'KWDA', '', e.kwda)) {
                return false;
            }

            input = e.input;
            perk = e.perk;
            return true;
        });

        if (kwda(s.kwWeapMaterialDaedric)) {
            outputQuantity += 1;
        } else if (kwda(s.kwWeapMaterialDraugr) || kwda(s.kwWeapMaterialDraugrHoned)) {
            inputQuantity += 1;
        }

        if (!input) {
            var nName = this.names[weapon];
            var edEdit = xelib.EditorID(weapon).toUpperCase();
            var isInIgnore = this.rules.ignoreLog.find((elem: IJSONElement) => {
                if (elem.edid && elem.edid !== null)
                    return edEdit.includes(elem.edid.toUpperCase());
                else
                    return nName.includes(elem.name);
            });

            if (!isInIgnore) {
                this.log(weapon, "Couldn't determine material - no meltdown recipe generated.");
            }

            return;
        }

        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_MELTDOWN_".concat(xelib.EditorID(weapon)));
        xelib.AddElement(newRecipe, 'Items');
        var ingredient = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(ingredient, 'CNTO\\Item', xelib.GetHexFormID(weapon));
        xelib.SetUIntValue(ingredient, 'CNTO\\Count', inputQuantity);
        xelib.AddElementValue(newRecipe, 'NAM1', "".concat(String(outputQuantity)));
        xelib.AddElementValue(newRecipe, 'CNAM', input);
        xelib.AddElementValue(newRecipe, 'BNAM', this.statics.kwCraftingSmelter);
        xelib.AddElement(newRecipe, 'Conditions');
        var condition = xelib.GetElement(newRecipe, 'Conditions\\[0]');
        updateHasPerkCondition(newRecipe, condition, 10000000, 1, s.perkSmithingMeltdown);

        if (perk) {
            createHasPerkCondition(newRecipe, 10000000, 1, perk);
        }

        createGetItemCountCondition(newRecipe, 11000000, 1, weapon);
        createGetEquippedCondition(newRecipe, 10000000, 0, weapon);
    }

    addCraftingRecipe(weapon: handle, requiredPerks: Array<string>, secondaryIngredients: Array<string>): void {
        var input;
        var perk;
        this.keywordMaterialMap.some((e) => {
            if (!xelib.HasArrayItem(weapon, 'KWDA', '', e.kwda)) {
                return false;
            }

            input = e.input;
            perk = e.perk;
            return true;
        });

        if (!input) {
            return;
        }

        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_CRAFT_WEAPON_".concat(xelib.EditorID(weapon)));
        xelib.AddElement(newRecipe, 'Items');
        var baseItem = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(baseItem, 'CNTO\\Item', input);
        xelib.SetUIntValue(baseItem, 'CNTO\\Count', 2);
        secondaryIngredients.forEach((ingredient) => {
            var secondaryItem = xelib.AddElement(newRecipe, 'Items\\.');
            xelib.SetValue(secondaryItem, 'CNTO\\Item', ingredient);
            xelib.SetUIntValue(secondaryItem, 'CNTO\\Count', 1);
        });
        xelib.AddElementValue(newRecipe, 'BNAM', this.statics.kwCraftingSmithingForge);
        xelib.AddElementValue(newRecipe, 'NAM1', '1');
        xelib.AddElementValue(newRecipe, 'CNAM', xelib.GetHexFormID(weapon));
        xelib.AddElement(newRecipe, 'Conditions');
        requiredPerks.forEach((p, index) => {
            var condition: handle;

            if (index === 0) {
                condition = xelib.GetElement(newRecipe, 'Conditions\\[0]');
            } else {
                condition = xelib.AddElement(newRecipe, 'Conditions\\.');
            }

            updateHasPerkCondition(newRecipe, condition, 10000000, 1, p);
        });

        if (perk) {
            createHasPerkCondition(newRecipe, 10000000, 1, perk);
        }
    }

    patchBoundWeapon(weapon: handle): void {
        var kwda = getKwda(weapon);

        if (xelib.GetFlag(weapon, 'DNAM\\Flags2', 'Bound Weapon') && !kwda(this.statics.kwWeapTypeBoundWeapon)) {
            xelib.AddElementValue(weapon, 'KWDA\\.', this.statics.kwWeapTypeBoundWeapon);
        }
    }

    patchFunc(weapon: handle): void {
        this.names[weapon] = xelib.FullName(weapon) || '';

        if (xelib.HasElement(weapon, 'CNAM')) {
            this.checkBroadswordName(weapon, true);

            this.patchBowType(weapon, true);

            return;
        }

        this.checkOverrides(weapon);

        this.patchWeaponKeywords(weapon);

        this.patchWeaponDamage(weapon);

        this.patchWeaponReach(weapon);

        this.patchWeaponSpeed(weapon);

        this.processCrossbow(weapon);

        this.processSilverWeapon(weapon);

        this.addMeltdownRecipe(weapon);

        this.modifyRecipes(weapon);

        this.patchBoundWeapon(weapon);
    }

    createKeywordMaps(): void {
        var s = this.statics;

        this.skyreTypesMap = [{
            kwda: s.kwWeapTypeBastardSword,
            name: 'Bastard'
        }, {
            kwda: s.kwWeapTypeBattlestaff,
            name: 'Battlestaff'
        }, {
            kwda: s.kwWeapTypeBroadsword,
            name: 'Broadsword'
        }, {
            kwda: s.kwWeapTypeClub,
            name: 'Club'
        }, {
            kwda: s.kwWeapTypeCrossbow,
            name: 'Crossbow'
        }, {
            kwda: s.kwWeapTypeGlaive,
            name: 'Glaive'
        }, {
            kwda: s.kwWeapTypeHalberd,
            name: 'Halberd'
        }, {
            kwda: s.kwWeapTypeHatchet,
            name: 'Hatchet'
        }, {
            kwda: s.kwWeapTypeKatana,
            name: 'Katana'
        }, {
            kwda: s.kwWeapTypeLongbow,
            name: 'Longbow'
        }, {
            kwda: s.kwWeapTypeLongmace,
            name: 'Longmace'
        }, {
            kwda: s.kwWeapTypeLongsword,
            name: 'Longsword'
        }, {
            kwda: s.kwWeapTypeMaul,
            name: 'Maul'
        }, {
            kwda: s.kwWeapTypeNodachi,
            name: 'Nodachi'
        }, {
            kwda: s.kwWeapTypeSaber,
            name: 'Saber'
        }, {
            kwda: s.kwWeapTypeScimitar,
            name: 'Scimitar'
        }, {
            kwda: s.kwWeapTypeShortbow,
            name: 'Shortbow'
        }, {
            kwda: s.kwWeapTypeShortspear,
            name: 'Shortspear'
        }, {
            kwda: s.kwWeapTypeShortsword,
            name: 'Shortsword'
        }, {
            kwda: s.kwWeapTypeTanto,
            name: 'Tanto'
        }, {
            kwda: s.kwWeapTypeUnarmed,
            name: 'Unarmed'
        }, {
            kwda: s.kwWeapTypeWakizashi,
            name: 'Wakizashi'
        }, {
            kwda: s.kwWeapTypeYari,
            name: 'Yari'
        }]; // prettier-ignore

        this.vanillaTypesMap = [{
            kwda: s.kwWeapTypeBattleaxe,
            name: "Battleaxe"
        }, {
            kwda: s.kwWeapTypeBow,
            name: "Bow"
        }, {
            kwda: s.kwWeapTypeSword,
            name: "Broadsword"
        }, {
            kwda: s.kwWeapTypeDagger,
            name: "Dagger"
        }, {
            kwda: s.kwWeapTypeGreatsword,
            name: "Greatsword"
        }, {
            kwda: s.kwWeapTypeMace,
            name: "Mace"
        }, {
            kwda: s.kwWeapTypeWaraxe,
            name: "Waraxe"
        }, {
            kwda: s.kwWeapTypeWarhammer,
            name: "Warhammer"
        }];

        this.keywordTypesMap = this.skyreTypesMap.concat(this.vanillaTypesMap);

        this.keywordMaterialMap = [{
            name: 'Dawnguard',
            kwda: s.kwWAF_DLC1WeapMaterialDawnguard,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel
        }, {
            name: 'Daedric',
            kwda: s.kwWAF_TreatAsMaterialDaedric,
            input: s.ingotEbony,
            perk: s.perkSmithingDaedric
        }, {
            name: 'Dragonbone',
            kwda: s.kwWAF_TreatAsMaterialDragon,
            input: s.dragonbone,
            perk: s.perkSmithingDragon
        }, {
            name: 'Dwarven',
            kwda: s.kwWAF_TreatAsMaterialDwarven,
            input: s.ingotDwarven,
            perk: s.perkSmithingDwarven
        }, {
            name: 'Ebony',
            kwda: s.kwWAF_TreatAsMaterialEbony,
            input: s.ingotEbony,
            perk: s.perkSmithingEbony
        }, {
            name: 'Elven',
            kwda: s.kwWAF_TreatAsMaterialElven,
            input: s.ingotMoonstone,
            perk: s.perkSmithingElven
        }, {
            name: 'Glass',
            kwda: s.kwWAF_TreatAsMaterialGlass,
            input: s.ingotMalachite,
            perk: s.perkSmithingGlass
        }, {
            name: 'Iron',
            kwda: s.kwWAF_TreatAsMaterialIron,
            input: s.ingotIron,
            perk: null
        }, {
            name: 'Orcish',
            kwda: s.kwWAF_TreatAsMaterialOrcish,
            input: s.ingotOrichalcum,
            perk: s.perkSmithingOrcish
        }, {
            name: 'Steel',
            kwda: s.kwWAF_TreatAsMaterialSteel,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel
        }, {
            name: 'Blades',
            kwda: s.kwWAF_WeapMaterialBlades,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel
        }, {
            name: 'Forsworn',
            kwda: s.kwWAF_WeapMaterialForsworn,
            input: s.charcoal,
            perk: null
        }, {
            name: 'Daedric',
            kwda: s.kwWeapMaterialDaedric,
            input: s.ingotEbony,
            perk: s.perkSmithingDaedric
        }, {
            name: 'Dragonbone',
            kwda: s.kwWeapMaterialDragonbone,
            input: s.dragonbone,
            perk: s.perkSmithingDragon
        }, {
            name: 'Draugr',
            kwda: s.kwWeapMaterialDraugr,
            input: s.ingotSteel,
            perk: s.perkSmithingAdvanced
        }, {
            name: 'Draugr Honed',
            kwda: s.kwWeapMaterialDraugrHoned,
            input: s.ingotSteel,
            perk: s.perkSmithingAdvanced
        }, {
            name: 'Dwarven',
            kwda: s.kwWeapMaterialDwarven,
            input: s.ingotDwarven,
            perk: s.perkSmithingDwarven
        }, {
            name: 'Ebony',
            kwda: s.kwWeapMaterialEbony,
            input: s.ingotEbony,
            perk: s.perkSmithingEbony
        }, {
            name: 'Elven',
            kwda: s.kwWeapMaterialElven,
            input: s.ingotMoonstone,
            perk: s.perkSmithingElven
        }, {
            name: 'Falmer',
            kwda: s.kwWeapMaterialFalmer,
            input: s.chaurusChitin,
            perk: s.perkSmithingElven
        }, {
            name: 'Falmer Honed',
            kwda: s.kwWeapMaterialFalmerHoned,
            input: s.chaurusChitin,
            perk: s.perkSmithingElven
        }, {
            name: 'Glass',
            kwda: s.kwWeapMaterialGlass,
            input: s.ingotMalachite,
            perk: s.perkSmithingGlass
        }, {
            name: 'Imperial',
            kwda: s.kwWeapMaterialImperial,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel
        }, {
            name: 'Iron',
            kwda: s.kwWeapMaterialIron,
            input: s.ingotIron,
            perk: null
        }, {
            name: 'Orcish',
            kwda: s.kwWeapMaterialOrcish,
            input: s.ingotOrichalcum,
            perk: s.perkSmithingOrcish
        }, {
            name: 'Silver',
            kwda: s.kwWeapMaterialSilver,
            input: s.ingotSilver,
            perk: s.perkSmithingSilver
        }, {
            name: 'Silver Refined',
            kwda: s.kwWeapMaterialSilverRefined,
            input: s.ingotSilver,
            perk: s.perkSmithingSilver
        }, {
            name: 'Steel',
            kwda: s.kwWeapMaterialSteel,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel
        }, {
            name: 'Wood',
            kwda: s.kwWeapMaterialWood,
            input: s.charcoal,
            perk: null
        }, {
            name: 'Stalhrim',
            kwda: s.kwDLC2WeaponMaterialStalhrim,
            input: s.oreStalhrim,
            perk: s.perkSmithingAdvanced
        }, {
            name: 'Nordic',
            kwda: s.kwWeapMaterialNordic,
            input: s.ingotQuicksilver,
            perk: s.perkSmithingAdvanced
        }];
    }

    log(weapon: handle, message: string): void {
        var name = this.names[weapon];
        var formId = xelib.GetHexFormID(weapon);
        this.helpers.logMessage("--> ".concat(name, "(").concat(formId, "): ").concat(message));
    }
}
