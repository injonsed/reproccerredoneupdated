export function SettingsController($scope: any, patcherService: any) {
    // helper functions
    let updateFiles = function () {
        $scope.settings.reproccerReborn.npc.plugins = $scope.plugins
            .map((item) => item.filename);
    };

    // scope functions
    $scope.addPlugin = function () {
        $scope.plugins.push({ filename: 'Plugin.esp' });
        $scope.onChange();
    };

    $scope.removePlugin = function (index) {
        $scope.plugins.splice(index, 1);
        $scope.onChange();
    };

    $scope.onChange = function () {
        updateFiles();
    };

    // initialization
    $scope.plugins = $scope.settings.reproccerReborn.npc.plugins.map(filename => ({ filename }));
}