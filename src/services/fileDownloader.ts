import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// You might need to extend jsPDF's type definition if not already done
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

interface GeneratedQuestion {
    id: string;
    type: string;
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    skill: string;
    difficulty: string;
    culturalContext?: string;
}

interface Metadata {
    gradeLevel: string;
}

/**
 * Downloads a list of questions as a PDF file.
 * @param questions - The list of questions to download.
 * @param metadata - Metadata for the document.
 */
export const downloadQuestionsPDF = (questions: GeneratedQuestion[], metadata: Metadata) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`Questions for ${metadata.gradeLevel}`, 14, 20);
    
    let yPosition = 35;
    
    questions.forEach((q, i) => {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Question number and text
        doc.setFontSize(12);
        doc.text(`${i + 1}. ${q.question}`, 14, yPosition);
        yPosition += 10;
        
        // Options for multiple choice questions
        if (q.options && q.options.length > 0) {
            q.options.forEach((option, optIndex) => {
                const prefix = String.fromCharCode(65 + optIndex); // A, B, C, D
                const isCorrect = option === q.correctAnswer;
                doc.text(`   ${prefix}. ${option}${isCorrect ? ' ✓' : ''}`, 14, yPosition);
                yPosition += 8;
            });
        }
        
        // Add spacing between questions
        yPosition += 5;
    });

    doc.save('questions.pdf');
};


/**
 * Downloads a list of questions as a Word (.rtf) file.
 * @param questions - The list of questions to download.
 * @param metadata - Metadata for the document.
 */
export const downloadQuestionsWord = async (questions: GeneratedQuestion[], metadata: Metadata) => {
    let rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
\\pard\\sa200\\sl276\\slmult1\\b\\f0\\fs28 Questions for ${metadata.gradeLevel}\\b0\\par\n\n`;

    questions.forEach((q, i) => {
        rtfContent += `\\pard\\sa200\\sl276\\slmult1\\b ${i + 1}. ${q.question.replace(/\n/g, '\\par ')}\\b0\\par\n`;
        if (q.options) {
            q.options.forEach(opt => {
                rtfContent += `\\pard\\sa200\\sl276\\slmult1\\tab - ${opt.replace(/\n/g, '\\par ')}\\par\n`;
            });
        }
        rtfContent += `\\pard\\sa200\\sl276\\slmult1\\i Answer: ${q.correctAnswer || 'N/A'}\\i0\\par\n\n`;
    });

    rtfContent += '}';

    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    saveAs(blob, 'questions.rtf');
}; 