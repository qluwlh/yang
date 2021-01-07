import Excel from 'exceljs'
import os from 'os'
import path from 'path'
import { awaitTime, createDirectory, getData, getInitData, handleData, listPublicViewDataGrid } from './util'

const filePath = path.resolve(os.homedir(), 'Documents', 'yang')
const excelFilename = `${filePath}/demo.xlsx`

const options = {
  filename: excelFilename,
  useStyles: false,
  useSharedStrings: true,
}
const columns = [
  { header: 'instNo', key: 'instNo', width: 20 },
  { header: 'regFileName', key: 'regFileName', width: 60 },
  { header: 'releaseTime', key: 'releaseTime', width: 30 },
  { header: 'projTrackNo', key: 'projTrackNo', width: 40 },
  { header: 'regNoticeNo', key: 'regNoticeNo', width: 30 },
  { header: 'fileName', key: 'fileName', width: 30 },
]
const run = async () => {
  const initData = await getInitData()
  const { total } = initData
  const result = await createDirectory(filePath)
  if (!result) {
    throw new Error(`文件创建失败：${filePath}`)
  }
  const pageSize = 20
  const pageCount = Math.ceil(total / pageSize)
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options)
  const worksheet = workbook.addWorksheet('First')
  worksheet.columns = columns
  for (let index = 0; index < 1; index++) {
    await awaitTime(1000)
    const rows = await getData(index + 1, pageSize)
    const data = handleData(rows)
    for (const currentData of data) {
      const row = currentData
      const publicViewDataGrids = await listPublicViewDataGrid(currentData.instNo, currentData.projTrackNo)
      for (const item of publicViewDataGrids) {
        const { storeLocation, fileName } = item
        if (storeLocation) {
          const fileIds = storeLocation.split(',')
          if (fileIds && fileIds.length > 0) {
            row.fileName = JSON.stringify({
              url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
              opt: { params: { bo: { fileName, fileId: fileIds[0] } } },
            })
          }
        }
        //  await downFile('http://zhuce.nafmii.org.cn/file_web/file/download',filePath,fileName,fileIds[0])
      }
      row.fileName && console.log('row', JSON.parse(row.fileName))
      worksheet.addRow(row).commit()
      // for (const item of publicViewDataGrids) {
      //    const {storeLocation,fileName} = item
      //    fileIds = storeLocation.split(',')
      //    await awaitTime(1000)
      //    await downFile('http://zhuce.nafmii.org.cn/file_web/file/download',filePath,fileName,fileIds[0])
      // }
    }
  }
  worksheet.commit()
  const res = await workbook.commit()
}
run()
  .then(() => {
    console.log('success')
  })
  .catch(console.log)

// const currentPath = path.resolve(os.homedir(),'Documents','yang')
// createDirectory(currentPath).then(console.log).catch(console.log)
