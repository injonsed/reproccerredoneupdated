import { PluginsList, SkyrimForms, deepmerge } from './core';
import { getLanguageCode } from './localization';
import { SettingsController } from './settingsController';

import AlchemyPatcher from './alchemy';
import ProjectilePatcher from './projectile';
import ArmorPatcher from './armor';
import WeaponPatcher from './weapons';

import { InteractionIconsFloraPatcher, InteractionIconsActivatorPatcher } from './icons';
import NPCPatcher from './npc';

var alchemySettings: AlchemySettings = {
    baseStats: {
        duration: 2,
        priceLimits: {
            lower: 5,
            upper: 150
        },
        usePriceLimits: true
    },
    enabled: false
};

var armorSettings: ArmorSettings = {
    baseStats: {
        maxProtection: 95,
        multipliers: {
            boots: 1,
            cuirass: 3,
            gauntlets: 1,
            helmet: 1.5,
            shield: 1.5
        },
        protectionPerArmor: 0.1
    },
    enabled: true,
    modifiers: {
        armorStrongerLow: 1.1,
        armorStrongerMedium: 1.2,
        armorStrongerHigh: 1.3,
        armorWeakerLow: 0.9,
        armorWeakerMedium: 0.8,
        armorWeakerHigh: 0.7
    }
};

var projectileSettings: ProjectileSettings = {
    enabled: true
};

var weaponSettings: WeaponSettings = {
    baseStats: {
        damage: {
            bow: 22,
            crossbow: 30,
            oneHanded: 12,
            twoHanded: 23
        },
        damageBonuses: {
            recurveCrossbow: 8
        },
        speedBonuses: {
            arbalestCrossbow: -0.2,
            lightweightCrossbow: 0.25
        },
        weightMultipliers: {
            arbalestCrossbow: 1.25,
            lightweightCrossbow: 0.75
        }
    },
    enabled: true,
    modifiers: {
        weaponStrongerLow: 1.1,
        weaponStrongerMedium: 1.2,
        weaponStrongerHigh: 1.3,
        weaponWeakerLow: 0.9,
        weaponWeakerMedium: 0.8,
        weaponWeakerHigh: 0.7
    }
};

var iconSettings: InteractionIconsSettings = {
    enabled: true
};

var npcSettings: NPCSettings = {
    enabled: true,
    // NPC loadorder list
    plugins: ["Modpocalypse NPCs (v3) SSE.esp", "PAN_NPCs.esp", "PAN_NPCs_Males.esp"]
};

var mainSettings = {
    label: 'Reproccer Reborn',
    templateUrl: `${patcherUrl}/partials/settings.html`,
    controller: SettingsController,
    defaultSettings: {
        patchFileName: 'ReProccer.esp',
        alchemy: alchemySettings,
        armor: armorSettings,
        projectiles: projectileSettings,
        weapons: weaponSettings,
        npc: npcSettings,
        lang: "en",
        icons: iconSettings,
        ignoredFiles: ['Apocalypse - Magic of Skyrim.esp', 'Bashed Patch, 0.esp', 'Chesko_WearableLantern.esp', 'Convenient Horses.esp',
            'Dr_Bandolier.esp', 'Dr_BandolierDG.esp', 'Growl - Werebeasts of Skyrim.esp']
    }
};

export default class ReproccerReborn implements ZEditPatcher {

    gameModes: Array<number>;
    settings: any;
    info: any;

    constructor() {
        mainSettings.defaultSettings.lang = getLanguageCode(xelib.GetGameLanguage(xelib.gmSSE));
        this.gameModes = [xelib.gmSSE];
        this.settings = mainSettings;
        this.info = info;
    }

    execute(patch: any, helpers: xelibHelpers, settings: any, locals: any) {
        var skyRePatchers = [AlchemyPatcher, ArmorPatcher, ProjectilePatcher, WeaponPatcher];

        var patchers: Array<any> = [];
        patchers = patchers.concat(skyRePatchers);
        patchers = patchers.concat([InteractionIconsFloraPatcher, InteractionIconsActivatorPatcher]);
        patchers = patchers.concat([NPCPatcher]);

        return {
            initialize: function initialize() {
                ReproccerReborn.buildRules(locals);
                ReproccerReborn.loadStatics(locals);
                locals.cobj = helpers.loadRecords('COBJ').map((h): IRecipe => {
                    return {
                        handle: xelib.GetWinningOverride(h),
                        cnamv: xelib.GetValue(h, 'CNAM'),
                        cnam: xelib.GetUIntValue(h, 'CNAM'),
                        bnam: xelib.GetUIntValue(h, 'BNAM')
                    };
                });

                for (var i = 0; i < patchers.length; i += 1) {
                    patchers[i] = new patchers[i](helpers, locals, patch, settings);
                }
            },
            process: patchers,
            finalize: function finalize() {}
        };
      }

    getFilesToPatch(filenames: Array<string>) {
        return filenames.subtract(['ReProccer.esp']);
    }

    requiredFiles() {
        return [PluginsList.SkyRe, PluginsList.Poulet];
    }

    static buildRules(locals: any) {
        var rules = {};
        var last = fh.loadJsonFile("".concat(patcherPath, "/data/last.json"), null);
        rules = deepmerge(rules, last);
        xelib.GetLoadedFileNames().forEach((plugin) => {
            var data = fh.loadJsonFile("".concat(patcherPath, "/data/").concat(plugin.slice(0, -4), ".json"), null);

            if (data) {
                rules = deepmerge(rules, data);
            }
        });
        var first = fh.loadJsonFile("".concat(patcherPath, "/data/first.json"), null);
        rules = deepmerge(rules, first);
        locals.rules = rules;
    }

    static loadStatics(locals: any) {
        var files = {};
        var loadOrders = {};

        function GetHex(formId: number, filename: string) {
            var loadOrder = getLoadOrder(getFile(filename));
            return xelib.Hex(loadOrder * Math.pow(2, 24) + formId);
        }

        function getLoadOrder(file: handle) {
            if (!loadOrders[file]) {
                loadOrders[file] = xelib.GetFileLoadOrder(file);
            }

            return loadOrders[file];
        }

        function getFile(filename: string) {
            if (!files[filename]) {
                files[filename] = xelib.FileByName(filename);
            }

            return files[filename];
        }

        SkyrimForms.init(GetHex);
    }
}
