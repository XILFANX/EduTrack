# Fee Management & Financial Analytics

**Goal:** Build multi-component fee structures, generate bulk invoices for a term, monitor financial health via analytics, and collect payments using the Blind Verification system.

*This guide is for Bursars, Principals, and Administrators.*

EduTrack uses a template-based invoicing system paired with a **Blind Verification** matching engine for collections. You build termly fee structures, generate bulk invoices from them, and monitor collections in real-time through the Financial Analytics dashboard.

---

## 1. Building Fee Templates

Before billing students, you define the fee components for the term using a Fee Template.

1. Navigate to **Finances → Fee Structures**. [Link: /bursar/fee-structures]
2. Click **New Template**.
3. Name the template (e.g., "Grade 1-3 Term 1 Fees").
4. Select the Academic Year and Term.
5. *(Optional)* Select a specific Class, or leave blank to apply to the whole school.
6. Add your **Fee Components** (line items):
   - "Tuition Fee": KES 15,000
   - "Lunch Program": KES 5,000
   - "Activity Fee": KES 2,000
7. The system calculates the Total per Student automatically. Click **Create Template**.

---

## 2. Generating Bulk Invoices

Once a template is built, you can generate invoices for all enrolled students in one click.

1. On the **Fee Structures** page, locate your newly created template.
2. Click **Generate Invoices**.
3. Review the preview summary of the charges and the target classes.
4. Click **Generate**. EduTrack will automatically create an unpaid invoice for every student in the assigned classes. 
   *(Note: The system is smart enough to skip students who already have an invoice from this specific template, preventing accidental double-billing).*

---

## 3. Financial Analytics Dashboard

The Financial Analytics dashboard provides a high-level view of fee collections and cash flow.

1. Navigate to **Finances → Analytics**. [Link: /dashboard/finance]
2. **Term Selector:** Use the dropdown in the top right to filter data by academic term.
3. **KPI Cards:** Instantly view Total Expected, Total Collected, Outstanding Arrears, and your Collection Rate.
4. **Collection by Class:** A breakdown comparing expected vs. collected fees per class to identify which classes are lagging.
5. **Payment Trend:** An 8-week sparkline showing payment volumes to help forecast cash flow.
6. **Defaulter Aging:** Students with outstanding balances are grouped into time buckets (0-30 days, 31-60 days, 60+ days) so you can prioritize follow-ups on critical defaulters.

---

## 4. The Blind Verification Flow (Collections)

When a parent pays school fees, EduTrack handles the reconciliation automatically using two independent submissions:

### Step A: The Parent's Submission
1. The parent pays the fees directly to the school's bank account or mobile wallet (off-platform).
2. The parent logs into their portal, clicks **Submit Payment**, and pastes the transaction confirmation message they received (e.g., M-Pesa SMS or Bank SMS).
3. The system automatically extracts the reference code, amount, currency, transaction fee, and date. The parent verifies these extracted details before clicking Submit.

### Step B: The Bursar's Receipt
1. The Bursar looks at the school's actual bank or M-Pesa statement.
2. The Bursar logs into EduTrack, navigates to **Finances → Record Bulk Receipts**.
3. The Bursar inputs the reference codes and amounts exactly as they appear on the bank statement.

### The Match
The EduTrack Engine continuously runs in the background. When it sees that the Parent's submitted reference code matches the Bursar's recorded receipt, it **automatically matches them together**.
- The amount is deducted from the invoice balance.
- If the balance hits 0, the invoice status changes to **Settled**.
- A digital receipt is generated and instantly available in the parent's portal.

[Link: /dashboard/finance]
