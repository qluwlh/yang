const path = require('path');
const Excel = require('exceljs');
const filename = `${__dirname}/demo.xlsx`

const options = {
    filename,
    useStyles: false,
    useSharedStrings: true
};


const run = async () => {
    const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    const worksheet = workbook.addWorksheet('First');
    worksheet.columns = [
        { header: 'instNo', key: 'instNo', width: 32 },
        { header: 'regFileName', key: 'regFileName', width: 32, },
        { header: 'releaseTime', key: 'releaseTime', width: 32, },
        { header: 'projTrackNo', key: 'projTrackNo', width: 32, },
        { header: 'regNoticeNo', key: 'regNoticeNo', width: 32, },
    ];
  try {
    worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)}).commit();
    worksheet.addRow({id: 2, name: 'John Doe', dob: new Date(1970,1,1)}).commit();
    worksheet.addRow({id: 3, name: 'John Doe', dob: new Date(1970,1,1)}).commit();
    worksheet.addRow({id: 33, name: 'John Doe', dob: new Date(1970,1,1)}).commit();
    worksheet.addRow({id: 34, name: 'John Doe', dob: new Date(1970,1,1)}).commit();
    worksheet.addRow({id: 36, name: 'John Doe', dob: new Date(1970,1,1)}).commit();
    worksheet.commit()
    const res = await workbook.commit()
    console.log('[success]', res)
  } catch (error) {
      console.log('[failed]:', error)
  }
}

run()
// workbook.xlsx.writeFile(filename).then((res)=> console.log('success', res) ).catch((error) => console.log('failed', error));

// const newWorkbook = new ExcelJS.Workbook();
// newWorkbook.xlsx.readFile(filename).then((res)=> {
//     res._worksheets.filter(item => !!item).map(item => console.log('item', item._rows))
// }).catch((error) => console.log('failed', error));;