
/* BillSplit - Analytics */

window.BillSplitAnalytics = {
    getTotalExpenses(expenses) {
        const cents = expenses.reduce(
            (sum, expense) => sum + Math.round(Number(expense.amount) * 100),
            0
        );
        return cents / 100;
    },

    getSpendingByMember(expenses) {
        const result = {};

        expenses.forEach(expense => {
            result[expense.paidBy] =
                (result[expense.paidBy] || 0) + Number(expense.amount);
        });

        return result;
    },

    getExpenseCount(expenses) {
        return expenses.length;
    },

    getAverageExpense(expenses) {
        return expenses.length
            ? this.getTotalExpenses(expenses) / expenses.length
            : 0;
    }
};
