"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryType = exports.AccountType = exports.TransactionType = exports.Period = void 0;
// Export all types and schemas
__exportStar(require("./types/transactions"), exports);
__exportStar(require("./types/analytics"), exports);
__exportStar(require("./types/gdpr"), exports);
// Export data engine components
__exportStar(require("./data-engine/LocalDataEngine"), exports);
__exportStar(require("./data-engine/SubscriptionManager"), exports);
__exportStar(require("./data-engine/BackupService"), exports);
__exportStar(require("./data-engine/OCRService"), exports);
__exportStar(require("./data-engine/PlaidService"), exports);
// Common enums
var Period;
(function (Period) {
    Period["MONTHLY"] = "monthly";
    Period["YEARLY"] = "yearly";
})(Period || (exports.Period = Period = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "income";
    TransactionType["EXPENSE"] = "expense";
    TransactionType["TRANSFER"] = "transfer";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var AccountType;
(function (AccountType) {
    AccountType["CHECKING"] = "checking";
    AccountType["SAVINGS"] = "savings";
    AccountType["CREDIT_CARD"] = "credit_card";
    AccountType["INVESTMENT"] = "investment";
})(AccountType || (exports.AccountType = AccountType = {}));
var CategoryType;
(function (CategoryType) {
    CategoryType["INCOME"] = "income";
    CategoryType["EXPENSE"] = "expense";
    CategoryType["TRANSFER"] = "transfer";
})(CategoryType || (exports.CategoryType = CategoryType = {}));
//# sourceMappingURL=index.js.map