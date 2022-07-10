declare const patcherUrl: string;
declare const patcherPath: string;
declare const info: any;
declare const Filename: string;

declare type handle = number;

declare interface ZEditPatcher {}

declare function registerPatcher(patcher: ZEditPatcher): void;

declare type FilterFunction = (record: handle) => boolean;
declare type PatchFunction = (record: handle) => void;

declare interface FilterEntry {
    signature: string,
    filter: FilterFunction
}

declare interface xelibHelpers {
    loadRecords(signature: string): Array<handle>;
    cacheRecord(record: handle, edid: string): void;
    logMessage(message: string): void;
}

interface Array<T> {
    subtract(to: Array<T>): Array<T>;
}

declare namespace xelib {
    const gmSSE: number;

    function GetGameLanguage(gameType: number): string;

    function GetLoadedFileNames(): Array<string>;
    function GetFileLoadOrder(filename: handle): number;
    function FileByName(name: string): handle;

    /**
     * Convert integer formID to hex representation
     * @returns hex value
    */
    function Hex(num: number): string;
    /**
     * For main records only
     * @returns hex formID value
     */
    function GetHexFormID(record: handle): string;
    /**
     * For main records only
     * @returns Integer number converted from hex value
     */
    function GetFormID(record: handle): number;
    function GetRecordFlag(record: handle, path: string): boolean;
    function GetRecord(loadorder: number, hexFormId: number): handle;

    function GetFileName(id: handle): string;

    function GetMasterRecord(record: handle): handle;
    function GetLinksTo(record: handle, path: string): handle;
    function IsWinningOverride(record: handle): boolean;
    function GetOverrides(record: handle): Array<handle>;
    function GetWinningOverride(id: handle): handle;

    /**
     * Resolves the flags element at @path, and gets the state of flag @name.
    */
    function GetFlag(record: handle, path: string, name: string): boolean;
    function SetFlag(record: handle, path: string, name: string, val: boolean): void;

    function FullName(record: handle): string;
    function EditorID(record: handle): string;
    function DisplayName(id: handle): string;
    function LongPath(id: handle): string;

    function HasScript(record: handle, scriptName: string): boolean;
    function RemoveScript(record: handle, scriptName: string): void;

    function GetElement(record: handle, path: string): handle;
    function GetElements(record: handle, path: string, sort?: boolean): Array<handle>;

    function AddElement(record: handle, path: string): handle;
    function AddElementValue(record: handle, path: string, val: string): void;
    function CopyElement(record: handle, patchFile: handle, asNew?: boolean): handle;
    function HasElement(record: handle, path: string): boolean;
    function RemoveElement(record: handle, path: string): void;
    function ElementEquals(e1: handle, e2: handle): boolean;
    function ElementCount(element: handle): number;
    function ElementToJSON(id: handle): string;

    /**
     * Adds an item to the array at @param path and sets @param val at @param subpath. Returns a handle to the added array item.
    */
    function AddArrayItem(record: handle, path: string, subpath: string, val: string): handle;
    function GetArrayItem(record: handle, path: string, subpath: string, search: string): handle;
    function MoveArrayItem(element: handle, index: number): void;
    function HasArrayItem(id: handle, path: string, subpath: string, val: string): boolean;
    function RemoveArrayItem(element: handle, path: string, subpath: string, val: string): void;

    /**
     * Returns the editor value at path. This is the same value displayed in the record view. Returns an empty string if path does not exist.
    */
    function GetValue(id: handle, path: string): string;
    function GetIntValue(id: handle, path: string): number;
    function GetFloatValue(id: handle, path: string): number;
    function GetUIntValue(id: handle, path: string): number;

    function SetValue(element: handle, path: string, val: string): void;
    function SetFloatValue(id: handle, path: string, val: number): void;
    function SetIntValue(id: handle, path: string, val: number): void;
    function SetUIntValue(id: handle, path: string, val: number): void;
}

declare namespace fh {
    function loadJsonFile(path: string, options: any): Object
}
