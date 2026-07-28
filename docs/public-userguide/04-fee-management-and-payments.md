# Fee Management & Payments

**Goal:** Configure school fees, generate invoices, and collect payments.

*This guide is for Bursars and Principals.*

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

## 2. Generating Invoices

Invoices are generated automatically by the system.

- On the 1st of every month (or the start of a Term, depending on your school's configuration), the automated invoice generator runs.
- It looks at the Fee Structures assigned to a student's class and creates a personalized invoice.
- The invoice starts as **Unpaid** and parents are instantly notified in their portal.

If a student joins mid-term, you can generate an invoice manually:
1. Go to the student's profile.
2. Click **Generate Invoice**.

[SCREENSHOT: /bursar/invoices — showing a list of unpaid and partially paid invoices]

---

## 3. How Parents Pay

EduTrack makes fee collection completely frictionless via M-Pesa.

1. A parent logs into their portal.
2. They view the outstanding invoice and tap **Pay via M-Pesa**.
3. A prompt appears on their phone. They enter their PIN.
4. The payment is processed securely via Safaricom.
5. The invoice balance in EduTrack updates instantly, and a digital receipt is generated.

You (the Bursar) do not need to manually reconcile M-Pesa payments made through the portal.

---

## 4. Manually Recording Payments (Bank Transfers / Cash)

If a parent pays directly to the school bank account or brings cash, you must record it manually.

1. Navigate to **Finances → Payments**.
2. Click **Log Payment**.
3. Select the Student and the Invoice they are paying.
4. Enter the amount and the payment method (Cash, Cheque, Bank Transfer).
5. Enter the reference number (e.g., the bank slip number).
6. Click **Save Payment**.

The invoice balance will update, and the parent will see the receipt in their portal.

---

## 5. Handling Fee Balances & Arrears

If a student has not paid in full by the due date:
- Their invoice status changes to **Overdue**.
- You can apply a manual penalty charge by opening the invoice and clicking **Add Charge**.
- You can use the **Communications** tab to send bulk SMS reminders to all parents with overdue balances.

[Link: /bursar/dashboard]
