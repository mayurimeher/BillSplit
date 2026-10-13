
/* BillSplit - Browser storage */

window.BillSplitStorage = {
    saveExpenses(expenses) {
        localStorage.setItem("billsplit_expenses", JSON.stringify(expenses));
    },

    loadExpenses() {
        try {
            const saved = localStorage.getItem("billsplit_expenses");
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Unable to load expenses:", error);
            return [];
        }
    },

    clearExpenses() {
        localStorage.removeItem("billsplit_expenses");
    }
};
