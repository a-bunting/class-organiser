const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function createNewSpreadsheet(timetable) {
    try {
        const SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
          ];
    
          const jwt = new JWT({
            email: process.env.CLIENT_EMAIL,
            key: process.env.PRIVATE_KEY,
            scopes: SCOPES,
          });
    
        const newSpreadsheet = await GoogleSpreadsheet.createNewSpreadsheetDocument(jwt, { title: timetable.name });
        newSpreadsheet.setPublicAccessLevel('reader');
        
        let sheets = [];
    
        // create the sheets
        for(let i = 0 ; i < timetable.schedule.blocks.length ; i++) {
            const blockName = timetable.schedule.blocks[i].name;
    
            for(let o = 0 ; o < timetable.schedule.blocks[i].blocks.length ; o++) {
                const block = timetable.schedule.blocks[i].blocks[o];
                let course = timetable.courses.find(a => a.id === block.selectedCourse);
                let teacher = timetable.classes.find(a => a.id === block.classId);
                let room = timetable.rooms.find(a => a.id === block.room);
    
                if(course && block && teacher && room) {
                    let newSheet = await newSpreadsheet.addSheet({ title: `${blockName} ${course.name} - ${room.name} (${teacher.teacher})` });
                    
                    await (await newSheet).loadCells();
    
                    for(let p = 0 ; p < block.students.length ; p++) {
                        let student = timetable.students.find(a => a.id === block.students[p]);
                        
                        if(student) {
                            let cell = (await newSheet).getCell(p, 0);
                            cell.value = `${student.name.forename} ${student.name.surname}`;
                        }
                    }
                    
                    await  (await newSheet).saveUpdatedCells();
                    sheets.push(newSheet);
                }
            }
        }
    
        // delete number 1
        newSpreadsheet.deleteSheet(0);
    
        return newSpreadsheet._spreadsheetUrl;
    } catch (e) {
        return e.message;
    }
}

module.exports.createNewSpreadsheet = createNewSpreadsheet;
