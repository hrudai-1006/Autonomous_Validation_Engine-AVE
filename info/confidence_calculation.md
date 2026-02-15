# Confidence Score Calculation Logic

The Autonomous Validation Engine (AVE) uses a penalty-based scoring system to determine the confidence level of a provider validation. This ensures transparency and explainability in the validation process.

## 1. The Algorithm

The QA Agent starts with a **Perfect Score of 100%** and deducts points based on discrepancies found between the **Extracted Data** (from your file) and the **Registry Data** (from official sources like CMS NPI).

### Penalty Rules

| Discrepancy Type | Penalty | Reason |
| :--- | :--- | :--- |
| **Name Mismatch** | **-20%** | Critical identity mismatch (e.g., "John Smith" vs "Jane Doe"). |
| **License Mismatch** | **-15%** | High risk; license number is a unique identifier. |
| **Specialty Mismatch (Major)** | **-10%** | Fundamentally different specialty (e.g., "Cardiology" vs "Dermatology"). |
| **Specialty Mismatch (Minor)** | **-5%** | Semantic difference or sub-specialty (e.g., "Surgery" vs "General Surgery"). |
| **Address Mismatch** | **-5%** | Often effectively the same location but formatted differently (e.g., "St" vs "Street"). |

---

## 2. Validation Status

The final score determines the validation status based on the **Confidence Threshold** configured in your system settings (Default: 78%).

*   **✅ Validated**: Score >= Threshold (e.g., 85%)
*   **🚩 Flagged**: Score < Threshold (e.g., 60%)

---

## 3. Example Scenario

**Provider:** Dr. Stephen Strange

### 📄 Extracted Data (from your upload)
*   **Name:** Stephen Strange
*   **License:** NY-123456
*   **Specialty:** Neurosurgery
*   **Address:** 177A Bleecker St, New York, NY

### 🏛️ Registry Data (from CMS NPI)
*   **Name:** Stephen V. Strange (`Match`)
*   **License:** NY-999999 (`Mismatch`)
*   **Specialty:** Neurological Surgery (`Minor Mismatch`)
*   **Address:** 177 Bleecker Street, Apt A, New York, NY (`Address Diff`)

### 🧮 Calculation Step-by-Step

1.  **Start Score**: `100`
2.  **Name Check**: "Stephen Strange" vs "Stephen V. Strange" -> Fuzzy Match (No Penalty).
3.  **License Check**: "NY-123456" vs "NY-999999" -> **Mismatch (-15)**.
4.  **Specialty Check**: "Neurosurgery" vs "Neurological Surgery" -> **Minor Mismatch (-5)**.
5.  **Address Check**: "177A Bleecker St" vs "177 Bleecker Street, Apt A" -> **Address Difference (-5)**.

**Final Score:** `100 - 15 - 5 - 5` = **75%**

### 🏁 Result
*   **System Threshold:** 78%
*   **Status:** **🚩 Flagged** (Manual Review Required)
