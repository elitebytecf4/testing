'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const azdata = require("azdata");
const vscode = require("vscode");
const DataScripter_1 = require("./DataScripter");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.scriptTableData', (oeContext) => __awaiter(this, void 0, void 0, function* () {
        if (!oeContext) {
            vscode.window.showErrorMessage("This extension cannot be run from the command menu.");
            return;
        }
        let tableName = `[${oeContext.connectionProfile.databaseName}].[${oeContext.nodeInfo.metadata.schema}].[${oeContext.nodeInfo.metadata.name}]`;
        let options = {
            prompt: `Press [Enter] to accept the default of all data or edit the SQL to select subsets of data. You can use any valid sql syntax. Note that scripting all data in the table can have serious performance issues for extremely large tables. `,
            value: `select * from ${tableName};`
        };
        let sql = yield vscode.window.showInputBox(options);
        if (!sql || sql.trim() === "") {
            vscode.window.showInformationMessage("Query was cancelled");
            return;
        }
        let args = {
            context: oeContext,
            tableName: tableName,
            sqlString: sql
        };
        // run this as a background operation with status displaying in Tasks pane
        let backgroundOperationInfo = {
            connection: undefined,
            displayName: `Scripting Data for : ${tableName} `,
            description: "A data scripting operation",
            isCancelable: true,
            operation: (operation) => {
                return scriptData(operation, args);
            }
        };
        azdata.tasks.startBackgroundOperation(backgroundOperationInfo);
    })));
}
exports.activate = activate;
function scriptData(backgroundOperation, args) {
    return __awaiter(this, void 0, void 0, function* () {
        let connectionResult = yield azdata.connection.connect(args.context.connectionProfile, false, false);
        if (!connectionResult.connected) {
            backgroundOperation.updateStatus(azdata.TaskStatus.Failed, "Could not connect to database server");
            vscode.window.showErrorMessage(connectionResult.errorMessage);
            return;
        }
        let connectionUri = yield azdata.connection.getUriForConnection(connectionResult.connectionId);
        let providerId = args.context.connectionProfile.providerName;
        let databaseName = args.context.connectionProfile.databaseName;
        let connectionProvider = azdata.dataprotocol.getProvider(providerId, azdata.DataProviderType.ConnectionProvider);
        let queryProvider = azdata.dataprotocol.getProvider(providerId, azdata.DataProviderType.QueryProvider);
        backgroundOperation.updateStatus(azdata.TaskStatus.InProgress, "Getting records...");
        var changeDatabaseResults = yield connectionProvider.changeDatabase(connectionUri, databaseName);
        if (!changeDatabaseResults) {
            backgroundOperation.updateStatus(azdata.TaskStatus.Failed, `Could not switch to [${databaseName}] database`);
            vscode.window.showErrorMessage(connectionResult.errorMessage);
            return;
        }
        queryProvider.runQueryAndReturn(connectionUri, args.sqlString).then(function (results) {
            if (!results || results.rowCount === 0) {
                backgroundOperation.updateStatus(azdata.TaskStatus.Succeeded, "No data retrieved");
                vscode.window.showErrorMessage("Nothing to script! The query produced no results!");
                return;
            }
            let dataScripter = new DataScripter_1.DataScripter(results, args.context.nodeInfo.metadata.name);
            backgroundOperation.updateStatus(azdata.TaskStatus.InProgress, "Parsing records...");
            vscode.workspace.openTextDocument({ language: 'sql' }).then(textDocument => {
                vscode.window.showTextDocument(textDocument, 1, false).then(textEditor => {
                    textEditor.edit(editBuilder => {
                        editBuilder.insert(new vscode.Position(0, 0), dataScripter.Script());
                        backgroundOperation.updateStatus(azdata.TaskStatus.Succeeded);
                    });
                });
            });
        }, function (error) {
            let message = (error instanceof Error) ? error.message : "There was an unknown error retrieving data";
            backgroundOperation.updateStatus(azdata.TaskStatus.Failed, message);
            vscode.window.showErrorMessage(message);
        });
    });
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map