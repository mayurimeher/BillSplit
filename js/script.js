
document.addEventListener("DOMContentLoaded", function () {
    const addExpenseButton = document.querySelector(".primary-button");
    const expensesPanel = document.querySelector(".expenses-panel");

    if (!addExpenseButton || !expensesPanel) {
        console.error("BillSplit dashboard elements nahi mile.");
        return;
    }

    // Create the expense form
    const formPanel = document.createElement("section");
    formPanel.className = "panel expense-form-panel";
    formPanel.hidden = true;

    formPanel.innerHTML = `
        <div class="panel-heading">
            <div>
                <h2>Add New Expense</h2>
                <p>Enter the details of your shared expense.</p>
            </div>
            <button type="button" class="text-button close-form">Cancel</button>
        </div>

        <form id="expense-form">
            <label for="expense-name">Expense name</label>
            <input id="expense-name" name="expenseName"
                   type="text" placeholder="e.g. Dinner" required>

            <label for="expense-amount">Amount (₹)</label>
            <input id="expense-amount" name="amount"
                   type="number" min="1" step="0.01"
                   placeholder="e.g. 850" required>

            <label for="paid-by">Paid by</label>
            <input id="paid-by" name="paidBy"
                   type="text" placeholder="e.g. Mayuri" required>

            <button class="primary-button" type="submit">
                Save Expense
            </button>
        </form>

        <p id="expense-message" role="status"></p>
    `;

    expensesPanel.after(formPanel);

    const form = formPanel.querySelector("#expense-form");
    const message = formPanel.querySelector("#expense-message");

    function openExpenseForm() {
        formPanel.hidden = false;
        message.textContent = "";
        form.reset();
        formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector("#expense-name").focus();
    }

    addExpenseButton.addEventListener("click", openExpenseForm);

    document.querySelectorAll(".nav-link").forEach(function (link) {
        if (link.textContent.includes("Add Expense")) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                openExpenseForm();
            });
        }
    });

    formPanel.querySelector(".close-form").addEventListener("click", function () {
        formPanel.hidden = true;
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = form.elements.expenseName.value.trim();
        const amount = Number(form.elements.amount.value);
        const paidBy = form.elements.paidBy.value.trim();

        if (!name || !paidBy || !Number.isFinite(amount) || amount <= 0) {
            message.textContent = "Please enter valid expense details.";
            return;
        }

        const row = document.createElement("div");
        row.className = "expense-row";

        const icon = document.createElement("div");
        icon.className = "expense-icon";
        icon.textContent = "🧾";

        const info = document.createElement("div");
        info.className = "expense-info";

        const title = document.createElement("h3");
        title.textContent = name;

        const details = document.createElement("p");
        details.textContent = "Paid by " + paidBy + " · Just now";

        const price = document.createElement("strong");
        price.textContent = amount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        });

        info.append(title, details);
        row.append(icon, info, price);

        const heading = expensesPanel.querySelector(".panel-heading");
        heading.after(row);

        message.textContent = "Expense added successfully!";
        form.reset();
        formPanel.hidden = true;
    });
});
