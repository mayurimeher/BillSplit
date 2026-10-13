
/* BillSplit - Main application */

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const form = $("expense-form");
    const formPanel = $("expense-form-panel");
    const expenseList = $("expense-list");
    const amountInput = $("expense-amount");
    const splitMode = $("split-mode");
    const customPanel = $("custom-splits");
    const preview = $("split-preview");
    const message = $("expense-message");

    const money = amount => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);

    if (
        !form || !formPanel || !expenseList ||
        !window.BillSplitDSA || !window.BillSplitStorage ||
        !window.BillSplitAnalytics
    ) {
        console.error("BillSplit setup incomplete. Check script tags and HTML IDs.");
        return;
    }

    let expenses = window.BillSplitStorage.loadExpenses();

    function selectedMembers() {
        return [...form.querySelectorAll('input[name="members"]:checked')]
            .map(input => input.value);
    }

    function showMessage(text, type = "") {
        message.textContent = text;
        message.className = type;
    }

    function renderPreview() {
        const amount = Number(amountInput.value);
        const members = selectedMembers();

        customPanel.replaceChildren();

        if (splitMode.value === "custom") {
            customPanel.hidden = false;

            members.forEach(member => {
                const row = document.createElement("div");
                row.className = "custom-split-row";

                const label = document.createElement("label");
                label.textContent = `${member}'s share (₹)`;

                const input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.step = "0.01";
                input.dataset.member = member;
                input.placeholder = "Enter share";
                input.setAttribute("aria-label", `${member}'s share`);

                label.htmlFor = `share-${member}`;
                input.id = `share-${member}`;

                input.addEventListener("input", updatePreview);
                row.append(label, input);
                customPanel.appendChild(row);
            });
        } else {
            customPanel.hidden = true;
        }

        updatePreview();
    }

    function updatePreview() {
        const amount = Number(amountInput.value);
        const members = selectedMembers();

        if (!Number.isFinite(amount) || amount <= 0 || !members.length) {
            preview.textContent = "Enter a valid bill and select group members.";
            return;
        }

        if (splitMode.value === "equal") {
            const shares = window.BillSplitDSA.splitEqually(amount, members);
            preview.textContent = members
                .map(member => `${member}: ${money(shares[member])}`)
                .join(" · ");
            return;
        }

        const inputs = [...customPanel.querySelectorAll("[data-member]")];
        const values = {};
        let incomplete = false;

        inputs.forEach(input => {
            if (input.value.trim() === "") incomplete = true;
            values[input.dataset.member] = Number(input.value);
        });

        if (incomplete) {
            preview.textContent = `Enter each share. Total bill: ${money(amount)}.`;
            return;
        }

        const totalShares = Object.values(values).reduce((sum, value) => sum + value, 0);
        const remaining = Math.round((amount - totalShares) * 100) / 100;

        preview.textContent = Math.abs(remaining) < 0.005
            ? `Shares match the bill total: ${money(amount)}.`
            : `Shares total: ${money(totalShares)}. Difference: ${money(remaining)}.`;
    }

    function getSplits(amount, members) {
        if (splitMode.value === "equal") {
            return window.BillSplitDSA.splitEqually(amount, members);
        }

        const splits = {};
        const inputs = [...customPanel.querySelectorAll("[data-member]")];

        if (inputs.length !== members.length) {
            throw new Error("Please check the selected group members.");
        }

        for (const input of inputs) {
            if (input.value.trim() === "") {
                throw new Error(`Enter ${input.dataset.member}'s share.`);
            }

            splits[input.dataset.member] = Number(input.value);
        }

        if (!window.BillSplitDSA.validateCustomSplits(amount, splits)) {
            throw new Error("Custom shares ka total bill ke barabar hona chahiye.");
        }

        return splits;
    }

    function renderExpenses() {
        expenseList.replaceChildren();

        if (!expenses.length) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "No expenses yet. Add your first expense!";
            expenseList.appendChild(empty);
            return;
        }

        [...expenses].reverse().forEach(expense => {
            const row = document.createElement("div");
            row.className = "expense-item";

            const info = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = expense.name;

            const details = document.createElement("p");
            details.textContent = `Paid by ${expense.paidBy} · ${expense.members.join(", ")}`;

            info.append(title, details);

            const actions = document.createElement("div");
            actions.className = "expense-actions";

            const price = document.createElement("strong");
            price.textContent = money(expense.amount);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Delete";
            remove.setAttribute("aria-label", `Delete ${expense.name}`);

            remove.addEventListener("click", () => {
                expenses = expenses.filter(item => item.id !== expense.id);
                saveAndRender();
                showMessage("Expense deleted.", "success");
            });

            actions.append(price, remove);
            row.append(info, actions);
            expenseList.appendChild(row);
        });
    }

    function renderDashboard() {
        const total = window.BillSplitAnalytics.getTotalExpenses(expenses);
        const balances = window.BillSplitDSA.calculateBalances(expenses);
        const myBalance = Math.round((balances.Mayuri || 0) * 100) / 100;

        $("total-expenses").textContent = money(total);
        $("you-owe").textContent = money(Math.max(0, -myBalance));
        $("you-are-owed").textContent = money(Math.max(0, myBalance));

        const settlementList = $("settlement-list");
        settlementList.replaceChildren();

        const settlements = window.BillSplitDSA.calculateSettlements(balances);

        if (!settlements.length) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = expenses.length
                ? "Everyone is settled up!"
                : "Add a group expense to calculate balances.";
            settlementList.appendChild(empty);
            return;
        }

        settlements.forEach(settlement => {
            const row = document.createElement("div");
            row.className = "settlement-row";
            row.textContent =
                `${settlement.from} pays ${settlement.to} ${money(settlement.amount)}`;
            settlementList.appendChild(row);
        });
    }

    function saveAndRender() {
        window.BillSplitStorage.saveExpenses(expenses);
        renderExpenses();
        renderDashboard();
    }

    function openForm() {
        formPanel.hidden = false;
        showMessage("");
        formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        $("expense-name").focus();
    }

    $("add-expense-button").addEventListener("click", openForm);
    $("nav-add-expense").addEventListener("click", event => {
        event.preventDefault();
        openForm();
    });

    $("cancel-expense").addEventListener("click", () => {
        formPanel.hidden = true;
        showMessage("");
    });

    $("settle-button").addEventListener("click", () => {
        $("settlements-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    splitMode.addEventListener("change", renderPreview);
    amountInput.addEventListener("input", updatePreview);

    form.querySelectorAll('input[name="members"]').forEach(input => {
        input.addEventListener("change", renderPreview);
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        showMessage("");

        try {
            const name = $("expense-name").value.trim();
            const amount = Number(amountInput.value);
            const paidBy = $("paid-by").value;
            const members = selectedMembers();

            if (!name) throw new Error("Enter an expense name.");
            if (!Number.isFinite(amount) || amount <= 0) {
                throw new Error("Enter a valid bill amount.");
            }
            if (!members.length) {
                throw new Error("Select at least one group member.");
            }
            if (!members.includes(paidBy)) {
                throw new Error("Please include the payer in group members.");
            }

            const splits = getSplits(amount, members);

            expenses.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                amount: Math.round(amount * 100) / 100,
                paidBy,
                members,
                splits,
                createdAt: new Date().toISOString()
            });

            saveAndRender();
            form.reset();
            formPanel.hidden = true;
            customPanel.replaceChildren();
            customPanel.hidden = true;
            updatePreview();
            showMessage("Expense added successfully!", "success");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    renderPreview();
    saveAndRender();
});
