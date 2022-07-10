import {
    addPerkScript, getValueFromName, getKwda, updateHasPerkCondition, createHasPerkCondition,
    createGetItemCountCondition, createGetEquippedCondition, overrideCraftingRecipes,
    removeTemperingConditions, SkyrimForms, Records
} from "./core";
import { LocData } from "./localization";

export default class ArmorPatcher implements ZEditPatcher {
    names: { [key: string]: string; };
    editorIds: { [key: string]: number; };

    baseStats: ArmorBaseStats;
    modifiers: ArmorModifiers;
    cobj: Array<IRecipe>;

    helpers: xelibHelpers;
    locals: any;
    patchFile: handle;
    rules: any;
    settings: DefaultSettings;

    lang: string;

    heavyMaterialsMap: Array<MaterialMap>;
    lightMaterialsMap: Array<MaterialMap>;
    armorMaterialsMap: Array<MaterialMap>;

    patch: PatchFunction;
    load: FilterEntry;

    constructor(helpers: xelibHelpers, locals: any, patch: handle, settings: DefaultSettings) {
        this.names = {};
        this.editorIds = {};

        this.baseStats = settings.armor.baseStats;
        this.cobj = locals.cobj;
        this.helpers = helpers;
        this.locals = locals;
        this.modifiers = settings.armor.modifiers;
        this.patchFile = patch;
        this.rules = locals.rules.armor;
        this.settings = settings;
        this.lang = settings.lang;

        if (this.settings.armor.enabled) {
            this.updateGameSettings();
        }

        this.createKeywordMaps();

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: 'ARMO'
        };
        this.patch = this.patchFunc.bind(this);

    }

    newEditorId(id: string) {
        if (this.editorIds[id] === undefined) {
            this.editorIds[id] = 0;
        }

        this.editorIds[id] += 1;
        return "".concat(id).concat(String(this.editorIds[id]));
    }

    updateGameSettings() {
        var hexFormId = parseInt(SkyrimForms.gmstArmorScalingFactor, 16);
        var protectionPerArmorBaseRecord = xelib.GetRecord(0, hexFormId);
        var protectionPerArmor = xelib.CopyElement(protectionPerArmorBaseRecord, this.patchFile);
        xelib.SetFloatValue(protectionPerArmor, 'DATA\\Float', this.settings.armor.baseStats.protectionPerArmor);
        hexFormId = parseInt(SkyrimForms.gmstMaxArmorRating, 16);

        var maxProtectionBaseRecord = xelib.GetRecord(0, hexFormId);
        var maxProtection = xelib.CopyElement(maxProtectionBaseRecord, this.patchFile);
        xelib.SetFloatValue(maxProtection, 'DATA\\Float', this.settings.armor.baseStats.maxProtection);
    }

    filterFunc(record: handle) {
        if (!this.settings.armor.enabled) {
            return false;
        }

        var name = xelib.FullName(record);
        var edid = xelib.EditorID(record);

        // ignore armor from excluded list
        if (name && this.rules.excludedArmor.find((e: IJSONElement) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid);
            else
                return name.includes(e.name);
        })) {
            return false;
        }

        if (xelib.HasArrayItem(record, 'KWDA', '', SkyrimForms.kwJewelry)) {
            return false;
        }

        if (xelib.HasElement(record, 'TNAM')) {
            return true;
        }

        if (!xelib.FullName(record) || !xelib.HasElement(record, 'KWDA')) {
            return false;
        }

        if (xelib.HasArrayItem(record, 'KWDA', '', SkyrimForms.kwVendorItemClothing)) {
            return true;
        }

        var keywords = [SkyrimForms.kwArmorHeavy, SkyrimForms.kwArmorLight, SkyrimForms.kwArmorSlotShield];

        if (!keywords.some((kwda) => {
            return xelib.HasArrayItem(record, 'KWDA', '', kwda);
        })) {
            return false;
        }

        return true;
    }

    getFactionArray(armor: handle): Array<string> {
        var faction: Array<string> = [];
        var name = this.names[armor];
        var edid = xelib.EditorID(armor);
        this.rules.masquerade.filter((e) => {
            if (e.edid && e.edid !== null) {
                if (!edid.includes(e.edid))
                    return false;
            }
            if (!edid.includes(e.substring) || !name.includes(e.substring))
                return false;

            return faction.push(e.faction);
        });
        return faction;
    }

    addMeltdownRecipe(armor: handle) {
        let override = this.getArmorMaterialOverride(armor);
        var name = this.names[armor];
        var edid = xelib.EditorID(armor);

        var kwda = getKwda(armor);
        var excluded = this.rules.excludedFromRecipes.find((e: any) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid);
            else
                return name.includes(e.name);
        });

        if (xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.excludeFromMeltdownRecipes) || excluded)
            return;

        // ignore enchanted
        if (xelib.HasElement(armor, 'EITM'))
            return;

        var outputQuantity = 1;
        var inputQuantity = 1;
        var input!: string;
        var perk!: string;
        var bnam!: string;

        if (kwda(SkyrimForms.kwArmorSlotCuirass) || kwda(SkyrimForms.kwArmorSlotShield)) {
            outputQuantity += 1;
        }

        if (kwda(SkyrimForms.kwWAF_ArmorMaterialDraugr)) {
            input = SkyrimForms.dragonscale;
            bnam = SkyrimForms.kwCraftingSmelter;
            perk = SkyrimForms.perkSmithingSteel;
            inputQuantity += 1;
        } else {
            this.armorMaterialsMap.some((e) => {
                if (!kwda(e.kwda)) {
                    return false;
                }

                bnam = e.bnam!;
                input = e.input!;
                perk = e.perk!;

                if (e.func) {
                    outputQuantity += 1;
                }

                return true;
            });
        }

        if (!input) {
            if (!override)
                this.log(armor, "Couldn't determine material - no meltdown recipe generated.");
            return;
        }

        var recipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(recipe, 'EDID', "REP_MELTDOWN_".concat(xelib.EditorID(armor)));
        xelib.AddElementValue(recipe, 'BNAM', bnam);
        xelib.AddElementValue(recipe, 'CNAM', input);
        xelib.AddElementValue(recipe, 'NAM1', "".concat(String(outputQuantity)));
        xelib.AddElement(recipe, 'Items');
        var baseItem = xelib.GetElement(recipe, 'Items\\[0]');
        xelib.SetValue(baseItem, 'CNTO\\Item', xelib.GetHexFormID(armor));
        xelib.SetUIntValue(baseItem, 'CNTO\\Count', inputQuantity);
        xelib.AddElement(recipe, 'Conditions');
        var condition = xelib.GetElement(recipe, 'Conditions\\[0]');
        updateHasPerkCondition(recipe, condition, 10000000, 1, SkyrimForms.perkSmithingMeltdown);

        if (perk) {
            createHasPerkCondition(recipe, 10000000, 1, perk);
        }

        createGetItemCountCondition(recipe, 11000000, 1.0, armor);
        createGetEquippedCondition(recipe, 10000000, 0, armor);
    }

    modifyLeatherCraftingRecipe(armor: handle, armorFormID: string, armorHasLeatherKwda: boolean,
                                armorHasThievesGuildKwda: boolean, excluded: boolean, recipe: IRecipe) {
        var cnamv = recipe.cnamv;

        if (!armorHasLeatherKwda && !armorHasThievesGuildKwda || excluded || !cnamv.includes(armorFormID)) {
            return;
        }

        var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
        createHasPerkCondition(newRecipe, 10000000, 1, SkyrimForms.perkSmithingLeather);
    }

    temperingPerkFromKeyword(armor: handle) {
        var perk!: string;
        var kwda!: string;
        this.armorMaterialsMap.some((e) => {
            if (!xelib.HasArrayItem(armor, 'KWDA', '', e.kwda)) {
                return false;
            }

            perk = e.perk!;
            kwda = e.kwda;
            return true;
        });

        if (!kwda && !perk && this.getArmorMaterialOverride(armor) === null) {
            this.log(armor, "Couldn't determine material - tempering recipe not modified.");
        }

        return perk;
    }

    modifyTemperingRecipe(armor: handle, armorFormID: string, excluded: boolean, recipe: IRecipe) {
        var bnam = recipe.bnam;
        var cnamv = recipe.cnamv;
        var bench = parseInt(SkyrimForms.kwCraftingSmithingArmorTable, 16);

        if (bnam !== bench || excluded || !cnamv.includes(armorFormID)) {
            return;
        }
        var perk = this.temperingPerkFromKeyword(armor);
        if (!perk) {
            return;
        }

        var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
        var condition = removeTemperingConditions(newRecipe, this.armorMaterialsMap, perk);
        var newCondition: handle;

        if (!condition && !xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Parameter #1', perk)) {
            newCondition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCondition, 10000000, 1, perk);
            xelib.MoveArrayItem(newCondition, 0);
        }

        if (!xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Function', 'EPTemperingItemIsEnchanted')
            && !xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Parameter #1', SkyrimForms.perkSmithingArcaneBlacksmith)) {
            newCondition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCondition, '00010000', 1, '', 'EPTemperingItemIsEnchanted');
            newCondition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCondition, 10000000, 1, SkyrimForms.perkSmithingArcaneBlacksmith);
        }
    }

    modifyRecipes(armor: handle) {
        var armorFormID = xelib.GetHexFormID(armor);
        var armorHasLeatherKwda = xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwArmorMaterialLeather);
        var armorHasThievesGuildKwda = xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwArmorMaterialThievesGuild);

        var name = this.names[armor];
        var edid = xelib.EditorID(armor);
        var excluded = this.rules.excludedFromRecipes.find((e) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid)
            else
                return name.includes(e.name);
        });
        if (!excluded)
            excluded = this.rules.excludedFromRecipes.find((e) => {
                return edid.includes(e.name);
            });

        this.cobj.forEach((recipe) => {
            this.modifyTemperingRecipe(armor, armorFormID, excluded, recipe);

            this.modifyLeatherCraftingRecipe(armor, armorFormID, armorHasLeatherKwda, armorHasThievesGuildKwda, excluded, recipe);
        });
    }

    patchShieldWeight(armor: handle) {
        if (!xelib.HasElement(armor, 'KWDA') || !xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwArmorSlotShield)) {
            return;
        }

        var name = this.names[armor];
        var type = xelib.GetIntValue(armor, 'BOD2\\Armor Type');

        var weightName = "";
        var searchName = LocData.armor.shield.name[this.lang];

        if (type === 1) {
            weightName = LocData.armor.shield.heavy[this.lang];

            if (!xelib.HasElement(armor, 'TNAM')) {
                xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwArmorShieldHeavy);
                xelib.AddElementValue(armor, 'BIDS', 'WPNBashShieldHeavyImpactSet [IPDS:000183FE]');
                xelib.AddElementValue(armor, 'BAMT', 'MaterialShieldHeavy [MATT:00016979]');
            }
        }

        if (type === 0) {
            weightName = LocData.armor.shield.light[this.lang];

            if (!xelib.HasElement(armor, 'TNAM')) {
                xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwArmorShieldLight);
                xelib.AddElementValue(armor, 'BIDS', 'WPNBashShieldLightImpactSet [IPDS:000183FB]');
                xelib.AddElementValue(armor, 'BAMT', 'MaterialShieldLight [MATT:00016978]');
            }
        }

        if (weightName.length > 0 && !name.toUpperCase().includes(weightName.toUpperCase())) {
            var data = name.split(searchName);
            data[0] = "".concat(data[0], weightName, " ", searchName);

            this.names[armor] = data.join('');
            xelib.AddElementValue(armor, 'FULL', this.names[armor]);
        }
    }

    patchMasqueradeKeywords(armor: handle) {
        var faction = this.getFactionArray(armor);

        if (!faction) {
            return;
        }

        if (faction.includes('THALMOR') && !xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwMasqueradeThalmor)) {
            xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwMasqueradeThalmor);
        }

        if (faction.includes('BANDIT') && !xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwMasqueradeBandit)) {
            xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwMasqueradeBandit);
        }

        if (faction.includes('IMPERIAL') && !xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwMasqueradeImperial)) {
            xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwMasqueradeImperial);
        }

        if (faction.includes('STORMCLOAK') && !xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwMasqueradeStormcloak)) {
            xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwMasqueradeStormcloak);
        }

        if (faction.includes('FORSWORN') && !xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwMasqueradeForsworn)) {
            xelib.AddElementValue(armor, 'KWDA\\.', SkyrimForms.kwMasqueradeForsworn);
        }
    }

    createDreamcloth(armor: handle) {
        var kwda = getKwda(armor);
        var dreamclothPerk;

        if (kwda(SkyrimForms.kwClothingBody)) {
            dreamclothPerk = SkyrimForms.perkDreamclothBody;
        } else if (kwda(SkyrimForms.kwClothingHands)) {
            dreamclothPerk = SkyrimForms.perkDreamclothHands;
        } else if (kwda(SkyrimForms.kwClothingHead)) {
            dreamclothPerk = SkyrimForms.perkDreamclothHead;
        } else if (kwda(SkyrimForms.kwClothingFeet)) {
            dreamclothPerk = SkyrimForms.perkDreamclothFeet;
        }

        if (!dreamclothPerk) {
            return null;
        }

        var dreamClothName = LocData.armor.dreamcloth[this.lang];
        var newName = "".concat(this.names[armor], " [", dreamClothName, "]");
        var newEditorId = this.newEditorId("REP_DREAMCLOTH_".concat(xelib.EditorID(armor)));
        var newDreamcloth = xelib.CopyElement(armor, this.patchFile, true);

        xelib.AddElementValue(newDreamcloth, 'EDID', newEditorId);
        xelib.AddElementValue(newDreamcloth, 'FULL', newName);
        this.names[newDreamcloth] = newName;
        xelib.RemoveElement(newDreamcloth, 'EITM');
        xelib.RemoveElement(newDreamcloth, 'DESC');
        xelib.AddElementValue(newDreamcloth, 'KWDA\\.', SkyrimForms.kwArmorDreamcloth);
        addPerkScript(newDreamcloth, 'xxxDreamCloth', 'pDream', dreamclothPerk);
        this.helpers.cacheRecord(newDreamcloth, newEditorId);
        return newDreamcloth;
    }

    getArmorSlotMultiplier(armor: handle) {
        var kwda = getKwda(armor);

        if (kwda(SkyrimForms.kwArmorSlotBoots)) {
            return this.settings.armor.baseStats.multipliers.boots;
        }

        if (kwda(SkyrimForms.kwArmorSlotCuirass)) {
            return this.settings.armor.baseStats.multipliers.cuirass;
        }

        if (kwda(SkyrimForms.kwArmorSlotGauntlets)) {
            return this.settings.armor.baseStats.multipliers.gauntlets;
        }

        if (kwda(SkyrimForms.kwArmorSlotHelmet)) {
            return this.settings.armor.baseStats.multipliers.helmet;
        }

        if (kwda(SkyrimForms.kwArmorSlotShield)) {
            return this.settings.armor.baseStats.multipliers.shield;
        }

        if (!xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.log(armor, "Couldn't find armor slot keyword.");
        }

        return 0;
    }

    getKeywordArmorModifier(armor: handle): number {
        var kwda = getKwda(armor);
        var modifier = getValueFromName<number>(this.rules.modifierOverrides, this.names[armor], 'name', 'multiplier');

        if (!modifier)
            modifier = getValueFromName<number>(this.rules.modifierOverrides, xelib.EditorID(armor), 'name', 'multiplier');

        if (!modifier) {
            if (kwda(SkyrimForms.armorStrongerLow)) {
                modifier = this.modifiers.armorStrongerLow;
            } else if (kwda(SkyrimForms.armorStrongerMedium)) {
                modifier = this.modifiers.armorStrongerMedium;
            } else if (kwda(SkyrimForms.armorStrongerHigh)) {
                modifier = this.modifiers.armorStrongerHigh;
            } else if (kwda(SkyrimForms.armorWeakerLow)) {
                modifier = this.modifiers.armorWeakerLow;
            } else if (kwda(SkyrimForms.armorWeakerMedium)) {
                modifier = this.modifiers.armorWeakerMedium;
            } else if (kwda(SkyrimForms.armorWeakerHigh)) {
                modifier = this.modifiers.armorWeakerHigh;
            } else {
                modifier = 1;
            }
        }

        return modifier;
    }

    getMaterialArmorModifier(armor: handle): number {
        var armorRating = getValueFromName<number>(this.rules.materials, this.names[armor], 'name', 'armor');

        if (armorRating >= 0)
            return armorRating;

        armorRating = getValueFromName<number>(this.rules.materials, xelib.EditorID(armor), 'name', 'armor');
        if (armorRating >= 0)
            return armorRating;

        this.armorMaterialsMap.some((e) => {
            if (!xelib.HasArrayItem(armor, 'KWDA', '', e.kwda)) {
                return false;
            }

            armorRating = getValueFromName<number>(this.rules.materials, e.name, 'name', 'armor');
            return true;
        });

        if (armorRating >= 0) {
            return armorRating;
        }

        if (!xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.log(armor, "Couldn't find material keyword nor relevant rule.");
        }

        return 0;
    }

    patchArmorRating(armor: handle) {
        var rating = Math.floor(this.getArmorSlotMultiplier(armor) * this.getMaterialArmorModifier(armor) * this.getKeywordArmorModifier(armor));

        const armorType = xelib.GetIntValue(armor, 'BOD2\\Armor Type');
        if (armorType === 1) {
            rating = rating * 1.5;
        }

        if (rating > 0) {
            xelib.SetValue(armor, 'DNAM', "".concat(String(rating)));
        } else if (rating === 0 && !xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.log(armor, "New armor rating calculation result is zero, armor rating not modified!");
        } else if (isNaN(rating)) {
            this.log(armor, "New armor rating calculation result is zero, armor rating not modified!");
        }
    }

    removeMaterialKeywords(armor: handle) {
        this.armorMaterialsMap.find((e) => {
            if (!xelib.HasArrayItem(armor, 'KWDA', '', e.kwda)) {
                return false;
            }

            xelib.RemoveArrayItem(armor, 'KWDA', '', e.kwda);
            return false;
        });
    }

    overrideMaterialKeywords(armor: handle) {
        var override = this.getArmorMaterialOverride(armor);
        var input!: string;
        var perk!: string;

        if (!override) {
            return;
        } else {
            override.replace('_', ' ');
        }

        this.removeMaterialKeywords(armor);
        this.armorMaterialsMap.some((e) => {
            if (e.name) {
                if (override !== e.name && override !== e.name.toUpperCase()) {
                    return false;
                }
            }

            xelib.AddElementValue(armor, 'KWDA\\.', e.kwda);
            input = e.input!;
            perk = e.perk!;
            return false;
        });
        var bench = parseInt(SkyrimForms.kwCraftingSmithingArmorTable, 16);
        overrideCraftingRecipes(this.cobj, armor, bench, perk, input, this.patchFile);
    }

    getArmorMaterialOverride(armor: handle): string {
        var full = this.names[armor];
        var edid = xelib.EditorID(armor);

        var override = this.rules.materialOverrides.find((o: IMaterialElement) => {
            if (o.edid)
                return edid.includes(o.edid);
            else
                return full.includes(o.substring!);
        });
        return override ? override.material : null;
    }

    addClothingCraftingRecipe(armor: handle, isDreamCloth?: boolean): void {
        var kwda = getKwda(armor);
        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_CRAFT_CLOTHING_".concat(xelib.EditorID(armor)));
        var quantityIngredient1 = 2;

        if (kwda(SkyrimForms.kwClothingBody)) {
            quantityIngredient1 += 2;
        } else if (kwda(SkyrimForms.kwClothingHead)) {
            quantityIngredient1 += 1;
        }

        xelib.AddElement(newRecipe, 'Items');
        var ingredient = xelib.AddElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(ingredient, 'CNTO\\Item', SkyrimForms.leather);
        xelib.SetUIntValue(ingredient, 'CNTO\\Count', quantityIngredient1);
        xelib.AddElementValue(newRecipe, 'NAM1', '1');
        xelib.AddElementValue(newRecipe, 'CNAM', xelib.GetHexFormID(armor));
        xelib.AddElementValue(newRecipe, 'BNAM', SkyrimForms.kwCraftingClothingStation);
        var secondaryIngredients: Array<string> = [];
        secondaryIngredients.push(SkyrimForms.leatherStrips);

        if (isDreamCloth) {
            secondaryIngredients.push(SkyrimForms.pettySoulGem);
            xelib.AddElement(newRecipe, 'Conditions');
            var condition = xelib.AddElement(newRecipe, 'Conditions\\[0]');
            updateHasPerkCondition(newRecipe, condition, 10000000, 1, SkyrimForms.perkSmithingWeavingMill);
        }

        secondaryIngredients.forEach((hexcode) => {
            var ingr = xelib.AddElement(newRecipe, 'Items\\.');
            xelib.SetValue(ingr, 'CNTO\\Item', hexcode);
            xelib.SetUIntValue(ingr, 'CNTO\\Count', 1);
        });
    }

    addClothingMeltdownRecipe(armor: handle, isDreamCloth?: boolean): void {
        var kwda = getKwda(armor);
        var returnQuantity = 1;
        var inputQuantity = 1;

        if (xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.excludeFromMeltdownRecipes)) {
            return;
        }

        // ignore enchanted
        if (xelib.HasElement(armor, 'EITM'))
            return;

        if (kwda(SkyrimForms.kwClothingBody)) {
            returnQuantity += 2;
        } else if (kwda(SkyrimForms.kwClothingHands) || kwda(SkyrimForms.kwClothingHead) || kwda(SkyrimForms.kwClothingFeet)) {
            returnQuantity += 1;
        }

        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_MELTDOWN_CLOTHING_".concat(xelib.EditorID(armor)));
        xelib.AddElement(newRecipe, 'Items');
        var ingredient = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(ingredient, 'CNTO\\Item', xelib.GetHexFormID(armor));
        xelib.SetUIntValue(ingredient, 'CNTO\\Count', inputQuantity);
        xelib.AddElementValue(newRecipe, 'NAM1', "".concat(String(returnQuantity)));
        xelib.AddElementValue(newRecipe, 'CNAM', SkyrimForms.leatherStrips);
        xelib.AddElementValue(newRecipe, 'BNAM', SkyrimForms.kwCraftingClothingStation);
        xelib.AddElement(newRecipe, 'Conditions');
        var condition = xelib.GetElement(newRecipe, 'Conditions\\[0]');
        updateHasPerkCondition(newRecipe, condition, 10000000, 1, SkyrimForms.perkSmithingMeltdown);

        if (isDreamCloth) {
            createHasPerkCondition(newRecipe, 10000000, 1, SkyrimForms.perkSmithingWeavingMill);
        }

        createGetItemCountCondition(newRecipe, 11000000, 1, armor);
        createGetEquippedCondition(newRecipe, 10000000, 0, armor);
    }

    processClothing(armor: handle): void {
        this.addClothingMeltdownRecipe(armor);
        var name = this.names[armor];
        var edid = xelib.EditorID(armor);

        if (this.rules.excludedDreamcloth.find((ed) => {
            if (ed.edid && ed.edid !== null)
                return edid.includes(ed.edid);
            else
                return name.includes(ed.name);
        })) {
            return;
        }

        if (xelib.HasElement(armor, 'EITM')) {
            return;
        }

        var dreamcloth = this.createDreamcloth(armor);

        if (!dreamcloth) {
            return;
        }

        this.addClothingCraftingRecipe(dreamcloth, true);
        this.addClothingMeltdownRecipe(dreamcloth, true);
    }

    patchFunc(armor: handle): void {
        this.names[armor] = xelib.FullName(armor);
        let equipType = xelib.FullName(xelib.GetElement(armor, Records.EquipType)).toUpperCase();

        if (equipType.includes("SHIELD")) {
            this.patchShieldWeight(armor);
            return;
        }

        if (xelib.HasElement(armor, Records.Keywords) && xelib.HasArrayItem(armor, Records.Keywords, '', SkyrimForms.kwVendorItemClothing)
                     && !xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.patchMasqueradeKeywords(armor);
            this.processClothing(armor);

            return;
        }

        this.overrideMaterialKeywords(armor);

        if (!xelib.HasElement(armor, 'TNAM') && !xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.patchMasqueradeKeywords(armor);
        }

        if (!xelib.HasArrayItem(armor, 'KWDA', '', SkyrimForms.kwVendorItemClothing)) {
            this.patchArmorRating(armor);
        }

        this.patchShieldWeight(armor);

        if (!xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.modifyRecipes(armor);

            this.addMeltdownRecipe(armor);
        }
    }

    createKeywordMaps(): void {
        this.heavyMaterialsMap = [{
            name: 'Blades',
            kwda: SkyrimForms.kwArmorMaterialBlades,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Daedric',
            kwda: SkyrimForms.kwArmorMaterialDaedric,
            input: SkyrimForms.ingotEbony,
            perk: SkyrimForms.perkSmithingDaedric,
            bnam: SkyrimForms.kwCraftingSmelter,
            func: 'incr'
          }, {
            name: 'Dragonplate',
            kwda: SkyrimForms.kwArmorMaterialDragonplate,
            input: SkyrimForms.dragonbone,
            perk: SkyrimForms.perkSmithingDragon,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Dwarven',
            kwda: SkyrimForms.kwArmorMaterialDwarven,
            input: SkyrimForms.ingotDwarven,
            perk: SkyrimForms.perkSmithingDwarven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Ebony',
            kwda: SkyrimForms.kwArmorMaterialEbony,
            input: SkyrimForms.ingotEbony,
            perk: SkyrimForms.perkSmithingEbony,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Falmer Hardened',
            kwda: SkyrimForms.kwArmorMaterialFalmerHardened,
            input: SkyrimForms.chaurusChitin,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Falmer Heavy',
            kwda: SkyrimForms.kwArmorMaterialFalmerHeavy,
            input: SkyrimForms.chaurusChitin,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Falmer',
            kwda: SkyrimForms.kwArmorMaterialFalmerHeavyOriginal,
            input: SkyrimForms.chaurusChitin,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Imperial Heavy',
            kwda: SkyrimForms.kwArmorMaterialImperialHeavy,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Iron',
            kwda: SkyrimForms.kwArmorMaterialIron,
            input: SkyrimForms.ingotIron,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Iron Banded',
            kwda: SkyrimForms.kwArmorMaterialIronBanded,
            input: SkyrimForms.ingotIron,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Nordic',
            kwda: SkyrimForms.kwArmorMaterialNordicHeavy,
            input: SkyrimForms.ingotQuicksilver,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Orcish',
            kwda: SkyrimForms.kwArmorMaterialOrcish,
            input: SkyrimForms.ingotOrichalcum,
            perk: SkyrimForms.perkSmithingOrcish,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Stalhrim Heavy',
            kwda: SkyrimForms.kwArmorMaterialStalhrimHeavy,
            input: SkyrimForms.oreStalhrim,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Steel',
            kwda: SkyrimForms.kwArmorMaterialSteel,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Steel Plate',
            kwda: SkyrimForms.kwArmorMaterialSteelPlate,
            input: SkyrimForms.ingotCorundum,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Dawnguard',
            kwda: SkyrimForms.kwDLC1ArmorMaterialDawnguard,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Dawnguard Hunter',
            kwda: SkyrimForms.kwDLC1ArmorMaterialHunter,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Bonemold Heavy',
            kwda: SkyrimForms.kwDLC2ArmorMaterialBonemoldHeavy,
            input: SkyrimForms.netchLeather,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Chitin Heavy',
            kwda: SkyrimForms.kwDLC2ArmorMaterialChitinHeavy,
            input: SkyrimForms.chitinPlate,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Ancient Nord',
            kwda: SkyrimForms.kwWAF_ArmorMaterialDraugr,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Wolf',
            kwda: SkyrimForms.kwWAF_ArmorWolf,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }];
    
          this.lightMaterialsMap = [{
            name: 'Shrouded',
            kwda: SkyrimForms.kwArmorMaterialDarkBrotherhood,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Dragonscale',
            kwda: SkyrimForms.kwArmorMaterialDragonscale,
            input: SkyrimForms.dragonscale,
            perk: SkyrimForms.perkSmithingDragon,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Elven',
            kwda: SkyrimForms.kwArmorMaterialElven,
            input: SkyrimForms.ingotMoonstone,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Elven Gilded',
            kwda: SkyrimForms.kwArmorMaterialElvenGilded,
            input: SkyrimForms.ingotMoonstone,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Forsworn',
            kwda: SkyrimForms.kwArmorMaterialForsworn,
            input: SkyrimForms.leatherStrips,
            bnam: SkyrimForms.kwCraftingTanningRack
          }, {
            name: 'Glass',
            kwda: SkyrimForms.kwArmorMaterialGlass,
            input: SkyrimForms.ingotMalachite,
            perk: SkyrimForms.perkSmithingGlass,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Hide',
            kwda: SkyrimForms.kwArmorMaterialHide,
            input: SkyrimForms.leatherStrips,
            bnam: SkyrimForms.kwCraftingTanningRack
          }, {
            name: 'Imperial Light',
            kwda: SkyrimForms.kwArmorMaterialImperialLight,
            input: SkyrimForms.ingotSteel,
            perk: SkyrimForms.perkSmithingSteel,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Imperial Studded',
            kwda: SkyrimForms.kwArmorMaterialImperialStudded,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Leather',
            kwda: SkyrimForms.kwArmorMaterialLeather,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Nightingale',
            kwda: SkyrimForms.kwArmorMaterialNightingale,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Scaled',
            kwda: SkyrimForms.kwArmorMaterialScaled,
            input: SkyrimForms.ingotCorundum,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter,
          }, {
            name: 'Stalhrim Light',
            kwda: SkyrimForms.kwArmorMaterialStalhrimLight,
            input: SkyrimForms.oreStalhrim,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Stormcloak',
            kwda: SkyrimForms.kwArmorMaterialStormcloak,
            input: SkyrimForms.ingotIron,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Studded',
            kwda: SkyrimForms.kwArmorMaterialStudded,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Thieves Guild',
            kwda: SkyrimForms.kwArmorMaterialThievesGuild,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Vampire',
            kwda: SkyrimForms.kwArmorMaterialVampire,
            input: SkyrimForms.leatherStrips,
            perk: SkyrimForms.perkSmithingLeather,
            bnam: SkyrimForms.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Bonemold',
            kwda: SkyrimForms.kwDLC2ArmorMaterialBonemoldLight,
            input: SkyrimForms.netchLeather,
            perk: SkyrimForms.perkSmithingAdvanced,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Chitin',
            kwda: SkyrimForms.kwDLC2ArmorMaterialChitinLight,
            input: SkyrimForms.chitinPlate,
            perk: SkyrimForms.perkSmithingElven,
            bnam: SkyrimForms.kwCraftingSmelter
          }, {
            name: 'Guard',
            kwda: SkyrimForms.kwWAF_ArmorMaterialGuard,
            input: SkyrimForms.ingotIron,
            bnam: SkyrimForms.kwCraftingSmelter
          }];
        this.armorMaterialsMap = this.lightMaterialsMap.concat(this.heavyMaterialsMap);
    }

    log(armor: handle, message: string) {
        var name = xelib.FullName(armor);
        var formId = xelib.GetHexFormID(armor);
        this.helpers.logMessage(`--> ${name} (${formId}): ${message}`);
    }
}
