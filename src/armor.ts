import {
    addPerkScript, getValueFromName, getKwda, updateHasPerkCondition, createHasPerkCondition,
    createGetItemCountCondition, createGetEquippedCondition, overrideCraftingRecipes,
    removeTemperingConditions
} from "./core";
import { LocData } from "./localization";

export default class ArmorPatcher {
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

    s: IFormIDList;
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
        this.s = locals.statics;
        this.lang = settings.lang;

        this.heavyMaterialsMap = null;
        this.lightMaterialsMap = null;
        this.armorMaterialsMap = null;

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
        var hexFormId = parseInt(this.s.gmstArmorScalingFactor, 16);
        var protectionPerArmorBaseRecord = xelib.GetRecord(0, hexFormId);
        var protectionPerArmor = xelib.CopyElement(protectionPerArmorBaseRecord, this.patchFile);
        xelib.SetFloatValue(protectionPerArmor, 'DATA\\Float', this.settings.armor.baseStats.protectionPerArmor);
        hexFormId = parseInt(this.s.gmstMaxArmorRating, 16);

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

        if (name && this.rules.excludedArmor.find((e) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid);
            else
                return name.includes(e.name);
        })) {
            return false;
        }

        if (xelib.HasElement(record, 'TNAM')) {
            return true;
        }

        if (!xelib.FullName(record) || !xelib.HasElement(record, 'KWDA')) {
            return false;
        }

        if (xelib.HasArrayItem(record, 'KWDA', '', this.s.kwVendorItemClothing)) {
            return true;
        }

        if (xelib.HasArrayItem(record, 'KWDA', '', this.s.kwJewelry)) {
            return false;
        }

        var keywords = [this.s.kwArmorHeavy, this.s.kwArmorLight, this.s.kwArmorSlotShield];

        if (!keywords.some((kwda) => {
            return xelib.HasArrayItem(record, 'KWDA', '', kwda);
        })) {
            return false;
        }

        return true;
    }

    getFactionArray(armor: handle) {
        var faction = [];
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
        var name = this.names[armor];
        var edid = xelib.EditorID(armor);

        var s = this.s;
        var kwda = getKwda(armor);
        var excluded = this.rules.excludedFromRecipes.find((e: any) => {
            if (e.edid && e.edid !== null)
                return edid.includes(e.edid);
            else
                return name.includes(e.name);
        });

        if (xelib.HasArrayItem(armor, 'KWDA', '', s.excludeFromMeltdownRecipes) || excluded)
            return;

        // ignore enchanted
        if (xelib.HasElement(armor, 'EITM'))
            return;

        var outputQuantity = 1;
        var inputQuantity = 1;
        var input: string;
        var perk: string;
        var bnam: string;

        if (kwda(s.kwArmorSlotCuirass) || kwda(s.kwArmorSlotShield)) {
            outputQuantity += 1;
        }

        if (kwda(s.kwWAF_ArmorMaterialDraugr)) {
            input = s.dragonscale;
            bnam = s.kwCraftingSmelter;
            perk = s.perkSmithingSteel;
            inputQuantity += 1;
        } else {
            this.armorMaterialsMap.some((e) => {
                if (!kwda(e.kwda)) {
                    return false;
                }

                bnam = e.bnam;
                input = e.input;
                perk = e.perk;

                if (e.func) {
                    outputQuantity += 1;
                }

                return true;
            });
        }

        if (!input) {
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
        updateHasPerkCondition(recipe, condition, 10000000, 1, this.s.perkSmithingMeltdown);

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
        createHasPerkCondition(newRecipe, 10000000, 1, this.s.perkSmithingLeather);
    }

    temperingPerkFromKeyword(armor: handle) {
        var perk;
        var kwda;
        this.armorMaterialsMap.some((e) => {
            if (!xelib.HasArrayItem(armor, 'KWDA', '', e.kwda)) {
                return false;
            }

            perk = e.perk;
            kwda = e.kwda;
            return true;
        });

        if (!kwda && !perk) {
            this.log(armor, "Couldn't determine material - tempering recipe not modified.");
        }

        return perk;
    }

    modifyTemperingRecipe(armor: handle, armorFormID: string, excluded: boolean, recipe: IRecipe) {
        var bnam = recipe.bnam;
        var cnamv = recipe.cnamv;
        var bench = parseInt(this.s.kwCraftingSmithingArmorTable, 16);

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
            && !xelib.HasArrayItem(newRecipe, 'Conditions', 'CTDA\\Parameter #1', this.s.perkSmithingArcaneBlacksmith)) {
            newCondition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCondition, '00010000', 1, '', 'EPTemperingItemIsEnchanted');
            newCondition = xelib.AddArrayItem(newRecipe, 'Conditions', '', '');
            updateHasPerkCondition(newRecipe, newCondition, 10000000, 1, this.s.perkSmithingArcaneBlacksmith);
        }
    }

    modifyRecipes(armor: handle) {
        var armorFormID = xelib.GetHexFormID(armor);
        var armorHasLeatherKwda = xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwArmorMaterialLeather);
        var armorHasThievesGuildKwda = xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwArmorMaterialThievesGuild);

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
        if (!xelib.HasElement(armor, 'KWDA') || !xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwArmorSlotShield)) {
            return;
        }

        var name = this.names[armor];
        var type = xelib.GetIntValue(armor, 'BOD2\\Armor Type');

        var weightName = "";
        var searchName = LocData.armor.shield.name[this.lang];

        if (type === 1) {
            weightName = LocData.armor.shield.heavy[this.lang];

            if (!xelib.HasElement(armor, 'TNAM')) {
                xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwArmorShieldHeavy);
                xelib.AddElementValue(armor, 'BIDS', 'WPNBashShieldHeavyImpactSet [IPDS:000183FE]');
                xelib.AddElementValue(armor, 'BAMT', 'MaterialShieldHeavy [MATT:00016979]');
            }
        }

        if (type === 0) {
            weightName = LocData.armor.shield.light[this.lang];

            if (!xelib.HasElement(armor, 'TNAM')) {
                xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwArmorShieldLight);
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

        if (faction.includes('THALMOR') && !xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwMasqueradeThalmor)) {
            xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwMasqueradeThalmor);
        }

        if (faction.includes('BANDIT') && !xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwMasqueradeBandit)) {
            xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwMasqueradeBandit);
        }

        if (faction.includes('IMPERIAL') && !xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwMasqueradeImperial)) {
            xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwMasqueradeImperial);
        }

        if (faction.includes('STORMCLOAK') && !xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwMasqueradeStormcloak)) {
            xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwMasqueradeStormcloak);
        }

        if (faction.includes('FORSWORN') && !xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwMasqueradeForsworn)) {
            xelib.AddElementValue(armor, 'KWDA\\.', this.s.kwMasqueradeForsworn);
        }
    }

    createDreamcloth(armor: handle) {
        var s = this.s;
        var kwda = getKwda(armor);
        var dreamclothPerk;

        if (kwda(s.kwClothingBody)) {
            dreamclothPerk = s.perkDreamclothBody;
        } else if (kwda(s.kwClothingHands)) {
            dreamclothPerk = s.perkDreamclothHands;
        } else if (kwda(s.kwClothingHead)) {
            dreamclothPerk = s.perkDreamclothHead;
        } else if (kwda(s.kwClothingFeet)) {
            dreamclothPerk = s.perkDreamclothFeet;
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
        xelib.AddElementValue(newDreamcloth, 'KWDA\\.', s.kwArmorDreamcloth);
        addPerkScript(newDreamcloth, 'xxxDreamCloth', 'pDream', dreamclothPerk);
        this.helpers.cacheRecord(newDreamcloth, newEditorId);
        return newDreamcloth;
    }

    getArmorSlotMultiplier(armor: handle) {
        var kwda = getKwda(armor);

        if (kwda(this.s.kwArmorSlotBoots)) {
            return this.settings.armor.baseStats.multipliers.boots;
        }

        if (kwda(this.s.kwArmorSlotCuirass)) {
            return this.settings.armor.baseStats.multipliers.cuirass;
        }

        if (kwda(this.s.kwArmorSlotGauntlets)) {
            return this.settings.armor.baseStats.multipliers.gauntlets;
        }

        if (kwda(this.s.kwArmorSlotHelmet)) {
            return this.settings.armor.baseStats.multipliers.helmet;
        }

        if (kwda(this.s.kwArmorSlotShield)) {
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
            if (kwda(this.s.armorStrongerLow)) {
                modifier = this.modifiers.armorStrongerLow;
            } else if (kwda(this.s.armorStrongerMedium)) {
                modifier = this.modifiers.armorStrongerMedium;
            } else if (kwda(this.s.armorStrongerHigh)) {
                modifier = this.modifiers.armorStrongerHigh;
            } else if (kwda(this.s.armorWeakerLow)) {
                modifier = this.modifiers.armorWeakerLow;
            } else if (kwda(this.s.armorWeakerMedium)) {
                modifier = this.modifiers.armorWeakerMedium;
            } else if (kwda(this.s.armorWeakerHigh)) {
                modifier = this.modifiers.armorWeakerHigh;
            } else {
                modifier = 1;
            }
        }

        return modifier;
    }

    getMaterialArmorModifier(armor: handle): number {
        var armorRating = getValueFromName<number>(this.rules.materials, this.names[armor], 'name', 'armor');

        if (armorRating !== null)
            return armorRating;

        armorRating = getValueFromName<number>(this.rules.materials, xelib.EditorID(armor), 'name', 'armor');
        if (armorRating !== null)
            return armorRating;

        this.armorMaterialsMap.some((e) => {
            if (!xelib.HasArrayItem(armor, 'KWDA', '', e.kwda)) {
                return false;
            }

            armorRating = getValueFromName<number>(this.rules.materials, e.name, 'name', 'armor');
            return true;
        });

        if (armorRating !== null) {
            return armorRating;
        }

        if (!xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.log(armor, "Couldn't find material keyword nor relevant rule.");
        }

        return 0;
    }

    patchArmorRating(armor: handle) {
        var rating = Math.floor(this.getArmorSlotMultiplier(armor) * this.getMaterialArmorModifier(armor) * this.getKeywordArmorModifier(armor));

        if (rating !== 0) {
            xelib.SetValue(armor, 'DNAM', "".concat(String(rating)));
        } else if (rating === 0 && !xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
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
        var override = this.getArmorMaterialOverride(this.names[armor]);
        var input: string;
        var perk: string;

        if (!override)
            override = this.getArmorMaterialOverride(xelib.EditorID(armor));

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
            input = e.input;
            perk = e.perk;
            return false;
        });
        var bench = parseInt(this.s.kwCraftingSmithingArmorTable, 16);
        overrideCraftingRecipes(this.cobj, armor, bench, perk, input, this.patchFile);
    }

    getArmorMaterialOverride(name: string) {
        var override = this.rules.materialOverrides.find((o: any) => {
            if (o.edid && o.edid !== null)
                return name.includes(o.edid);
            else
                return name.includes(o.substring);
        });
        return override ? override.material : null;
    }

    addClothingCraftingRecipe(armor: handle, isDreamCloth?: boolean) {
        var s = this.s;
        var kwda = getKwda(armor);
        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_CRAFT_CLOTHING_".concat(xelib.EditorID(armor)));
        var quantityIngredient1 = 2;

        if (kwda(s.kwClothingBody)) {
            quantityIngredient1 += 2;
        } else if (kwda(s.kwClothingHead)) {
            quantityIngredient1 += 1;
        }

        xelib.AddElement(newRecipe, 'Items');
        var ingredient = xelib.AddElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(ingredient, 'CNTO\\Item', s.leather);
        xelib.SetUIntValue(ingredient, 'CNTO\\Count', quantityIngredient1);
        xelib.AddElementValue(newRecipe, 'NAM1', '1');
        xelib.AddElementValue(newRecipe, 'CNAM', xelib.GetHexFormID(armor));
        xelib.AddElementValue(newRecipe, 'BNAM', s.kwCraftingTanningRack);
        var secondaryIngredients = [];
        secondaryIngredients.push(s.leatherStrips);

        if (isDreamCloth) {
            secondaryIngredients.push(s.pettySoulGem);
            xelib.AddElement(newRecipe, 'Conditions');
            var condition = xelib.AddElement(newRecipe, 'Conditions\\[0]');
            updateHasPerkCondition(newRecipe, condition, 10000000, 1, s.perkSmithingWeavingMill);
        }

        secondaryIngredients.forEach((hexcode) => {
            var ingr = xelib.AddElement(newRecipe, 'Items\\.');
            xelib.SetValue(ingr, 'CNTO\\Item', hexcode);
            xelib.SetUIntValue(ingr, 'CNTO\\Count', 1);
        });
    }

    addClothingMeltdownRecipe(armor: handle, isDreamCloth?: boolean) {
        var s = this.s;
        var kwda = getKwda(armor);
        var returnQuantity = 1;
        var inputQuantity = 1;

        if (xelib.HasArrayItem(armor, 'KWDA', '', s.excludeFromMeltdownRecipes)) {
            return;
        }

        // ignore enchanted
        if (xelib.HasElement(armor, 'EITM'))
            return;

        if (kwda(s.kwClothingBody)) {
            returnQuantity += 2;
        } else if (kwda(s.kwClothingHands) || kwda(s.kwClothingHead) || kwda(s.kwClothingFeet)) {
            returnQuantity += 1;
        }

        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_MELTDOWN_CLOTHING_".concat(xelib.EditorID(armor)));
        xelib.AddElement(newRecipe, 'Items');
        var ingredient = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(ingredient, 'CNTO\\Item', xelib.GetHexFormID(armor));
        xelib.SetUIntValue(ingredient, 'CNTO\\Count', inputQuantity);
        xelib.AddElementValue(newRecipe, 'NAM1', "".concat(String(returnQuantity)));
        xelib.AddElementValue(newRecipe, 'CNAM', s.leatherStrips);
        xelib.AddElementValue(newRecipe, 'BNAM', s.kwCraftingTanningRack);
        xelib.AddElement(newRecipe, 'Conditions');
        var condition = xelib.GetElement(newRecipe, 'Conditions\\[0]');
        updateHasPerkCondition(newRecipe, condition, 10000000, 1, s.perkSmithingMeltdown);

        if (isDreamCloth) {
            createHasPerkCondition(newRecipe, 10000000, 1, s.perkSmithingWeavingMill);
        }

        createGetItemCountCondition(newRecipe, 11000000, 1, armor);
        createGetEquippedCondition(newRecipe, 10000000, 0, armor);
    }

    processClothing(armor: handle) {
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

    patchFunc(armor: handle) {
        this.names[armor] = xelib.FullName(armor);

        if (xelib.HasElement(armor, 'TNAM')) {
            this.patchShieldWeight(armor);
            return;
        } else if (xelib.HasElement(armor, 'KWDA') && xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwVendorItemClothing)
                     && !xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.patchMasqueradeKeywords(armor);

            this.processClothing(armor);

            return;
        }

        this.overrideMaterialKeywords(armor);

        if (!xelib.HasElement(armor, 'TNAM') && !xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.patchMasqueradeKeywords(armor);
        }

        if (!xelib.HasArrayItem(armor, 'KWDA', '', this.s.kwVendorItemClothing)) {
            this.patchArmorRating(armor);
        }

        this.patchShieldWeight(armor);

        if (!xelib.GetFlag(armor, 'Record Header\\Record Flags', 'Non-Playable')) {
            this.modifyRecipes(armor);

            this.addMeltdownRecipe(armor);
        }
    }

    createKeywordMaps() {
        var s = this.s;

        this.heavyMaterialsMap = [{
            name: 'Blades',
            kwda: s.kwArmorMaterialBlades,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Daedric',
            kwda: s.kwArmorMaterialDaedric,
            input: s.ingotEbony,
            perk: s.perkSmithingDaedric,
            bnam: s.kwCraftingSmelter,
            func: 'incr'
          }, {
            name: 'Dragonplate',
            kwda: s.kwArmorMaterialDragonplate,
            input: s.dragonbone,
            perk: s.perkSmithingDragon,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Dwarven',
            kwda: s.kwArmorMaterialDwarven,
            input: s.ingotDwarven,
            perk: s.perkSmithingDwarven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Ebony',
            kwda: s.kwArmorMaterialEbony,
            input: s.ingotEbony,
            perk: s.perkSmithingEbony,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Falmer Hardened',
            kwda: s.kwArmorMaterialFalmerHardened,
            input: s.chaurusChitin,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Falmer Heavy',
            kwda: s.kwArmorMaterialFalmerHeavy,
            input: s.chaurusChitin,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Falmer',
            kwda: s.kwArmorMaterialFalmerHeavyOriginal,
            input: s.chaurusChitin,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Imperial Heavy',
            kwda: s.kwArmorMaterialImperialHeavy,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Iron',
            kwda: s.kwArmorMaterialIron,
            input: s.ingotIron,
            perk: null,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Iron Banded',
            kwda: s.kwArmorMaterialIronBanded,
            input: s.ingotIron,
            perk: null,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Nordic',
            kwda: s.kwArmorMaterialNordicHeavy,
            input: s.ingotQuicksilver,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Orcish',
            kwda: s.kwArmorMaterialOrcish,
            input: s.ingotOrichalcum,
            perk: s.perkSmithingOrcish,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Stalhrim Heavy',
            kwda: s.kwArmorMaterialStalhrimHeavy,
            input: s.oreStalhrim,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Steel',
            kwda: s.kwArmorMaterialSteel,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Steel Plate',
            kwda: s.kwArmorMaterialSteelPlate,
            input: s.ingotCorundum,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Dawnguard',
            kwda: s.kwDLC1ArmorMaterialDawnguard,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Dawnguard Hunter',
            kwda: s.kwDLC1ArmorMaterialHunter,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Bonemold Heavy',
            kwda: s.kwDLC2ArmorMaterialBonemoldHeavy,
            input: s.netchLeather,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Chitin Heavy',
            kwda: s.kwDLC2ArmorMaterialChitinHeavy,
            input: s.chitinPlate,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Ancient Nord',
            kwda: s.kwWAF_ArmorMaterialDraugr,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Wolf',
            kwda: s.kwWAF_ArmorWolf,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }]; // prettier-ignore
    
          this.lightMaterialsMap = [{
            name: 'Shrouded',
            kwda: s.kwArmorMaterialDarkBrotherhood,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Dragonscale',
            kwda: s.kwArmorMaterialDragonscale,
            input: s.dragonscale,
            perk: s.perkSmithingDragon,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Elven',
            kwda: s.kwArmorMaterialElven,
            input: s.ingotMoonstone,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Elven Gilded',
            kwda: s.kwArmorMaterialElvenGilded,
            input: s.ingotMoonstone,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Forsworn',
            kwda: s.kwArmorMaterialForsworn,
            input: s.leatherStrips,
            perk: null,
            bnam: s.kwCraftingTanningRack,
            func: null
          }, {
            name: 'Glass',
            kwda: s.kwArmorMaterialGlass,
            input: s.ingotMalachite,
            perk: s.perkSmithingGlass,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Hide',
            kwda: s.kwArmorMaterialHide,
            input: s.leatherStrips,
            perk: null,
            bnam: s.kwCraftingTanningRack,
            func: null
          }, {
            name: 'Imperial Light',
            kwda: s.kwArmorMaterialImperialLight,
            input: s.ingotSteel,
            perk: s.perkSmithingSteel,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Imperial Studded',
            kwda: s.kwArmorMaterialImperialStudded,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Leather',
            kwda: s.kwArmorMaterialLeather,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Nightingale',
            kwda: s.kwArmorMaterialNightingale,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Scaled',
            kwda: s.kwArmorMaterialScaled,
            input: s.ingotCorundum,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Stalhrim Light',
            kwda: s.kwArmorMaterialStalhrimLight,
            input: s.oreStalhrim,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Stormcloak',
            kwda: s.kwArmorMaterialStormcloak,
            input: s.ingotIron,
            perk: null,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Studded',
            kwda: s.kwArmorMaterialStudded,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Thieves Guild',
            kwda: s.kwArmorMaterialThievesGuild,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Vampire',
            kwda: s.kwArmorMaterialVampire,
            input: s.leatherStrips,
            perk: s.perkSmithingLeather,
            bnam: s.kwCraftingTanningRack,
            func: 'incr'
          }, {
            name: 'Bonemold',
            kwda: s.kwDLC2ArmorMaterialBonemoldLight,
            input: s.netchLeather,
            perk: s.perkSmithingAdvanced,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Chitin',
            kwda: s.kwDLC2ArmorMaterialChitinLight,
            input: s.chitinPlate,
            perk: s.perkSmithingElven,
            bnam: s.kwCraftingSmelter,
            func: null
          }, {
            name: 'Guard',
            kwda: s.kwWAF_ArmorMaterialGuard,
            input: s.ingotIron,
            perk: null,
            bnam: s.kwCraftingSmelter,
            func: null
          }];
        this.armorMaterialsMap = this.lightMaterialsMap.concat(this.heavyMaterialsMap);
    }

    log(armor: handle, message: string) {
        var name = this.names[armor];
        var formId = xelib.GetHexFormID(armor);
        this.helpers.logMessage("--> ".concat(name, "(").concat(formId, "): ").concat(message));
    }
}
