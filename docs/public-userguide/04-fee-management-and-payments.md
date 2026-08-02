# Fee Management & Payments

**Goal:** Configure school fees, generate invoices, and collect payments using the Blind Verification system.

*This guide is for Bursars and Principals.*

EduTrack uses a **Blind Verification** matching engine. It automatically generates the invoices based on Fee Structures, and then uses a two-independent-witness model to automatically reconcile school fees without the Bursar needing to match student names manually.

---

## 1. Setting Up Fee Structures

Before you can bill students, you must define what you are charging them for.

1. Navigate to **Finances → Fee Structures**. [Link: /bursar/fees]
2. Click **Create Structure**.
3. Name the structure (e.g., "Grade 1-3 Tuition").
4. Add line items:
   - "Tuition": KES 15,000
   - "Activity Fee": KES 2,000
5. You can set this structure to apply globally to the whole school, or restrict it to specific classes.

---

## 2. Defining Your Receiving Accounts

Before collecting fees, you must define where the money should go.
1. Navigate to **Settings** → **Payment Rails**.
2. Add your receiving accounts (e.g., School M-Pesa Paybill, KCB Bank Account).
3. These details are securely displayed to parents in their portal.

---

## 3. Generating Invoices (Obligations)

Invoices are generated automatically by the system.

- On the 1st of every month (or the start of a Term, depending on your school's configuration), the automated invoice generator runs.
- It looks at the Fee Structures assigned to a student's class and creates a personalized invoice (an "Obligation").
- The invoice starts as **Open** and parents are instantly notified in their portal.

If a student joins mid-term, you can generate an invoice manually:
1. Go to the student's profile.
2. Click **Generate Invoice**.

[SCREENSHOT: /bursar/invoices — showing a list of unpaid and partially paid invoices]

---

## 4. The Blind Verification Flow (How Parents Pay)

When a parent pays school fees, EduTrack handles the reconciliation automatically using two independent submissions:

### Step A: The Parent's Submission
1. The parent pays the fees directly to the school's bank account or mobile wallet (off-platform).
2. The parent logs into their portal, clicks **Submit Payment**, and simply pastes the transaction confirmation message they received (e.g., M-Pesa SMS or Bank SMS).
3. The system automatically extracts the reference code, amount, currency, transaction fee, and date. The parent can verify these extracted details in real-time before clicking Submit.
   *(Note: If a parent has no active fee invoice generated yet, the system provides a fallback option to check back later or make an advance payment).*

### Step B: The Bursar's Receipt
1. The Bursar looks at the school's actual bank or M-Pesa statement.
2. The Bursar logs into EduTrack, navigates to **Finances** → **Record Bulk Receipts**.
3. The Bursar inputs the reference codes and amounts exactly as they appear on the bank statement.

### The Match
The EduTrack Engine continuously runs in the background. When it sees that the Parent's submitted reference code matches the Bursar's recorded receipt, it **automatically matches them together**.
- The amount is deducted from the invoice balance.
- If the balance hits 0, the invoice status changes to **Settled**.
- A digital receipt is generated and instantly available in the parent's portal.

[SCREENSHOT: /bursar/payments/match-ledger — showing successful auto-matches]

---

## 5. Handling Fee Balances & Arrears

If a student has not paid in full by the due date:
- Their invoice status changes to **Partial** or **Open**.
- You can apply a manual penalty charge by opening the invoice and clicking **Add Charge**.
- You can use the **Communications** tab to send bulk SMS reminders to all parents with overdue balances.

[Link: /bursar/dashboard]
