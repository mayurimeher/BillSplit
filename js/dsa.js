
/* BillSplit - Calculation logic */

window.BillSplitDSA = {
    splitEqually(total, members) {
        if (!members.length) throw new Error("Select group members.");

        const cents = Math.round(Number(total) * 100);
        if (!Number.isFinite(cents) || cents < 0) {
            throw new Error("Invalid bill amount.");
        }

        const base = Math.floor(cents / members.length);
        const remainder = cents % members.length;
        const result = {};

        members.forEach((member, index) => {
            result[member] = (base + (index < remainder ? 1 : 0)) / 100;
        });

        return result;
    },

    validateCustomSplits(total, splits) {
        const totalCents = Math.round(Number(total) * 100);
        const values = Object.values(splits).map(Number);

        if (!Number.isFinite(totalCents) || totalCents < 0) return false;
        if (values.some(v => !Number.isFinite(v) || v < 0)) return false;

        return values.reduce((sum, v) => sum + Math.round(v * 100), 0)
            === totalCents;
    },

    calculateBalances(expenses) {
        const cents = {};

        expenses.forEach(expense => {
            const amount = Math.round(Number(expense.amount) * 100);
            cents[expense.paidBy] = (cents[expense.paidBy] || 0) + amount;

            Object.entries(expense.splits || {}).forEach(([member, share]) => {
                cents[member] = (cents[member] || 0)
                    - Math.round(Number(share) * 100);
            });
        });

        return Object.fromEntries(
            Object.entries(cents).map(([member, amount]) => [member, amount / 100])
        );
    },

    calculateSettlements(balances) {
        const debtors = [];
        const creditors = [];

        Object.entries(balances).forEach(([member, amount]) => {
            const cents = Math.round(Number(amount) * 100);
            if (cents < 0) debtors.push({ member, cents: -cents });
            if (cents > 0) creditors.push({ member, cents });
        });

        const result = [];
        let d = 0;
        let c = 0;

        while (d < debtors.length && c < creditors.length) {
            const amount = Math.min(debtors[d].cents, creditors[c].cents);

            result.push({
                from: debtors[d].member,
                to: creditors[c].member,
                amount: amount / 100
            });

            debtors[d].cents -= amount;
            creditors[c].cents -= amount;

            if (debtors[d].cents === 0) d++;
            if (creditors[c].cents === 0) c++;
        }

        return result;
    }
};
