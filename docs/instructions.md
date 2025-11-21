# ExamGenerator Pro - Instructions

## Quick Start

1. Open `index.html` in a web browser
2. Upload a CSV file with questions or use the sample files
3. Configure your exam settings
4. Generate and export your exam

## CSV Format Details

### Questions Format
- Column 1: Question text
- Column 2: Points (number)
- Column 3: Type (open, mc, gap, memory, connection)
- Column 4: Solution/Answer
- Column 5+: Assessment criteria in format "Criterion:Points"

### Question Types

**Open Questions**
- Free text answers
- Example: "What is HTML?;5;open;HTML is a markup language..."

**Multiple Choice**
- Provide options and correct answer index
- Example: "What color is the sky?;3;mc;Blue"

**Fill in the Blanks**
- Use [blank] markers in text
- Example: "The [blank] jumps over the [blank].;4;gap;Dog,Fence"

**Matching Pairs**
- Pairs of terms and definitions
- Example: "Match pairs: HTML - Markup language;4;memory;HTML=HyperText Markup Language|CSS=Styling..."

**Connection Tasks**
- Left-right connection pairs
- Example: "Connections: Browser - Firefox;3;connection;Browser=Firefox|Browser=Chrome..."

## Tips

- Use the sample CSV files as templates
- The application works entirely in the browser - no server required
- All data stays local to your computer
- Export to PDF for printing or digital distribution
