# ExamGeneratorPro
A comprehensive web application for creating practice exams with structured grading rubrics and assessment sheets.

# Features
- Create various question types (open questions, multiple choice, fill-in-the-blank, matching, connection tasks)
- CSV import for existing questions
- Structured grading rubric with assessment criteria
- PDF export of exams and assessment sheets
- Customizable exam header with logo
- Automatic point distribution

## Usage

1. Upload a CSV file with questions or create questions manually
2. Optionally upload a structured grading rubric CSV
3. Configure the exam header and logo
4. Set the total points and generate the exam
5. Export as PDF or assessment sheet

## CSV Format

### Questions CSV
Question;Points;Type;Solution;Criterion1:Points1;Criterion2:Points2;...

### Rubric CSV
Question;Solution;Criterion1:Points1;Criterion2:Points2;...


## Question Types
- `open`: Open questions
- `mc`: Multiple choice
- `gap`: Fill in the blanks
- `memory`: Matching pairs
- `connection`: Connection tasks

## License
MIT License
