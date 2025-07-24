// Helper.gs

/**
 * Called by the client to generate & upload the Lesson-Note PDF.
 *
 * @param {{ folderName: string, date: string }} data
 * @return {{ success: boolean, message: string }}
 */
function uploadStudentPDF(data) {
  const { folderName, date } = data;
  const tz = Session.getScriptTimeZone();

  // 1) locate the parent folder
  const parentFolder = findStudentFolder(folderName);
  if (!parentFolder) throw new Error(`Folder "${folderName}" not found.`);

  // 2) derive student name & find the subfolders & the template doc
  const studentName        = folderName.split(" ").slice(1).join(" ");
  const lessonNotesFolder  = findFolderInFolder(parentFolder, `${studentName}'s Lesson Notes`);
  const lessonNoteTemplate = findFileInFolder(parentFolder, `${studentName}'s Lesson Note`);

  if (!lessonNotesFolder)  throw new Error(`"Lesson Notes" subfolder missing.`);
  if (!lessonNoteTemplate) throw new Error(`"Lesson Note" doc missing.`);

  // 3) pick the next 3-digit prefix
  let maxNum = 0;
  const it = lessonNotesFolder.getFiles();
  while (it.hasNext()) {
    const name = it.next().getName().match(/^(\d{3})/);
    if (name) maxNum = Math.max(maxNum, +name[1]);
  }
  const nextNum = String(maxNum + 1).padStart(3, "0");

  // 4) format date to ddMMyyyy
  function fmt(d) {
    const dt = typeof d === "string" ? new Date(d) : d;
    const p  = n => String(n).padStart(2, "0");
    return `${p(dt.getDate())}${p(dt.getMonth() + 1)}${dt.getFullYear()}`;
  }
  const datePart  = fmt(new Date(date));
  const pdfName   = `${nextNum} ${studentName}'s Lesson Note ${datePart}.pdf`;

  // 5) convert & upload
  const blob = lessonNoteTemplate.getBlob().getAs("application/pdf");
  blob.setName(pdfName);
  lessonNotesFolder.createFile(blob);

  // 6) mark the row in your lessons_today sheet
  _updateStatusInTodaySheet(folderName, date, "pdfUpload");
  return { success: true, message: `PDF uploaded: ${pdfName}` };
}


/**
 * Called by the client to append a lesson-history row
 * and then mark lesson_history=1 in lessons_today.
 */
function addLessonHistoryEntry(data) {
  try {
    _appendLessonHistoryRow(data);
    _updateStatusInTodaySheet(data.folderName, data.date, "lessonHistory");
    return { success: true, message: "Lesson history recorded." };
  }
  catch (e) {
    return { success: false, message: e.message };
  }
}


// —––– HELPER FUNCTIONS —–––––––––––––––––––––––––––––––––––––––––––––––––

function _updateStatusInTodaySheet(folderName, dateStr, columnName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sh    = ss.getSheetByName("lessons_today");
  const data  = sh.getDataRange().getValues();
  const hdrs  = data.shift().map(h => h.toString().trim());
  const col   = hdrs.indexOf(columnName);
  const title = hdrs.indexOf("folderName");  // assuming column is "folderName"

  if (col < 0 || title < 0) throw new Error(`Missing "${columnName}" or "folderName"`);

  for (let r=0; r<data.length; r++) {
    if (data[r][title] === folderName) {
      sh.getRange(r+2, col+1).setValue(true);
      return;
    }
  }
  throw new Error(`Row for "${folderName}" not found in lessons_today.`);
}

// Helpers
function findStudentFolder(name) { const it=DriveApp.getFoldersByName(name); return it.hasNext()?it.next():null; }
function findFolderInFolder(p,sub) { const it=p.getFoldersByName(sub); return it.hasNext()?it.next():null; }
function findFileInFolder(p,n) { const it=p.getFilesByName(n); return it.hasNext()?it.next():null; }
function _appendLessonHistoryRow({ folderName, date, teacher, warmUpTopic, unitPages, homework, comments, studentRequests, advice }) {
  const parent = findStudentFolder(folderName);
  if (!parent) throw new Error('Folder not found');
  const studentName = folderName.split(' ').slice(1).join(' ');
  const historyFile = findFileInFolder(parent, `${studentName}'s Lesson History`);
  if (!historyFile) throw new Error('History file missing');

  const ss = SpreadsheetApp.openById(historyFile.getId());
  const year = new Date().getFullYear().toString();
  let sheet = ss.getSheetByName(year);
  if (!sheet) {
    const template = ss.getSheetByName('Template');
    if (!template) throw new Error('Template sheet missing.');
    sheet = template.copyTo(ss).setName(year);
  }
  sheet.appendRow([date, teacher, warmUpTopic, unitPages, homework, '', comments, studentRequests, advice]);
}

/**
 * Returns an array of { folderName } objects
 * built from column D of the "Student List" sheet (skipping the header).
 */
function getStudentFolders() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Student List');
  if (!sheet) return [];
  
  // read everything from D2:D<lastRow>
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const raw = sheet
    .getRange(2, 4, lastRow - 1, 1)  // col 4 == D
    .getValues()
    .flat();
  
  return raw
    .map(v => v.toString().trim())
    .filter(v => v)               // drop blanks
    .map(folderName => ({ folderName }));
}

/**
 * Reads all non-empty teacher names from column A of the "Code" sheet.
 */
function getTeacherList() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Code');
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const raw = sheet
    .getRange(2, 1, lastRow - 1, 1)  // A2:A
    .getValues()
    .flat();
  
  return raw
    .map(v => v.toString().trim())
    .filter(v => v);
}

/**
 * Bundles both lists for the client.
 */
function getFoldersAndTeachers() {
  return {
    folders:  getStudentFolders(),
    teachers: getTeacherList()
  };
}

/**
 * Formats an array of student names into a readable string.
 * @param {string[]} students
 * @returns {string}
 */
function formatStudentNames(students) {
  if (!students || !students.length) return '';
  if (students.length === 1) return students[0];
  if (students.length === 2) return students[0] + ' and ' + students[1];
  return students.slice(0, -1).join(', ') + ', and ' + students[students.length - 1];
}

/**
 * Generates a PDF evaluation document for a student
 * @param {Object} data - The evaluation data
 * @returns {string} The URL of the generated PDF
 */
function generateEvaluationPDF(data) {
  try {
    // Find the student's folder
    const studentName = data.studentName;
    const parentFolder = findStudentFolder(studentName);
    if (!parentFolder) throw new Error(`Folder for "${studentName}" not found.`);

    // Find or create evaluation folder
    const evaluationFolder = findFolderInFolder(parentFolder, `${studentName}'s Evaluation`);
    if (!evaluationFolder) throw new Error(`Evaluation folder not found for "${studentName}"`);

    // Create evaluation document content
    const content = createEvaluationContent(data);
    
    // Create a new Google Doc with the evaluation content
    const doc = DocumentApp.create(`${studentName} Evaluation ${new Date().toLocaleDateString()}`);
    const body = doc.getBody();
    
    // Clear default content and add our evaluation
    body.clear();
    body.appendParagraph(content);
    
    // Convert to PDF
    const pdfBlob = doc.getAs('application/pdf');
    const pdfFile = evaluationFolder.createFile(pdfBlob);
    
    // Clean up the temporary document
    DriveApp.getFileById(doc.getId()).setTrashed(true);
    
    return pdfFile.getUrl();
  } catch (error) {
    Logger.log('Error generating evaluation PDF: ' + error.message);
    throw error;
  }
}

/**
 * Creates the content for the evaluation document
 * @param {Object} data - The evaluation data
 * @returns {string} The formatted evaluation content
 */
function createEvaluationContent(data) {
  let content = `STUDENT EVALUATION\n\n`;
  content += `Student Name: ${data.studentName}\n`;
  content += `Level: ${data.level}\n`;
  content += `Textbook: ${data.textbook}\n\n`;
  
  content += `SCORES\n`;
  if (data.evals && data.evals.length > 0) {
    data.evals.forEach((eval, index) => {
      content += `Date: ${eval.date}\n`;
      content += `Grammar: ${eval.grammar}, Vocab: ${eval.vocab}, Speaking: ${eval.speak}\n`;
      content += `Listening: ${eval.listen}, Reading: ${eval.read}, Writing: ${eval.write}\n`;
      content += `Fluency: ${eval.fluency}, Self-study: ${eval.self}\n\n`;
    });
  } else {
    content += `No scores recorded.\n\n`;
  }
  
  return content;
}

/**
 * Given a folderName, returns all student names from the Student List sheet that match it.
 * @param {string} folderName
 * @returns {string[]} Array of student names
 */
function getStudentNamesByFolder(folderName) {
  if (!folderName) return [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Student List');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  // Column C: Student Name (index 2), Column D: Student Folder (index 3)
  const NAME_COL_IDX = 2;
  const FOLDER_COL_IDX = 3;
  const names = [];
  Logger.log('Searching for folderName: "' + folderName + '" (length: ' + folderName.length + ')');
  for (let i = 1; i < data.length; i++) {
    const rowFolder = data[i][FOLDER_COL_IDX] ? data[i][FOLDER_COL_IDX].toString().trim() : '';
    Logger.log('Row ' + i + ': "' + rowFolder + '" (length: ' + rowFolder.length + ')');
    if (rowFolder === folderName.trim()) {
      Logger.log('MATCH: ' + rowFolder + ' == ' + folderName.trim());
      names.push(data[i][NAME_COL_IDX]);
    }
  }
  Logger.log('Found names: ' + JSON.stringify(names));
  // Return unique names only
  return Array.from(new Set(names));
}