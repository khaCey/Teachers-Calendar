# New Teachers App

A Google Apps Script web application for managing daily lessons, student records, and lesson documentation for a language school in Japan.

## Overview

This application provides a comprehensive dashboard for teachers to:
- View today's lessons in a calendar-style interface
- Upload lesson notes as PDFs to student folders
- Record lesson history and progress
- Manage demo lessons and create student folders
- Track lesson completion status

## Features

### 📅 Daily Lesson Dashboard
- **Visual Calendar Interface**: Displays today's lessons in a time-based grid (10:00-20:00)
- **Real-time Status Tracking**: Color-coded lesson blocks showing completion status
- **Current Time Indicator**: Red line showing current time on the calendar
- **Auto-refresh**: Status updates every minute

### 📚 Lesson Management
- **PDF Upload**: Convert and upload lesson notes to student folders
- **Direct File Access**: One-click access to student lesson notes and history files
  - Google Docs integration for lesson notes
  - Google Sheets integration for lesson history
- **Student Evaluations**: Comprehensive evaluation system with:
  - **Evaluation Tags**: `#evaluationReady` and `#evaluationDue` in calendar events
  - **Automatic Color Coding**: Green for ready, red for due evaluations
  - **Evaluation Modal**: Complete evaluation form with scores and feedback
  - **PDF Generation**: Automatic creation of evaluation documents
- **Lesson History**: Record detailed lesson progress including:
  - Teacher name
  - Warm-up topics
  - Unit/pages covered
  - Homework assignments
  - Comments and student requests
  - Advice for future lessons

### 👥 Student Management
- **Student Folders**: Organized Google Drive structure for each student
- **Demo Lesson Support**: Special handling for demo lessons with automatic folder creation
- **Direct File Access**: One-click buttons to open student files
  - **Lesson Notes**: Direct link to Google Docs templates
  - **Lesson History**: Direct link to Google Sheets progress tracking
- **Smart Student Name Extraction**: Automatic parsing of student names from folder structures

### 🎯 Status Tracking
- **Visual Indicators**: 
  - 🔴 Red: Lesson overdue (no PDF uploaded) or evaluation due
  - 🟡 Yellow: PDF uploaded, history pending
  - 🟢 Green: Complete (PDF + history recorded) or evaluation ready
  - 🟠 Orange: Evaluation button for events with `#evaluationDue` tag

## Technical Architecture

### Google Apps Script Components

#### `Code.js` - Main Application Logic
- **Calendar Integration**: Fetches events from two Google Calendars
  - Main lessons calendar
  - Demo lessons calendar
- **Spreadsheet Management**: Reads/writes to Google Sheets for lesson tracking
- **Event Processing**: Filters and processes calendar events for lesson display
- **Folder Creation**: Automatically creates student folders for new students

#### `Helper.js` - Utility Functions
- **PDF Generation**: Converts Google Docs to PDF and uploads to student folders
- **Lesson History**: Appends lesson data to student history spreadsheets
- **Student Data**: Manages student folder structures and teacher lists
- **Status Updates**: Tracks PDF upload and lesson history completion

#### `Index.html` - User Interface
- **Modern Web Interface**: Responsive design with Google Material Design principles
- **Interactive Calendar**: Click-to-edit lesson blocks with modal dialogs
- **Real-time Updates**: JavaScript polling for status changes
- **Form Validation**: Client-side validation for all user inputs
- **Google Integration**: Direct links to Google Docs and Sheets with branded styling
- **Enhanced Error Handling**: Comprehensive logging and user feedback

### Data Sources

#### Google Sheets
- **Student List**: Contains student names and folder mappings
- **Lessons Today**: Tracks current day's lessons with status flags
- **Lesson History**: Individual spreadsheets for each student's progress

#### Google Drive
- **Student Folders**: Organized folder structure per student
- **Lesson Notes**: Google Docs templates converted to PDFs
- **History Files**: Spreadsheets tracking long-term student progress

#### Google Calendar
- **Main Calendar**: Regular lesson events
- **Demo Calendar**: Demo lesson events with special handling

## Setup and Configuration

### Prerequisites
- Google Apps Script project
- Google Sheets with student data
- Google Drive with organized folder structure
- Google Calendar with lesson events

### Configuration Files

#### `appsscript.json`
```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Sheets",
        "version": "v4",
        "serviceId": "sheets"
      },
      {
        "userSymbol": "Drive",
        "version": "v3",
        "serviceId": "drive"
      }
    ]
  },
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

### Required Google Sheets Structure

#### Student List Sheet
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Teacher  | ...      | Name     | Folder   |

#### Lessons Today Sheet
| eventID | eventName | Start | End | studentName | folderName | pdfUpload | lessonHistory |
|---------|-----------|-------|-----|-------------|------------|-----------|---------------|

## Usage

### For Teachers

1. **Access the Dashboard**: Open the deployed web app URL
2. **View Today's Lessons**: See all lessons in a visual calendar format
3. **Upload Lesson Notes**: Click on a lesson block to upload PDF notes
4. **Access Student Files**: Use one-click buttons to open lesson notes and history
5. **Record Lesson History**: Add detailed lesson progress after uploading notes
6. **Track Completion**: Monitor lesson status through color-coded indicators

### For Administrators

1. **Manage Student Data**: Update the Student List sheet with new students
2. **Configure Calendars**: Ensure lesson events are properly formatted
3. **Monitor Usage**: Check lesson completion rates and teacher activity

## Key Functions

### Core Functions (`Code.js`)
- `doGet()`: Web app entry point
- `getEventsJson()`: Returns lesson data for the dashboard
- `getLessonsTodayStatuses()`: Reads PDF and history status flags
- `markPdfUploaded(eventID, flag)`: Updates PDF upload status
- `isValidLessonEvent_(event)`: Filters out cancelled lessons by color
- `fetchAndCacheTodayLessons([date])`: Fetches events and updates the sheet
- `determineLessonTypeAndPrefix(eventName)`: Detects lesson type
- `incrementLessonTypeID(type)`: Increments ID counters
- `createFoldersForStudents()`: Placeholder for folder creation (currently commented out)
- `manual()`: Debug helper to refresh a specific date
- `createDemoLessonFolder(eventID, eventName)`: Creates demo lesson folders
- `getStudentLinks(studentName)`: Returns note/history URLs
- `extractStudentNameFromDemo(eventName)`: Parses names from demo titles
- `changeEventColor(eventID, color)`: Updates calendar event colors
- `getStudentNamesByFolder(folderName)`: Lists students by folder
- `getStudentEvaluations(studentName)`: Retrieves evaluation history

### Helper Functions (`Helper.js`)
- `uploadStudentPDF(data)`: Converts and uploads lesson notes
- `addLessonHistoryEntry(data)`: Records lesson progress
- `_updateStatusInTodaySheet(folderName, date, columnName)`: Flags status in sheet
- `findStudentFolder(name)`: Finds a student folder
- `findFolderInFolder(parent, name)`: Finds a subfolder
- `findFileInFolder(parent, name)`: Finds a file
- `_appendLessonHistoryRow(...)`: Writes a row to the history sheet
- `getStudentFolders()`: Retrieves student folder list
- `getTeacherList()`: Gets available teachers
- `getFoldersAndTeachers()`: Bundles folder and teacher data
- `formatStudentNames(students)`: Formats names for folder creation
- `generateEvaluationPDF(data)`: Creates evaluation PDF documents
- `createEvaluationContent(data)`: Formats evaluation data for PDF generation
- `getStudentNamesByFolder(folderName)`: Finds student names by folder

## Calendar Event Format

### Regular Lessons
- **Title Format**: `Student Name (Subject)`
- **Multiple Students**: `Student1 and Student2 (Subject)`
- **Color Coding**: Valid lessons exclude graphite, lavender, and banana colors

### Demo Lessons
- **Title Format**: `Student Name D/L (Subject)`
- **Special Handling**: Automatic folder creation for new demo students
- **Folder Naming**: `Student Name DEMO`

### Evaluation Lessons
- **Evaluation Ready**: Add `#evaluationReady` to event description
- **Evaluation Due**: Add `#evaluationDue` to event description
- **Automatic Color Coding**: Green for ready, red for due
- **Evaluation Button**: Orange button appears on events with `#evaluationDue` tag

### Teacher Tags
- **Assign Teacher**: Add `#teacherName` to event description
- **Example**: `#teacherKhacey`, `#teacherAna`, `#teacherSham`
- **Dashboard Display**: Teacher name appears as a purple marker on the lesson card

## Folder Structure

```
Google Drive/
├── Student Name/
│   ├── Student Name's Lesson Notes/
│   │   ├── 001 Student Name's Lesson Note 01012024.pdf
│   │   ├── 002 Student Name's Lesson Note 02012024.pdf
│   │   └── ...
│   ├── Student Name's Evaluation/
│   │   ├── Student Name Evaluation 01012024.pdf
│   │   └── ...
│   ├── Student Name's Lesson Note (template)
│   └── Student Name's Lesson History (spreadsheet)
└── ...
```

## Development Notes

### Timezone Handling
- Application uses Asia/Tokyo timezone
- All date/time operations respect the configured timezone
- Calendar events are processed in the local timezone

### Error Handling
- Comprehensive error logging with Stackdriver
- Enhanced client-side logging with prefixed messages (`[LessonNotes]`, `[LessonHistory]`)
- Graceful fallbacks for missing data
- User-friendly error messages in the interface

### Performance Considerations
- Efficient polling (60-second intervals)
- Minimal data transfer between client and server
- Cached status updates to reduce API calls

### Google Integration
- Direct links to Google Docs and Sheets using official Google colors
- Seamless integration with Google Workspace ecosystem
- Automatic student name extraction from folder structures
- Automatic calendar event color management based on evaluation tags

## Deployment

1. **Deploy as Web App**: In Google Apps Script editor
2. **Set Access**: Configure as "Anyone, even anonymous"
3. **Execute As**: Set to "User accessing the web app"
4. **Share URL**: Distribute the generated web app URL to teachers

## Maintenance

### Regular Tasks
- Monitor calendar event formatting
- Update student list as needed
- Review lesson completion rates
- Backup important data periodically

### Troubleshooting
- Check Google Apps Script logs for errors
- Verify calendar permissions and event formatting
- Ensure student folder structure is maintained
- Monitor Google Drive storage usage
- Check browser console for client-side error messages
- Verify Google Docs and Sheets permissions for direct links

## Security Considerations

- Web app access is configured for anonymous users
- All data is stored in Google's secure infrastructure
- No external API keys or sensitive data in code
- User authentication handled by Google's systems

---

**Version**: 1.3
**Last Updated**: 2025
**Timezone**: Asia/Tokyo
**Language**: English/Japanese (mixed content)
**Clasp Project ID**: 1GgbhvcVRx27p3fCbah5wduyzczrzbzaurgK15oeYdn5bjh8XxOpDCRSm 