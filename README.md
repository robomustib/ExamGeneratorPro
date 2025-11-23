# ExamGeneratorPro
A comprehensive web application for creating practice exams with structured grading rubrics and assessment sheets.

# Features
- Versatile Question Types: Create open questions, multiple choice, fill-in-the-blank, matching pairs, and connection tasks.
- CSV Import: Easily import existing questions and rubrics via CSV.
- Structured Assessment: Integrated grading rubric with specific assessment criteria and points.
- PDF Export: Generate professional PDFs for both the exam (including student data fields) and the teacher's assessment sheet.
- Customization: Customizable exam header with logo support (upload or default).
- Smart Generation: Automatic random selection of questions to match a target point total.

## Usage
1. Upload a CSV file with questions or create questions manually
2. Optionally upload a structured grading rubric CSV
3. Configure the exam header and logo
4. Set the total points and generate the exam
5. Export as PDF or assessment sheet

## CSV Format

### Questions CSV
```bash
Question;Points;Type;Solution;Criterion1:Points1;Criterion2:Points2;...
```

### Rubric CSV
```bash
Question;Solution;Criterion1:Points1;Criterion2:Points2;...
```

## Question Types
- `open`: Open questions
- `mc`: Multiple choice
- `gap`: Fill in the blanks
- `memory`: Matching pairs
- `connection`: Connection tasks

## Demo
Click here to try out:
[ExamGeneratorPro Demo](https://www.mustafa-bilgin.de/examgenerator-pro)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
